import type { ReactNode } from 'react';
import { HamsterIllustration, visualForSpecies } from '@/components/HamsterIllustration';

/** 귀여운 햄스터 일러스트가 있는 빈 화면 */
export function EmptyState({
  title,
  description,
  action,
  kind = 'golden',
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  kind?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-cute border border-cream-200/80 bg-white/70 px-6 py-12 text-center">
      <div className="h-24 w-28 opacity-90">
        <HamsterIllustration visual={visualForSpecies(kind)} className="h-full w-full" bg={false} />
      </div>
      <p className="font-bold text-cocoa-500">{title}</p>
      {description && <p className="max-w-xs text-sm text-cocoa-300">{description}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
