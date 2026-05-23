# 출시 체크리스트 (iOS / Android / Web)

신규 앱 출시 또는 주요 버전 업데이트 전에 모두 통과해야 함.

## 공통

- [ ] `/privacy`, `/terms`, `/account/delete` 본문이 최신 정책으로 업데이트되어 있다
- [ ] 운영자 문의 이메일이 `site_settings`(site.contact_email)에 입력되어 있다
- [ ] 홈 공지 영역에 출시 안내가 올라가 있다
- [ ] `/admin`에서 모든 토글이 의도대로 ON/OFF 상태에 있다
- [ ] DB 마이그레이션이 운영 Supabase에 모두 적용됐다 (0001, 0002, 0003 …)
- [ ] 시드 데이터(`supabase/seed.sql`)가 적용됐다

## iOS (App Store Connect)

- [ ] **테스트 계정 준비**
  - 이메일/비밀번호:
  - 권한(관리자 여부):
  - 익명 게시 시나리오는 별도로 캡처해서 심사 노트에 첨부
- [ ] 심사 노트(Review Notes)
  - 로그인 흐름 한 줄 설명
  - 익명 게시는 비번 분실 시 복구 불가 (정상 동작)
- [ ] 앱 카테고리/등급 결정 (예: Lifestyle / 4+)
- [ ] 스크린샷: iPhone 6.7”, 6.5”, 5.5” (Capacitor preview로 캡처)
- [ ] App Privacy 항목 입력 (수집: 이메일, 닉네임)
- [ ] Sign in with Apple 사용 여부 결정 (소셜 로그인 사용 시 Apple ID도 필수)

## Android (Google Play Console)

- [ ] 테스트 계정 동일
- [ ] 개인정보 처리방침 URL을 Play Console에 등록 (`https://YOUR_DOMAIN/privacy`)
- [ ] 데이터 안전 섹션(Data safety) 입력
- [ ] 콘텐츠 등급 설문(IARC) 제출

## 결제 (추후)

- [ ] 결제 후 잠금 해제되는 항목을 화면과 안내 페이지에 모두 명시
- [ ] 환불·복원 흐름 명시
- [ ] StoreKit 2 / Play Billing 정상 동작 확인
