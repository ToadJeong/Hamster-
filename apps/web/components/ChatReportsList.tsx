'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/format';

type Report = {
  id: string;
  reporter_label: string | null;
  target_label: string;
  message_body: string;
  reason: string | null;
  created_at: string;
};

export function ChatReportsList({ initial }: { initial: Report[] }) {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [items, setItems] = useState(initial);

  async function resolve(id: string) {
    if (!confirm('이 신고를 처리 완료로 표시하고 삭제할까요?')) return;
    const { error } = await supabase.from('chat_reports').delete().eq('id', id);
    if (!error) {
      setItems((prev) => prev.filter((r) => r.id !== id));
      router.refresh();
    }
  }

  if (items.length === 0) {
    return <div className="card text-center text-cocoa-300">처리할 신고가 없어요.</div>;
  }

  return (
    <ul className="space-y-2">
      {items.map((r) => (
        <li key={r.id} className="card space-y-1.5">
          <div className="flex items-center justify-between text-xs text-cocoa-300">
            <span>{formatDate(r.created_at)}</span>
            <button onClick={() => resolve(r.id)} className="text-cocoa-300 hover:text-red-400">처리완료(삭제)</button>
          </div>
          <p className="text-sm text-cocoa-500">
            신고자: <strong>{r.reporter_label ?? '(익명)'}</strong> → 대상: <strong>{r.target_label}</strong>
          </p>
          <blockquote className="rounded-2xl bg-cream-50 px-3 py-2 text-sm text-cocoa-500 whitespace-pre-wrap break-words">
            {r.message_body}
          </blockquote>
          {r.reason && <p className="text-xs text-cocoa-400">사유: {r.reason}</p>}
        </li>
      ))}
    </ul>
  );
}
