'use client';

import { useState } from 'react';

export function IdentifyForm() {
  const [q, setQ] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    const query = term ? `햄스터 ${term}` : '햄스터 종류';
    const url = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <form onSubmit={submit} className="card space-y-3">
      <label className="block">
        <span className="text-sm text-cocoa-400">햄스터의 특징이나 추정되는 종 이름</span>
        <input
          className="input mt-1"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="예: 갈색 통통한 햄스터 / 골든 / 로보 새끼"
          autoFocus
        />
      </label>
      <div className="flex justify-end">
        <button type="submit" className="btn-primary">
          🔍 Google 이미지 검색 열기
        </button>
      </div>
    </form>
  );
}
