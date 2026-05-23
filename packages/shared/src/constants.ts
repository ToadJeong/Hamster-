import type { SiteSettingKey, SiteSettings } from './types';

export const SITE_SETTING_KEYS: readonly SiteSettingKey[] = [
  'auth.google_enabled',
  'auth.kakao_enabled',
  'app.allow_anonymous',
  'chat.enabled',
  'site.notice',
  'site.contact_email',
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
  'legal.privacy_html': '',
  'legal.terms_html': '',
  'legal.deletion_html': '',
};

export const CHAT_CHANNEL = 'hamster-lobby';
export const PRESENCE_CHANNEL = 'hamster-presence';
export const MAX_CHAT_MESSAGE_LENGTH = 200;

export const PET_HAMSTER_KINDS: { kind: import('./types').PetHamsterKind; emoji: string; label: string; color: string }[] = [
  { kind: 'golden',      emoji: '🐹', label: '골든',         color: '#E9B85A' },
  { kind: 'winterwhite', emoji: '🐹', label: '윈터화이트',   color: '#E9DCE9' },
  { kind: 'roborovski',  emoji: '🐹', label: '로보로브스키', color: '#D7BFA3' },
  { kind: 'campbell',    emoji: '🐹', label: '캠벨',         color: '#F8D27E' },
  { kind: 'chinese',     emoji: '🐹', label: '중국',         color: '#B89677' },
];

export const STORAGE_BUCKETS = {
  speciesImages: 'species-images',
  guideCovers: 'guide-covers',
  avatars: 'avatars',
} as const;
