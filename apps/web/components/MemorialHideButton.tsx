'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useModal } from '@/components/Modal';
import { useT } from '@/components/I18nProvider';

export function MemorialHideButton({ id, hidden }: { id: string; hidden: boolean }) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const modal = useModal();
  const t = useT();
  const [optHidden, setOptHidden] = useState(hidden);
  const busy = useRef(false);

  async function toggle() {
    if (busy.current) return;
    busy.current = true;
    const next = !optHidden;
    setOptHidden(next); // 옵티미스틱: 즉시 라벨 변경
    const { error } = await supabase.from('memorials').update({ hidden: next }).eq('id', id);
    if (error) {
      setOptHidden(!next); // 롤백
      await modal.alert({ title: t('form.saveFailed'), message: error.message, tone: 'error' });
    } else {
      router.refresh();
    }
    busy.current = false;
  }

  return (
    <button onClick={toggle} className="text-xs text-cocoa-400 hover:text-cocoa-600">
      {optHidden ? t('mem.unhide') : t('mem.hide')}
    </button>
  );
}
