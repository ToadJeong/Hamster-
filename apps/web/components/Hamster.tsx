/**
 * Hamster Character Component — Hamland signature character (30 species)
 */

import * as React from 'react';

export type PaletteKey =
  | 'goldenSyrian' | 'blackSyrian' | 'creamSyrian' | 'whiteSyrian'
  | 'goldenBlack' | 'goldenSatin' | 'chocolateSyrian' | 'beigeSyrian'
  | 'longHairGolden' | 'longHairBlack' | 'bandedSyrian' | 'toiseShellSyrian'
  | 'domSpotSyrian'
  | 'winterWhite' | 'pearlWW' | 'doveWW' | 'sapphireWW' | 'lilacWW'
  | 'djungarian' | 'pearlDjungarian'
  | 'campbell' | 'whiteCampbell' | 'agoutiCampbell' | 'albinoCampbell'
  | 'yellowCampbell' | 'blackCampbell'
  | 'roborovski' | 'whiteFaceRobo' | 'huskyRobo'
  | 'chineseHamster';

export type AccessoryKey = 'seed' | 'heart' | 'zzz' | 'carrot' | 'flower';
export type PoseKey = 'sit' | 'sleep';

export interface HamsterPalette {
  body: string;
  belly: string;
  outline: string;
  innerEar: string;
  paw: string;
  name: string;
  stripe?: string;
  band?: string;
  patch?: string;
  patch2?: string;
  spots?: string;
  whiteFace?: boolean;
  mask?: boolean;
  longHair?: boolean;
  longTail?: boolean;
  satin?: boolean;
  albino?: boolean;
}

