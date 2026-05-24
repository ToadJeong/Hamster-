export type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  interest_tags: string[];
  is_admin: boolean;
  is_moderator: boolean;
  created_at: string;
};

export type Gender = 'male' | 'female' | 'other' | 'undisclosed';

/* 개인정보 (본인/관리자만 조회) */
export type ProfilePrivate = {
  id: string;
  real_name: string | null;
  birth_date: string | null;
  gender: Gender | null;
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
  | 'chat.enabled'
  | 'site.notice'
  | 'site.contact_email'
  | 'brand.site_name'
  | 'brand.user_label'
  | 'legal.privacy_html'
  | 'legal.terms_html'
  | 'legal.deletion_html';

export type SiteSettings = {
  'auth.google_enabled': boolean;
  'auth.kakao_enabled': boolean;
  'app.allow_anonymous': boolean;
  'chat.enabled': boolean;
  'site.notice': string;
  'site.contact_email': string;
  'brand.site_name': string;
  'brand.user_label': string;
  'legal.privacy_html': string;
  'legal.terms_html': string;
  'legal.deletion_html': string;
};

/* 실시간 채팅 메시지 (DB 미저장, broadcast 전용) */
export type ChatMessage = {
  id: string;            // uuid 클라 생성
  body: string;
  sender_label: string;  // 회원이면 username, 익명이면 입력 닉네임
  sender_id: string | null;     // auth user id
  sender_session: string;       // presence key
  is_admin?: boolean;
  created_at: number;    // epoch ms
};

export type PetHamsterKind =
  | 'golden' | 'black-bear' | 'banded' | 'teddy' | 'albino'
  | 'winterwhite' | 'pearl' | 'roborovski' | 'campbell' | 'chinese';

export type PetHamster = {
  id: string;
  kind: PetHamsterKind;
  nickname: string;
  // 위치는 viewport 비율(0–1)로 저장해 화면 크기가 달라져도 자연스럽게 보임
  x: number;
  y: number;
  born_at: number; // epoch ms
};

/* 공지사항 */
export type Announcement = {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

/* 커뮤니티 자유 게시판 */
export type CommunityCategory = 'free' | 'question' | 'show-off';

export type CommunityPost = {
  id: string;
  author_id: string | null;
  anonymous_nickname: string | null;
  title: string;
  body: string;
  category: CommunityCategory;
  tags: string[];
  created_at: string;
  updated_at: string;
};

/* 유기햄 구조대 */
export type RescueKind = 'available' | 'needs-home' | 'lost' | 'found';
export type RescueStatus = 'open' | 'in_progress' | 'completed' | 'closed';

export type RescuePost = {
  id: string;
  author_id: string;
  species_id: string | null;
  kind: RescueKind;
  status: RescueStatus;
  title: string;
  body: string;
  region: string | null;
  cover_url: string | null;
  contact_hint: string | null;
  age_months: number | null;
  created_at: string;
  updated_at: string;
};

export type RescuePostWithAuthor = RescuePost & {
  author_username: string | null;
  author_avatar_url: string | null;
  species_slug: string | null;
  species_name_ko: string | null;
};

/* 라운지 채팅 영구 기록 (최근 1시간 조회용) */
export type LobbyMessageRow = {
  id: string;
  sender_id: string | null;
  sender_label: string;
  sender_session: string;
  is_admin: boolean;
  body: string;
  created_at: string;
};

/* DM */
export type DMThread = {
  id: string;
  user_a: string;
  user_b: string;
  created_at: string;
  last_message_at: string;
};

export type DMMessage = {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

/* 커뮤니티 피드 */
export type CommunityPostFeed = CommunityPost & {
  author_username: string | null;
  author_avatar_url: string | null;
  tags: string[];
  like_count: number;
  comment_count: number;
};
