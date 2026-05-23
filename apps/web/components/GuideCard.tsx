import Link from 'next/link';
import type { GuideWithCounts } from '@hamster/shared';
import { formatDate } from '@/lib/format';

export function GuideCard({ guide }: { guide: GuideWithCounts }) {
  return (
    <Link
      href={`/guides/${guide.id}`}
      className="card flex gap-4 transition hover:-translate-y-0.5 hover:shadow-soft"
    >
      <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-cream-100 text-3xl">
        {guide.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={guide.cover_url} alt="" className="h-full w-full rounded-2xl object-cover" />
        ) : (
          '📖'
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-xs text-cocoa-300">
          {guide.species_name_ko && (
            <span className="badge">#{guide.species_name_ko}</span>
          )}
          <span>{formatDate(guide.created_at)}</span>
        </div>
        <h3 className="mt-1 line-clamp-2 font-semibold text-cocoa-500">{guide.title}</h3>
        <div className="mt-2 flex items-center gap-3 text-xs text-cocoa-300">
          <span>by {guide.author_username ?? '익명'}</span>
          <span>❤ {guide.like_count}</span>
          <span>💬 {guide.comment_count}</span>
        </div>
      </div>
    </Link>
  );
}
