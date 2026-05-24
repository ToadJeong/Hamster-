'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useModal } from '@/components/Modal';
import { useT } from '@/components/I18nProvider';

type Props = {
  guideId: string;
  isAnonymous: boolean;
  canEdit: boolean;
};

export function GuideActions({ guideId, isAnonymous, canEdit }: Props) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const modal = useModal();
  const t = useT();

  async function handleDelete() {
    if (isAnonymous) {
      const pw = await modal.prompt({
        title: t('act.delAnonGuideTitle'),
        message: t('cm.delAnonMsg'),
        inputType: 'password',
        confirmText: t('cm.delConfirm'),
      });
      if (!pw) return;
      const { data, error } = await supabase.rpc('delete_anonymous_guide', {
        p_guide_id: guideId,
        p_password: pw,
      });
      if (error || !data) {
        await modal.alert({ title: t('cm.wrongPassword'), tone: 'error' });
        return;
      }
      await modal.alert({ title: t('act.guideDeleted'), tone: 'success' });
      router.push('/guides');
      router.refresh();
      return;
    }
    const ok = await modal.confirm({
      title: t('act.delGuideTitle'),
      message: t('act.delGuideMsg'),
      confirmText: t('cm.delConfirm'),
    });
    if (!ok) return;
    const { error } = await supabase.from('guides').delete().eq('id', guideId);
    if (error) {
      await modal.alert({ title: t('form.deleteFailed'), message: error.message, tone: 'error' });
      return;
    }
    router.push('/guides');
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      {canEdit && (
        <Link
          href={`/guides/${guideId}/edit`}
          className="inline-flex items-center gap-1 rounded-full border border-cream-200 bg-white px-3 py-1.5 text-sm font-medium text-cocoa-500 shadow-softer hover:bg-cream-50"
        >
          {t('act.edit')}
        </Link>
      )}
      <button
        onClick={handleDelete}
        className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-500 shadow-softer hover:bg-red-50"
      >
        {t('act.delete')}
      </button>
    </div>
  );
}
