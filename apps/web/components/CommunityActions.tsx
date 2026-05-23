'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type Props = {
  postId: string;
  authorId: string;
  initialLiked: boolean;
  initialLikeCount: number;
  initialFollowing: boolean;
};

export function CommunityActions({
  postId, authorId, initialLiked, initialLikeCount, initialFollowing,
}: Props) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialLikeCount);
  const [following, setFollowing] = useState(initialFollowing);

  async function toggleLike() {
    const next = !liked;
    setLiked(next);
    setCount((c) => c + (next ? 1 : -1));

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    if (next) {
      await supabase.from('community_likes').insert({ post_id: postId, user_id: user.id });
    } else {
      await supabase.from('community_likes').delete().eq('post_id', postId).eq('user_id', user.id);
    }
    router.refresh();
  }

  async function toggleFollow() {
    const next = !following;
    setFollowing(next);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    if (next) {
      await supabase.from('follows').insert({ follower_id: user.id, followee_id: authorId });
    } else {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('followee_id', authorId);
    }
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleLike}
        className={'inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm transition ' +
          (liked ? 'bg-peach-100 text-peach-500' : 'border border-cream-200 text-cocoa-400 hover:bg-cream-50')}
      >
        {liked ? '❤' : '🤍'} {count}
      </button>
      <button
        onClick={toggleFollow}
        className={'rounded-full px-3 py-1 text-sm font-medium transition ' +
          (following ? 'bg-cocoa-100 text-cocoa-500' : 'bg-lilac-100 text-lilac-400 hover:bg-lilac-200')}
      >
        {following ? '팔로잉 ✓' : '+ 팔로우'}
      </button>
    </div>
  );
}
