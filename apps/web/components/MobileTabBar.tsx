'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/',          label: '홈',     icon: '🏠' },
  { href: '/species',   label: '도감',   icon: '🐹' },
  { href: '/moments',   label: '모먼트', icon: '📸' },
  { href: '/community', label: '커뮤니티', icon: '💬' },
  { href: '/profile',   label: '내정보', icon: '👤' },
];

export function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-cream-200 bg-[var(--bg)]/95 backdrop-blur lg:hidden">
      <ul className="mx-auto flex max-w-5xl">
        {TABS.map((t) => {
          const active = t.href === '/' ? pathname === '/' : pathname.startsWith(t.href);
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                className={
                  'flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition ' +
                  (active ? 'text-peach-500' : 'text-cocoa-300')
                }
              >
                <span className={'text-lg leading-none transition-transform ' + (active ? 'scale-110' : '')}>{t.icon}</span>
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
      {/* iOS 안전영역 */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
