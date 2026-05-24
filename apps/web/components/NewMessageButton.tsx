'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useModal } from '@/components/Modal';

type Found = { id: string; username: string | null; avatar_url: string | null };

export function NewMessageButton({ currentUserId }: { currentUserId: string }) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const modal = useModal();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Found[]>([]);
  const [searched, setSearched] = useState(false);
  const [busy, setBusy] = useState(false);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    setBusy(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .ilike('username', `%${term}%`)
      .neq('id', currentUserId)
      .limit(10);
    setResults((data ?? []) as Found[]);
    setSearched(true);
    setBusy(false);
  }

  async function start(otherId: string) {
    setBusy(true);
    const { data, error } = await supabase.rpc('open_dm_thread', { p_other: otherId });
    setBusy(false);
    if (error || !data) {
      await modal.alert({ title: '대화방을 열 수 없어요', message: error?.message, tone: 'error' });
      return;
    }
    router.push(`/messages/${data}`);
    router.refresh();
  }

  return (
    <div>
      <button onClick={() => setOpen((v) => !v)} className="btn-primary text-sm">
        {open ? '닫기' : '✏️ 새 쪽지 쓰기'}
      </button>

      {open && (
        <div className="card mt-3 space-y-3">
          <form onSubmit={search} className="flex gap-2">
            <input
              className="input flex-1 py-2 text-sm"
              placeholder="햄집사 닉네임으로 검색"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoFocus
            />
            <button type="submit" className="btn-secondary text-sm" disabled={busy || !q.trim()}>검색</button>
          </form>

          {searched && results.length === 0 && (
            <p className="text-center text-sm text-cocoa-300">
              검색 결과가 없어요. 닉네임을 정확히 입력했는지 확인해 주세요.
            </p>
          )}

          {results.length > 0 && (
            <ul className="space-y-1">
              {results.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => start(p.id)}
                    disabled={busy}
                    className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition hover:bg-cream-100 disabled:opacity-50"
                  >
                    {p.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-peach-200 text-sm">🐹</span>
                    )}
                    <span className="font-medium text-cocoa-500">{p.username ?? '햄집사'}</span>
                    <span className="ml-auto text-xs font-semibold text-peach-500">대화 시작 →</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
