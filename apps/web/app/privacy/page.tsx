import { getSiteSettings } from '@/lib/site-settings';
import { LegalDocument } from '@/components/LegalDocument';

export const dynamic = 'force-dynamic';

const FALLBACK = `# 개인정보 처리방침

본 약관은 햄찌랜드(이하 "서비스")가 이용자의 개인정보를 어떻게 처리하는지 안내합니다.
**실제 운영 전 변호사 또는 전문가의 검토를 받으시기 바랍니다.**

## 1. 수집하는 개인정보 항목
- 회원가입: 이메일, 비밀번호, 닉네임
- 소셜 로그인 시: 해당 제공자로부터 받는 프로필(이메일, 이름)
- 익명 게시: 본인 확인용 비밀번호 (서버에 bcrypt 해시로만 저장)
- 자동 수집: 접속 IP, 브라우저 정보 (보안 목적)

## 2. 수집 목적
- 계정 식별과 인증
- 콘텐츠 작성·수정·삭제의 본인 확인
- 부정 이용 방지

## 3. 보유 기간
- 회원 탈퇴 즉시 개인 식별 정보 삭제
- 단, 관련 법령에 따라 보관이 필요한 경우 해당 기간 보관

## 4. 제3자 제공
- 이용자가 명시적으로 동의하지 않는 한 제3자에게 제공하지 않습니다.
- 인프라: Supabase Inc. (데이터 저장·인증)

## 5. 이용자 권리
- 개인정보 열람, 수정, 삭제 요청은 **/account/delete** 또는 운영자 이메일로 가능합니다.

## 6. 문의
- 운영자 이메일: (관리자 설정에서 안내)

본 방침은 ${new Date().getFullYear()}년 기준입니다.`;

export default async function PrivacyPage() {
  const settings = await getSiteSettings();
  const content = settings['legal.privacy_html'] || FALLBACK;
  return <LegalDocument title="개인정보 처리방침" markdown={content} />;
}
