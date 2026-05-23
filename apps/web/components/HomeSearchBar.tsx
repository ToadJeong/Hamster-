'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function HomeSearchBar() {
  const router = useRouter();
  const [q, setQ] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next = q.trim();
    router.push(next ? `/search?q=${encodeURIComponent(next)}` : '/search');
  }

  return (
    <form onSubmit={submit} className="flex gap-2 rounded-full border border-white/60 bg-white/80 p-1.5 shadow-soft backdrop-blur">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="햄스터 종, 가이드, 작성자 검색"
        className="flex-1 bg-transparent px-4 py-2 outline-none placeholder:text-cocoa-300"
      />
      <button type="submit" className="btn-primary px-5 py-2">검색</button>
    </form>
  );
}
