import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/format';
import { RescueAuthorActions } from '@/components/RescueAuthorActions';
import { RescueRoleBoard, type RescueRole, type RescueApplication } from '@/components/RescueRoleBoard';
import { RescueCommentSection } from '@/components/RescueCommentSection';
import { ViewTracker } from '@/components/ViewTracker';
import {
  RESCUE_KIND_LABEL, RESCUE_STATUS_LABEL,
  type RescuePostWithAuthor,
} from '@hamster/shared';

export const dynamic = 'force-dynamic';

function dday(deadline: string): { text: string; tone: string } {
  const end = new Date(deadline);
  const now = new Date();
  const days = Math.ceil((end.getTime() - now.getTime()) / 86400000);
  if (days < 0) return { text: '마감 지남', tone: 'bg-cocoa-100 text-cocoa-400' };
  if (days === 0) return { text: '오늘 마감', tone: 'bg-red-500 text-white' };
  return { text: `마감 D-${days}`, tone: 'bg-red-100 text-red-500' };
}

export default async function RescueDetail({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('rescue_posts_with_author')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (error || !data) notFound();
  const r = data as RescuePostWithAuthor & { view_count?: number };
  const kindMeta = RESCUE_KIND_LABEL[r.kind];
  const isAuthor = !!user && r.author_id === user.id;

  // 권한(운영자) — 댓글 삭제용
  let isStaff = false;
  if (user) {
    const { data: p } = await supabase.from('profiles').select('is_admin, is_moderator').eq('id', user.id).maybeSingle();
    isStaff = !!(p as any)?.is_admin || !!(p as any)?.is_moderator;
  }

  // 역할 슬롯 + 담당자
  const { data: roleRows } = await supabase
    .from('rescue_roles')
    .select('id, role_type, status, assignee_id, assignee:profiles!rescue_roles_assignee_id_fkey(username)')
    .eq('post_id', params.id);
  const roles: RescueRole[] = ((roleRows as any[]) ?? []).map((x) => ({
    id: x.id, role_type: x.role_type, status: x.status, assignee_id: x.assignee_id,
    assignee_username: x.assignee?.username ?? null,
  }));

  // 지원 내역 (작성자: 역할별 대기중 지원자 / 회원: 내 지원)
  const applicantsByRole: Record<string, RescueApplication[]> = {};
  const myApplications: Record<string, RescueApplication> = {};
  if (user && roles.length > 0) {
    if (isAuthor || isStaff) {
      const { data: apps } = await supabase
        .from('rescue_role_applications')
        .select('id, role_id, applicant_id, message, status, applicant:profiles!rescue_role_applications_applicant_id_fkey(username)')
        .eq('post_id', params.id)
        .eq('status', 'pending');
      for (const a of (apps as any[]) ?? []) {
        const app: RescueApplication = {
          id: a.id, role_id: a.role_id, applicant_id: a.applicant_id,
          applicant_username: a.applicant?.username ?? null, message: a.message, status: a.status,
        };
        (applicantsByRole[a.role_id] ??= []).push(app);
      }
    } else {
      const { data: mine } = await supabase
        .from('rescue_role_applications')
        .select('id, role_id, applicant_id, message, status')
        .eq('post_id', params.id)
        .eq('applicant_id', user.id);
      for (const a of (mine as any[]) ?? []) {
        myApplications[a.role_id] = {
          id: a.id, role_id: a.role_id, applicant_id: a.applicant_id,
          applicant_username: null, message: a.message, status: a.status,
        };
      }
    }
  }

  // 댓글
  const { data: commentRows } = await supabase
    .from('rescue_comments')
    .select('id, author_id, body, created_at, author:profiles!rescue_comments_author_id_fkey(username, avatar_url)')
    .eq('post_id', params.id)
    .order('created_at', { ascending: true });

  const gallery = (r.images && r.images.length > 0) ? r.images : (r.cover_url ? [r.cover_url] : []);
  const dl = r.deadline ? dday(r.deadline) : null;

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <Link href="/rescue" className="text-sm text-cocoa-300 hover:text-peach-500">← 유기햄 구조대</Link>

      {/* 사진 갤러리 */}
      {gallery.length > 0 && (
        <div className={gallery.length === 1 ? '' : 'grid grid-cols-2 gap-2'}>
          {gallery.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={url}
              alt=""
              className={
                'w-full rounded-cute object-cover ' +
                (gallery.length === 1 ? 'aspect-[16/9]' : 'aspect-square')
              }
            />
          ))}
        </div>
      )}

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {r.urgent && <span className="badge bg-red-500 text-white">🚨 긴급</span>}
          {dl && <span className={'badge ' + dl.tone}>⏰ {dl.text}</span>}
          <span className="badge bg-peach-100 text-peach-500">{kindMeta.emoji} {kindMeta.label}</span>
          <span className="badge bg-cocoa-100 text-cocoa-400">{RESCUE_STATUS_LABEL[r.status]}</span>
          {r.region && <span className="badge">📍 {r.region}</span>}
          {r.species_name_ko && r.species_slug && (
            <Link href={`/species/${r.species_slug}`} className="badge bg-mint-100 text-mint-400 hover:bg-mint-200">
              #{r.species_name_ko}
            </Link>
          )}
          {typeof r.age_months === 'number' && <span className="badge">{r.age_months}개월</span>}
        </div>
        <h1 className="font-display text-2xl font-bold leading-tight text-cocoa-500 sm:text-3xl">{r.title}</h1>
        <div className="flex items-center gap-1.5 text-sm text-cocoa-300">
          <span>{r.author_username ?? '익명'} · {formatDate(r.created_at)} ·</span>
          <ViewTracker type="rescue" id={r.id} initialCount={r.view_count ?? 0} showCount />
        </div>
      </header>

      <div className="prose-soft whitespace-pre-line text-[15px]">{r.body}</div>

      {r.contact_hint && (
        <div className="card bg-mint-50">
          <p className="text-sm text-cocoa-300">연락 방법</p>
          <p className="mt-1 text-cocoa-500">{r.contact_hint}</p>
          <p className="mt-2 text-xs text-cocoa-300">
            ⚠ 직접 만남보다 안전한 방법(택배·동물보호단체 경유 등)을 권장합니다.
          </p>
        </div>
      )}

      {/* 구조 역할 모집 */}
      {roles.length > 0 && (
        <RescueRoleBoard
          postId={r.id}
          roles={roles}
          isAuthor={isAuthor}
          isAuthed={!!user}
          applicantsByRole={applicantsByRole}
          myApplications={myApplications}
        />
      )}

      {isAuthor && <RescueAuthorActions postId={r.id} currentStatus={r.status} />}

      <RescueCommentSection
        postId={r.id}
        initialComments={(commentRows as any[]) ?? []}
        currentUserId={user?.id ?? null}
        isStaff={isStaff}
      />
    </article>
  );
}
