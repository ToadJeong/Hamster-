'use client';

/**
 * 실시간 알림 토스터.
 * 로그인 사용자의 notifications INSERT를 구독해 우하단 토스트를 띄우고
 * 헤더 뱃지(서버 렌더)를 갱신하기 위해 router.refresh()를 호출한다.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type Toast = { id: string; title: string; body: string | null; link: string | null };

const ICON: Record<string, string> = {
  new_comment: '💬', new_like: '❤️', new_follower: '⭐',
  view_milestone: '🎉', new_dm: '✉️', rescue_status: '🆘',
};

export function NotificationToaster({ userId }: { userId: string }) {
  const router = useRouter();
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const ch = supabase
      .channel(`notif:${userId}`)
      .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
          (payload) => {
            const n = payload.new as any;
            const t: Toast = { id: n.id, title: `${ICON[n.kind] ?? '🔔'} ${n.title}`, body: n.body, link: n.link };
            setToasts((prev) => [...prev, t]);
            router.refresh();
            setTimeout(() => {
              setToasts((prev) => prev.filter((x) => x.id !== t.id));
            }, 5000);
          })
      .subscribe();
    return () => { ch.unsubscribe(); };
  }, [userId, router]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 left-3 z-[90] flex flex-col gap-2 md:bottom-24 md:left-5">
      {toasts.map((t) => {
        const inner = (
          <div className="w-72 rounded-cute border border-cream-200 bg-white p-3 shadow-soft">
            <p className="text-sm font-semibold text-cocoa-500">{t.title}</p>
            {t.body && <p className="mt-0.5 line-clamp-2 text-xs text-cocoa-400">{t.body}</p>}
          </div>
        );
        return (
          <div key={t.id} className="animate-[pet-cuddle-pop_0.3s_ease-out]">
            {t.link ? <Link href={t.link}>{inner}</Link> : inner}
          </div>
        );
      })}
    </div>
  );
}
