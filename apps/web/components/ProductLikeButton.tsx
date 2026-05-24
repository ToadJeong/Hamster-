'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type Props = {
  productId: string;
  initialLiked: boolean;
  initialCount: number;
  isAuthed: boolean;
};

export function ProductLikeButton({ productId, initialLiked, initialCount, isAuthed }: Props) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
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
    if (next) {
      await supabase.from('product_likes').insert({ product_id: productId, user_id: user.id });
    } else {
      await supabase.from('product_likes').delete().eq('product_id', productId).eq('user_id', user.id);
    }
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      className={
        'inline-flex items-center gap-1.5 rounded-full px-4 py-2 font-medium transition ' +
        (liked ? 'bg-peach-100 text-peach-500' : 'border border-cream-200 bg-white text-cocoa-400 hover:bg-cream-50')
      }
      aria-pressed={liked}
    >
      <span aria-hidden>{liked ? '👍' : '👍🏻'}</span>
      <span>추천 {count}</span>
    </button>
  );
}
