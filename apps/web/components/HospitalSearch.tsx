'use client';

import { useRef, useState } from 'react';

export function HospitalSearch() {
  const [q, setQ] = useState('');
  const linkRef = useRef<HTMLAnchorElement>(null);

  const term = q.trim();
  const query = term ? `${term} 햄스터 동물병원` : '내 주변 햄스터 동물병원';
  const url = `https://map.naver.com/p/search/${encodeURIComponent(query)}`;

  // 엔터로 제출하면 실제 링크를 클릭해 새 탭을 연다.
  // (window.open 은 일부 브라우저에서 팝업 차단으로 무반응 → 지역 버튼과 동일한 <a> 방식 사용)
  function submit(e: React.FormEvent) {
    e.preventDefault();
    linkRef.current?.click();
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
        <a
          ref={linkRef}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
        >
          🗺 네이버 지도에서 찾기
        </a>
      </div>
    </form>
  );
}
