import Link from 'next/link';
import { getSiteSettings } from '@/lib/site-settings';

export async function Footer() {
  const settings = await getSiteSettings();
  return (
    <footer className="border-t border-cream-200 bg-cream-50/60">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-6 text-sm text-cocoa-300 md:px-6">
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Link href="/privacy" className="hover:text-peach-500">개인정보처리방침</Link>
          <Link href="/terms" className="hover:text-peach-500">이용약관</Link>
          <Link href="/account/delete" className="hover:text-peach-500">데이터 삭제 요청</Link>
          {settings['site.contact_email'] && (
            <a href={`mailto:${settings['site.contact_email']}`} className="hover:text-peach-500">
              문의: {settings['site.contact_email']}
            </a>
          )}
        </nav>
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} 햄찌랜드 · 햄집사들의 작은 커뮤니티</p>
          <p className="text-xs">정보는 참고용이며, 햄스터 건강 문제는 수의사 진료를 권장해요.</p>
        </div>
      </div>
    </footer>
  );
}
