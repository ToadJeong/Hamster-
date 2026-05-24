import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/format';
import { EmptyState } from '@/components/EmptyState';
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

      {error && (
        <div className="card text-center text-sm text-cocoa-300">
          🆘 구조대 게시판을 준비하고 있어요. 잠시 후 다시 와 주세요!
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          title="아직 등록된 글이 없어요"
          description="새 가족이 필요한 햄찌, 잃어버린 햄찌 소식을 올려보세요."
          action={<Link href="/rescue/new" className="btn-primary text-sm">글 올리기</Link>}
          kind="roborovski"
        />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {items.map((r) => {
            const kindMeta = RESCUE_KIND_LABEL[r.kind];
            return (
              <li key={r.id}>
                <Link href={`/rescue/${r.id}`} className="group flex gap-3.5 rounded-2xl border border-cream-200/80 bg-white/95 p-3.5 shadow-softer transition hover:-translate-y-0.5 hover:border-peach-200 hover:shadow-soft sm:p-4">
                  <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-cream-100 text-xl ring-1 ring-cream-200">
                    {r.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.cover_url} alt="" className="h-full w-full object-cover" />
                    ) : kindMeta.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-md bg-peach-50 px-1.5 py-0.5 text-[11px] font-bold text-peach-500">{kindMeta.emoji} {kindMeta.label}</span>
                      {r.status !== 'open' && (
                        <span className="rounded-md bg-cocoa-100 px-1.5 py-0.5 text-[11px] font-medium text-cocoa-400">{RESCUE_STATUS_LABEL[r.status]}</span>
                      )}
                      {r.region && <span className="text-[11px] font-medium text-cocoa-400">📍 {r.region}</span>}
                    </div>
                    <h3 className="line-clamp-1 font-bold text-cocoa-500 group-hover:text-peach-500">{r.title}</h3>
                    <p className="mt-0.5 line-clamp-1 text-[13px] text-cocoa-400">{r.body}</p>
                    <div className="mt-1.5 text-[11px] text-cocoa-300">
                      {r.species_name_ko && <span className="text-mint-400">#{r.species_name_ko} · </span>}
                      <span className="font-medium text-cocoa-400">{r.author_username ?? '익명'}</span> · {formatDate(r.created_at)}
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
