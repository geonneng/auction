// 데이터 무결성 검증 유틸리티

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export class DataValidator {
  // 경매 상태 검증
  static validateAuctionState(state: any): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // 필수 필드 검증
    if (!state.id) errors.push('Room ID is required')
    if (!state.status) errors.push('Status is required')
    if (typeof state.initialCapital !== 'number' || state.initialCapital <= 0) {
      errors.push('Initial capital must be a positive number')
    }
    if (typeof state.currentRound !== 'number' || state.currentRound < 0) {
      errors.push('Current round must be a non-negative number')
    }

    // 상태 값 검증
    const validStatuses = ['PRE-START', 'ACTIVE', 'ENDED']
    if (!validStatuses.includes(state.status)) {
      errors.push(`Invalid status: ${state.status}`)
    }

    // 게스트 데이터 검증
    if (state.guests && Array.isArray(state.guests)) {
      state.guests.forEach((guest: any, index: number) => {
        if (!guest.nickname || typeof guest.nickname !== 'string') {
          errors.push(`Guest ${index}: nickname is required`)
        }
        if (typeof guest.capital !== 'number' || guest.capital < 0) {
          errors.push(`Guest ${index}: capital must be a non-negative number`)
        }
        if (typeof guest.hasBidInCurrentRound !== 'boolean') {
          errors.push(`Guest ${index}: hasBidInCurrentRound must be boolean`)
        }
      })
    }

    // 입찰 데이터 검증
    if (state.bids && Array.isArray(state.bids)) {
      state.bids.forEach((bid: any, index: number) => {
        if (!bid.nickname || typeof bid.nickname !== 'string') {
          errors.push(`Bid ${index}: nickname is required`)
        }
        if (typeof bid.amount !== 'number' || bid.amount <= 0) {
          errors.push(`Bid ${index}: amount must be a positive number`)
        }
        if (typeof bid.round !== 'number' || bid.round < 1) {
          errors.push(`Bid ${index}: round must be a positive number`)
        }
      })
    }

    // 경고사항 체크
    if (state.guests && state.guests.length === 0 && state.status === 'ACTIVE') {
      warnings.push('Auction is active but no guests are present')
    }

    if (state.currentRound > 0 && (!state.bids || state.bids.length === 0)) {
      warnings.push('Current round is active but no bids are present')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  // 경매 물품 검증
  static validateAuctionItem(item: any): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (!item.name || typeof item.name !== 'string' || item.name.trim().length === 0) {
      errors.push('Item name is required')
    }

    if (!item.description || typeof item.description !== 'string') {
      errors.push('Item description is required')
    }

    if (item.startingPrice && (typeof item.startingPrice !== 'number' || item.startingPrice < 0)) {
      errors.push('Starting price must be a non-negative number')
    }

    if (item.owner && typeof item.owner !== 'string') {
      errors.push('Owner must be a string')
    }

    if (item.round && (typeof item.round !== 'number' || item.round < 1)) {
      errors.push('Round must be a positive number')
    }

    // 경고사항
    if (item.name && item.name.length > 100) {
      warnings.push('Item name is very long')
    }

    if (item.description && item.description.length > 500) {
      warnings.push('Item description is very long')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  // 입찰 데이터 검증
  static validateBid(bid: any, guestCapital: number): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (!bid.nickname || typeof bid.nickname !== 'string') {
      errors.push('Bidder nickname is required')
    }

    if (typeof bid.amount !== 'number' || bid.amount <= 0) {
      errors.push('Bid amount must be a positive number')
    }

    if (bid.amount > guestCapital) {
      errors.push('Bid amount exceeds guest capital')
    }

    if (typeof bid.round !== 'number' || bid.round < 1) {
      errors.push('Round must be a positive number')
    }

    // 경고사항
    if (bid.amount > guestCapital * 0.8) {
      warnings.push('Bid amount is very high relative to capital')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  // 데이터 동기화 검증
  static validateDataSync(localData: any, serverData: any): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (!localData || !serverData) {
      errors.push('Both local and server data are required for sync validation')
      return { isValid: false, errors, warnings }
    }

    // 기본 필드 동기화 검증
    const criticalFields = ['status', 'currentRound', 'roundStatus']
    criticalFields.forEach(field => {
      if (localData[field] !== serverData[field]) {
        warnings.push(`Field '${field}' is out of sync: local=${localData[field]}, server=${serverData[field]}`)
      }
    })

    // 게스트 데이터 동기화 검증
    if (localData.guests && serverData.guests) {
      const localGuests = localData.guests.length
      const serverGuests = serverData.guests.length
      
      if (localGuests !== serverGuests) {
        warnings.push(`Guest count mismatch: local=${localGuests}, server=${serverGuests}`)
      }
    }

    // 입찰 데이터 동기화 검증
    if (localData.bids && serverData.bids) {
      const localBids = localData.bids.length
      const serverBids = serverData.bids.length
      
      if (Math.abs(localBids - serverBids) > 1) {
        warnings.push(`Bid count significantly different: local=${localBids}, server=${serverBids}`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }
}

// 데이터 복구 유틸리티
export class DataRecovery {
  // 손상된 데이터 복구
  static recoverAuctionState(state: any): any {
    const recovered = { ...state }

    // 기본값 설정
    if (!recovered.status) recovered.status = 'PRE-START'
    if (typeof recovered.currentRound !== 'number') recovered.currentRound = 0
    if (typeof recovered.roundStatus !== 'string') recovered.roundStatus = 'WAITING'
    if (!Array.isArray(recovered.guests)) recovered.guests = []
    if (!Array.isArray(recovered.bids)) recovered.bids = []

    // 게스트 데이터 정리
    recovered.guests = recovered.guests.filter((guest: any) => 
      guest && guest.nickname && typeof guest.capital === 'number'
    )

    // 입찰 데이터 정리
    recovered.bids = recovered.bids.filter((bid: any) => 
      bid && bid.nickname && typeof bid.amount === 'number' && typeof bid.round === 'number'
    )

    return recovered
  }

  // 로컬 스토리지 데이터 복구
  static recoverLocalStorage(key: string): any {
    try {
      const data = localStorage.getItem(key)
      if (!data) return null

      const parsed = JSON.parse(data)
      return this.recoverAuctionState(parsed)
    } catch (error) {
      console.error(`[DataRecovery] Failed to recover localStorage data for key: ${key}`, error)
      return null
    }
  }
}

// recoverAuctionState 함수를 별도로 export
export const recoverAuctionState = DataRecovery.recoverAuctionState