import type { SiteSettingKey, SiteSettings } from './types';

export const SITE_SETTING_KEYS: readonly SiteSettingKey[] = [
  'auth.google_enabled',
  'auth.kakao_enabled',
  'app.allow_anonymous',
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
  'site.notice': '',
  'site.contact_email': '',
  'legal.privacy_html': '',
  'legal.terms_html': '',
  'legal.deletion_html': '',
};

export const STORAGE_BUCKETS = {
  speciesImages: 'species-images',
  guideCovers: 'guide-covers',
  avatars: 'avatars',
} as const;
