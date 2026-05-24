import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ProductEditor } from '@/components/ProductEditor';

export const dynamic = 'force-dynamic';

export default async function NewProductPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/products/new');

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="font-display text-2xl font-bold text-cocoa-500 sm:text-3xl">🛍 상품 추천하기</h1>
      <p className="text-sm text-cocoa-300">상품 링크를 붙여넣고 “미리보기 가져오기”를 누르면 제목·이미지를 자동으로 채워줘요.</p>
      <ProductEditor />
    </div>
  );
}
