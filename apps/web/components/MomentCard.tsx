'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/format';
import type { MomentFeed } from '@hamster/shared';

export function MomentCard({ moment: m, liked: initialLiked, isAuthed }: { moment: MomentFeed; liked: boolean; isAuthed: boolean }) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(m.like_count);

  async function toggleLike() {
    if (!isAuthed) { router.push('/login?next=/moments'); return; }
    const next = !liked;
    setLiked(next);
    setCount((c) => c + (next ? 1 : -1));
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (next) await supabase.from('moment_likes').insert({ moment_id: m.id, user_id: user.id });
    else await supabase.from('moment_likes').delete().eq('moment_id', m.id).eq('user_id', user.id);
    router.refresh();
  }

  return (
    <article className="overflow-hidden rounded-cute border border-cream-200/80 bg-white shadow-softer">
      {/* 헤더 */}
      <div className="flex items-center gap-2.5 px-4 py-3">
        {m.author_avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={m.author_avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
        ) : (
          <span className="grid h-9 w-9 place-items-center rounded-full bg-peach-200 text-base">🐹</span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-cocoa-500">
            {m.author_username ?? '햄집사'}
            {m.pet_name && <span className="ml-1 font-normal text-cocoa-300">· {m.pet_name}</span>}
          </p>
          <p className="text-[11px] text-cocoa-300">{formatDate(m.created_at)}</p>
        </div>
      </div>

      {/* 사진 */}
      <Link href={`/moments/${m.id}`} className="block bg-cream-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={m.image_url} alt={m.caption ?? ''} className="max-h-[520px] w-full object-cover" />
      </Link>

      {/* 액션 */}
      <div className="flex items-center gap-4 px-4 pt-3 text-sm">
        <button onClick={toggleLike} className={'inline-flex items-center gap-1 font-semibold transition ' + (liked ? 'text-peach-500' : 'text-cocoa-400 hover:text-peach-400')}>
          <span className="text-lg leading-none">{liked ? '❤' : '🤍'}</span> {count}
        </button>
        <Link href={`/moments/${m.id}`} className="inline-flex items-center gap-1 font-semibold text-cocoa-400 hover:text-peach-400">
          <span className="text-base leading-none">💬</span> {m.comment_count}
        </Link>
      </div>

      {/* 캡션 */}
      {m.caption && (
        <p className="whitespace-pre-line px-4 pb-4 pt-2 text-[15px] leading-6 text-cocoa-500">
          <span className="font-bold">{m.author_username ?? '햄집사'}</span> {m.caption}
        </p>
      )}
      {!m.caption && <div className="pb-3" />}
    </article>
  );
}
