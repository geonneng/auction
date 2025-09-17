const { createServer } = require("http")
const { parse } = require("url")
const next = require("next")
const { Server } = require("socket.io")

const dev = process.env.NODE_ENV !== "production"
const hostname = process.env.HOSTNAME || "localhost"
const port = process.env.PORT || 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// In-memory storage for auction rooms
const auctionRooms = new Map()

// Room data structure
class AuctionRoom {
  constructor(id, initialCapital) {
    this.id = id
    this.initialCapital = Number.parseInt(initialCapital)
    this.status = "PRE-START" // PRE-START, ACTIVE, ENDED
    this.host = null
    this.guests = new Map() // nickname -> { socketId, capital, nickname, hasBidInCurrentRound }
    this.bids = [] // Array of { nickname, amount, timestamp, round }
    this.currentRound = 0
    this.roundStatus = "WAITING" // WAITING, ACTIVE, ENDED
    this.createdAt = new Date()
  }

  addGuest(socketId, nickname) {
    if (this.guests.size >= 6) {
      throw new Error("방이 가득 찼습니다")
    }

    if (this.guests.has(nickname)) {
      throw new Error("이미 사용 중인 닉네임입니다")
    }

    this.guests.set(nickname, {
      socketId,
      nickname,
      capital: this.initialCapital,
      hasBidInCurrentRound: false,
    })
  }

  removeGuest(nickname) {
    this.guests.delete(nickname)
  }

  modifyGuestCapital(nickname, newCapital) {
    const guest = this.guests.get(nickname)
    if (!guest) {
      throw new Error("게스트를 찾을 수 없습니다")
    }

    if (newCapital < 0) {
      throw new Error("자본금은 0 이상이어야 합니다")
    }

    const oldCapital = guest.capital
    guest.capital = newCapital

    console.log(`[v0] Capital modified for ${nickname}: ${oldCapital} -> ${newCapital}`)
    
    return {
      nickname,
      oldCapital,
      newCapital,
      difference: newCapital - oldCapital
    }
  }

  placeBid(nickname, amount) {
    const guest = this.guests.get(nickname)
    if (!guest) {
      throw new Error("게스트를 찾을 수 없습니다")
    }

    if (amount <= 0 || amount > guest.capital) {
      throw new Error("유효하지 않은 입찰 금액입니다")
    }

    if (this.status !== "ACTIVE" || this.roundStatus !== "ACTIVE") {
      throw new Error("현재 라운드가 활성화되지 않았습니다")
    }

    // 라운드별 중복 입찰 방지
    if (guest.hasBidInCurrentRound) {
      throw new Error("이미 이번 라운드에서 입찰하셨습니다")
    }

    // Update guest capital
    guest.capital -= amount

    // Mark guest as having bid in current round
    guest.hasBidInCurrentRound = true

    // Add bid to history
    this.bids.push({
      nickname,
      amount,
      timestamp: new Date(),
      round: this.currentRound,
    })

    return true
  }

  startAuction() {
    if (this.guests.size === 0) {
      throw new Error("참가자가 없습니다")
    }
    this.status = "ACTIVE"
  }

  startRound() {
    if (this.status !== "ACTIVE") {
      throw new Error("경매가 시작되지 않았습니다")
    }
    this.currentRound++
    this.roundStatus = "ACTIVE"
    
    // 모든 게스트의 입찰 상태 초기화
    console.log(`[v0] Resetting bid status for ${this.guests.size} guests in round ${this.currentRound}`)
    for (const guest of this.guests.values()) {
      console.log(`[v0] Guest ${guest.nickname}: hasBidInCurrentRound = ${guest.hasBidInCurrentRound} -> false`)
      guest.hasBidInCurrentRound = false
    }
  }

  endRound() {
    if (this.roundStatus !== "ACTIVE") {
      throw new Error("활성화된 라운드가 없습니다")
    }
    this.roundStatus = "ENDED"
    
    // Calculate round results
    const roundBids = this.bids.filter(bid => bid.round === this.currentRound)
    const roundResults = {
      round: this.currentRound,
      bids: roundBids.sort((a, b) => b.amount - a.amount), // Sort by amount descending
      winner: roundBids.length > 0 ? roundBids.reduce((max, bid) => bid.amount > max.amount ? bid : max) : null
    }
    
    return roundResults
  }

