export interface Guest {
  nickname: string
  capital: number
  hasBidInCurrentRound?: boolean
}

export interface Bid {
  nickname: string
  amount?: number // Optional for host view
  timestamp: Date
  round?: number
}

export interface RoundResults {
  round: number
  bids: Bid[]
  winner: Bid | null
}

export interface AuctionState {
  id: string
  status: "PRE-START" | "ACTIVE" | "ENDED"
  initialCapital: number
  guests: Guest[]
  bids: Bid[]
  guestCount: number
  currentRound: number
  roundStatus: "WAITING" | "ACTIVE" | "ENDED"
  currentRoundItem?: RoundAuctionItem
}

export interface HostData {
  roomId: string
  joinUrl: string
  state: AuctionState
}

export interface GuestData {
  nickname: string
  capital: number
  status: "PRE-START" | "ACTIVE" | "ENDED"
  currentRound?: number
  roundStatus?: "WAITING" | "ACTIVE" | "ENDED"
  hasBidInCurrentRound?: boolean
}

export interface AuctionItem {
  id: string
  name: string
  description: string
  imageUrl?: string
  ownerNickname: string
  registeredAt: Date
}

export interface RoundAuctionItem {
  item: AuctionItem
  registeredAt: Date
}
