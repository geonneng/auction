// API client for auction operations
interface RetryOptions {
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
}

export class AuctionAPI {
  private baseUrl: string
  private retryOptions: RetryOptions

  constructor() {
    this.baseUrl = '/api/auction'
    this.retryOptions = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2
    }
  }

  private async makeRequest(url: string, options: RequestInit, retries?: number): Promise<any> {
    const maxRetries = retries ?? this.retryOptions.maxRetries!
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        console.log(`[API] Making request to ${url}, attempt ${i + 1}/${maxRetries}`)
        
        // AbortController로 타임아웃 설정
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10초 타임아웃
        
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (!response.ok) {
          // 4xx 클라이언트 오류는 재시도하지 않음
          if (response.status >= 400 && response.status < 500) {
            throw new Error(`Client error: ${response.status} ${response.statusText}`)
          }
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        console.log(`[API] Request successful:`, data)
        return data
      } catch (error: any) {
        console.error(`[API] Request failed (attempt ${i + 1}/${maxRetries}):`, error)
        
        // 마지막 시도이거나 재시도 불가능한 오류인 경우
        if (i === maxRetries - 1 || this.isNonRetryableError(error)) {
          throw error
        }
        
        // 지수 백오프 적용
        const delay = Math.min(
          this.retryOptions.baseDelay! * Math.pow(this.retryOptions.backoffMultiplier!, i),
          this.retryOptions.maxDelay!
        )
        
        console.log(`[API] Retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  private isNonRetryableError(error: any): boolean {
    // 네트워크 오류나 타임아웃이 아닌 경우 재시도하지 않음
    if (error.name === 'AbortError') return true
    if (error.message?.includes('Client error:')) return true
    return false
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

  async endAuction(roomId: string) {
    return this.makeRequest(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'endAuction',
        roomId
      })
    })
  }

  async placeBid(roomId: string, nickname: string, amount: number, auctionMethod: 'fixed' | 'dynamic' = 'fixed') {
    return this.makeRequest(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'placeBid',
        roomId,
        nickname,
        amount,
        auctionMethod
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

  async getAuctionItems(roomId: string) {
    return this.makeRequest(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'getAuctionItems',
        roomId
      })
    })
  }

  async saveAuctionItem(roomId: string, itemData: any, guestName: string) {
    return this.makeRequest(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'saveAuctionItem',
        roomId,
        itemData,
        guestName
      })
    })
  }

  async registerAuctionItem(roomId: string, itemData: any, round: number) {
    return this.makeRequest(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'registerAuctionItem',
        roomId,
        itemData,
        round
      })
    })
  }

  async distributeWinningAmount(roomId: string, winnerNickname: string, amount: number, ownerNickname: string) {
    return this.makeRequest(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'distributeWinningAmount',
        roomId,
        winnerNickname,
        amount,
        ownerNickname
      })
    })
  }
}

export const auctionAPI = new AuctionAPI()