  getState() {
    return {
      id: this.id,
      status: this.status,
      initialCapital: this.initialCapital,
      guests: Array.from(this.guests.values()).map((guest) => ({
        nickname: guest.nickname,
        capital: guest.capital,
        hasBidInCurrentRound: guest.hasBidInCurrentRound,
      })),
      bids: this.bids.slice(-20), // Last 20 bids
      guestCount: this.guests.size,
      currentRound: this.currentRound,
      roundStatus: this.roundStatus,
    }
  }
}

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error("Error occurred handling", req.url, err)
      res.statusCode = 500
      res.end("internal server error")
    }
  })

  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  })

  io.on("connection", (socket) => {
    console.log("[v0] Client connected:", socket.id)

    // Host creates a new auction room
    socket.on("host:create", (data) => {
      try {
        const { initialCapital } = data
        const roomId = generateRoomId()
        const room = new AuctionRoom(roomId, initialCapital)
        room.host = socket.id

        auctionRooms.set(roomId, room)
        socket.join(roomId)

        console.log("[v0] Room created:", roomId, "by host:", socket.id)

        socket.emit("host:created", {
          roomId,
          joinUrl: `${process.env.NEXT_PUBLIC_BASE_URL || `http://${hostname}:${port}`}/room/${roomId}`,
          state: room.getState(),
        })
      } catch (error) {
        socket.emit("app:error", { message: error.message })
      }
    })

    // Host requests current state (e.g., on refresh or deep link)
    socket.on("host:requestState", (data) => {
      try {
        const { roomId } = data
        console.log("[v0] Host requesting state for room:", roomId)
        console.log("[v0] Available rooms:", Array.from(auctionRooms.keys()))
        
        const room = auctionRooms.get(roomId)

        if (!room) {
          console.log("[v0] Room not found:", roomId)
          throw new Error("존재하지 않는 방입니다")
        }

        console.log("[v0] Room found, sending state to host:", socket.id)
        
        // Join the room to receive updates
        socket.join(roomId)

        // If host is not set or different, update host (supports reconnection)
        if (!room.host || room.host !== socket.id) {
          console.log("[v0] Updating room host:", roomId, "from", room.host, "to", socket.id)
          room.host = socket.id
        }

        // Send current state back to requester and set joinUrl
        socket.emit("host:created", {
          roomId,
          joinUrl: `${process.env.NEXT_PUBLIC_BASE_URL || `http://${hostname}:${port}`}/room/${roomId}`,
          state: room.getState(),
        })
      } catch (error) {
        console.log("[v0] Error in host:requestState:", error.message)
        socket.emit("app:error", { message: error.message })
      }
    })

    // Guest joins an auction room
    socket.on("guest:join", (data) => {
      try {
        const { roomId, nickname } = data
        const room = auctionRooms.get(roomId)

        if (!room) {
          throw new Error("존재하지 않는 방입니다")
        }

        room.addGuest(socket.id, nickname)
        socket.join(roomId)

        console.log("[v0] Guest joined:", nickname, "to room:", roomId)

        // Get the guest data after adding to room
        const guest = room.guests.get(nickname)
        console.log(`[v0] Guest ${nickname} joined - hasBidInCurrentRound: ${guest.hasBidInCurrentRound}, roundStatus: ${room.roundStatus}`)

        // Notify guest of successful join
        socket.emit("guest:joined", {
          nickname,
          capital: room.initialCapital,
          status: room.status,
          currentRound: room.currentRound,
          roundStatus: room.roundStatus,
          hasBidInCurrentRound: guest.hasBidInCurrentRound,
        })
        
        // If round is active, also send round:started event to this guest
        if (room.roundStatus === "ACTIVE") {
          socket.emit("round:started", {
            round: room.currentRound,
            canBid: true
          })
        }

        // Notify host of updated state
        if (room.host) {
          io.to(room.host).emit("host:stateUpdate", room.getState())
        }
      } catch (error) {
        socket.emit("app:error", { message: error.message })
      }
    })

    // Host starts the auction
    socket.on("host:startAuction", (data) => {
      try {
        const { roomId } = data
        const room = auctionRooms.get(roomId)

        if (!room || room.host !== socket.id) {
          throw new Error("권한이 없습니다")
        }

        room.startAuction()

        console.log("[v0] Auction started in room:", roomId)

        // Notify all guests that auction has started
        socket.to(roomId).emit("auction:started")

        // Update host state
        socket.emit("host:stateUpdate", room.getState())
      } catch (error) {
        socket.emit("app:error", { message: error.message })
      }
    })

    // Host starts a round
    socket.on("host:startRound", (data) => {
      try {
        const { roomId } = data
        console.log("[v0] Host requesting to start round in room:", roomId)
        const room = auctionRooms.get(roomId)

        if (!room || room.host !== socket.id) {
          console.log("[v0] Round start failed - no room or wrong host")
          throw new Error("권한이 없습니다")
        }

        room.startRound()

        console.log("[v0] Round started in room:", roomId, "Round:", room.currentRound)

        // Notify all guests that round has started
        socket.to(roomId).emit("round:started", { 
          round: room.currentRound,
          canBid: true // 모든 게스트가 새 라운드에서 입찰 가능
        })

        // Update host state
        socket.emit("host:stateUpdate", room.getState())
      } catch (error) {
        console.log("[v0] Error starting round:", error.message)
        socket.emit("app:error", { message: error.message })
      }
    })

    // Host ends a round
    socket.on("host:endRound", (data) => {
      try {
        const { roomId } = data
        const room = auctionRooms.get(roomId)

        if (!room || room.host !== socket.id) {
          throw new Error("권한이 없습니다")
        }

        const roundResults = room.endRound()

        console.log("[v0] Round ended in room:", roomId, "Round:", room.currentRound)
        console.log("[v0] Round results:", roundResults)

        // Notify all guests that round has ended with results
        socket.to(roomId).emit("round:ended", { 
          round: room.currentRound,
          results: roundResults
        })

        // Update host state
        socket.emit("host:stateUpdate", room.getState())
        
        // Send round results to host
        socket.emit("host:roundResults", roundResults)
      } catch (error) {
        console.log("[v0] Error ending round:", error.message)
        socket.emit("app:error", { message: error.message })
      }
    })

    // Host modifies guest capital
    socket.on("host:modifyCapital", (data) => {
      try {
        const { roomId, nickname, newCapital } = data
        console.log(`[v0] Host modifying capital: ${nickname} -> ${newCapital} in room ${roomId}`)
        
        const room = auctionRooms.get(roomId)

        if (!room || room.host !== socket.id) {
          throw new Error("권한이 없습니다")
        }

        const result = room.modifyGuestCapital(nickname, newCapital)
        console.log("[v0] Capital modified successfully:", result)

        // Notify host of successful modification
        socket.emit("host:capitalModified", result)

        // Notify the specific guest of capital change
        const guest = room.guests.get(nickname)
        if (guest) {
          console.log(`[v0] Notifying guest ${nickname} of capital change: ${guest.capital}`)
          io.to(guest.socketId).emit("guest:capitalChanged", {
            newCapital: guest.capital,
            difference: result.difference
          })
        } else {
          console.log(`[v0] Guest ${nickname} not found in room`)
        }

        // Update host state
        console.log("[v0] Sending state update to host")
        socket.emit("host:stateUpdate", room.getState())
      } catch (error) {
        console.log("[v0] Error modifying capital:", error.message)
        socket.emit("app:error", { message: error.message })
      }
    })

    // Guest places a bid
    socket.on("guest:bid", (data) => {
      try {
        const { roomId, nickname, amount } = data
        const room = auctionRooms.get(roomId)

        if (!room) {
          throw new Error("존재하지 않는 방입니다")
        }

        room.placeBid(nickname, amount)

        console.log("[v0] Bid placed:", nickname, amount, "in room:", roomId)

        // Notify guest of successful bid
        const guest = room.guests.get(nickname)
        socket.emit("guest:bidSuccess", {
          remainingCapital: guest.capital,
          hasBidInCurrentRound: guest.hasBidInCurrentRound,
        })

        // Notify host of new bid and updated state (without amount)
        if (room.host) {
          io.to(room.host).emit("host:newBid", {
            nickname,
            timestamp: new Date(),
            round: room.currentRound,
          })
          io.to(room.host).emit("host:stateUpdate", room.getState())
        }
      } catch (error) {
        socket.emit("app:error", { message: error.message })
      }
    })

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log("[v0] Client disconnected:", socket.id)

      // Find and clean up rooms where this socket was involved
      for (const [roomId, room] of auctionRooms.entries()) {
        // If host disconnected, delay room deletion to allow reconnection
        if (room.host === socket.id) {
          console.log("[v0] Host disconnected, scheduling room cleanup:", roomId)
          // Delay room deletion by 30 seconds to allow reconnection
          setTimeout(() => {
            if (auctionRooms.has(roomId) && auctionRooms.get(roomId).host === socket.id) {
              console.log("[v0] Host reconnection timeout, ending room:", roomId)
              io.to(roomId).emit("room:ended", { reason: "Host disconnected" })
              auctionRooms.delete(roomId)
            }
          }, 30000)
          continue
        }

        // If guest disconnected, remove from room
        for (const [nickname, guest] of room.guests.entries()) {
          if (guest.socketId === socket.id) {
            room.removeGuest(nickname)
            console.log("[v0] Guest disconnected:", nickname, "from room:", roomId)

            // Notify host of updated state
            if (room.host) {
              io.to(room.host).emit("host:stateUpdate", room.getState())
            }
            break
          }
        }
      }
    })
  })

  server
    .once("error", (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
    })
})
