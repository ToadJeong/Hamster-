import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { IdentifyForm } from '@/components/IdentifyForm';
import type { Species } from '@hamster/shared';

export const revalidate = 300;

export default async function IdentifyPage() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from('species')
    .select('slug, name_ko')
    .order('name_ko');
  const species = (data as Pick<Species, 'slug' | 'name_ko'>[]) ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold text-cocoa-500 sm:text-3xl">📷 사진으로 종 찾기</h1>
        <p className="mt-1 text-sm text-cocoa-300">
          햄스터 종 이름이나 특징을 입력하면 Google 이미지 검색으로 연결해드려요.
        </p>
      </header>

      <IdentifyForm />

      <section className="space-y-3">
        <h2 className="font-semibold text-cocoa-500">한 번에 검색 — 자주 찾는 종</h2>
        <div className="flex flex-wrap gap-2">
          {species.slice(0, 20).map((s) => (
            <a
              key={s.slug}
              href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent('햄스터 ' + s.name_ko)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="badge bg-cream-100 text-cocoa-500 hover:bg-peach-100 hover:text-peach-500"
            >
              🔍 {s.name_ko}
            </a>
          ))}
          {species.length > 20 && (
            <Link href="/species" className="badge hover:bg-cream-200">… 도감에서 전체 보기</Link>
          )}
        </div>
        <p className="text-xs text-cocoa-300">
          버튼을 누르면 Google 이미지 검색 결과가 새 탭으로 열려요.
        </p>
      </section>

      <section className="card bg-mint-50 text-sm text-cocoa-500">
        <p className="font-semibold">💡 종을 잘 모르겠다면</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-cocoa-400">
          <li>크기: 손바닥보다 크면 시리안(골든) 계열일 가능성이 높아요</li>
          <li>등에 검은 줄이 있으면 윈터화이트/정글리안</li>
          <li>꼬리가 길고 가늘면 중국햄스터(그레이햄스터)</li>
          <li>아주 작고 빠르며 무리지어 있으면 로보로브스키</li>
        </ul>
        <Link href="/species" className="btn-secondary mt-3 text-sm">도감에서 확인하기</Link>
      </section>
    </div>
  );
}