export const PALETTES: Record<PaletteKey, HamsterPalette> = {
  goldenSyrian:    { body: '#D6A576', belly: '#FBEDD0', outline: '#6E4628', innerEar: '#A07070', paw: '#E6B498', name: '골든시리안' },
  blackSyrian:     { body: '#3F352E', belly: '#E0D2BE', outline: '#1A1611', innerEar: '#8A5050', paw: '#C09080', name: '블랙시리안' },
  creamSyrian:     { body: '#EFD8A6', belly: '#FBF1D6', outline: '#A88848', innerEar: '#C28080', paw: '#F0C8B0', name: '크림시리안' },
  whiteSyrian:     { body: '#F4ECD9', belly: '#FBF6E8', outline: '#A09478', innerEar: '#C28080', paw: '#F0CFB0', name: '화이트시리안' },
  goldenBlack:     { body: '#5A3A28', belly: '#D2B289', outline: '#2A1810', innerEar: '#8A5050', paw: '#C09680', name: '골든블랙' },
  goldenSatin:     { body: '#E0AA68', belly: '#FAE6BE', outline: '#A87838', innerEar: '#C08080', paw: '#F0BC90', satin: true, name: '골든사틴' },
  longHairBlack:   { body: '#2D2620', belly: '#C9B89C', outline: '#0F0C08', innerEar: '#7A4848', paw: '#A88070', longHair: true, name: '장모블랙시리안' },
  chocolateSyrian: { body: '#704228', belly: '#E0C6A2', outline: '#321810', innerEar: '#9A5858', paw: '#C89488', name: '초콜릿시리안' },
  beigeSyrian:     { body: '#C9A878', belly: '#F0DDB8', outline: '#80603A', innerEar: '#B07878', paw: '#E0B89C', name: '베이지시리안' },
  longHairGolden:  { body: '#D6A576', belly: '#FBEDD0', outline: '#6E4628', innerEar: '#A07070', paw: '#E6B498', longHair: true, name: '장모골든시리안' },
  bandedSyrian:    { body: '#D6A576', belly: '#FBEDD0', outline: '#6E4628', innerEar: '#A07070', paw: '#E6B498', band: '#F4ECD9', name: '밴디드시리안' },
  toiseShellSyrian:{ body: '#D6A576', belly: '#FBEDD0', outline: '#6E4628', innerEar: '#A07070', paw: '#E6B498', patch: '#3F352E', patch2: '#F4ECD9', name: '토토이즈셸' },
  domSpotSyrian:   { body: '#F4ECD9', belly: '#FBF6E8', outline: '#A09478', innerEar: '#C28080', paw: '#F0CFB0', spots: '#D6A576', name: '도미넌트스팟' },

  winterWhite:     { body: '#B0B2B8', belly: '#F6F2E6', outline: '#46484E', innerEar: '#A07070', paw: '#E0B098', stripe: '#5E626A', name: '윈터화이트' },
  pearlWW:         { body: '#E2DED2', belly: '#FBF8EE', outline: '#807A6E', innerEar: '#C28080', paw: '#E8C0A0', stripe: '#8E8878', name: '펄윈터화이트' },
  doveWW:          { body: '#AC9CAC', belly: '#EDE6E8', outline: '#5E4E5E', innerEar: '#A07070', paw: '#DEB098', stripe: '#705870', name: '도브윈터화이트' },
  sapphireWW:      { body: '#90A0B4', belly: '#E2E6EC', outline: '#465668', innerEar: '#A07070', paw: '#D8AC98', stripe: '#566A7E', name: '사파이어윈터화이트' },
  lilacWW:         { body: '#BAACBC', belly: '#EFE6EC', outline: '#665468', innerEar: '#B07878', paw: '#E0B0B8', stripe: '#7E6E80', name: '라일락윈터화이트' },

  djungarian:      { body: '#A89678', belly: '#F0E6CE', outline: '#4E3A20', innerEar: '#A07070', paw: '#DEB098', stripe: '#3E3018', name: '정글리안' },
  pearlDjungarian: { body: '#D8CEB8', belly: '#F8F2DE', outline: '#7C6E50', innerEar: '#C28080', paw: '#E8C8A8', stripe: '#5C4E32', name: '펄정글리안' },

  campbell:        { body: '#BC9676', belly: '#EFDBB4', outline: '#4E3520', innerEar: '#A07070', paw: '#E6AC92', stripe: '#5C3E22', name: '캠벨' },
  whiteCampbell:   { body: '#F5EFE2', belly: '#FBF6E8', outline: '#A89C84', innerEar: '#C28080', paw: '#F0CFB0', name: '화이트캠벨' },
  agoutiCampbell:  { body: '#A88E6C', belly: '#E5D5B0', outline: '#4A361C', innerEar: '#A07070', paw: '#DCAC92', stripe: '#3E2E18', name: '아구티캠벨' },
  albinoCampbell:  { body: '#FBF6E8', belly: '#FFFCF2', outline: '#A89A78', innerEar: '#E08080', paw: '#F0C8B0', albino: true, name: '알비노캠벨' },
  yellowCampbell:  { body: '#E8C878', belly: '#FAE8B0', outline: '#8E7028', innerEar: '#C08080', paw: '#F0BC90', name: '옐로우캠벨' },
  blackCampbell:   { body: '#322820', belly: '#D5C2A2', outline: '#0C0806', innerEar: '#8A5050', paw: '#B8907C', name: '블랙캠벨' },

  roborovski:      { body: '#D6A672', belly: '#FBEDD0', outline: '#7C5828', innerEar: '#A07070', paw: '#E6B498', whiteFace: true, name: '로보로프스키' },
  whiteFaceRobo:   { body: '#F2EAD2', belly: '#FBF5E2', outline: '#A89A78', innerEar: '#C28080', paw: '#F0C8B0', name: '화이트페이스로보' },
  huskyRobo:       { body: '#AC9E84', belly: '#F5EFD8', outline: '#5E4E36', innerEar: '#A07070', paw: '#DEB098', mask: true, name: '허스키로보' },

  chineseHamster:  { body: '#A88870', belly: '#E0D0AE', outline: '#46321E', innerEar: '#A07070', paw: '#DCAA92', stripe: '#322218', longTail: true, name: '차이니즈햄스터' },
};

export interface HamsterProps {
  palette?: PaletteKey;
  accessory?: AccessoryKey;
  pose?: PoseKey;
  size?: number | string;
  className?: string;
}

// clipPath/gradient 모양은 모든 인스턴스가 동일하므로 상수 id를 공유한다.
// (훅을 쓰지 않아 서버·클라이언트 컴포넌트 양쪽에서 안전하게 렌더된다)
const BODY_CLIP_ID = 'hl-hamster-body-clip';
const SATIN_GRAD_ID = 'hl-hamster-satin-grad';

