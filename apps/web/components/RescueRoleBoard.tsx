'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useModal } from '@/components/Modal';
import { useT } from '@/components/I18nProvider';
import {
  RESCUE_ROLE_ORDER, RESCUE_ROLE_LABEL,
  type RescueRoleType,
} from '@hamster/shared';

export type RescueRole = {
  id: string;
  role_type: RescueRoleType;
  status: 'open' | 'filled';
  assignee_id: string | null;
  assignee_username: string | null;
};
export type RescueApplication = {
  id: string;
  role_id: string;
  applicant_id: string;
  applicant_username: string | null;
  message: string | null;
  status: 'pending' | 'accepted' | 'rejected';
};

export type PublicApplicant = { applicant_id: string; username: string | null; status: string };

type Props = {
  postId: string;
  roles: RescueRole[];
  isAuthor: boolean;
  isAuthed: boolean;
  // 작성자: 역할별 지원자 / 일반 회원: 내 지원 내역
  applicantsByRole: Record<string, RescueApplication[]>;
  myApplications: Record<string, RescueApplication>; // role_id -> 내 지원
  publicApplicants: Record<string, PublicApplicant[]>; // 모두에게 보이는 지원자 이름
};

export function RescueRoleBoard({
  postId, roles, isAuthor, isAuthed, applicantsByRole, myApplications, publicApplicants,
}: Props) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const modal = useModal();
  const t = useT();
  const [busy, setBusy] = useState(false);

  // role_type -> role (없으면 미생성)
  const byType = new Map(roles.map((r) => [r.role_type, r]));

  async function apply(roleId: string) {
    if (!isAuthed) { router.push('/login?next=/rescue/' + postId); return; }
    const msg = await modal.prompt({
      title: t('rb.applyTitle'),
      message: t('rb.applyMsg'),
      placeholder: t('rb.applyPh'),
      confirmText: t('rb.apply'),
    });
    if (msg === null) return;
    setBusy(true);
    const { error } = await supabase.rpc('apply_rescue_role', { p_role_id: roleId, p_message: msg.trim() || null });
    setBusy(false);
    if (error) { await modal.alert({ title: t('rb.applyFail'), message: error.message, tone: 'error' }); return; }
    await modal.alert({ title: t('rb.applyDone'), tone: 'success' });
    router.refresh();
  }

  async function withdraw(appId: string) {
    const ok = await modal.confirm({ title: t('rb.withdrawConfirm'), confirmText: t('rb.withdraw') });
    if (!ok) return;
    setBusy(true);
    const { error } = await supabase.from('rescue_role_applications').delete().eq('id', appId);
    setBusy(false);
    if (!error) router.refresh();
  }

  async function accept(appId: string) {
    setBusy(true);
    const { error } = await supabase.rpc('accept_rescue_application', { p_app_id: appId });
    setBusy(false);
    if (error) { await modal.alert({ title: t('form.saveFailed'), message: error.message, tone: 'error' }); return; }
    router.refresh();
  }

  async function reopen(roleId: string) {
    setBusy(true);
    const { error } = await supabase.rpc('reopen_rescue_role', { p_role_id: roleId });
    setBusy(false);
    if (!error) router.refresh();
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-display text-xl font-bold text-cocoa-500">{t('rb.title')}</h2>
        <p className="mt-0.5 text-sm text-cocoa-300">{t('rb.subtitle')}</p>
      </div>

      <ul className="space-y-2.5">
        {RESCUE_ROLE_ORDER.map((type) => {
          const role = byType.get(type);
          if (!role) return null;
          const meta = RESCUE_ROLE_LABEL[type];
          const filled = role.status === 'filled';
          const mine = myApplications[role.id];
          const applicants = applicantsByRole[role.id] ?? [];

          return (
            <li key={type} className="rounded-2xl border border-cream-200 bg-white p-3.5">
              <div className="flex items-start gap-3">
                <span className="text-2xl leading-none">{meta.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-bold text-cocoa-500">{meta.label}</span>
                    {filled ? (
                      <span className="badge bg-mint-100 text-mint-500">✅ {t('rb.filled')}{role.assignee_username ? ` · ${role.assignee_username}` : ''}</span>
                    ) : (
                      <span className="badge bg-peach-100 text-peach-500">{t('rb.open')}</span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[13px] text-cocoa-300">{meta.desc}</p>

                  {/* 모두에게 보이는 지원자 (이름) */}
                  {(publicApplicants[role.id]?.length ?? 0) > 0 && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                      <span className="text-[11px] text-cocoa-300">{t('rb.applicantsLabel')}</span>
                      {publicApplicants[role.id].map((a) => (
                        <span key={a.applicant_id}
                          className={'rounded-full px-2 py-0.5 text-[11px] ' + (a.status === 'accepted' ? 'bg-mint-100 font-bold text-mint-500' : 'bg-cream-100 text-cocoa-400')}>
                          {a.username ?? t('common.anonymous')}{a.status === 'accepted' ? ' ✅' : ''}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 일반 회원 액션 */}
                  {!isAuthor && !filled && (
                    mine ? (
                      <div className="mt-2 flex items-center gap-2 text-sm">
                        <span className="font-medium text-mint-500">{mine.status === 'accepted' ? t('rb.appliedAccepted') : t('rb.appliedPending')}</span>
                        {mine.status === 'pending' && (
                          <button onClick={() => withdraw(mine.id)} disabled={busy} className="text-xs text-cocoa-300 hover:text-red-400">{t('rb.withdraw')}</button>
                        )}
                      </div>
                    ) : (
                      <button onClick={() => apply(role.id)} disabled={busy}
                        className="btn-primary mt-2 px-4 py-1.5 text-sm">
                        {isAuthed ? t('rb.apply') : t('rb.loginToApply')}
                      </button>
                    )
                  )}

                  {/* 작성자 액션: 지원자 목록 + 수락 / 다시모집 */}
                  {isAuthor && (
                    <div className="mt-2 space-y-1.5">
                      {filled && (
                        <button onClick={() => reopen(role.id)} disabled={busy} className="btn-secondary px-3 py-1.5 text-xs">{t('rb.reopen')}</button>
                      )}
                      {!filled && applicants.length === 0 && (
                        <p className="text-xs text-cocoa-300">{t('rb.noApplicants')}</p>
                      )}
                      {!filled && applicants.map((a) => (
                        <div key={a.id} className="flex items-start justify-between gap-2 rounded-xl bg-cream-50 px-3 py-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-cocoa-500">{a.applicant_username ?? t('common.anonymous')}</p>
                            {a.message && <p className="text-[13px] text-cocoa-400">{a.message}</p>}
                          </div>
                          <button onClick={() => accept(a.id)} disabled={busy} className="btn-primary shrink-0 px-3 py-1.5 text-xs">{t('rb.accept')}</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {!isAuthed && (
        <p className="text-center text-xs text-cocoa-300">
          <Link href={'/login?next=/rescue/' + postId} className="text-peach-500 underline">{t('action.login')}</Link> {t('rb.loginHint')}
        </p>
      )}
    </section>
  );
}
