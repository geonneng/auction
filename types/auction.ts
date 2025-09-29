export interface Guest {
  id?: string
  room_id?: string
  nickname: string
  capital: number
  has_bid_in_current_round?: boolean
  socket_id?: string
  joined_at?: string
}

export interface Bid {
  id?: string
  room_id?: string
  guest_id?: string
  item_id?: string
  nickname?: string
  amount: number
  round: number
  created_at?: string
}

export interface RoundResults {
  round: number
  bids: Bid[]
  winner: Bid | null
}

export interface AuctionRoom {
  id: string
  name: string
  initial_capital: number
  status: "PRE-START" | "ACTIVE" | "ENDED"
  round_status: "WAITING" | "ACTIVE" | "ENDED"
  current_round: number
  current_item?: any
  created_at?: string
  updated_at?: string
  guests?: Guest[]
  items?: AuctionItem[]
  bids?: Bid[]
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
  id?: string
  room_id?: string
  name: string
  description?: string
  image_url?: string
  starting_price?: number
  created_at?: string
}

export interface RoundAuctionItem {
  item: AuctionItem
  registeredAt: Date
}
