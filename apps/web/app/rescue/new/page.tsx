import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { RescueEditor } from '@/components/RescueEditor';
import type { Species } from '@hamster/shared';

export const dynamic = 'force-dynamic';

export default async function NewRescuePost() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/rescue/new');

  const { data: speciesList } = await supabase
    .from('species').select('id, slug, name_ko').order('name_ko');

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-display text-2xl font-bold text-cocoa-500 sm:text-3xl">🆘 구조대 글 올리기</h1>
      <p className="text-sm text-cocoa-300">
        직접 만남보다는 동물보호단체·전문 분양처를 통한 안전한 매칭을 권장합니다.
        연락 방법에는 오픈채팅·이메일·SNS 계정 등 분실 위험이 적은 채널을 사용해 주세요.
      </p>
      <RescueEditor species={(speciesList as Pick<Species,'id'|'slug'|'name_ko'>[]) ?? []} />
    </div>
  );
}
