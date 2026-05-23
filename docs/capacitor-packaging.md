# Capacitor로 모바일 패키징

웹앱(`apps/web`)을 그대로 iOS/Android 앱으로 패키징하는 방법.

> **참고:** Next.js App Router는 동적 SSR을 사용해 정적 export가 까다롭다.
> 운영 환경에서는 **웹앱을 Vercel/Cloudflare에 배포한 뒤, Capacitor는 그 URL을 WebView로 감싸는 방식**(서버 라우팅 유지)을 추천한다.

## 1. 초기 셋업

```bash
cd apps/web
npm i -D @capacitor/cli @capacitor/core @capacitor/ios @capacitor/android

# capacitor.config.ts 생성
npx cap init "햄찌랜드" com.hamster.community --web-dir=out
```

`capacitor.config.ts` 예시:

```ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hamster.community',
  appName: '햄찌랜드',
  // 옵션 A: 배포된 웹앱을 WebView로 감싸기 (추천)
  server: { url: 'https://YOUR_DOMAIN', cleartext: false },
  // 옵션 B: 정적 export를 임베드
  // webDir: 'out',
};
export default config;
```

## 2. 빌드 & 동기화

옵션 B (정적 export)를 쓰는 경우, `next.config.js`에 `output: 'export'`를 추가하고 동적 라우트를 정적으로 만들어야 한다. 동적 SSR 페이지가 많은 햄찌랜드는 **옵션 A 권장**.

```bash
# 옵션 B만 해당
npm run build
npx cap add ios
npx cap add android
npx cap sync
```

## 3. iOS / Android 열기

```bash
npx cap open ios       # Xcode
npx cap open android   # Android Studio
```

## 4. 딥링크 (Universal Links / App Links)

푸시 알림에서 `/guides/{id}`로 점프하려면 딥링크를 설정한다. Capacitor 공식 문서 [App URL Open](https://capacitorjs.com/docs/apis/app#addlistenerappurlopen-) 참고.

## 5. 푸시 알림 (FCM)

```bash
npm i @capacitor/push-notifications
npx cap sync
```

iOS는 APNs 인증서, Android는 `google-services.json`이 필요하다.
[`/docs/push-notification-plan.md`](./push-notification-plan.md)의 시나리오 외에는 발송하지 않는다.

## 6. 상태 보존

`Capacitor App` API의 `appStateChange` 이벤트로 백그라운드 진입 시 작성 폼 상태를 즉시 저장하도록 한다 (원칙 6).
