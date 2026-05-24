import type { ReactNode } from 'react';

/**
 * 종별 특징을 반영한 정적 햄스터 일러스트.
 * 실사진(image_url)이 없을 때 도감/카드의 빈 자리를 채운다.
 */

export type HamsterVisual = {
  color: string;
  belly: string;
  ear: string;
  earInner: string;
  eyeColor?: string;   // 알비노 빨간 눈
  stripe?: boolean;    // 등 줄무늬 (윈터화이트/중국)
  whiteFace?: boolean; // 로보 화이트페이스
  longHair?: boolean;  // 장모
  band?: boolean;      // 밴디드 흰 띠
  long?: boolean;      // 중국햄 길쭉
};

/** 종 slug/이름으로 외형 추론 */
export function visualForSpecies(slug: string, nameKo?: string): HamsterVisual {
  const s = (slug + ' ' + (nameKo ?? '')).toLowerCase();
  const has = (...keys: string[]) => keys.some((k) => s.includes(k));

  // 알비노
  if (has('albino', '알비노')) {
    return { color: '#FFFCF5', belly: '#FFFFFF', ear: '#FFE0E8', earInner: '#FFB7C7', eyeColor: '#D63B45' };
  }
  // 로보로브스키
  if (has('roborovski', 'robo', '로보')) {
    return { color: '#E5C8A1', belly: '#FFFAF0', ear: '#B89569', earInner: '#FFC6D8', whiteFace: true };
  }
  // 중국햄 / 그레이햄
  if (has('chinese', 'chinese-hamster', '중국', '그레이', 'manchurian', '망토')) {
    return { color: '#A68666', belly: '#E5D2B8', ear: '#7A5F47', earInner: '#FFC6D8', stripe: true, long: true };
  }
  // 캠벨
  if (has('campbell', '캠벨', 'yellow-campbell')) {
    return { color: '#F8D27E', belly: '#FFF1C9', ear: '#D4A748', earInner: '#FFC6D8' };
  }
  // 윈터화이트 계열
  if (has('pearl', '펄')) {
    return { color: '#F2EEEB', belly: '#FFFFFF', ear: '#C9BFB7', earInner: '#FFC6D8' };
  }
  if (has('dove', '도브')) {
    return { color: '#CFC6D6', belly: '#FFFFFF', ear: '#A99FB2', earInner: '#FFC6D8', stripe: true };
  }
  if (has('winter', 'djungarian', '윈터', '정글리안', 'satin-winter')) {
    return { color: '#D9D2D4', belly: '#FFFFFF', ear: '#A6979A', earInner: '#FFC6D8', stripe: true };
  }
  // 밴디드(판다)
  if (has('banded', '밴디드', '판다')) {
    return { color: '#3B2A22', belly: '#FFFAF1', ear: '#1F1410', earInner: '#FFC6D8', band: true };
  }
  // 블랙베어 / 블랙 시리안 / 노블랙
  if (has('black-bear', '블랙베어')) {
    return { color: '#2B2018', belly: '#473529', ear: '#161009', earInner: '#FFB7C7' };
  }
  if (has('black', '블랙', 'golden-black', 'long-haired-black', '노블랙')) {
    return { color: '#3B2A22', belly: '#5C453A', ear: '#1F1410', earInner: '#FFB7C7', longHair: has('long', '노블랙', '롱') };
  }
  // 장모 / 테디
  if (has('teddy', '테디', 'long-haired-syrian', '롱헤어')) {
    return { color: '#C99B6D', belly: '#F1D9BC', ear: '#8C6A4B', earInner: '#FFC6D8', longHair: true };
  }
  // 샴 (컬러포인트)
  if (has('siamese', '샴')) {
    return { color: '#E7DAC6', belly: '#FFF6E8', ear: '#5E4530', earInner: '#FFC6D8' };
  }
  // 사틴/크림/라이트브라운/실버페어/모자이크/토토이즈쉘
  if (has('cream', '크림')) {
    return { color: '#F3DFBE', belly: '#FFF6E5', ear: '#D8B98A', earInner: '#FFC6D8' };
  }
  if (has('light-brown', '라이트브라운', 'satin', '사틴')) {
    return { color: '#D9AE7B', belly: '#F3DEC2', ear: '#B0844F', earInner: '#FFC6D8' };
  }
  if (has('silver', '실버')) {
    return { color: '#CFC6BC', belly: '#EFE9E0', ear: '#A89E92', earInner: '#FFC6D8' };
  }
  if (has('mosaic', '모자이크', 'tortoise', '토토이즈')) {
    return { color: '#E0B873', belly: '#FBEFD3', ear: '#5E4530', earInner: '#FFC6D8' };
  }
  // 기본: 골든
  return { color: '#E9B85A', belly: '#FBE7BF', ear: '#C99445', earInner: '#FFC6D8' };
}

