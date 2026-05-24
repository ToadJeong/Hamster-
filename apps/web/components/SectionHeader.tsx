import Link from 'next/link';

/** 홈/목록의 통일된 섹션 헤더 */
export function SectionHeader({
  title, subtitle, moreHref, moreLabel = '전체 보기',
}: {
  title: string;
  subtitle?: string;
  moreHref?: string;
  moreLabel?: string;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-cocoa-500 sm:text-xl">
          <span className="h-4 w-1.5 shrink-0 rounded-full bg-peach-400" aria-hidden />
          {title}
        </h2>
        {subtitle && <p className="mt-0.5 pl-3.5 text-xs text-cocoa-300 sm:text-sm">{subtitle}</p>}
      </div>
      {moreHref && (
        <Link href={moreHref} className="shrink-0 whitespace-nowrap text-sm font-semibold text-peach-500 hover:underline">
          {moreLabel} →
        </Link>
      )}
    </div>
  );
}
