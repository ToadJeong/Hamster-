'use client';

import { createBrowserClient } from '@supabase/ssr';

// 브라우저 클라이언트는 싱글턴으로 재사용한다.
// 매 렌더마다 새 인스턴스를 만들면 useEffect 의존성([..., supabase])이
// 매번 바뀌어 효과가 반복 실행되고, 실시간 구독이 중복으로 열린다.
let browserClient: ReturnType<typeof createBrowserClient> | undefined;

export function createSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return browserClient;
}
