'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type Word = { id: string; word: string; created_at: string };

export function BannedWordsManager({ initial }: { initial: Word[] }) {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const w = draft.trim();
    if (!w) return;
    setError(null);
    const { data, error } = await supabase
      .from('chat_banned_words')
      .insert({ word: w })
      .select('id, word, created_at')
      .single();
    if (error) { setError(error.message); return; }
    setItems((prev) => [...prev, data as Word].sort((a, b) => a.word.localeCompare(b.word)));
    setDraft('');
    router.refresh();
  }

  async function remove(id: string) {
    const { error } = await supabase.from('chat_banned_words').delete().eq('id', id);
    if (!error) {
      setItems((prev) => prev.filter((w) => w.id !== id));
      router.refresh();
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={add} className="card flex gap-2">
        <input
          className="input flex-1"
          placeholder="추가할 금지어"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={50}
        />
        <button className="btn-primary" type="submit">추가</button>
      </form>
      {error && <p className="text-sm text-red-500">{error}</p>}

      <ul className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {items.map((w) => (
          <li key={w.id} className="flex items-center justify-between gap-2 rounded-2xl bg-cream-50 px-3 py-1.5 text-sm">
            <span className="text-cocoa-500">{w.word}</span>
            <button onClick={() => remove(w.id)} className="text-xs text-cocoa-300 hover:text-red-400">삭제</button>
          </li>
        ))}
        {items.length === 0 && <li className="col-span-full text-center text-sm text-cocoa-300">아직 등록된 금지어가 없어요.</li>}
      </ul>
    </div>
  );
}