export function Hamster({
  palette = 'goldenSyrian',
  accessory,
  pose = 'sit',
  size,
  className,
}: HamsterProps) {
  const p = PALETTES[palette] ?? PALETTES.goldenSyrian;
  const bodyClip = BODY_CLIP_ID;
  const isSleep = pose === 'sleep';

  const bodyPath = `
    M 120 30
    C 90 32, 64 50, 58 78
    C 42 95, 32 130, 52 142
    C 28 175, 22 222, 60 232
    C 80 240, 160 240, 180 232
    C 218 222, 212 175, 188 142
    C 208 130, 198 95, 182 78
    C 176 50, 150 30, 120 30 Z
  `;

  const bellyPath = `
    M 120 130
    C 86 138, 70 180, 78 218
    C 86 234, 105 240, 120 240
    C 135 240, 154 234, 162 218
    C 170 180, 154 138, 120 130 Z
  `;

  const eyeFill = p.albino ? '#D14848' : p.outline;
  const eyeHi = p.albino ? '#FFB0B0' : 'white';

  const svgProps: React.SVGProps<SVGSVGElement> = {
    viewBox: '0 0 240 244',
    xmlns: 'http://www.w3.org/2000/svg',
    className,
  };
  if (size !== undefined) {
    svgProps.width = size;
    svgProps.height = size;
  }

  return (
    <svg {...svgProps}>
      <defs>
        <clipPath id={bodyClip}>
          <path d={bodyPath} />
        </clipPath>
        {p.satin && (
          <linearGradient id={SATIN_GRAD_ID} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        )}
      </defs>

      <ellipse cx="120" cy="240" rx="76" ry="4" fill="rgba(59,42,28,0.13)" />

      {p.longHair && (
        <g fill={p.body} stroke={p.outline} strokeWidth="1.6" strokeLinejoin="round" opacity="0.95">
          <path d="M 38 110 q -16 -6 -22 8 q 14 0 24 8 z" />
          <path d="M 202 110 q 16 -6 22 8 q -14 0 -24 8 z" />
          <path d="M 48 200 q -18 8 -10 24 q 12 -14 22 -16 z" />
          <path d="M 192 200 q 18 8 10 24 q -12 -14 -22 -16 z" />
        </g>
      )}

      <ellipse cx="96" cy="240" rx="13" ry="6" fill={p.paw} stroke={p.outline} strokeWidth="2" />
      <ellipse cx="144" cy="240" rx="13" ry="6" fill={p.paw} stroke={p.outline} strokeWidth="2" />

      <g transform="rotate(-14 80 40)">
        <ellipse cx="80" cy="40" rx="10" ry="12" fill={p.body} stroke={p.outline} strokeWidth="2.2" />
        <ellipse cx="80" cy="43" rx="5" ry="7.5" fill={p.innerEar} />
      </g>
      <g transform="rotate(14 160 40)">
        <ellipse cx="160" cy="40" rx="10" ry="12" fill={p.body} stroke={p.outline} strokeWidth="2.2" />
        <ellipse cx="160" cy="43" rx="5" ry="7.5" fill={p.innerEar} />
      </g>

      <path d={bodyPath} fill={p.body} stroke={p.outline} strokeWidth="2.4" strokeLinejoin="round" />

      <g clipPath={`url(#${bodyClip})`}>
        <path d={bellyPath} fill={p.belly} />

        {p.stripe && (
          <path
            d="M 120 30 C 116 50, 116 75, 120 90 C 124 75, 124 50, 120 30 Z"
            fill={p.stripe}
            opacity="0.7"
          />
        )}

        {p.band && <rect x="0" y="135" width="240" height="38" fill={p.band} />}

        {p.patch && (
          <g>
            <ellipse cx="74" cy="72" rx="28" ry="22" fill={p.patch} transform="rotate(-12 74 72)" />
            <ellipse cx="160" cy="180" rx="32" ry="26" fill={p.patch} transform="rotate(15 160 180)" />
            {p.patch2 && <ellipse cx="146" cy="60" rx="20" ry="14" fill={p.patch2} />}
          </g>
        )}

        {p.spots && (
          <g>
            <circle cx="78" cy="65" r="11" fill={p.spots} />
            <circle cx="156" cy="58" r="9" fill={p.spots} />
            <circle cx="170" cy="180" r="14" fill={p.spots} />
            <circle cx="74" cy="190" r="11" fill={p.spots} />
            <circle cx="120" cy="220" r="8" fill={p.spots} />
          </g>
        )}

        {p.mask && (
          <path
            d="M 60 80 Q 120 64, 180 80 Q 168 108, 120 100 Q 72 108, 60 80 Z"
            fill={p.outline}
            opacity="0.35"
          />
        )}

        {p.whiteFace && (
          <g fill="#FBF5E2">
            <ellipse cx="86" cy="78" rx="22" ry="16" />
            <ellipse cx="154" cy="78" rx="22" ry="16" />
            <ellipse cx="120" cy="98" rx="28" ry="14" />
          </g>
        )}

        {p.satin && (
          <ellipse cx="120" cy="80" rx="55" ry="22" fill={`url(#${SATIN_GRAD_ID})`} />
        )}

        <path
          d="M 60 95 Q 32 115, 42 145 Q 70 152, 86 132 Q 90 105, 60 95 Z"
          fill="none"
          stroke={p.outline}
          strokeWidth="1.4"
          strokeOpacity="0.5"
        />
        <path
          d="M 180 95 Q 208 115, 198 145 Q 170 152, 154 132 Q 150 105, 180 95 Z"
          fill="none"
          stroke={p.outline}
          strokeWidth="1.4"
          strokeOpacity="0.5"
        />
      </g>

      {isSleep ? (
        <g stroke={eyeFill} strokeWidth="2.8" fill="none" strokeLinecap="round">
          <path d="M 84 70 q 8 6 16 0" />
          <path d="M 140 70 q 8 6 16 0" />
        </g>
      ) : (
        <g>
          <ellipse cx="92" cy="70" rx="6.5" ry="8" fill={eyeFill} />
          <ellipse cx="148" cy="70" rx="6.5" ry="8" fill={eyeFill} />
          <circle cx="94" cy="66" r="1.6" fill={eyeHi} />
          <circle cx="150" cy="66" r="1.6" fill={eyeHi} />
        </g>
      )}

      <path d="M 113 90 Q 120 85, 127 90 Q 124 98, 120 100 Q 116 98, 113 90 Z" fill="#E08888" stroke={p.outline} strokeWidth="0.8" />

      {!isSleep && (
        <g stroke={p.outline} strokeWidth="1.6" fill="none" strokeLinecap="round">
          <path d="M 120 100 L 120 106" />
          <path d="M 120 106 q -5 4 -8 1" />
          <path d="M 120 106 q 5 4 8 1" />
        </g>
      )}

      <g stroke={p.outline} strokeWidth="1.1" strokeLinecap="round" opacity="0.65">
        <path d="M 90 96 L 52 86" />
        <path d="M 90 102 L 46 104" />
        <path d="M 150 96 L 188 86" />
        <path d="M 150 102 L 194 104" />
      </g>

      <ellipse cx="58" cy="124" rx="14" ry="7" fill="#F4A8A8" opacity="0.55" />
      <ellipse cx="182" cy="124" rx="14" ry="7" fill="#F4A8A8" opacity="0.55" />

      <g>
        <ellipse cx="100" cy="212" rx="12" ry="15" fill={p.body} stroke={p.outline} strokeWidth="2.2" />
        <ellipse cx="102" cy="222" rx="6.5" ry="4" fill={p.paw} />
        <ellipse cx="140" cy="212" rx="12" ry="15" fill={p.body} stroke={p.outline} strokeWidth="2.2" />
        <ellipse cx="138" cy="222" rx="6.5" ry="4" fill={p.paw} />
      </g>

      {p.longTail && (
        <path d="M 212 220 q 20 4 22 -12" stroke={p.body} strokeWidth="7" fill="none" strokeLinecap="round" />
      )}

      {accessory === 'seed' && (
        <g transform="translate(120 218)">
          <ellipse cx="0" cy="0" rx="8" ry="6" fill="#3B2A1C" stroke={p.outline} strokeWidth="1" transform="rotate(15)" />
          <path d="M -5 -2 L 5 -1" stroke="white" strokeWidth="0.8" opacity="0.6" />
        </g>
      )}
      {accessory === 'zzz' && (
        <g transform="translate(168 28)" fontFamily="'Nanum Pen Script', cursive" fill="#7C5E3E">
          <text x="0" y="22" fontSize="18">z</text>
          <text x="14" y="10" fontSize="22">z</text>
          <text x="28" y="-2" fontSize="28">Z</text>
        </g>
      )}
      {accessory === 'heart' && (
        <g transform="translate(170 26)">
          <path d="M 16 24 L 4 12 a 6 6 0 1 1 12 -2 a 6 6 0 1 1 12 2 Z" fill="#E08080" stroke={p.outline} strokeWidth="1" />
        </g>
      )}
      {accessory === 'carrot' && (
        <g transform="translate(94 200) rotate(-15)">
          <path d="M 0 8 L 36 4 L 12 22 Z" fill="#E89548" stroke={p.outline} strokeWidth="1.4" strokeLinejoin="round" />
          <g stroke="#7CA058" strokeWidth="2.4" fill="none" strokeLinecap="round">
            <path d="M 32 0 q 6 -8 4 -12" />
            <path d="M 36 4 q 8 -2 8 -10" />
          </g>
        </g>
      )}
      {accessory === 'flower' && (
        <g transform="translate(176 30)">
          <g fill="#F4A8A8" stroke={p.outline} strokeWidth="0.8">
            <circle cx="0" cy="0" r="6" />
            <circle cx="-6" cy="-3" r="5" />
            <circle cx="6" cy="-3" r="5" />
            <circle cx="-3" cy="6" r="5" />
            <circle cx="3" cy="6" r="5" />
          </g>
          <circle cx="0" cy="0" r="3" fill="#FBE38A" />
        </g>
      )}
    </svg>
  );
}

