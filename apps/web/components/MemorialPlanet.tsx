/** 별나라 중심의 귀여운 "행성" 그래픽 (SVG) — 고리 + 분화구 + 미소. */
export function MemorialPlanet({ className = 'h-24 w-24' }: { className?: string }) {
  return (
    <svg viewBox="0 0 140 140" className={className} role="img" aria-label="햄스터 별">
      <defs>
        <radialGradient id="planet-glow" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#FFF3DE" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#E7D4F4" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="planet-body" cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#FFE7C6" />
          <stop offset="55%" stopColor="#F7B98C" />
          <stop offset="100%" stopColor="#B98AD9" />
        </radialGradient>
        <linearGradient id="planet-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFD7A6" />
          <stop offset="50%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#D8B6F0" />
        </linearGradient>
      </defs>

      {/* 후광 */}
      <circle cx="70" cy="72" r="62" fill="url(#planet-glow)" />

      {/* 고리 (뒤쪽) */}
      <g transform="rotate(-20 70 74)">
        <ellipse cx="70" cy="74" rx="60" ry="16" fill="none" stroke="url(#planet-ring)" strokeWidth="7" opacity="0.92" />
      </g>

      {/* 행성 본체 */}
      <circle cx="70" cy="74" r="36" fill="url(#planet-body)" stroke="#FFFFFF" strokeWidth="2.5" />

      {/* 하이라이트 */}
      <ellipse cx="58" cy="60" rx="13" ry="9" fill="#FFFFFF" opacity="0.30" />
      {/* 분화구/대륙 */}
      <circle cx="86" cy="83" r="6.5" fill="#AE7FD0" opacity="0.45" />
      <circle cx="60" cy="90" r="4.5" fill="#AE7FD0" opacity="0.4" />
      <circle cx="92" cy="66" r="3.5" fill="#FFE7C6" opacity="0.6" />

      {/* 볼터치 + 얼굴 */}
      <circle cx="57" cy="78" r="5" fill="#FF9E9E" opacity="0.55" />
      <circle cx="83" cy="78" r="5" fill="#FF9E9E" opacity="0.55" />
      <circle cx="62" cy="71" r="3.2" fill="#5B4636" />
      <circle cx="78" cy="71" r="3.2" fill="#5B4636" />
      <circle cx="63" cy="69.9" r="1" fill="#fff" />
      <circle cx="79" cy="69.9" r="1" fill="#fff" />
      <path d="M64 78 Q70 83 76 78" fill="none" stroke="#5B4636" strokeWidth="2.2" strokeLinecap="round" />

      {/* 고리 (앞쪽, 행성 아래를 가로지름) */}
      <g transform="rotate(-20 70 74)">
        <path d="M14 80 A60 16 0 0 0 126 80" fill="none" stroke="url(#planet-ring)" strokeWidth="7" opacity="0.95" strokeLinecap="round" />
      </g>

      {/* 반짝이 */}
      <circle cx="116" cy="40" r="2.6" fill="#fff" />
      <circle cx="24" cy="48" r="2" fill="#fff" />
      <circle cx="110" cy="96" r="1.8" fill="#fff" />
    </svg>
  );
}
