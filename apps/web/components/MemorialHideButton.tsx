'use client';

import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useT } from '@/components/I18nProvider';

export function MemorialHideButton({ id, hidden }: { id: string; hidden: boolean }) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const t = useT();

  async function toggle() {
    await supabase.from('memorials').update({ hidden: !hidden }).eq('id', id);
    router.refresh();
  }

  return (
    <button onClick={toggle} className="text-xs text-cocoa-400 hover:text-cocoa-600">
      {hidden ? t('mem.unhide') : t('mem.hide')}
    </button>
  );
}
