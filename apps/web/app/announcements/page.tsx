import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/format';
import { AnnouncementDeleteButton } from '@/components/AnnouncementDeleteButton';
import type { Announcement } from '@hamster/shared';

export const revalidate = 30;

export default async function AnnouncementsPage() {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false });

  const items = (data as Announcement[]) ?? [];

  // 관리자 권한 확인 (글쓰기 버튼 노출용)
  const { data: { user } } = await supabase.auth.getUser();
  let isAdmin = false;
  if (user) {
    const { data: p } = await supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle();
    isAdmin = !!(p as any)?.is_admin;
  }

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-cocoa-500 sm:text-3xl">📢 공지사항</h1>
          <p className="mt-1 text-sm text-cocoa-300">햄랜드 운영 안내와 업데이트 소식</p>
        </div>
        {isAdmin && (
          <Link href="/announcements/new" className="btn-primary text-sm">
            ✏️ 공지 작성
          </Link>
        )}
      </header>

      {error && (
        <div className="card text-center text-sm text-cocoa-300">
          📢 공지사항을 준비하고 있어요. 잠시 후 다시 와 주세요!
        </div>
      )}

      {items.length === 0 ? (
        <div className="card text-center text-cocoa-300">아직 공지사항이 없어요.</div>
      ) : (
        <ul className="space-y-3">
          {items.map((a) => (
            <li key={a.id} className="card">
              <div className="mb-2 flex items-center gap-2 text-xs text-cocoa-300">
                {a.pinned && <span className="badge bg-peach-100 text-peach-500">📌 고정</span>}
                <span>{formatDate(a.created_at)}</span>
              </div>
              <h2 className="mb-2 font-display text-lg font-bold text-cocoa-500 sm:text-xl">{a.title}</h2>
              <div className="prose-soft text-[15px]">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{a.body}</ReactMarkdown>
              </div>
              {isAdmin && (
                <div className="mt-3 flex justify-end gap-3 border-t border-cream-100 pt-2 text-xs">
                  <Link href={`/announcements/${a.id}/edit`} className="text-cocoa-400 hover:text-peach-500">수정</Link>
                  <AnnouncementDeleteButton id={a.id} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
