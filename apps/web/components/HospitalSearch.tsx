'use client';

import { useState } from 'react';

export function HospitalSearch() {
  const [q, setQ] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    const query = term ? `${term} 햄스터 동물병원` : '내 주변 햄스터 동물병원';
    window.open(`https://map.naver.com/p/search/${encodeURIComponent(query)}`, '_blank', 'noopener,noreferrer');
  }

  return (
    <form onSubmit={submit} className="card space-y-3">
      <label className="block">
        <span className="text-sm text-cocoa-400">지역이나 동네 이름을 입력해 보세요</span>
        <input
          className="input mt-1"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="예: 분당, 강남역, 부산 해운대"
          autoFocus
        />
      </label>
      <div className="flex justify-end">
        <button type="submit" className="btn-primary">🗺 네이버 지도에서 찾기</button>
      </div>
    </form>
  );
}