/** species slug/한글명 → 30종 팔레트 키 매핑 */
export function paletteForSpecies(slug: string, nameKo?: string): PaletteKey {
  const s = (slug + ' ' + (nameKo ?? '')).toLowerCase();
  const has = (...keys: string[]) => keys.some((k) => s.includes(k));

  if (has('albino', '알비노')) return 'albinoCampbell';
  if (has('roborovski-wf', 'white-face', 'whiteface', '화이트페이스')) return 'whiteFaceRobo';
  if (has('husky', '허스키')) return 'huskyRobo';
  if (has('roborovski', 'robo', '로보')) return 'roborovski';
  if (has('chinese', '중국', '차이니즈', 'manchurian', '망토', '만주')) return 'chineseHamster';
  if (has('pearl-winter', 'pearl-ww', '펄윈터', '펄 윈터')) return 'pearlWW';
  if (has('dove', '도브')) return 'doveWW';
  if (has('sapphire', '사파이어')) return 'sapphireWW';
  if (has('lilac', '라일락')) return 'lilacWW';
  if (has('satin-winter', '사틴윈터')) return 'pearlWW';
  if (has('winter', '윈터', 'siberian', '시베리안')) return 'winterWhite';
  if (has('pearl-djung', '펄정글')) return 'pearlDjungarian';
  if (has('djungarian', '정글리안')) return 'djungarian';
  if (has('albino-campbell', '알비노캠벨')) return 'albinoCampbell';
  if (has('yellow-campbell', 'yellow', '옐로우')) return 'yellowCampbell';
  if (has('agouti', '아구티')) return 'agoutiCampbell';
  if (has('white-campbell', 'campbell-wb', '화이트캠벨')) return 'whiteCampbell';
  if (has('black-campbell', '블랙캠벨')) return 'blackCampbell';
  if (has('campbell', '캠벨')) return 'campbell';
  if (has('black-bear', '블랙베어')) return 'blackSyrian';
  if (has('long-haired-black', 'longhair-black', '장모블랙', '노블랙')) return 'longHairBlack';
  if (has('black', '블랙')) return 'blackSyrian';
  if (has('long-haired', 'long-hair', 'teddy', '테디', '장모', '롱헤어')) return 'longHairGolden';
  if (has('banded', '밴디드', '판다')) return 'bandedSyrian';
  if (has('tortoise', '토토이즈', '토티')) return 'toiseShellSyrian';
  if (has('mosaic', '모자이크')) return 'domSpotSyrian';
  if (has('dominant', '도미넌트', 'spot', '스팟')) return 'domSpotSyrian';
  if (has('siamese', '샴')) return 'creamSyrian';
  if (has('cream', '크림')) return 'creamSyrian';
  if (has('chocolate', '초콜릿')) return 'chocolateSyrian';
  if (has('satin', '사틴')) return 'goldenSatin';
  if (has('light-brown', '라이트브라운', 'beige', '베이지', 'silver', '실버')) return 'beigeSyrian';
  if (has('white', '화이트')) return 'whiteSyrian';
  if (has('golden-black', '골든블랙')) return 'goldenBlack';
  return 'goldenSyrian';
}

export default Hamster;
