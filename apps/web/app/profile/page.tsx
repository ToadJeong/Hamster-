import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ProfileEditor } from '@/components/ProfileEditor';
import { PetManager } from '@/components/PetManager';
import { GuideCard } from '@/components/GuideCard';
import { HamsterIllustration, visualForSpecies } from '@/components/HamsterIllustration';
import { EmptyState } from '@/components/EmptyState';
import { formatDate } from '@/lib/format';
import type { GuideWithCounts, Pet, Profile, Species } from '@hamster/shared';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/profile');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, bio, is_admin, is_moderator, created_at')
    .eq('id', user.id)
    .maybeSingle();

  const [guidesRes, communityRes, followersRes, followingRes, petsRes, speciesRes] = await Promise.all([
    supabase.from('guides_with_counts').select('*').eq('author_id', user.id).order('created_at', { ascending: false }),
    supabase.from('community_posts_feed').select('*').eq('author_id', user.id).order('created_at', { ascending: false }).limit(20),
    supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('followee_id', user.id),
    supabase.from('follows').select('followee_id', { count: 'exact', head: true }).eq('follower_id', user.id),
    supabase.from('pets').select('*').eq('owner_id', user.id).order('created_at'),
    supabase.from('species').select('id, slug, name_ko').order('name_ko'),
  ]);

  const myGuides = (guidesRes.data as GuideWithCounts[]) ?? [];
  const myPosts = (communityRes.data as any[]) ?? [];
  const followers = followersRes.count ?? 0;
  const following = followingRes.count ?? 0;
  const myPets = (petsRes.data as Pet[]) ?? [];
  const speciesList = (speciesRes.data as Pick<Species, 'id' | 'slug' | 'name_ko'>[]) ?? [];
  const p = profile as Profile;

  return (
    <div className="space-y-6">
      {/* 프로필 헤더 카드 */}
      <section className="overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-peach-50 via-cream-100 to-lilac-50 p-5 shadow-soft sm:p-6">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-white shadow-soft ring-4 ring-white/70">
            {p?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <HamsterIllustration visual={visualForSpecies('golden')} className="h-full w-full" bg={false} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-cocoa-500">{p?.username ?? '햄집사'}</h1>
              {p?.is_admin && <span className="rounded-full bg-lilac-200 px-2 py-0.5 text-[11px] font-bold text-lilac-400">마스터</span>}
              {p?.is_moderator && <span className="rounded-full bg-mint-100 px-2 py-0.5 text-[11px] font-bold text-mint-400">운영자</span>}
            </div>
            <p className="mt-0.5 text-sm text-cocoa-400">{p?.bio || '아직 소개가 없어요'}</p>
            <p className="mt-0.5 text-xs text-cocoa-300">{user.email} · {p?.created_at ? formatDate(p.created_at) + ' 가입' : ''}</p>
          </div>
        </div>
        {/* 통계 */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Stat label="가이드" value={myGuides.length} />
          <Stat label="팔로워" value={followers} />
          <Stat label="팔로잉" value={following} />
        </div>
      </section>

      {/* 빠른 링크 */}
      <div className="flex flex-wrap gap-2">
        <Link href="/messages" className="btn-secondary text-sm">✉ 쪽지함</Link>
        <Link href="/notifications" className="btn-secondary text-sm">🔔 알림</Link>
        {p?.is_admin && <Link href="/admin" className="btn-secondary text-sm">🛠 관리</Link>}
      </div>

      {/* 프로필 편집 */}
      <details className="group">
        <summary className="flex cursor-pointer items-center gap-2 font-display text-lg font-bold text-cocoa-500">
          <span className="h-4 w-1.5 rounded-full bg-peach-400" aria-hidden />프로필 편집
          <span className="text-sm font-normal text-cocoa-300 group-open:hidden">(펼치기)</span>
        </summary>
        <div className="mt-3">
          <ProfileEditor profile={p} />
        </div>
      </details>

      {/* 내 햄찌 */}
      <PetManager initialPets={myPets} species={speciesList} />

      {/* 내 커뮤니티 글 */}
      {myPosts.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-cocoa-500">
            <span className="h-4 w-1.5 rounded-full bg-lilac-400" aria-hidden />내 커뮤니티 글 {myPosts.length}
          </h2>
          <ul className="space-y-2">
            {myPosts.map((m) => (
              <li key={m.id}>
                <Link href={`/community/${m.id}`} className="card flex items-center justify-between gap-2 transition hover:-translate-y-0.5 hover:shadow-soft">
                  <span className="line-clamp-1 font-semibold text-cocoa-500">{m.title}</span>
                  <span className="shrink-0 text-xs text-cocoa-300">♥ {m.like_count ?? 0} · 💬 {m.comment_count ?? 0}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 내 가이드 */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-cocoa-500">
          <span className="h-4 w-1.5 rounded-full bg-peach-400" aria-hidden />내가 쓴 가이드 {myGuides.length}
        </h2>
        {myGuides.length === 0 ? (
          <EmptyState title="아직 작성한 가이드가 없어요" description="사육 노하우를 정리해 가이드로 남겨보세요!" action={<Link href="/guides/new" className="btn-primary text-sm">가이드 쓰기</Link>} kind="teddy" />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {myGuides.map((g) => <GuideCard key={g.id} guide={g} />)}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white/80 py-2.5 text-center shadow-softer">
      <div className="font-display text-xl font-bold text-cocoa-500">{value}</div>
      <div className="text-[11px] text-cocoa-300">{label}</div>
    </div>
  );
}
