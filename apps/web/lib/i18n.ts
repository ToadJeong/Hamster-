/**
 * 경량 다국어(i18n) 토대 — 쿠키 기반 로케일(라우트 프리픽스 없음).
 *  - 서버: getLocale()(서버 전용 파일)로 쿠키를 읽어 makeT(locale) 사용
 *  - 클라이언트: <I18nProvider>가 dict를 내려주고 useT()로 사용
 *  - 사전에 없는 키는 한국어 → 키 순으로 폴백하므로, 부분 번역 상태에서도 화면이 깨지지 않는다.
 */

export const LOCALES = ['ko', 'en', 'ja', 'zh'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'ko';
export const LOCALE_COOKIE = 'hl_lang';

export const LOCALE_LABEL: Record<Locale, string> = {
  ko: '한국어', en: 'English', ja: '日本語', zh: '中文',
};
export const LOCALE_FLAG: Record<Locale, string> = {
  ko: '🇰🇷', en: '🇺🇸', ja: '🇯🇵', zh: '🇨🇳',
};

export function isLocale(v: string | undefined | null): v is Locale {
  return !!v && (LOCALES as readonly string[]).includes(v);
}

type Dict = Record<string, string>;

const ko: Dict = {
  // 네비게이션
  'nav.announcements': '공지',
  'nav.species': '도감',
  'nav.guides': '가이드',
  'nav.community': '커뮤니티',
  'nav.moments': '육아일기',
  'nav.products': '상품',
  'nav.rescue': '구조대',
  'nav.hospitals': '병원',
  'nav.identify': '사진찾기',
  'nav.home': '홈',
  'nav.profile': '내정보',
  'nav.admin': '관리',
  // 액션/공통
  'action.login': '로그인',
  'action.signup': '가입',
  'action.logout': '로그아웃',
  'action.search': '통합검색',
  'action.search.placeholder': '🔍 통합검색',
  'action.menu': '메뉴',
  'common.notifications': '알림',
  'common.messages': '쪽지',
  'common.language': '언어',
  'header.brandHome': '햄랜드 홈',
  // 푸터
  'footer.tagline': '햄집사들의 따뜻한 커뮤니티',
  'footer.terms': '이용약관',
  'footer.privacy': '개인정보처리방침',
  'footer.dataDelete': '데이터 삭제 요청',
  'footer.contact': '문의',
  'footer.disclaimer': '정보는 참고용이며, 햄스터 건강 문제는 수의사 진료를 권장해요.',
  // 홈 섹션
  'home.section.categories': '카테고리 바로가기',
  'home.section.notices': '📢 공지사항',
  'home.section.species': '🐹 햄스터 도감',
  'home.section.species.sub': '반려 햄스터 5종을 한눈에',
  'home.section.moments': '📸 육아일기',
  'home.section.moments.sub': '우리집 햄찌들의 귀여운 순간',
  'home.section.community': '💬 커뮤니티',
  'home.section.community.sub': '햄집사들의 따끈한 글',
  'home.section.rescue': '🆘 유기햄 구조대',
  'home.section.rescue.sub': '새 가족이 필요한 햄찌들',
  'home.section.guides': '📖 최신 가이드',
  'home.section.guides.sub': '햄집사들이 직접 쓴 사육 노하우',
  'home.more': '전체 보기',
  // 콘텐츠 번역 버튼
  'translate.toLang': '번역',
  'translate.show': '번역 보기',
  'translate.original': '원문 보기',
  'translate.loading': '번역 중…',
  'translate.failed': '번역을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.',
};

const en: Dict = {
  'nav.announcements': 'Notice', 'nav.species': 'Species', 'nav.guides': 'Guides',
  'nav.community': 'Community', 'nav.moments': 'Diary', 'nav.products': 'Shop',
  'nav.rescue': 'Rescue', 'nav.hospitals': 'Vets', 'nav.identify': 'Identify',
  'nav.home': 'Home', 'nav.profile': 'Me', 'nav.admin': 'Admin',
  'action.login': 'Log in', 'action.signup': 'Sign up', 'action.logout': 'Log out',
  'action.search': 'Search', 'action.search.placeholder': '🔍 Search', 'action.menu': 'Menu',
  'common.notifications': 'Notifications', 'common.messages': 'Messages', 'common.language': 'Language',
  'header.brandHome': 'Hamland home',
  'footer.tagline': 'A warm community for hamster keepers',
  'footer.terms': 'Terms', 'footer.privacy': 'Privacy',
  'footer.dataDelete': 'Delete my data', 'footer.contact': 'Contact',
  'footer.disclaimer': 'Info is for reference only; please see a vet for health concerns.',
  'home.section.categories': 'Quick links',
  'home.section.notices': '📢 Notices',
  'home.section.species': '🐹 Hamster Species', 'home.section.species.sub': 'The 5 pet hamster species at a glance',
  'home.section.moments': '📸 Diary', 'home.section.moments.sub': 'Adorable moments of our hamsters',
  'home.section.community': '💬 Community', 'home.section.community.sub': 'Fresh posts from keepers',
  'home.section.rescue': '🆘 Hamster Rescue', 'home.section.rescue.sub': 'Hamsters looking for a new family',
  'home.section.guides': '📖 Latest Guides', 'home.section.guides.sub': 'Care know-how written by keepers',
  'home.more': 'See all',
  'translate.toLang': 'Translate', 'translate.show': 'Show translation', 'translate.original': 'Show original',
  'translate.loading': 'Translating…', 'translate.failed': 'Could not load the translation. Please try again later.',
};

const ja: Dict = {
  'nav.announcements': 'お知らせ', 'nav.species': '図鑑', 'nav.guides': 'ガイド',
  'nav.community': 'コミュニティ', 'nav.moments': '育児日記', 'nav.products': 'グッズ',
  'nav.rescue': 'レスキュー', 'nav.hospitals': '病院', 'nav.identify': '写真で探す',
  'nav.home': 'ホーム', 'nav.profile': 'マイ', 'nav.admin': '管理',
  'action.login': 'ログイン', 'action.signup': '登録', 'action.logout': 'ログアウト',
  'action.search': '検索', 'action.search.placeholder': '🔍 検索', 'action.menu': 'メニュー',
  'common.notifications': '通知', 'common.messages': 'メッセージ', 'common.language': '言語',
  'header.brandHome': 'ハムランド ホーム',
  'footer.tagline': 'ハム飼いの温かいコミュニティ',
  'footer.terms': '利用規約', 'footer.privacy': 'プライバシー',
  'footer.dataDelete': 'データ削除リクエスト', 'footer.contact': 'お問い合わせ',
  'footer.disclaimer': '情報は参考用です。健康問題は獣医の診察をおすすめします。',
  'home.section.categories': 'クイックリンク',
  'home.section.notices': '📢 お知らせ',
  'home.section.species': '🐹 ハムスター図鑑', 'home.section.species.sub': '飼えるハムスター5種を一覧で',
  'home.section.moments': '📸 育児日記', 'home.section.moments.sub': 'うちのハムの可愛い瞬間',
  'home.section.community': '💬 コミュニティ', 'home.section.community.sub': '飼い主たちの新着投稿',
  'home.section.rescue': '🆘 ハムスターレスキュー', 'home.section.rescue.sub': '新しい家族を待つ子たち',
  'home.section.guides': '📖 最新ガイド', 'home.section.guides.sub': '飼い主が書いた飼育ノウハウ',
  'home.more': 'すべて見る',
  'translate.toLang': '翻訳', 'translate.show': '翻訳を表示', 'translate.original': '原文を表示',
  'translate.loading': '翻訳中…', 'translate.failed': '翻訳を読み込めませんでした。後ほど再試行してください。',
};

const zh: Dict = {
  'nav.announcements': '公告', 'nav.species': '图鉴', 'nav.guides': '指南',
  'nav.community': '社区', 'nav.moments': '养育日记', 'nav.products': '商品',
  'nav.rescue': '救助', 'nav.hospitals': '医院', 'nav.identify': '拍照识别',
  'nav.home': '首页', 'nav.profile': '我的', 'nav.admin': '管理',
  'action.login': '登录', 'action.signup': '注册', 'action.logout': '退出',
  'action.search': '搜索', 'action.search.placeholder': '🔍 搜索', 'action.menu': '菜单',
  'common.notifications': '通知', 'common.messages': '私信', 'common.language': '语言',
  'header.brandHome': '仓鼠乐园 首页',
  'footer.tagline': '仓鼠铲屎官的温暖社区',
  'footer.terms': '服务条款', 'footer.privacy': '隐私政策',
  'footer.dataDelete': '删除我的数据', 'footer.contact': '联系',
  'footer.disclaimer': '信息仅供参考，健康问题请咨询兽医。',
  'home.section.categories': '快捷入口',
  'home.section.notices': '📢 公告',
  'home.section.species': '🐹 仓鼠图鉴', 'home.section.species.sub': '一览5种宠物仓鼠',
  'home.section.moments': '📸 养育日记', 'home.section.moments.sub': '自家仓鼠的可爱瞬间',
  'home.section.community': '💬 社区', 'home.section.community.sub': '铲屎官们的最新帖子',
  'home.section.rescue': '🆘 仓鼠救助', 'home.section.rescue.sub': '等待新家庭的仓鼠',
  'home.section.guides': '📖 最新指南', 'home.section.guides.sub': '铲屎官亲笔的饲养经验',
  'home.more': '查看全部',
  'translate.toLang': '翻译', 'translate.show': '显示翻译', 'translate.original': '显示原文',
  'translate.loading': '翻译中…', 'translate.failed': '无法加载翻译，请稍后再试。',
};

export const DICT: Record<Locale, Dict> = { ko, en, ja, zh };

/** 사전에 없으면 한국어 → 키 순으로 폴백 */
export function makeT(locale: Locale) {
  const base = DICT[locale] ?? DICT.ko;
  return (key: string, fallback?: string): string => base[key] ?? DICT.ko[key] ?? fallback ?? key;
}

export type TFn = ReturnType<typeof makeT>;
