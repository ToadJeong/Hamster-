'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/format';

type Report = {
  id: string;
  target_type: string;
  target_id: string;
  reason: string | null;
  created_at: string;
};

const LINK: Record<string, (id: string) => string> = {
  community: (id) => `/community/${id}`,
  guide: (id) => `/guides/${id}`,
  rescue: (id) => `/rescue/${id}`,
  community_comment: (id) => `/community`,
  guide_comment: (id) => `/guides`,
};

export function PostReportsList({ initial }: { initial: Report[] }) {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [items, setItems] = useState(initial);

  async function resolve(id: string) {
    await supabase.from('post_reports').delete().eq('id', id);
    setItems((prev) => prev.filter((r) => r.id !== id));
    router.refresh();
  }

  if (items.length === 0) {
    return <div className="card text-center text-cocoa-300">처리할 신고가 없어요.</div>;
  }

  return (
    <ul className="space-y-2">
      {items.map((r) => {
        const href = LINK[r.target_type]?.(r.target_id);
        return (
          <li key={r.id} className="card space-y-1.5">
            <div className="flex items-center justify-between text-xs text-cocoa-300">
              <span className="badge bg-cream-100 text-cocoa-500">{r.target_type}</span>
              <span>{formatDate(r.created_at)}</span>
            </div>
            {r.reason && <p className="text-sm text-cocoa-500">사유: {r.reason}</p>}
            <div className="flex justify-end gap-2 text-xs">
              {href && <Link href={href} className="rounded-full bg-cream-100 px-3 py-1 text-cocoa-500">글 보기</Link>}
              <button onClick={() => resolve(r.id)} className="rounded-full border border-red-200 px-3 py-1 text-red-400">처리 완료(삭제)</button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