function shade(hex: string, percent: number): string {
  const c = hex.replace('#', '');
  if (c.length !== 6) return hex;
  const r = parseInt(c.slice(0, 2), 16), g = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16);
  const adj = (v: number) => Math.max(0, Math.min(255, Math.round(v + (percent / 100) * (percent > 0 ? 255 - v : v))));
  return '#' + [adj(r), adj(g), adj(b)].map((v) => v.toString(16).padStart(2, '0')).join('');
}

/**
 * 정면 chibi 햄스터 일러스트 (정적).
 * className으로 크기 지정 (예: "h-full w-full").
 */
export function HamsterIllustration({
  visual,
  className,
  bg = true,
}: {
  visual: HamsterVisual;
  className?: string;
  bg?: boolean;
}): ReactNode {
  const { color, belly, ear, earInner, eyeColor, stripe, whiteFace, longHair, band, long } = visual;
  const bodyRx = long ? 23 : 21;
  const bodyRy = long ? 16 : 18;

  return (
    <svg viewBox="0 0 64 60" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label="햄스터 일러스트">
      {bg && <rect width="64" height="60" rx="14" fill="#FFF4DB" />}

      {/* 장모 풀풀 */}
      {longHair && (
        <g fill={color} opacity="0.95">
          <circle cx="14" cy="34" r="5" />
          <circle cx="50" cy="34" r="5" />
          <circle cx="18" cy="46" r="4" />
          <circle cx="46" cy="46" r="4" />
          <circle cx="32" cy="50" r="5" />
        </g>
      )}

      {/* 발 */}
      <ellipse cx="24" cy="50" rx="5" ry="3" fill={shade(color, -22)} />
      <ellipse cx="40" cy="50" rx="5" ry="3" fill={shade(color, -22)} />

      {/* 꼬리 (중국햄은 길게) */}
      {long
        ? <path d="M9 36 q-6 -1 -8 5" stroke={shade(color, -25)} strokeWidth="2.4" strokeLinecap="round" fill="none" />
        : <circle cx="10" cy="36" r="2.4" fill={shade(color, -25)} />}

      {/* 몸통 */}
      <ellipse cx="32" cy="34" rx={bodyRx} ry={bodyRy} fill={color} />

      {/* 등 줄무늬 */}
      {stripe && (
        <path
          d={long ? 'M12 24 L52 24' : 'M14 22 L23 16 L32 13 L41 16 L50 22'}
          stroke={shade(color, -45)} strokeWidth="2.2" fill="none" strokeLinecap="round"
        />
      )}

      {/* 배 */}
      <ellipse cx="32" cy="40" rx={bodyRx - 7} ry={bodyRy - 9} fill={belly} opacity="0.9" />
      {band && <ellipse cx="32" cy="36" rx="19" ry="6.5" fill="#FFFAF1" />}

      {/* 화이트페이스 */}
      {whiteFace && <ellipse cx="32" cy="27" rx="15" ry="11" fill="#FFFAF0" />}

      {/* 귀 */}
      <g>
        <ellipse cx="19" cy="15" rx="5.5" ry="6.5" fill={ear} />
        <ellipse cx="19" cy="15.5" rx="2.8" ry="3.6" fill={earInner} />
        <ellipse cx="45" cy="15" rx="5.5" ry="6.5" fill={ear} />
        <ellipse cx="45" cy="15.5" rx="2.8" ry="3.6" fill={earInner} />
      </g>

      {/* 얼굴 살짝 밝게 */}
      <ellipse cx="32" cy="27" rx="17" ry="13" fill={belly} opacity="0.35" />

      {/* 눈 */}
      <ellipse cx="25" cy="27" rx="3" ry="3.4" fill={eyeColor ?? '#2E1F12'} />
      <circle cx="24.2" cy="25.8" r="1" fill="#fff" />
      <ellipse cx="39" cy="27" rx="3" ry="3.4" fill={eyeColor ?? '#2E1F12'} />
      <circle cx="38.2" cy="25.8" r="1" fill="#fff" />

      {/* 코·입 */}
      <ellipse cx="32" cy="32" rx="1.3" ry="1" fill="#3B2A1C" />
      <path d="M32 33 q-1.4 1.6 -3 0.5 M32 33 q1.4 1.6 3 0.5" stroke="#3B2A1C" strokeWidth="0.7" fill="none" strokeLinecap="round" />

      {/* 볼터치 */}
      <circle cx="18" cy="32" r="2.6" fill="#FFB7C7" opacity="0.75" />
      <circle cx="46" cy="32" r="2.6" fill="#FFB7C7" opacity="0.75" />
    </svg>
  );
}
