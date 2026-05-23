import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NotificationList } from '@/components/NotificationList';

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/notifications');

  const { data } = await supabase
    .from('notifications')
    .select('id, kind, title, body, link, read_at, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-cocoa-500 sm:text-3xl">🔔 알림</h1>
      </div>
      <p className="text-sm text-cocoa-300">내 글에 달린 댓글·좋아요, 새 팔로워, 조회수 소식이 모여요.</p>
      <NotificationList initial={(data as any[]) ?? []} />
    </div>
  );
}
