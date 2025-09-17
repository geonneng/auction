# 다시마 경매 (Dashima Auction)

실시간 경매 시뮬레이션 플랫폼입니다. 호스트가 라운드별로 경매를 진행하고, 게스트들이 실시간으로 입찰할 수 있습니다.

## 주요 기능

- 🏠 **호스트 대시보드**: 경매 생성, 라운드 관리, 실시간 입찰 현황 모니터링
- 👥 **게스트 참여**: QR코드 또는 링크로 쉽게 참여
- 🎯 **라운드별 경매**: 호스트가 라운드를 시작/종료하며 경매 진행
- 💰 **실시간 입찰**: 라운드 중 실시간 입찰, 종료 후 결과 공개
- 📱 **QR코드 공유**: 스마트폰으로 쉽게 참여 가능

## 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: Tailwind CSS, Radix UI
- **Real-time**: Socket.IO
- **QR Code**: qrcode 라이브러리

## 로컬 개발

1. 의존성 설치
```bash
npm install
```

2. 개발 서버 실행
```bash
npm run dev
```

3. 브라우저에서 `http://localhost:3000` 접속

## Vercel 배포

### 1. Vercel CLI 설치
```bash
npm i -g vercel
```

### 2. Vercel 로그인
```bash
vercel login
```

### 3. 프로젝트 배포
```bash
vercel
```

### 4. 환경 변수 설정
Vercel 대시보드에서 다음 환경 변수를 설정하세요:

- `NEXT_PUBLIC_SOCKET_URL`: Socket.IO 서버 URL (자동 설정됨)
- `NEXT_PUBLIC_BASE_URL`: 앱의 기본 URL (자동 설정됨)

## 경매 진행 방식

1. **경매 생성**: 호스트가 초기 자본금을 설정하고 경매 생성
2. **참가자 참여**: 게스트들이 QR코드 또는 링크로 참여
3. **경매 시작**: 호스트가 경매를 시작
4. **라운드 진행**: 
   - 호스트가 라운드 시작
   - 게스트들이 입찰 (금액은 비공개)
   - 호스트가 라운드 종료
   - 입찰 결과 공개 및 최고 입찰자 발표
5. **다음 라운드**: 필요시 새로운 라운드 시작

## 라이선스

MIT License
