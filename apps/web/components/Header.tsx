'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { LogoWordmark } from '@/components/HamlandAssets';

type Props = {
  user: { email: string } | null;
  username: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
};

// 사용자가 요청한 메뉴 순서: 공지 → 도감 → 가이드 → 커뮤니티 → 육아일기 → 상품 → 구조대 → 병원
const NAV: { href: string; label: string; emoji: string }[] = [
  { href: '/announcements', label: '공지',   emoji: '📢' },
  { href: '/species',       label: '도감',   emoji: '🐹' },
  { href: '/guides',        label: '가이드', emoji: '📖' },
  { href: '/community',     label: '커뮤니티', emoji: '💬' },
  { href: '/moments',       label: '육아일기', emoji: '📸' },
  { href: '/products',      label: '상품',   emoji: '🛍' },
  { href: '/rescue',        label: '구조대', emoji: '🆘' },
  { href: '/hospitals',     label: '병원',   emoji: '🏥' },
];

export function Header({
  user, username, avatarUrl, isAdmin,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const supabase = createSupabaseBrowserClient();

  const [q, setQ] = useState(pathname.startsWith('/search') ? params.get('q') ?? '' : '');
  const [open, setOpen] = useState(false);

  // 안읽은 배지는 서버 렌더를 막지 않도록 마운트 후 조회 (페이지 이동 시 갱신)
  const [dmUnread, setDmUnread] = useState(0);
  const [notifUnread, setNotifUnread] = useState(0);
  useEffect(() => {
    if (!user) { setDmUnread(0); setNotifUnread(0); return; }
    let active = true;
    (async () => {
      const [dm, nf] = await Promise.all([
        supabase.rpc('dm_unread_count'),
        supabase.rpc('notif_unread_count'),
      ]);
      if (!active) return;
      setDmUnread((dm.data as number) ?? 0);
      setNotifUnread((nf.data as number) ?? 0);
    })();
    return () => { active = false; };
  }, [user, pathname, supabase]);

  useEffect(() => { setOpen(false); }, [pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.refresh();
    router.push('/');
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const next = q.trim();
    router.push(next ? `/search?q=${encodeURIComponent(next)}` : '/search');
  }

  return (
    <header className="sticky top-0 z-30 border-b border-cream-200 bg-[var(--bg)]/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-2 px-3 py-2.5 md:gap-3 md:px-6 md:py-3">
        <Link href="/" className="flex shrink-0 items-center" aria-label="햄랜드 홈">
          <LogoWordmark variant="horizontal" className="h-10 w-auto" />
        </Link>

        {/* 데스크톱 네비 — 볼드체 + 더 큰 글씨 */}
        <nav className="hidden flex-1 items-center gap-0.5 lg:flex">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  'whitespace-nowrap rounded-full px-2.5 py-1.5 text-[13px] font-bold transition xl:px-3 xl:text-sm ' +
                  (active ? 'bg-peach-100 text-peach-500' : 'text-cocoa-500 hover:bg-cream-100')
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* 데스크톱/태블릿 통합검색 */}
        <form onSubmit={submitSearch} className="ml-auto hidden min-w-0 flex-1 max-w-xs md:block lg:max-w-[140px] xl:max-w-xs">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="🔍 통합검색"
            className="input py-1.5 text-sm"
          />
        </form>

        {/* 오른쪽 액션 */}
        <div className="ml-auto flex shrink-0 items-center gap-1.5 lg:ml-0">
          {isAdmin && (
            <Link
              href="/admin"
              className={
                'hidden whitespace-nowrap rounded-full px-2.5 py-1.5 text-sm font-bold transition md:inline-flex ' +
                (pathname.startsWith('/admin') ? 'bg-lilac-200 text-lilac-400' : 'text-lilac-400 hover:bg-lilac-50')
              }
            >
              관리
            </Link>
          )}
          {user && (
            <Link
              href="/notifications"
              className="relative hidden shrink-0 rounded-full px-2.5 py-1.5 text-sm font-medium text-cocoa-400 hover:bg-cream-100 md:inline-flex"
              title="알림"
            >
              🔔
              {notifUnread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {notifUnread > 9 ? '9+' : notifUnread}
                </span>
              )}
            </Link>
          )}
          {user && (
            <Link
              href="/messages"
              className="relative hidden shrink-0 rounded-full px-2.5 py-1.5 text-sm font-medium text-cocoa-400 hover:bg-cream-100 md:inline-flex"
              title="쪽지"
            >
              ✉
              {dmUnread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {dmUnread > 9 ? '9+' : dmUnread}
                </span>
              )}
            </Link>
          )}
          {user ? (
            <>
              <Link
                href="/profile"
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-cream-100 px-2.5 py-1.5 text-sm font-medium text-cocoa-500 hover:bg-cream-200"
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
                ) : (
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-peach-200 text-xs">🐹</span>
                )}
                <span className="hidden whitespace-nowrap md:inline">{username ?? '내 프로필'}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="hidden whitespace-nowrap rounded-full px-2.5 py-1.5 text-sm font-medium text-cocoa-400 hover:bg-cream-100 md:inline-flex"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="whitespace-nowrap rounded-full px-2.5 py-1.5 text-sm font-medium text-cocoa-500 hover:bg-cream-100"
              >
                로그인
              </Link>
              <Link
                href="/signup"
                className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-peach-400 px-3 py-1.5 text-sm font-bold text-white shadow-soft hover:bg-peach-500"
              >
                가입
              </Link>
            </>
          )}

          <button
            onClick={() => setOpen(!open)}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-cocoa-500 hover:bg-cream-100 lg:hidden"
            aria-label="메뉴"
          >
            {open ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* 모바일 드로어 */}
      {open && (
        <div className="border-t border-cream-200 bg-[var(--bg)] lg:hidden">
          <div className="mx-auto w-full max-w-5xl space-y-3 px-3 py-3 md:px-6">
            <form onSubmit={submitSearch}>
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="🔍 통합검색"
                className="input"
              />
            </form>
            <nav className="grid grid-cols-2 gap-2">
              {NAV.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={
                      'flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-bold transition ' +
                      (active ? 'bg-peach-100 text-peach-500' : 'bg-cream-50 text-cocoa-500 hover:bg-cream-100')
                    }
                  >
                    <span>{item.emoji}</span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            {user && (
              <div className="flex flex-wrap gap-2">
                <Link href="/notifications" className="btn-secondary flex-1 text-sm">
                  🔔 알림{notifUnread > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] text-white">
                      {notifUnread}
                    </span>
                  )}
                </Link>
                <Link href="/messages" className="btn-secondary flex-1 text-sm">
                  ✉ 쪽지{dmUnread > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] text-white">
                      {dmUnread}
                    </span>
                  )}
                </Link>
                {isAdmin && (
                  <Link href="/admin" className="btn-secondary flex-1 text-sm">관리</Link>
                )}
                <button onClick={handleLogout} className="btn-secondary flex-1 text-sm">
                  로그아웃
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
