-- 경매방 테이블
CREATE TABLE auction_rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  initial_capital INTEGER NOT NULL DEFAULT 100000,
  status TEXT NOT NULL DEFAULT 'PRE-START',
  round_status TEXT NOT NULL DEFAULT 'WAITING',
  current_round INTEGER NOT NULL DEFAULT 0,
  current_item JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 게스트 테이블
CREATE TABLE guests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES auction_rooms(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  capital INTEGER NOT NULL,
  has_bid_in_current_round BOOLEAN DEFAULT FALSE,
  socket_id TEXT,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, nickname)
);

-- 경매 아이템 테이블
CREATE TABLE auction_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES auction_rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  starting_price INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 입찰 테이블
CREATE TABLE bids (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES auction_rooms(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES auction_items(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  round INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (성능 향상)
CREATE INDEX idx_guests_room_id ON guests(room_id);
CREATE INDEX idx_auction_items_room_id ON auction_items(room_id);
CREATE INDEX idx_bids_room_id ON bids(room_id);
CREATE INDEX idx_bids_guest_id ON bids(guest_id);
CREATE INDEX idx_bids_round ON bids(round);

-- 실시간 구독을 위한 RLS 정책
ALTER TABLE auction_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능하도록 설정
CREATE POLICY "Allow read access to auction_rooms" ON auction_rooms
  FOR SELECT USING (true);

CREATE POLICY "Allow read access to guests" ON guests
  FOR SELECT USING (true);

CREATE POLICY "Allow read access to auction_items" ON auction_items
  FOR SELECT USING (true);

CREATE POLICY "Allow read access to bids" ON bids
  FOR SELECT USING (true);

-- 게스트는 자신의 정보를 삽입/수정할 수 있음
CREATE POLICY "Allow insert for guests" ON guests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update for guests" ON guests
  FOR UPDATE USING (true);

-- 입찰은 누구나 할 수 있음
CREATE POLICY "Allow insert for bids" ON bids
  FOR INSERT WITH CHECK (true);

-- 아이템은 누구나 추가할 수 있음
CREATE POLICY "Allow insert for auction_items" ON auction_items
  FOR INSERT WITH CHECK (true);

-- 경매방은 누구나 생성할 수 있음
CREATE POLICY "Allow insert for auction_rooms" ON auction_rooms
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update for auction_rooms" ON auction_rooms
  FOR UPDATE USING (true);

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_auction_rooms_updated_at BEFORE UPDATE
    ON auction_rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
