'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useModal } from '@/components/Modal';
import { formatDate } from '@/lib/format';

type Row = {
  id: string; username: string; email: string;
  is_admin: boolean; is_moderator: boolean; created_at: string;
};

export function UserManager() {
  const supabase = createSupabaseBrowserClient();
  const modal = useModal();
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.rpc('admin_search_users', { p_q: q.trim() });
    setLoading(false);
    setSearched(true);
    if (error) { await modal.alert({ title: '검색 실패', message: error.message, tone: 'error' }); return; }
    setRows((data as Row[]) ?? []);
  }

  async function toggleMod(r: Row) {
    const next = !r.is_moderator;
    const { error } = await supabase.rpc('admin_set_moderator', { p_user: r.id, p_value: next });
    if (error) { await modal.alert({ title: '변경 실패', message: error.message, tone: 'error' }); return; }
    setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, is_moderator: next } : x)));
  }

  return (
    <div className="space-y-4">
      <form onSubmit={search} className="flex gap-2">
        <input
          className="input flex-1"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="아이디 또는 이메일 (빈칸이면 최근 가입자)"
        />
        <button type="submit" className="btn-primary" disabled={loading}>{loading ? '검색 중…' : '검색'}</button>
      </form>

      {searched && rows.length === 0 && (
        <div className="card text-center text-cocoa-300">검색 결과가 없어요.</div>
      )}

      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="card flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-cocoa-500">
                {r.username}
                {r.is_admin && <span className="ml-1 badge bg-lilac-200 text-lilac-400">마스터</span>}
                {r.is_moderator && <span className="ml-1 badge bg-mint-100 text-mint-400">운영자</span>}
              </p>
              <p className="text-xs text-cocoa-300">{r.email} · 가입 {formatDate(r.created_at)}</p>
            </div>
            {r.is_admin ? (
              <span className="text-xs text-cocoa-300">변경 불가</span>
            ) : (
              <button
                onClick={() => toggleMod(r)}
                className={'rounded-full px-3 py-1.5 text-sm font-medium transition ' +
                  (r.is_moderator ? 'bg-cocoa-100 text-cocoa-500 hover:bg-cocoa-200' : 'bg-mint-100 text-mint-400 hover:bg-mint-200')}
              >
                {r.is_moderator ? '운영자 회수' : '+ 운영자 지정'}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
