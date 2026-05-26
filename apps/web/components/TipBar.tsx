'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type Tip = { text: string; href?: string; urgent?: boolean };

const DEFAULT_TIPS: Tip[] = [
  { text: '🥕 젖은 먹이는 볼주머니에 들러붙어요. 마른 사료 위주로 주세요', href: '/guides' },
  { text: '🌡 적정 온도는 20~24℃. 18℃ 아래면 가성 동면 위험!', href: '/guides' },
  { text: '🏥 햄찌 아플 땐 병원부터. 진료 가능한 곳을 미리 찾아두세요', href: '/hospitals' },
  { text: '🔍 우리집 햄찌가 무슨 종일까? 도감에서 확인해 보세요', href: '/species' },
  { text: '🆘 새 가족이 필요한 햄찌들이 있어요. 유기햄 구조대를 살펴봐요', href: '/rescue' },
  { text: '💬 라운지에서 햄집사들과 실시간으로 수다 떨어요 (우하단 버튼)' },
  { text: '🎡 휠은 시리안 20cm, 드워프 16cm 이상! 작으면 척추에 무리가 가요', href: '/guides' },
];

export function TipBar({ tips = DEFAULT_TIPS, urgentTips = [] }: { tips?: Tip[]; urgentTips?: Tip[] }) {
  // 긴급 구조 글을 앞쪽에 섞어 보여준다 (같은 TIP 모양, 빨간 배지)
  const all = useMemo<Tip[]>(() => [...urgentTips, ...tips], [urgentTips, tips]);
  const [idx, setIdx] = useState(0);
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (all.length <= 1) return;
    const t = setInterval(() => {
      setShow(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % all.length);
        setShow(true);
      }, 280);
    }, 4500);
    return () => clearInterval(t);
  }, [all.length]);

  const tip = all[idx % all.length];
  if (!tip) return null;

  const inner = (
    <span
      className={
        'flex items-center gap-1.5 transition-all duration-300 ' +
        (show ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0')
      }
    >
      <span className={
        'shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white ' +
        (tip.urgent ? 'bg-red-500' : 'bg-peach-400')
      }>{tip.urgent ? '긴급' : 'TIP'}</span>
      <span className="truncate">{tip.text}</span>
    </span>
  );

  return (
    <div className={'border-b border-cream-200 bg-gradient-to-r ' + (tip.urgent ? 'from-red-50 via-cream-50 to-peach-50' : 'from-peach-50 via-cream-50 to-lilac-50')}>
      <div className="mx-auto flex h-9 w-full max-w-5xl items-center overflow-hidden px-4 text-sm text-cocoa-500 md:px-6">
        {tip.href ? (
          <Link href={tip.href} className="min-w-0 flex-1 hover:text-peach-500">{inner}</Link>
        ) : (
          <div className="min-w-0 flex-1">{inner}</div>
        )}
        <div className="ml-2 hidden shrink-0 gap-1 sm:flex">
          {all.map((tp, i) => (
            <span
              key={i}
              className={'h-1.5 w-1.5 rounded-full ' + (i === idx ? (tp.urgent ? 'bg-red-500' : 'bg-peach-400') : 'bg-cream-200')}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
