'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type Props = {
  user: { email: string } | null;
  username: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
};

export function Header({ user, username, avatarUrl, isAdmin }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const supabase = createSupabaseBrowserClient();
  const [q, setQ] = useState(pathname.startsWith('/search') ? params.get('q') ?? '' : '');

  const navItems = [
    { href: '/species', label: '도감' },
    { href: '/guides',  label: '가이드' },
  ] as const;

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
      <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-3 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span aria-hidden className="text-2xl">🐹</span>
          <span className="hidden font-display text-xl font-bold text-cocoa-500 sm:inline">햄찌랜드</span>
        </Link>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  'rounded-full px-3 py-1.5 text-sm font-medium transition ' +
                  (active ? 'bg-peach-100 text-peach-500' : 'text-cocoa-400 hover:bg-cream-100')
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <form onSubmit={submitSearch} className="ml-auto hidden flex-1 max-w-sm md:block">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="🔍 종·가이드 통합 검색"
            className="input py-2 text-sm"
          />
        </form>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          {isAdmin && (
            <Link
              href="/admin"
              className={
                'rounded-full px-3 py-1.5 text-sm font-medium transition ' +
                (pathname.startsWith('/admin')
                  ? 'bg-lilac-200 text-lilac-400'
                  : 'text-lilac-400 hover:bg-lilac-50')
              }
            >
              관리
            </Link>
          )}
          {user ? (
            <>
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-full bg-cream-100 px-3 py-1.5 text-sm text-cocoa-500 hover:bg-cream-200"
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
                ) : (
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-peach-200 text-xs">🐹</span>
                )}
                <span className="hidden sm:inline">{username ?? '내 프로필'}</span>
              </Link>
              <button onClick={handleLogout} className="btn-ghost text-sm">로그아웃</button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost text-sm">로그인</Link>
              <Link href="/signup" className="btn-primary text-sm">가입</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
