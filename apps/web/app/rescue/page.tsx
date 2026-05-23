import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/format';
import {
  RESCUE_KIND_LABEL, RESCUE_STATUS_LABEL,
  type RescueKind, type RescueStatus, type RescuePostWithAuthor,
} from '@hamster/shared';

export const revalidate = 20;

export default async function RescueIndex({
  searchParams,
}: {
  searchParams: { kind?: RescueKind; status?: RescueStatus };
}) {
  const supabase = createSupabaseServerClient();
  let q = supabase
    .from('rescue_posts_with_author')
    .select('*')
    .order('status')
    .order('created_at', { ascending: false })
    .limit(60);
  if (searchParams.kind)   q = q.eq('kind', searchParams.kind);
  if (searchParams.status) q = q.eq('status', searchParams.status);

  const { data, error } = await q;
  const items = (data as RescuePostWithAuthor[]) ?? [];

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-cocoa-500 sm:text-3xl">🆘 유기햄 구조대</h1>
            <p className="mt-1 text-sm text-cocoa-300">버려진 햄찌에게 새 가족을, 잃어버린 햄찌에게 새 단서를</p>
          </div>
          <Link href="/rescue/new" className="btn-primary text-sm">📮 글 올리기</Link>
        </div>
        <div className="card bg-peach-50 text-sm text-cocoa-500">
          ⚠️ <strong>주의:</strong> 입양·구조는 직접 만남 대신 공식 동물보호단체와 함께 진행해 주세요.
          가짜 분양·금전 거래는 운영자에게 신고해 주시면 즉시 차단 처리합니다.
        </div>
      </header>

      {/* 필터 */}
      <div className="flex flex-wrap gap-2 rounded-cute border border-cream-200 bg-white p-3">
        <Link href="/rescue" className={'badge ' + (!searchParams.kind ? 'bg-peach-100 text-peach-500' : 'hover:bg-cream-200')}>전체</Link>
        {(Object.keys(RESCUE_KIND_LABEL) as RescueKind[]).map((k) => {
          const meta = RESCUE_KIND_LABEL[k];
          return (
            <Link key={k} href={`/rescue?kind=${k}`}
              className={'badge ' + (searchParams.kind === k ? 'bg-peach-100 text-peach-500' : 'hover:bg-cream-200')}>
              {meta.emoji} {meta.label}
            </Link>
          );
        })}
      </div>

      {error?.message?.includes('rescue_posts') && (
        <div className="card text-amber-500">
          유기햄 구조대 테이블이 아직 없어요. Supabase에 `0005_announcements_community_rescue.sql`을 적용해 주세요.
        </div>
      )}

      {items.length === 0 ? (
        <div className="card text-center text-cocoa-300">아직 글이 없어요. 첫 글을 올려보세요.</div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {items.map((r) => {
            const kindMeta = RESCUE_KIND_LABEL[r.kind];
            return (
              <li key={r.id}>
                <Link href={`/rescue/${r.id}`} className="card flex gap-3 transition hover:-translate-y-0.5 hover:shadow-soft">
                  <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-cream-100 text-3xl">
                    {r.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.cover_url} alt="" className="h-full w-full rounded-2xl object-cover" />
                    ) : '🐹'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-1.5">
                      <span className="badge bg-peach-100 text-peach-500">{kindMeta.emoji} {kindMeta.label}</span>
                      {r.status !== 'open' && (
                        <span className="badge bg-cocoa-100 text-cocoa-400">{RESCUE_STATUS_LABEL[r.status]}</span>
                      )}
                      {r.region && <span className="badge">📍 {r.region}</span>}
                    </div>
                    <h3 className="line-clamp-1 font-semibold text-cocoa-500">{r.title}</h3>
                    <p className="mt-1 line-clamp-2 text-xs text-cocoa-300">{r.body}</p>
                    <div className="mt-1 text-xs text-cocoa-300">
                      {r.species_name_ko && <span>#{r.species_name_ko} · </span>}
                      {r.author_username ?? '익명'} · {formatDate(r.created_at)}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
