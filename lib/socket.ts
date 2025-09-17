import { io, type Socket } from "socket.io-client"

// Ensure singleton persists across HMR in Next.js
const globalForSocket = globalThis as unknown as { __socketManager?: SocketManager }

class SocketManager {
  private socket: Socket | null = null
  private static instance: SocketManager

  static getInstance(): SocketManager {
    if (!globalForSocket.__socketManager) {
      globalForSocket.__socketManager = new SocketManager()
    }
    return globalForSocket.__socketManager
  }

  connect(): Socket {
    if (!this.socket) {
      const defaultUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"
      const url = process.env.NEXT_PUBLIC_SOCKET_URL || defaultUrl
      this.socket = io(url, {
        transports: ["websocket", "polling"],
        withCredentials: true,
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 20000,
      })

      this.socket.on("connect", () => {
        console.log("[v0] Connected to server:", this.socket?.id)
      })

      this.socket.on("disconnect", (reason) => {
        console.log("[v0] Disconnected from server", reason)
      })

      // Compact connection error logging only
      this.socket.on("connect_error", (err) => {
        console.warn("[v0] Socket connect_error:", err?.message || err)
      })
    }

    return this.socket
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  getSocket(): Socket | null {
    return this.socket
  }
}

export default SocketManager
