/** 별나라 중심의 귀여운 별 그래픽 (SVG, 은은한 발광 + 미소). */
export function MemorialStar({ className = 'h-24 w-24' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} role="img" aria-label="별나라">
      <defs>
        <radialGradient id="memstar-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFF6D8" />
          <stop offset="55%" stopColor="#FFD98A" />
          <stop offset="100%" stopColor="#FFB06B" />
        </radialGradient>
        <linearGradient id="memstar-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFE9A8" />
          <stop offset="100%" stopColor="#FFC062" />
        </linearGradient>
      </defs>
      {/* 후광 */}
      <circle cx="60" cy="60" r="54" fill="url(#memstar-glow)" opacity="0.35" />
      {/* 별 몸체 */}
      <path
        d="M60 16 L72 47 L105 49 L79 70 L88 103 L60 84 L32 103 L41 70 L15 49 L48 47 Z"
        fill="url(#memstar-body)"
        stroke="#FFFFFF"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* 볼터치 */}
      <circle cx="48" cy="66" r="5" fill="#FFB6A3" opacity="0.8" />
      <circle cx="72" cy="66" r="5" fill="#FFB6A3" opacity="0.8" />
      {/* 눈 */}
      <circle cx="52" cy="58" r="3.4" fill="#5B4636" />
      <circle cx="68" cy="58" r="3.4" fill="#5B4636" />
      <circle cx="53.2" cy="56.8" r="1.1" fill="#fff" />
      <circle cx="69.2" cy="56.8" r="1.1" fill="#fff" />
      {/* 미소 */}
      <path d="M54 67 Q60 73 66 67" fill="none" stroke="#5B4636" strokeWidth="2.4" strokeLinecap="round" />
      {/* 반짝이 */}
      <circle cx="96" cy="34" r="2.5" fill="#fff" />
      <circle cx="24" cy="40" r="2" fill="#fff" />
      <circle cx="90" cy="86" r="1.8" fill="#fff" />
    </svg>
  );
}
