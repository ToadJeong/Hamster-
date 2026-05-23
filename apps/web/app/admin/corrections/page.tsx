import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { CorrectionsList } from '@/components/CorrectionsList';

export const dynamic = 'force-dynamic';

export default async function AdminCorrectionsPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin/corrections');
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle();
  if (!(profile as any)?.is_admin) {
    return <div className="card text-center text-cocoa-400">관리자만 접근할 수 있어요.</div>;
  }

  const { data } = await supabase
    .from('content_corrections')
    .select('*')
    .order('status')
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <div className="space-y-4">
      <Link href="/admin" className="text-sm text-cocoa-300 hover:text-peach-500">← 관리</Link>
      <h1 className="font-display text-2xl font-bold text-cocoa-500">🛠 정보 제보 ({data?.length ?? 0}건)</h1>
      <p className="text-sm text-cocoa-300">도감·가이드 정보 수정 제보예요. 반영 후에는 도감을 직접 수정하고 처리 상태를 바꿔주세요.</p>
      <CorrectionsList initial={(data as any[]) ?? []} />
    </div>
  );
}
