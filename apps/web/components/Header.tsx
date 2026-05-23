'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type Props = {
  user: { email: string } | null;
  username: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
};

const NAV: { href: string; label: string; emoji: string }[] = [
  { href: '/species',    label: '도감',         emoji: '🐹' },
  { href: '/guides',     label: '가이드',       emoji: '📖' },
  { href: '/community',  label: '커뮤니티',     emoji: '💬' },
  { href: '/rescue',     label: '구조대',       emoji: '🆘' },
  { href: '/announcements', label: '공지',     emoji: '📢' },
];

export function Header({ user, username, avatarUrl, isAdmin }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const supabase = createSupabaseBrowserClient();

  const [q, setQ] = useState(pathname.startsWith('/search') ? params.get('q') ?? '' : '');
  const [open, setOpen] = useState(false);

  // 라우트 변경 시 모바일 메뉴 닫기
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
    <header className="sticky top-0 z-30 border-b border-cream-200 bg-[var(--bg)]/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-2 px-3 py-2.5 md:gap-3 md:px-6 md:py-3">
        {/* 로고 */}
        <Link href="/" className="flex shrink-0 items-center gap-1.5">
          <span aria-hidden className="text-2xl">🐹</span>
          <span className="font-display text-lg font-bold text-cocoa-500 md:text-xl">햄랜드</span>
        </Link>

        {/* 데스크톱 네비 */}
        <nav className="hidden flex-1 items-center gap-0.5 lg:flex">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  'whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition ' +
                  (active ? 'bg-peach-100 text-peach-500' : 'text-cocoa-400 hover:bg-cream-100')
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* 데스크톱 검색 */}
        <form onSubmit={submitSearch} className="ml-auto hidden flex-1 max-w-xs lg:block">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="🔍 검색"
            className="input py-1.5 text-sm"
          />
        </form>

        {/* 오른쪽 액션 */}
        <div className="ml-auto flex shrink-0 items-center gap-1.5 lg:ml-0">
          {isAdmin && (
            <Link
              href="/admin"
              className={
                'hidden whitespace-nowrap rounded-full px-2.5 py-1.5 text-sm font-medium transition md:inline-flex ' +
                (pathname.startsWith('/admin') ? 'bg-lilac-200 text-lilac-400' : 'text-lilac-400 hover:bg-lilac-50')
              }
            >
              관리
            </Link>
          )}
          {user && (
            <Link
              href="/messages"
              className="hidden shrink-0 rounded-full px-2.5 py-1.5 text-sm font-medium text-cocoa-400 hover:bg-cream-100 md:inline-flex"
              aria-label="쪽지"
              title="쪽지"
            >
              ✉
            </Link>
          )}
          {user ? (
            <>
              <Link
                href="/profile"
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-cream-100 px-2.5 py-1.5 text-sm text-cocoa-500 hover:bg-cream-200"
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
                className="hidden whitespace-nowrap rounded-full px-2.5 py-1.5 text-sm text-cocoa-400 hover:bg-cream-100 md:inline-flex"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="whitespace-nowrap rounded-full px-2.5 py-1.5 text-sm text-cocoa-400 hover:bg-cream-100"
              >
                로그인
              </Link>
              <Link
                href="/signup"
                className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-peach-400 px-3 py-1.5 text-sm font-semibold text-white shadow-soft hover:bg-peach-500"
              >
                가입
              </Link>
            </>
          )}

          {/* 모바일 햄버거 */}
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
                placeholder="🔍 검색"
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
                      'flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-medium transition ' +
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
                <Link href="/messages" className="btn-secondary flex-1 text-sm">✉ 쪽지함</Link>
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
