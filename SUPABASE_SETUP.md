# Supabase 설정 가이드

## 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에 접속하여 계정 생성
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - **Name**: `dashima-auction`
   - **Database Password**: 복잡한 비밀번호 설정 (기억해두세요!)
   - **Region**: `Northeast Asia (Seoul)` 선택
4. 프로젝트 생성 완료까지 2-3분 대기

## 2. 데이터베이스 스키마 설정

1. Supabase 대시보드에서 **SQL Editor** 메뉴 선택
2. `supabase-schema.sql` 파일의 내용을 복사하여 실행
3. 실행 후 **Table Editor**에서 다음 테이블들이 생성되었는지 확인:
   - `auction_rooms`
   - `guests`
   - `auction_items`
   - `bids`

## 3. 환경 변수 설정

`.env.local` 파일을 프로젝트 루트에 생성하고 다음 내용 추가:

```bash
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# 기존 설정
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Supabase 키 찾는 방법:
1. Supabase 대시보드에서 **Settings** → **API** 메뉴 선택
2. **Project URL**: `NEXT_PUBLIC_SUPABASE_URL`에 복사
3. **anon public key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`에 복사
4. **service_role secret key**: `SUPABASE_SERVICE_ROLE_KEY`에 복사

## 4. 실시간 기능 활성화

1. Supabase 대시보드에서 **Database** → **Replication** 메뉴 선택
2. 다음 테이블들의 **Real-time** 토글을 활성화:
   - `auction_rooms`
   - `guests`
   - `auction_items`
   - `bids`

## 5. API 라우트 변경

기존 API 라우트를 Supabase 버전으로 변경:

```typescript
// 기존: /api/auction
// 변경: /api/auction-supabase
```

또는 기존 라우트를 덮어쓰기:
```bash
mv app/api/auction/route.ts app/api/auction/route-backup.ts
mv app/api/auction-supabase/route.ts app/api/auction/route.ts
```

## 6. 프론트엔드 업데이트

실시간 기능을 사용하려면 컴포넌트에서 다음과 같이 사용:

```typescript
import { useAuctionRealtime } from '@/hooks/use-supabase-realtime'

function AuctionRoom({ roomId }: { roomId: string }) {
  const roomData = useAuctionRealtime(roomId, {
    onRoomUpdate: (room) => {
      console.log('Room updated:', room)
    },
    onGuestJoin: (guest) => {
      console.log('Guest joined:', guest)
    },
    onBidPlaced: (bid) => {
      console.log('New bid:', bid)
    }
  })

  // 컴포넌트 렌더링...
}
```

## 7. 테스트

1. 개발 서버 실행: `npm run dev`
2. 브라우저에서 `http://localhost:3000` 접속
3. 경매방 생성 및 참여 테스트
4. 실시간 기능 동작 확인

## 8. 배포 시 주의사항

### Vercel 배포 시:
1. Vercel 대시보드에서 프로젝트 설정
2. **Environment Variables** 섹션에서 환경 변수 추가
3. `NEXT_PUBLIC_BASE_URL`을 실제 도메인으로 변경

### Supabase 보안 설정:
1. **Authentication** → **Settings**에서 필요시 인증 정책 설정
2. **Database** → **Policies**에서 RLS 정책 검토
3. **Settings** → **API**에서 CORS 설정 확인

## 9. 모니터링

- **Supabase Dashboard** → **Logs**에서 실시간 로그 확인
- **Database** → **Logs**에서 쿼리 성능 모니터링
- **API** → **Usage**에서 API 사용량 확인

## 10. 문제 해결

### 일반적인 문제들:

1. **연결 오류**: 환경 변수가 올바르게 설정되었는지 확인
2. **RLS 오류**: 데이터베이스 정책이 올바르게 설정되었는지 확인
3. **실시간 기능 작동 안함**: Replication 설정에서 해당 테이블이 활성화되었는지 확인
4. **타입 오류**: `types/auction.ts`의 인터페이스가 Supabase 스키마와 일치하는지 확인

### 로그 확인:
```bash
# 개발 서버 로그
npm run dev

# Supabase 로그는 대시보드에서 확인
```

## 추가 리소스

- [Supabase 문서](https://supabase.com/docs)
- [Supabase Realtime 가이드](https://supabase.com/docs/guides/realtime)
- [Row Level Security 가이드](https://supabase.com/docs/guides/auth/row-level-security)
