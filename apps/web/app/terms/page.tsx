import { getSiteSettings } from '@/lib/site-settings';
import { LegalDocument } from '@/components/LegalDocument';

export const dynamic = 'force-dynamic';

const FALLBACK = `# 이용약관

본 약관은 햄찌랜드(이하 "서비스") 이용에 관한 기본 사항을 정합니다.
**실제 운영 전 변호사 검토를 받으시기 바랍니다.**

## 1. 서비스 내용
- 햄스터 종별 도감, 사육 가이드 게시판, 커뮤니티 기능을 제공합니다.

## 2. 회원 의무
- 타인의 정보를 도용하지 않습니다.
- 음란물, 폭력, 차별, 혐오, 불법 정보 게시를 금합니다.
- 햄스터 학대 옹호·조장 게시물을 금합니다.

## 3. 콘텐츠 권리
- 작성자는 본인이 작성한 콘텐츠의 저작권을 보유합니다.
- 서비스는 본 서비스의 운영·홍보를 위해 비독점적으로 활용할 수 있습니다.

## 4. 서비스 중단
- 시스템 점검, 천재지변 등으로 서비스 제공이 일시 중단될 수 있습니다.

## 5. 면책
- 본 서비스의 정보는 참고용이며, 햄스터 건강 문제는 반드시 수의사 진료를 권장합니다.
- 콘텐츠에서 발생한 손해에 대해 운영자는 책임을 지지 않습니다.

본 약관은 ${new Date().getFullYear()}년 기준입니다.`;

export default async function TermsPage() {
  const settings = await getSiteSettings();
  const content = settings['legal.terms_html'] || FALLBACK;
  return <LegalDocument title="이용약관" markdown={content} />;
}
