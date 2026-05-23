import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/format';
import { COMMUNITY_CATEGORY_LABEL, type CommunityCategory } from '@hamster/shared';

export const dynamic = 'force-dynamic';

export default async function CommunityDetail({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from('community_posts')
    .select('id, author_id, anonymous_nickname, title, body, category, created_at, updated_at, author:profiles!community_posts_author_id_fkey(username, avatar_url)')
    .eq('id', params.id)
    .maybeSingle();

  if (error || !data) notFound();
  const p = data as any;
  const display = p.author?.username ?? p.anonymous_nickname ?? '익명';
  const meta = COMMUNITY_CATEGORY_LABEL[p.category as CommunityCategory] ?? COMMUNITY_CATEGORY_LABEL.free;

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <Link href="/community" className="text-sm text-cocoa-300 hover:text-peach-500">← 커뮤니티</Link>
      <header className="space-y-2">
        <span className="badge bg-cream-100 text-cocoa-500">{meta.emoji} {meta.label}</span>
        <h1 className="font-display text-2xl font-bold text-cocoa-500 sm:text-3xl">{p.title}</h1>
        <div className="text-sm text-cocoa-300">
          {display}{!p.author_id && ' · 익명'} · {formatDate(p.created_at)}
        </div>
      </header>
      <div className="prose-soft whitespace-pre-line text-[15px]">{p.body}</div>
      <div className="card text-sm text-cocoa-300">
        💬 댓글 기능은 v2에서 추가됩니다. 잠시만 기다려 주세요!
      </div>
    </article>
  );
}
