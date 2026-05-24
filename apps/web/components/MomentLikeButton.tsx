'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useT } from '@/components/I18nProvider';

export function MomentLikeButton({
  momentId, initialLiked, initialCount, isAuthed,
}: {
  momentId: string;
  initialLiked: boolean;
  initialCount: number;
  isAuthed: boolean;
}) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const t = useT();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);

  async function toggle() {
    if (!isAuthed) {
      router.push('/login?next=' + encodeURIComponent(window.location.pathname));
      return;
    }
    const next = !liked;
    setLiked(next);
    setCount((c) => c + (next ? 1 : -1));
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (next) await supabase.from('moment_likes').insert({ moment_id: momentId, user_id: user.id });
    else await supabase.from('moment_likes').delete().eq('moment_id', momentId).eq('user_id', user.id);
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      className={
        'inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition ' +
        (liked ? 'bg-peach-100 text-peach-500' : 'border border-cream-200 bg-white text-cocoa-400 hover:bg-cream-50')
      }
      aria-pressed={liked}
    >
      <span className="text-base leading-none">{liked ? '❤' : '🤍'}</span>
      <span>{t('act.like')} {count}</span>
    </button>
  );
}
