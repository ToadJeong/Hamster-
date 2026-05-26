'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Item = { text: string; href: string };

/** TIP 바 아래에 별도로 뜨는 긴급 구조 알림 바 (빨간색). */
export function UrgentBar({ items }: { items: Item[] }) {
  const [idx, setIdx] = useState(0);
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (items.length <= 1) return;
    const t = setInterval(() => {
      setShow(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % items.length);
        setShow(true);
      }, 280);
    }, 4000);
    return () => clearInterval(t);
  }, [items.length]);

  if (items.length === 0) return null;
  const item = items[idx % items.length];

  return (
    <div className="border-b border-red-100 bg-gradient-to-r from-red-50 via-peach-50 to-red-50">
      <div className="mx-auto flex h-9 w-full max-w-5xl items-center overflow-hidden px-4 text-sm text-cocoa-500 md:px-6">
        <Link href={item.href} className="flex min-w-0 flex-1 items-center gap-1.5 hover:text-red-500">
          <span className="shrink-0 animate-pulse rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">🆘 긴급</span>
          <span className={'truncate transition-all duration-300 ' + (show ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0')}>
            {item.text}
          </span>
        </Link>
        {items.length > 1 && (
          <div className="ml-2 hidden shrink-0 gap-1 sm:flex">
            {items.map((_, i) => (
              <span key={i} className={'h-1.5 w-1.5 rounded-full ' + (i === idx ? 'bg-red-500' : 'bg-red-100')} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
