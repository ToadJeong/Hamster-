import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function IdentifyPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold text-cocoa-500 sm:text-3xl">📷 사진으로 종 찾기</h1>
        <p className="mt-1 text-sm text-cocoa-300">우리집 햄찌가 어떤 종인지 사진으로 확인해 보세요</p>
      </header>

      <div className="card bg-gradient-to-br from-peach-50 to-lilac-50 text-center">
        <p className="text-5xl">🤖🐹</p>
        <h2 className="mt-3 font-semibold text-cocoa-500">사진 인식 기능 준비 중</h2>
        <p className="mt-2 text-sm text-cocoa-400">
          Claude Vision · Google Vision 등 AI 이미지 인식을 연동하면<br />
          업로드한 사진으로 종 후보 Top 3를 추천해 드릴 수 있어요.
        </p>
        <p className="mt-3 text-xs text-cocoa-300">
          (Phase 2에서 출시 예정 — API 키 연결과 약간의 비용이 필요합니다)
        </p>
        <Link href="/species" className="btn-secondary mt-5 text-sm">
          그동안은 도감에서 직접 찾아보기
        </Link>
      </div>

      <details className="card text-sm text-cocoa-400">
        <summary className="cursor-pointer font-semibold text-cocoa-500">관리자: 활성화 방법</summary>
        <div className="mt-2 space-y-2">
          <p>이 기능을 켜려면 다음이 필요합니다:</p>
          <ol className="list-decimal pl-5">
            <li>Anthropic API 키 또는 Google Cloud Vision 키 발급</li>
            <li>Vercel 프로젝트 → Environment Variables에 <code>ANTHROPIC_API_KEY</code> 추가</li>
            <li>이 페이지를 업로드 폼 + 서버 액션으로 교체 (별도 작업 요청)</li>
          </ol>
        </div>
      </details>
    </div>
  );
}
