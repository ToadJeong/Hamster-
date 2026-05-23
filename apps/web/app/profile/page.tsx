import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ProfileEditor } from '@/components/ProfileEditor';
import { GuideCard } from '@/components/GuideCard';
import type { GuideWithCounts, Profile } from '@hamster/shared';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/profile');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, bio, is_admin, created_at')
    .eq('id', user.id)
    .maybeSingle();

  const { data: myGuides } = await supabase
    .from('guides_with_counts')
    .select('*')
    .eq('author_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold text-cocoa-500">내 프로필</h1>
        <p className="mt-1 text-sm text-cocoa-300">{user.email}</p>
      </header>

      <ProfileEditor profile={profile as Profile} />

      <section>
        <h2 className="mb-3 font-display text-xl font-bold text-cocoa-500">
          내가 쓴 가이드 {(myGuides ?? []).length}
        </h2>
        {(myGuides ?? []).length === 0 ? (
          <div className="card text-center text-cocoa-300">아직 작성한 가이드가 없어요.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {(myGuides as GuideWithCounts[]).map((g) => <GuideCard key={g.id} guide={g} />)}
          </div>
        )}
      </section>
    </div>
  );
}
