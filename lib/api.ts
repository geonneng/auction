// API client for auction operations
export class AuctionAPI {
  private baseUrl: string

  constructor() {
    this.baseUrl = '/api/auction'
  }

  private async makeRequest(url: string, options: RequestInit, retries = 3): Promise<any> {
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`[API] Making request to ${url}, attempt ${i + 1}`)
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          }
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        console.log(`[API] Request successful:`, data)
        return data
      } catch (error) {
        console.error(`[API] Request failed (attempt ${i + 1}):`, error)
        if (i === retries - 1) {
          throw error
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
      }
    }
  }

  async createRoom(initialCapital: number, auctionName?: string) {
    return this.makeRequest(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'createRoom',
        initialCapital,
        auctionName
      })
    })
  }

  async joinRoom(roomId: string, nickname: string) {
    return this.makeRequest(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'joinRoom',
        roomId,
        nickname
      })
    })
  }

  async startAuction(roomId: string) {
    return this.makeRequest(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'startAuction',
        roomId
      })
    })
  }

  async startRound(roomId: string) {
    return this.makeRequest(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'startRound',
        roomId
      })
    })
  }

  async endRound(roomId: string) {
    return this.makeRequest(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'endRound',
        roomId
      })
    })
  }

  async placeBid(roomId: string, nickname: string, amount: number) {
    return this.makeRequest(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'placeBid',
        roomId,
        nickname,
        amount
      })
    })
  }

  async modifyCapital(roomId: string, nickname: string, newCapital: number) {
    return this.makeRequest(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'modifyCapital',
        roomId,
        nickname,
        newCapital
      })
    })
  }

  async getState(roomId: string) {
    return this.makeRequest(`${this.baseUrl}?roomId=${roomId}`, {
      method: 'GET'
    })
  }
}

export const auctionAPI = new AuctionAPI()
