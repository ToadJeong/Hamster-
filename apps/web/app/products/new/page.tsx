import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ProductEditor } from '@/components/ProductEditor';
import { getLocale } from '@/lib/i18n-server';
import { makeT } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export default async function NewProductPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/products/new');
  const t = makeT(getLocale());

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="font-display text-2xl font-bold text-cocoa-500 sm:text-3xl">{t('pe.newTitle')}</h1>
      <p className="text-sm text-cocoa-300">{t('pe.newSubtitle')}</p>
      <ProductEditor />
    </div>
  );
}
