import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="text-6xl">🐹</p>
      <h1 className="mt-4 font-display text-3xl font-bold text-cocoa-500">길을 잃었네요</h1>
      <p className="mt-2 text-cocoa-300">햄찌가 톱밥 속으로 사라진 것 같아요.</p>
      <div className="mt-6 flex justify-center gap-2">
        <Link href="/" className="btn-primary">홈으로</Link>
        <Link href="/species" className="btn-secondary">도감 보기</Link>
      </div>
    </div>
  );
}
