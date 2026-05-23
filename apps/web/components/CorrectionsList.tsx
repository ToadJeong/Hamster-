'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/format';

type Correction = {
  id: string;
  reporter_name: string | null;
  target_type: string;
  target_slug: string | null;
  field: string | null;
  suggested: string;
  reason: string | null;
  status: 'open' | 'accepted' | 'rejected';
  created_at: string;
};

const STATUS_LABEL: Record<string, string> = { open: '대기', accepted: '반영', rejected: '반려' };

export function CorrectionsList({ initial }: { initial: Correction[] }) {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [items, setItems] = useState(initial);

  async function setStatus(id: string, status: Correction['status']) {
    setItems((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    await supabase.from('content_corrections').update({ status }).eq('id', id);
    router.refresh();
  }

  async function remove(id: string) {
    await supabase.from('content_corrections').delete().eq('id', id);
    setItems((prev) => prev.filter((c) => c.id !== id));
    router.refresh();
  }

  if (items.length === 0) {
    return <div className="card text-center text-cocoa-300">처리할 제보가 없어요.</div>;
  }

  return (
    <ul className="space-y-2">
      {items.map((c) => (
        <li key={c.id} className="card space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-cocoa-300">
            <span className="badge bg-cream-100 text-cocoa-500">{c.target_type}{c.target_slug ? ` · ${c.target_slug}` : ''}</span>
            {c.field && <span className="badge">{c.field}</span>}
            <span className={'badge ' + (c.status === 'accepted' ? 'bg-mint-100 text-mint-400' : c.status === 'rejected' ? 'bg-cocoa-100 text-cocoa-400' : 'bg-peach-100 text-peach-500')}>
              {STATUS_LABEL[c.status]}
            </span>
            <span>{formatDate(c.created_at)}</span>
            {c.reporter_name && <span>· {c.reporter_name}</span>}
          </div>
          <p className="whitespace-pre-line rounded-2xl bg-cream-50 px-3 py-2 text-sm text-cocoa-500">{c.suggested}</p>
          {c.reason && <p className="text-xs text-cocoa-400">근거: {c.reason}</p>}
          <div className="flex justify-end gap-2 text-xs">
            <button onClick={() => setStatus(c.id, 'accepted')} className="rounded-full bg-mint-100 px-3 py-1 text-mint-400">반영함</button>
            <button onClick={() => setStatus(c.id, 'rejected')} className="rounded-full bg-cocoa-100 px-3 py-1 text-cocoa-400">반려</button>
            <button onClick={() => remove(c.id)} className="rounded-full border border-red-200 px-3 py-1 text-red-400">삭제</button>
          </div>
        </li>
      ))}
    </ul>
  );
}
