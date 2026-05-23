export type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  is_admin: boolean;
  created_at: string;
};

export type Species = {
  id: string;
  slug: string;
  name_ko: string;
  name_en: string | null;
  scientific_name: string | null;
  size_cm: string | null;
  lifespan_years: string | null;
  temperament: string | null;
  origin: string | null;
  image_url: string | null;
  summary: string;
  description: string;
  care_tips: string | null;
  created_at: string;
  updated_at: string;
};

export type Guide = {
  id: string;
  author_id: string | null;
  anonymous_nickname: string | null;
  species_id: string | null;
  title: string;
  body: string;
  cover_url: string | null;
  created_at: string;
  updated_at: string;
};

export type GuideWithCounts = Omit<Guide, 'author_id'> & {
  author_id: string | null;
  author_username: string | null; // 회원이면 profiles.username, 익명이면 anonymous_nickname
  author_avatar_url: string | null;
  species_slug: string | null;
  species_name_ko: string | null;
  like_count: number;
  comment_count: number;
};

export type Comment = {
  id: string;
  guide_id: string;
  author_id: string | null;
  anonymous_nickname: string | null;
  body: string;
  created_at: string;
};

export type CommentWithAuthor = Comment & {
  author: Pick<Profile, 'username' | 'avatar_url'> | null;
};

export type SiteSettingKey =
  | 'auth.google_enabled'
  | 'auth.kakao_enabled'
  | 'app.allow_anonymous'
  | 'site.notice'
  | 'site.contact_email'
  | 'legal.privacy_html'
  | 'legal.terms_html'
  | 'legal.deletion_html';

export type SiteSettings = {
  'auth.google_enabled': boolean;
  'auth.kakao_enabled': boolean;
  'app.allow_anonymous': boolean;
  'site.notice': string;
  'site.contact_email': string;
  'legal.privacy_html': string;
  'legal.terms_html': string;
  'legal.deletion_html': string;
};
