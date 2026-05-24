import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

type CookieToSet = { name: string; value: string; options?: CookieOptions };

export async function middleware(request: NextRequest) {
  // getAll/setAll 패턴: 토큰 갱신 시 모든 쿠키를 단일 응답에 안전하게 반영한다.
  // (이전의 개별 set 패턴은 갱신 쿠키가 누락돼 페이지 전환 중 간헐적 로그아웃을 유발했음)
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: request.headers } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options));
        },
      },
    }
  );

  // 세션을 새로고침해 만료 직전 토큰을 갱신하고 쿠키를 다시 심는다.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /*
     * 다음 경로를 제외하고 모두 매칭:
     * - _next/static, _next/image, favicon.ico
     * - 정적 파일 (svg, png, jpg, jpeg, gif, webp)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
