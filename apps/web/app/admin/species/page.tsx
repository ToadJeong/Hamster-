import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Species } from '@hamster/shared';

export const dynamic = 'force-dynamic';

export default async function AdminSpeciesPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin/species');
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle();
  if (!(profile as any)?.is_admin) {
    return <div className="card text-center text-cocoa-400">관리자만 접근할 수 있어요.</div>;
  }

  const { data } = await supabase.from('species').select('id, slug, name_ko, summary').order('name_ko');
  const list = (data as Pick<Species, 'id'|'slug'|'name_ko'|'summary'>[]) ?? [];

  return (
    <div className="space-y-4">
      <Link href="/admin" className="text-sm text-cocoa-300 hover:text-peach-500">← 관리</Link>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-cocoa-500">🐹 도감 관리 ({list.length})</h1>
        <Link href="/admin/species/new" className="btn-primary text-sm">+ 새 종 추가</Link>
      </div>
      <ul className="space-y-2">
        {list.map((s) => (
          <li key={s.id}>
            <Link href={`/admin/species/${s.id}`} className="card flex items-center justify-between gap-3 transition hover:-translate-y-0.5 hover:shadow-soft">
              <div className="min-w-0">
                <p className="font-semibold text-cocoa-500">{s.name_ko} <span className="text-xs text-cocoa-300">/{s.slug}</span></p>
                <p className="line-clamp-1 text-sm text-cocoa-300">{s.summary}</p>
              </div>
              <span className="text-cocoa-300">수정 →</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
