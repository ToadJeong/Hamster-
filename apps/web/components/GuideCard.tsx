import Link from 'next/link';
import type { GuideWithCounts } from '@hamster/shared';
import { formatDate } from '@/lib/format';
import { ReadBadge } from '@/components/ReadBadge';

export function GuideCard({ guide }: { guide: GuideWithCounts }) {
  return (
    <Link
      href={`/guides/${guide.id}`}
      className="group flex gap-3.5 rounded-2xl border border-cream-200/80 bg-white/95 p-3.5 shadow-softer transition hover:-translate-y-0.5 hover:border-peach-200 hover:shadow-soft has-[[data-read=true]]:opacity-55 sm:p-4"
    >
      <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-cream-100 text-xl text-cocoa-300 ring-1 ring-cream-200">
        {guide.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={guide.cover_url} alt="" className="h-full w-full object-cover" />
        ) : (
          '📖'
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-1.5">
          {guide.species_name_ko && (
            <span className="rounded-md bg-mint-100 px-1.5 py-0.5 text-[11px] font-bold text-mint-400">#{guide.species_name_ko}</span>
          )}
          <ReadBadge type="guide" id={guide.id} />
        </div>
        <h3 className="line-clamp-1 font-bold text-cocoa-500 group-hover:text-peach-500">{guide.title}</h3>
        <p className="mt-0.5 line-clamp-1 text-[13px] text-cocoa-400">{guide.body}</p>
        <div className="mt-1.5 flex items-center gap-2.5 text-[11px] text-cocoa-300">
          <span className="font-medium text-cocoa-400">{guide.author_username ?? '익명'}</span>
          <span>{formatDate(guide.created_at)}</span>
          <span>♥ {guide.like_count}</span>
          <span>💬 {guide.comment_count}</span>
          {typeof (guide as any).view_count === 'number' && <span>👁 {(guide as any).view_count}</span>}
        </div>
      </div>
    </Link>
  );
}
