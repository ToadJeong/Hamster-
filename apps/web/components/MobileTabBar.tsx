'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useT } from '@/components/I18nProvider';

const TABS = [
  { href: '/',          tkey: 'nav.home',      icon: '🏠' },
  { href: '/species',   tkey: 'nav.species',   icon: '🐹' },
  { href: '/moments',   tkey: 'nav.moments',   icon: '📸' },
  { href: '/community', tkey: 'nav.community', icon: '💬' },
  { href: '/profile',   tkey: 'nav.profile',   icon: '👤' },
];

export function MobileTabBar() {
  const pathname = usePathname();
  const t = useT();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-cream-200 bg-[var(--bg)]/95 backdrop-blur lg:hidden">
      <ul className="mx-auto flex max-w-5xl">
        {TABS.map((tab) => {
          const active = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className={
                  'flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition ' +
                  (active ? 'text-peach-500' : 'text-cocoa-300')
                }
              >
                <span className={'text-lg leading-none transition-transform ' + (active ? 'scale-110' : '')}>{tab.icon}</span>
                {t(tab.tkey)}
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
