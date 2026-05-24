import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { MomentComposer } from '@/components/MomentComposer';
import type { Pet } from '@hamster/shared';

export const dynamic = 'force-dynamic';

export default async function NewMomentPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/moments/new');

  const { data: pets } = await supabase
    .from('pets').select('id, name').eq('owner_id', user.id).order('created_at');

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="font-display text-2xl font-bold text-cocoa-500 sm:text-3xl">📸 육아일기 쓰기</h1>
      <p className="text-sm text-cocoa-300">우리집 햄찌의 귀여운 순간을 사진과 함께 남겨요.</p>
      <MomentComposer pets={(pets as Pick<Pet, 'id' | 'name'>[]) ?? []} />
    </div>
  );
}
