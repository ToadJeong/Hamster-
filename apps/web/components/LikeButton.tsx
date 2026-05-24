'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useT } from '@/components/I18nProvider';

type Props = {
  guideId: string;
  initialLiked: boolean;
  initialCount: number;
  isAuthed: boolean;
};

export function LikeButton({ guideId, initialLiked, initialCount, isAuthed }: Props) {
  const router = useRouter();
  const t = useT();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [_, startTransition] = useTransition();
  const supabase = createSupabaseBrowserClient();

  async function toggle() {
    if (!isAuthed) {
      router.push('/login?next=' + encodeURIComponent(window.location.pathname));
      return;
    }
    // 낙관적 업데이트
    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount((c) => c + (nextLiked ? 1 : -1));

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (nextLiked) {
      const { error } = await supabase.from('likes').insert({ guide_id: guideId, user_id: user.id });
      if (error) {
        // rollback
        setLiked(!nextLiked);
        setCount((c) => c + (nextLiked ? -1 : 1));
      }
    } else {
      const { error } = await supabase.from('likes').delete()
        .eq('guide_id', guideId)
        .eq('user_id', user.id);
      if (error) {
        setLiked(!nextLiked);
        setCount((c) => c + (nextLiked ? -1 : 1));
      }
    }
    startTransition(() => router.refresh());
  }

  return (
    <button
      onClick={toggle}
      className={
        'inline-flex items-center gap-1.5 rounded-full px-4 py-2 font-medium transition ' +
        (liked
          ? 'bg-peach-100 text-peach-500'
          : 'border border-cream-200 bg-white text-cocoa-400 hover:bg-cream-50')
      }
      aria-pressed={liked}
    >
      <span aria-hidden>{liked ? '❤' : '🤍'}</span>
      <span>{t('act.like')} {count}</span>
    </button>
  );
}
