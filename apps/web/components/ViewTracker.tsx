'use client';

/**
 * 글 상세 진입 시 조회수 증가 + 읽음 마크.
 * 화면에는 아무것도 렌더하지 않거나(기본), showCount=true면 조회수를 표시.
 */

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { markRead, type ReadType } from '@/lib/read-state';

type Props = {
  type: 'guide' | 'community' | 'rescue';
  id: string;
  initialCount: number;
  showCount?: boolean;
};

export function ViewTracker({ type, id, initialCount, showCount }: Props) {
  const supabase = createSupabaseBrowserClient();
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    markRead(type as ReadType, id);
    let cancelled = false;
    (async () => {
      const { data } = await supabase.rpc('bump_view', { p_type: type, p_id: id });
      if (!cancelled && typeof data === 'number') setCount(data);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, id]);

  if (!showCount) return null;
  return <span className="text-cocoa-300">👁 {count}</span>;
}
