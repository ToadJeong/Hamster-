# 햄찌랜드 🐹

한국에서 키우는 햄스터 종별 도감과 사육 가이드, 그리고 햄집사들의 이야기를 나누는 커뮤니티.

- **웹** (`apps/web`): Next.js 14 (App Router) + Tailwind + Supabase SSR
- **모바일 — 패키징 우선**: 동일 웹앱을 [Capacitor](./docs/capacitor-packaging.md)로 iOS/Android 패키징
- **모바일 — 네이티브 옵션**: `apps/mobile`에 Expo Router 기반 보조 앱 (조회/로그인)
- **백엔드**: Supabase (Postgres + Auth + Storage + RPC)
- **공통 패키지** (`packages/shared`): 타입·상수

> 출시 전 모든 신규 기능은 [`/docs/development-principles.md`](./docs/development-principles.md)의 7가지 원칙을 통과해야 함.

## 폴더 구조

```
apps/
  web/        Next.js 웹 (도감/가이드/인증/프로필/관리/검색/정책)
  mobile/     Expo 보조 앱 (조회 + 로그인)
packages/
  shared/     공유 타입과 상수
supabase/
  migrations/ 0001 스키마 · 0002 관리자/스토리지 · 0003 익명 게시
  seed.sql    햄스터 30종 시드 (가나다순)
docs/
  development-principles.md  7대 개발 원칙
  release-checklist.md       iOS/Android/Web 출시 체크리스트
  push-notification-plan.md  푸시 알림 시나리오 (등록제)
  capacitor-packaging.md     Capacitor 패키징 가이드
```

## 핵심 기능

| 영역 | 내용 |
|---|---|
| 햄스터 도감 | 가나다순 30종 · 초성 점프 인덱스 · 상세 페이지 · 종별 가이드 자동 연결 |
| 가이드 게시판 | 마크다운 작성기 · 미리보기 탭 · 종 태그 · 좋아요 · 댓글 |
| 인증 | 이메일+비밀번호 · Google·Kakao OAuth (관리자가 ON/OFF) |
| **익명 게시** | 비로그인도 닉네임+비밀번호로 글/댓글 작성 가능, 본인 비번으로 수정·삭제 |
| 통합 검색 | `/search` — 종/가이드/작성자를 한 번에 검색 |
| 프로필 | 닉네임·아바타·소개, 내가 쓴 가이드 모음 (회원 한정) |
| **관리자** | 소셜 로그인 ON/OFF, 홈 공지, 문의 이메일, 정책 본문을 **코드 배포 없이 관리** |
| 정책 페이지 | `/privacy`, `/terms`, `/account/delete` (관리자 페이지에서 본문 편집) |
| 드래프트 보존 | 글 작성 중 새로고침·뒤로가기·앱 백그라운드 → 입력 내용 자동 복구 |

## 1. Supabase 설정

1. [Supabase](https://supabase.com/)에서 새 프로젝트 생성
2. **SQL Editor**에서 다음 순서로 실행
   - `supabase/migrations/0001_initial_schema.sql`
   - `supabase/migrations/0002_admin_and_settings.sql`
   - `supabase/migrations/0003_anonymous_posting.sql`
   - `supabase/seed.sql` (햄스터 30종)
3. **Authentication → Providers**에서 사용할 제공자 활성화
   - Email/Password는 기본 활성화
   - Google, Kakao를 사용하려면 각 콘솔에서 OAuth 앱 생성 후 키 입력
4. **Authentication → URL Configuration**의 Redirect URL에 추가
   - 로컬: `http://localhost:3000/auth/callback`
   - 운영: `https://YOUR_DOMAIN/auth/callback`

### 관리자 권한 부여
첫 가입 본인 계정을 관리자로 만들기 — SQL Editor에서:

```sql
update public.profiles
   set is_admin = true
 where id = (select id from auth.users where email = 'YOUR_EMAIL');
```

이후 헤더에 “관리” 메뉴가 보이고 `/admin`에서 사이트 설정을 편집할 수 있어요.

## 2. 로컬 개발

```bash
# 워크스페이스 설치
npm install

# 웹
cp apps/web/.env.local.example apps/web/.env.local
npm run dev:web        # → http://localhost:3000

# Expo 보조 앱
cp apps/mobile/.env.local.example apps/mobile/.env.local
npm run dev:mobile

# Capacitor 패키징 (웹앱을 iOS/Android로)
# → docs/capacitor-packaging.md 참고
```

## 3. 데이터 모델

| 테이블 | 설명 |
|---|---|
| `profiles` | `auth.users` 1:1, `is_admin`, 닉네임/아바타 |
| `species` | 햄스터 종 (도감), 관리자만 추가/수정 |
| `guides` | 사육 가이드. `author_id` NULL이면 익명 (닉네임+비밀번호 해시 보관) |
| `comments` | 가이드 댓글. 동일하게 익명/회원 모두 지원 |
| `likes` | 좋아요 (복합 PK) |
| `site_settings` | key/value(jsonb), 관리자만 쓰기 — 소셜 로그인 토글·공지·정책 본문 |
| `guides_with_counts` (view) | 작성자/종/좋아요·댓글 수 집계 |

### 익명 게시 보안 모델

- 평문 비밀번호는 **DB에 도달하기 전에만 클라이언트가 갖고 있으며**,
  서버 측 RPC (`insert_anonymous_guide` 등)가 `pgcrypto.crypt()` + bcrypt salt로 해시해 저장
- 수정·삭제는 `update_anonymous_guide` / `delete_anonymous_guide` / `delete_anonymous_comment` RPC를 통해서만 가능
- `anonymous_password_hash` 컬럼은 `anon`/`authenticated` 키에 SELECT 권한을 회수했기 때문에 외부로 노출되지 않음
- 익명 게시 자체를 `app.allow_anonymous = false`로 막을 수 있음

## 4. 보안 메모

- `.env.local`은 절대 커밋 금지 (`.gitignore`에 포함)
- `anon`(publishable) 키는 클라이언트 노출 가능 — RLS로 보호되지만 `service_role` 키는 절대 클라/깃에 두면 안 됨
- 스토리지는 `species-images`(관리자만), `guide-covers`/`avatars`(본인 폴더만) 정책 적용

## 5. 출시 체크리스트

[`/docs/release-checklist.md`](./docs/release-checklist.md) 참고. 핵심:
- 심사용 테스트 계정 준비
- `site.contact_email` 설정
- 정책 페이지 본문 검수
- 마이그레이션 모두 적용 확인

## 6. 이후 계획 (v2+)

- Supabase Storage 업로드 UI (커버 이미지, 아바타)
- 도감 관리자 편집 UI
- 모바일에서 작성·댓글 지원
- 푸시 알림 (시나리오는 이미 등록됨 — `/docs/push-notification-plan.md`)
- 결제 도입 시 잠금 해제·복원 안내 페이지 (원칙 4)
