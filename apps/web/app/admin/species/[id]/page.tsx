import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { SpeciesEditor } from '@/components/SpeciesEditor';
import type { Species } from '@hamster/shared';

export const dynamic = 'force-dynamic';

export default async function AdminSpeciesEdit({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin/species');
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle();
  if (!(profile as any)?.is_admin) {
    return <div className="card text-center text-cocoa-400">관리자만 접근할 수 있어요.</div>;
  }

  const { data } = await supabase.from('species').select('*').eq('id', params.id).maybeSingle();
  if (!data) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href="/admin/species" className="text-sm text-cocoa-300 hover:text-peach-500">← 도감 관리</Link>
      <h1 className="font-display text-2xl font-bold text-cocoa-500">도감 수정 · {(data as Species).name_ko}</h1>
      <SpeciesEditor initial={data as Species} />
    </div>
  );
}
