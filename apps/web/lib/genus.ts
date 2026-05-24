import type { PaletteKey } from '@/components/Hamster';

/** 진짜 햄스터 '종'(genus 단위) — 도감은 이 5종을 메인으로 보여주고, 색상/특징은 모프로 묶는다. */
export type GenusKey = 'syrian' | 'winter-white' | 'campbell' | 'roborovski' | 'chinese';

export const GENUS_ORDER: GenusKey[] = ['syrian', 'winter-white', 'campbell', 'roborovski', 'chinese'];

export const GENUS_INFO: Record<GenusKey, {
  name_ko: string;
  name_en: string;
  scientific: string;
  blurb: string;
  baseSlug: string;   // 종 개요로 사용할 대표 모프 slug
  palette: PaletteKey;
}> = {
  'syrian': {
    name_ko: '시리안 햄스터', name_en: 'Syrian Hamster', scientific: 'Mesocricetus auratus',
    blurb: '가장 대중적인 대형 햄스터. 골든·블랙·장모 등 색·모질 변이가 가장 다양하고, 단독 사육이 절대 원칙이에요.',
    baseSlug: 'golden-syrian', palette: 'goldenSyrian',
  },
  'winter-white': {
    name_ko: '윈터화이트 햄스터', name_en: 'Winter White (Djungarian)', scientific: 'Phodopus sungorus',
    blurb: '정글리안과 같은 종. 펄·사파이어·도브 등 모프가 있고, 당뇨에 취약해 저당 식단이 필수예요.',
    baseSlug: 'winter-white', palette: 'winterWhite',
  },
  'campbell': {
    name_ko: '캠벨 햄스터', name_en: 'Campbell Dwarf', scientific: 'Phodopus campbelli',
    blurb: '윈터화이트와 닮았지만 별개의 종. 영역성이 강하고 당뇨에 극도로 취약해요.',
    baseSlug: 'campbell-dwarf', palette: 'campbell',
  },
  'roborovski': {
    name_ko: '로보로브스키 햄스터', name_en: 'Roborovski', scientific: 'Phodopus roborovskii',
    blurb: '반려 햄스터 중 가장 작고 빠른 관상형. 화이트페이스·허스키 모프가 있고 수명이 가장 길어요.',
    baseSlug: 'roborovski', palette: 'roborovski',
  },
  'chinese': {
    name_ko: '중국 햄스터', name_en: 'Chinese Hamster', scientific: 'Cricetulus griseus',
    blurb: '꼬리가 긴 유일한 종. 차분하지만 점프·등반을 잘해 탈출에 주의해야 해요.',
    baseSlug: 'chinese-hamster', palette: 'chineseHamster',
  },
};

/** species slug → 5종 분류 */
export function genusForSlug(slug: string, nameKo?: string): GenusKey {
  const s = (slug + ' ' + (nameKo ?? '')).toLowerCase();
  const has = (...keys: string[]) => keys.some((k) => s.includes(k));

  if (has('winter', '윈터', 'djungarian', '정글리안', 'pearl-winter', 'dove-winter', 'satin-winter', 'sapphire', '사파이어', 'lilac', '라일락')) return 'winter-white';
  if (has('campbell', '캠벨')) return 'campbell';
  if (has('roborovski', 'robo', '로보')) return 'roborovski';
  if (has('chinese', '중국', '차이니즈', 'manchurian', '망토', '만주', '그레이')) return 'chinese';
  // 그 외(골든/블랙/크림/장모/테디/밴디드/샴/사틴/알비노/모자이크 등)는 모두 시리안
  return 'syrian';
}

/** 모프 표시용 짧은 라벨(종 접미사 제거) — 예: '골든시리안햄스터' → '골든' */
export function morphLabel(nameKo: string): string {
  return nameKo
    .replace(/햄스터$/, '')
    .replace(/(시리안|윈터화이트|정글리안|캠벨|로보로?브스키|로보|차이니즈|중국)$/u, '')
    .trim() || nameKo.replace(/햄스터$/, '');
}
