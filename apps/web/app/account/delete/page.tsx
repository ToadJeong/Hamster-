import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getSiteSettings } from '@/lib/site-settings';
import { LegalDocument } from '@/components/LegalDocument';
import { AccountDeleteRequestForm } from '@/components/AccountDeleteRequestForm';

export const dynamic = 'force-dynamic';

const FALLBACK = `# 데이터 삭제 요청 안내

햄찌랜드는 이용자의 계정과 데이터를 언제든 삭제할 수 있도록 안내합니다.

## 직접 삭제 (회원)
1. 로그인 후 \`내 프로필\` 페이지로 이동합니다.
2. 본인이 작성한 가이드·댓글을 개별 삭제할 수 있습니다.
3. 계정 자체의 삭제는 아래 양식 또는 운영자 이메일로 요청해 주세요.

## 익명 게시물 삭제
- 익명으로 작성한 글/댓글은 글 상세에서 “삭제” 버튼을 누른 뒤,
  작성 당시 입력한 비밀번호를 입력하면 즉시 삭제됩니다.
- 비밀번호를 잊으셨다면, 글의 URL과 함께 운영자에게 삭제를 요청해 주세요.

## 요청 후 처리 기간
- 영업일 기준 7일 이내에 처리합니다.
`;

export default async function AccountDeletePage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const settings = await getSiteSettings();
  const content = settings['legal.deletion_html'] || FALLBACK;
  const contact = settings['site.contact_email'] || '';

  return (
    <div className="space-y-6">
      <LegalDocument title="데이터 삭제 요청" markdown={content} />
      <section className="card space-y-3">
        <h2 className="font-display text-xl font-bold text-cocoa-500">삭제 요청 보내기</h2>
        {contact ? (
          <p className="text-sm text-cocoa-400">
            운영자 이메일: <a href={`mailto:${contact}`} className="text-peach-500 underline">{contact}</a>
          </p>
        ) : (
          <p className="text-sm text-cocoa-400">
            관리자가 아직 운영자 이메일을 설정하지 않았어요. 운영자에게 직접 문의해 주세요.
          </p>
        )}
        <AccountDeleteRequestForm currentEmail={user?.email ?? null} contactEmail={contact} />
        {!user && (
          <p className="text-xs text-cocoa-300">
            회원이신가요? <Link href="/login?next=/account/delete" className="underline">로그인</Link>하면 신청이 더 빠르게 처리돼요.
          </p>
        )}
      </section>
    </div>
  );
}
