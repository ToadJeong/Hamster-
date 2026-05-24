import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

const ENTITY_LABEL: Record<string, string> = {
  community_posts: '커뮤니티 글',
  community_comments: '커뮤니티 댓글',
  guides: '가이드',
  comments: '가이드 댓글',
  rescue_posts: '구조대 글',
  product_posts: '상품글',
  announcements: '공지',
  post_reports: '신고',
  content_corrections: '정보 제보',
  chat_reports: '채팅 신고',
};
const ACTION = {
  create: { label: '작성', cls: 'bg-mint-100 text-mint-400' },
  update: { label: '수정', cls: 'bg-cream-200 text-cocoa-500' },
  delete: { label: '삭제', cls: 'bg-red-100 text-red-500' },
} as const;

export default async function AuditPage({ searchParams }: { searchParams: { entity?: string; action?: string } }) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin/audit');
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle();
  if (!(profile as any)?.is_admin) {
    return <div className="card text-center text-cocoa-400">최고 관리자(마스터)만 접근할 수 있어요.</div>;
  }

  let q = supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(300);
  if (searchParams.entity) q = q.eq('entity_type', searchParams.entity);
  if (searchParams.action) q = q.eq('action', searchParams.action);
  const { data, error } = await q;
  const logs = (data as any[]) ?? [];

  return (
    <div className="space-y-4">
      <Link href="/admin" className="text-sm text-cocoa-300 hover:text-peach-500">← 관리</Link>
      <h1 className="font-display text-2xl font-bold text-cocoa-500">🗂 운영 로그</h1>
      <p className="text-sm text-cocoa-300">사이트의 작성·수정·삭제·신고 내역이 자동 기록돼요. (마스터 전용)</p>

      {/* 필터 */}
      <div className="flex flex-wrap gap-1.5 rounded-cute border border-cream-200 bg-white p-3">
        <Link href="/admin/audit" className={'badge ' + (!searchParams.entity && !searchParams.action ? 'bg-peach-100 text-peach-500' : 'hover:bg-cream-200')}>전체</Link>
        {(['create','update','delete'] as const).map((a) => (
          <Link key={a} href={`/admin/audit?action=${a}`} className={'badge ' + (searchParams.action === a ? 'bg-peach-100 text-peach-500' : 'hover:bg-cream-200')}>
            {ACTION[a].label}만
          </Link>
        ))}
        {Object.keys(ENTITY_LABEL).map((e) => (
          <Link key={e} href={`/admin/audit?entity=${e}`} className={'badge ' + (searchParams.entity === e ? 'bg-lilac-200 text-lilac-400' : 'hover:bg-cream-200')}>
            {ENTITY_LABEL[e]}
          </Link>
        ))}
      </div>

      {error && (
        <div className="card text-sm text-amber-600">
          운영 로그 테이블이 아직 없어요. 마이그레이션 0017이 적용되면 표시됩니다.
        </div>
      )}

      {logs.length === 0 ? (
        <div className="card text-center text-cocoa-300">기록이 없어요.</div>
      ) : (
        <ul className="space-y-1.5">
          {logs.map((l) => {
            const act = ACTION[l.action as keyof typeof ACTION] ?? { label: l.action, cls: 'bg-cream-100 text-cocoa-400' };
            return (
              <li key={l.id} className="card flex items-center gap-3 py-2.5">
                <span className={'badge shrink-0 ' + act.cls}>{act.label}</span>
                <span className="badge shrink-0 bg-cream-100 text-cocoa-500">{ENTITY_LABEL[l.entity_type] ?? l.entity_type}</span>
                <span className="min-w-0 flex-1 truncate text-sm text-cocoa-500">{l.summary || '(내용 없음)'}</span>
                <span className="shrink-0 text-xs text-cocoa-300">{l.actor_label ?? '비회원'}</span>
                <span className="shrink-0 text-xs text-cocoa-300">{formatDate(l.created_at)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
