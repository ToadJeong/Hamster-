'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useT } from '@/components/I18nProvider';

export function TributeButton({
  memorialId, initialCount, initialTributed, isAuthed,
}: {
  memorialId: string;
  initialCount: number;
  initialTributed: boolean;
  isAuthed: boolean;
}) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const t = useT();
  const [on, setOn] = useState(initialTributed);
  const [count, setCount] = useState(initialCount);

  async function toggle() {
    if (!isAuthed) { router.push('/login?next=/memorial/' + memorialId); return; }
    const next = !on;
    setOn(next);
    setCount((c) => c + (next ? 1 : -1));
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (next) {
      await supabase.from('memorial_tributes').insert({ memorial_id: memorialId, user_id: user.id });
    } else {
      await supabase.from('memorial_tributes').delete().eq('memorial_id', memorialId).eq('user_id', user.id);
    }
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      aria-pressed={on}
      className={
        'inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 font-bold shadow-soft transition hover:-translate-y-0.5 ' +
        (on ? 'bg-lilac-200 text-lilac-500' : 'bg-white text-cocoa-400 ring-1 ring-cream-200 hover:bg-cream-50')
      }
      title={t('mem.tributeHint')}
    >
      <span className="text-lg leading-none">{on ? '🌟' : '⭐'}</span>
      <span>{t('mem.tribute')} {count}</span>
    </button>
  );
}
