// API client for auction operations
export class AuctionAPI {
  private baseUrl: string

  constructor() {
    this.baseUrl = '/api/auction'
  }

  async createRoom(initialCapital: number) {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'createRoom',
        initialCapital
      })
    })
    return response.json()
  }

  async joinRoom(roomId: string, nickname: string) {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'joinRoom',
        roomId,
        nickname
      })
    })
    return response.json()
  }

  async startAuction(roomId: string) {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'startAuction',
        roomId
      })
    })
    return response.json()
  }

  async startRound(roomId: string) {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'startRound',
        roomId
      })
    })
    return response.json()
  }

  async endRound(roomId: string) {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'endRound',
        roomId
      })
    })
    return response.json()
  }

  async placeBid(roomId: string, nickname: string, amount: number) {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'placeBid',
        roomId,
        nickname,
        amount
      })
    })
    return response.json()
  }

  async modifyCapital(roomId: string, nickname: string, newCapital: number) {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'modifyCapital',
        roomId,
        nickname,
        newCapital
      })
    })
    return response.json()
  }

  async getState(roomId: string) {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'getState',
        roomId
      })
    })
    return response.json()
  }
}

export const auctionAPI = new AuctionAPI()
