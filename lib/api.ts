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
      maxRetries: 2,
      baseDelay: 400,
      maxDelay: 2000,
      backoffMultiplier: 2
    }
  }

  private async makeRequest(url: string, options: RequestInit, retries?: number): Promise<any> {
    const method = (options.method || 'GET').toUpperCase()
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
    const maxRetries = isMutation ? 1 : (retries ?? this.retryOptions.maxRetries!)
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        console.log(`[API] Making request to ${url}, attempt ${i + 1}/${maxRetries}`)
        
        // AbortController로 타임아웃 설정 (10초로 증가)
        const controller = new AbortController()
        const timeoutId = setTimeout(() => {
          console.log(`[API] Request timeout after 10 seconds`)
          controller.abort()
        }, 10000) // 10초 타임아웃
        
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            ...options.headers,
          },
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (!response.ok) {
          // 응답 본문을 함께 로깅하여 원인 진단 용이
          let errorBody: any = null
          try {
            errorBody = await response.json()
          } catch (_) {}

          console.error('[API] HTTP error response:', {
            status: response.status,
            statusText: response.statusText,
            body: errorBody
          })

          // 4xx 클라이언트 오류는 재시도하지 않음
          if (response.status >= 400 && response.status < 500) {
            throw new Error(`Client error: ${response.status} ${response.statusText}${errorBody?.error ? ` - ${errorBody.error}` : ''}`)
          }
          throw new Error(`HTTP error! status: ${response.status}${errorBody?.error ? ` - ${errorBody.error}` : ''}`)
        }
        
        const data = await response.json()
        console.log(`[API] Request successful:`, data)
        return data
      } catch (error: any) {
        console.error(`[API] Request failed (attempt ${i + 1}/${maxRetries}):`, error)
        
        // AbortError인 경우 더 구체적인 메시지 제공
        if (error.name === 'AbortError') {
          console.error(`[API] Request was aborted - possible timeout or network issue`)
        }
        
        // 마지막 시도이거나 재시도 불가능한 오류인 경우
        if (i === maxRetries - 1 || this.isNonRetryableError(error)) {
          // AbortError인 경우 더 친화적인 에러 메시지 제공
          if (error.name === 'AbortError') {
            console.warn('[API] Request timed out, but continuing...')
            // AbortError는 재시도할 가치가 있으므로 에러를 던지지 않고 빈 응답 반환
            return { success: false, error: 'Request timeout - retrying...', timeout: true }
          }
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
    // 클라이언트 오류(4xx)는 재시도하지 않음
    if (error.message?.includes('Client error:')) return true
    // 서버 오류(5xx)는 기본적으로 재시도하지 않도록 처리하여 지연을 줄임
    const m = /HTTP error! status: (\d+)/.exec(error.message || '')
    if (m) {
      const status = parseInt(m[1], 10)
      if (status >= 500) return true
    }
    // AbortError는 재시도하지 않음
    if (error.name === 'AbortError') return true
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

  async endRound(roomId: string, auctionType?: 'fixed' | 'dynamic') {
    return this.makeRequest(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'endRound',
        roomId,
        auctionType
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

  async placeBid(roomId: string, nickname: string, amount: number, round: number, auctionType?: 'fixed' | 'dynamic') {
    return this.makeRequest(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'placeBid',
        roomId,
        nickname,
        bidAmount: amount,
        round,
        auctionType: auctionType || 'fixed'
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
    const ts = Date.now()
    return this.makeRequest(`${this.baseUrl}?roomId=${roomId}&_t=${ts}`, {
      method: 'GET',
      // 최신 상태 강제
      cache: 'no-store'
    } as RequestInit)
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

  async getCurrentRoundItem(roomId: string) {
    return this.makeRequest(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'getCurrentRoundItem',
        roomId
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
