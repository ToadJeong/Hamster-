import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/format';
import {
  RESCUE_KIND_LABEL, RESCUE_STATUS_LABEL,
  type RescuePostWithAuthor,
} from '@hamster/shared';

export const dynamic = 'force-dynamic';

export default async function RescueDetail({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('rescue_posts_with_author')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (error || !data) notFound();
  const r = data as RescuePostWithAuthor;
  const kindMeta = RESCUE_KIND_LABEL[r.kind];

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <Link href="/rescue" className="text-sm text-cocoa-300 hover:text-peach-500">← 유기햄 구조대</Link>

      {r.cover_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={r.cover_url} alt="" className="aspect-[16/9] w-full rounded-cute object-cover" />
      )}

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="badge bg-peach-100 text-peach-500">{kindMeta.emoji} {kindMeta.label}</span>
          <span className="badge bg-cocoa-100 text-cocoa-400">{RESCUE_STATUS_LABEL[r.status]}</span>
          {r.region && <span className="badge">📍 {r.region}</span>}
          {r.species_name_ko && r.species_slug && (
            <Link href={`/species/${r.species_slug}`} className="badge bg-mint-100 text-mint-400 hover:bg-mint-200">
              #{r.species_name_ko}
            </Link>
          )}
          {typeof r.age_months === 'number' && <span className="badge">{r.age_months}개월</span>}
        </div>
        <h1 className="font-display text-2xl font-bold leading-tight text-cocoa-500 sm:text-3xl">{r.title}</h1>
        <div className="text-sm text-cocoa-300">{r.author_username ?? '익명'} · {formatDate(r.created_at)}</div>
      </header>

      <div className="prose-soft whitespace-pre-line text-[15px]">{r.body}</div>

      {r.contact_hint && (
        <div className="card bg-mint-50">
          <p className="text-sm text-cocoa-300">연락 방법</p>
          <p className="mt-1 text-cocoa-500">{r.contact_hint}</p>
          <p className="mt-2 text-xs text-cocoa-300">
            ⚠ 직접 만남보다 안전한 방법(택배·동물보호단체 경유 등)을 권장합니다.
          </p>
        </div>
      )}
    </article>
  );
}
