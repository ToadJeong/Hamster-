import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { GuideEditor } from '@/components/GuideEditor';
import { getSiteSettings } from '@/lib/site-settings';
import type { Species } from '@hamster/shared';

export const dynamic = 'force-dynamic';

export default async function NewGuidePage({
  searchParams,
}: {
  searchParams: { species?: string };
}) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const settings = await getSiteSettings();

  // 비로그인인데 익명도 막혀있으면 로그인 페이지로
  if (!user && !settings['app.allow_anonymous']) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-12 text-center">
        <p className="text-3xl">🐹</p>
        <p className="text-cocoa-400">현재 익명 작성이 비활성화되어 있어요.</p>
        <Link href="/login?next=/guides/new" className="btn-primary inline-block">로그인하러 가기</Link>
      </div>
    );
  }

  const { data: speciesList } = await supabase
    .from('species')
    .select('id, slug, name_ko')
    .order('name_ko', { ascending: true });

  const preselectSlug = searchParams.species ?? null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-cocoa-500">가이드 작성</h1>
        <p className="mt-1 text-sm text-cocoa-300">
          마크다운으로 작성해요. <code>#</code>은 제목, <code>**굵게**</code>, <code>- 리스트</code>를 사용할 수 있어요.
          {!user && settings['app.allow_anonymous'] && (
            <> 비로그인 상태로도 익명으로 글을 남길 수 있어요.</>
          )}
        </p>
      </header>
      <GuideEditor
        species={(speciesList as Pick<Species,'id'|'slug'|'name_ko'>[]) ?? []}
        preselectSlug={preselectSlug}
        allowAnonymous={settings['app.allow_anonymous']}
        isAuthed={!!user}
      />
    </div>
  );
}
