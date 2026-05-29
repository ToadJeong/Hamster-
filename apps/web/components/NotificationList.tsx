'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useT } from '@/components/I18nProvider';
import { formatDate } from '@/lib/format';

type Notif = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

const ICON: Record<string, string> = {
  new_comment: '💬',
  new_like: '❤️',
  new_follower: '⭐',
  view_milestone: '🎉',
  new_dm: '✉️',
  rescue_status: '🆘',
};

export function NotificationList({ initial }: { initial: Notif[] }) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const t = useT();
  const [items, setItems] = useState<Notif[]>(initial);

  // 페이지 열면 전체 읽음 처리 — 화면은 즉시 읽음 상태로(옵티미스틱), 서버는 백그라운드에서 동기화
  useEffect(() => {
    const now = new Date().toISOString();
    setItems((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: now })));
    void supabase.rpc('mark_all_notifications_read').then(() => router.refresh());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (items.length === 0) {
    return (
      <div className="card text-center text-cocoa-300">
        {t('nt.empty')}
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((n) => {
        const body = (
          <div className={'card flex items-start gap-3 ' + (n.read_at ? 'opacity-70' : 'border-peach-200 bg-peach-50/40')}>
            <span className="text-xl">{ICON[n.kind] ?? '🔔'}</span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-cocoa-500">{n.title}</p>
              {n.body && <p className="mt-0.5 line-clamp-2 text-sm text-cocoa-400">{n.body}</p>}
              <p className="mt-1 text-xs text-cocoa-300">{formatDate(n.created_at)}</p>
            </div>
            {!n.read_at && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-peach-400" />}
          </div>
        );
        return (
          <li key={n.id}>
            {n.link ? <Link href={n.link}>{body}</Link> : body}
          </li>
        );
      })}
    </ul>
  );
}
