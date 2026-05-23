'use client';

import { useEffect, useState } from 'react';
import { isRead, READ_EVENT, type ReadType } from '@/lib/read-state';

/**
 * 리스트 카드에 끼워 넣는 "읽음" 표시.
 * - 읽은 글이면 data-read="true"인 작은 배지를 렌더한다.
 * - 부모 <li>에 Tailwind `has-[[data-read=true]]:opacity-60` 등을 걸면
 *   카드 전체가 회색빛으로 흐려진다.
 */
export function ReadBadge({ type, id }: { type: ReadType; id: string }) {
  const [read, setRead] = useState(false);

  useEffect(() => {
    setRead(isRead(type, id));
    function onChange() { setRead(isRead(type, id)); }
    window.addEventListener(READ_EVENT, onChange);
    return () => window.removeEventListener(READ_EVENT, onChange);
  }, [type, id]);

  if (!read) return null;
  return (
    <span
      data-read="true"
      className="inline-flex items-center rounded-full bg-cocoa-100 px-1.5 py-0.5 text-[10px] font-medium text-cocoa-400"
    >
      읽음
    </span>
  );
}
