import type { SiteSettingKey, SiteSettings } from './types';

export const SITE_SETTING_KEYS: readonly SiteSettingKey[] = [
  'auth.google_enabled',
  'auth.kakao_enabled',
  'app.allow_anonymous',
  'chat.enabled',
  'site.notice',
  'site.contact_email',
  'brand.site_name',
  'brand.user_label',
  'legal.privacy_html',
  'legal.terms_html',
  'legal.deletion_html',
] as const;

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  'auth.google_enabled': false,
  'auth.kakao_enabled': false,
  'app.allow_anonymous': true,
  'chat.enabled': true,
  'site.notice': '',
  'site.contact_email': '',
  'brand.site_name': '햄랜드',
  'brand.user_label': '햄집사',
  'legal.privacy_html': '',
  'legal.terms_html': '',
  'legal.deletion_html': '',
};

export const RESCUE_KIND_LABEL: Record<import('./types').RescueKind, { label: string; emoji: string; color: string }> = {
  'available':  { label: '분양 가능',      emoji: '🤝', color: 'mint'  },
  'needs-home': { label: '긴급 입양처 필요', emoji: '🆘', color: 'peach' },
  'lost':       { label: '잃어버렸어요',    emoji: '😢', color: 'lilac' },
  'found':      { label: '발견했어요',      emoji: '👀', color: 'cream' },
};

export const RESCUE_STATUS_LABEL: Record<import('./types').RescueStatus, string> = {
  'open':        '진행 중',
  'in_progress': '대화 중',
  'completed':   '완료',
  'closed':      '마감',
};

export const COMMUNITY_CATEGORY_LABEL: Record<import('./types').CommunityCategory, { label: string; emoji: string }> = {
  'free':      { label: '자유',   emoji: '💬' },
  'question':  { label: '질문',   emoji: '❓' },
  'show-off':  { label: '자랑',   emoji: '✨' },
};

export const CHAT_CHANNEL = 'hamster-lobby';
export const PRESENCE_CHANNEL = 'hamster-presence';
export const MAX_CHAT_MESSAGE_LENGTH = 200;

/**
 * 펫 햄스터 종별 외형 메타데이터.
 *  - color/belly: 몸·배 색상
 *  - earColor: 귀 색깔 (어두운 종은 까만 귀)
 *  - eyeRed: 알비노류 빨간 눈
 *  - size: 1.0 기준 (시리안 = 1.0, 드워프 = 0.78, 로보 = 0.6, 중국 = 길쭉)
 *  - stripe: 등에 검은 줄 (윈터화이트/정글리안/중국)
 *  - bodyShape: 'chubby' | 'long' | 'tiny' — 비율
 */
export type PetKindMeta = {
  kind: import('./types').PetHamsterKind;
  label: string;
  category: '시리안' | '드워프';
  color: string;
  belly: string;
  earColor: string;
  earInner: string;
  eyeColor?: string;
  size: number;        // 0.6 ~ 1.0
  stripe?: boolean;
  whiteFace?: boolean; // 로보 화이트페이스 등
  bodyShape: 'chubby' | 'long' | 'tiny';
};

export const PET_HAMSTER_KINDS: PetKindMeta[] = [
  // 시리안 (대형) — 단독사육
  { kind: 'golden',     label: '골든',         category: '시리안', color: '#E9B85A', belly: '#FBE7BF', earColor: '#C99445', earInner: '#FFC6D8', size: 1.0,  bodyShape: 'chubby' },
  { kind: 'black-bear', label: '블랙베어',     category: '시리안', color: '#3B2A22', belly: '#5C453A', earColor: '#1F1410', earInner: '#FFB7C7', size: 1.0,  bodyShape: 'chubby' },
  { kind: 'banded',     label: '밴디드(판다)', category: '시리안', color: '#3B2A22', belly: '#FFFAF1', earColor: '#1F1410', earInner: '#FFC6D8', size: 1.0,  bodyShape: 'chubby' },
  { kind: 'teddy',      label: '테디베어(장모)', category: '시리안', color: '#C99B6D', belly: '#F1D9BC', earColor: '#8C6A4B', earInner: '#FFC6D8', size: 1.0,  bodyShape: 'chubby' },
  { kind: 'albino',     label: '알비노',       category: '시리안', color: '#FFFCF5', belly: '#FFFFFF', earColor: '#FFE0E8', earInner: '#FFB7C7', eyeColor: '#D63B45', size: 1.0, bodyShape: 'chubby' },
  // 드워프
  { kind: 'winterwhite', label: '윈터화이트',  category: '드워프', color: '#D9D2D4', belly: '#FFFFFF', earColor: '#A6979A', earInner: '#FFC6D8', size: 0.78, stripe: true,  bodyShape: 'chubby' },
  { kind: 'pearl',       label: '펄윈터',      category: '드워프', color: '#F2EEEB', belly: '#FFFFFF', earColor: '#C9BFB7', earInner: '#FFC6D8', size: 0.78, bodyShape: 'chubby' },
  { kind: 'roborovski',  label: '로보로브스키', category: '드워프', color: '#E5C8A1', belly: '#FFFAF0', earColor: '#B89569', earInner: '#FFC6D8', size: 0.6,  whiteFace: true, bodyShape: 'tiny' },
  { kind: 'campbell',    label: '캠벨',        category: '드워프', color: '#F8D27E', belly: '#FFF1C9', earColor: '#D4A748', earInner: '#FFC6D8', size: 0.78, bodyShape: 'chubby' },
  { kind: 'chinese',     label: '중국햄스터',  category: '드워프', color: '#A68666', belly: '#E5D2B8', earColor: '#7A5F47', earInner: '#FFC6D8', size: 0.82, stripe: true, bodyShape: 'long' },
];

export const STORAGE_BUCKETS = {
  speciesImages: 'species-images',
  guideCovers: 'guide-covers',
  avatars: 'avatars',
} as const;
