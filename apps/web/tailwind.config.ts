import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // 햄스터 커뮤니티 파스텔 팔레트
        peach:  { 50:'#FFF6F1', 100:'#FFE9DC', 200:'#FFD3B8', 300:'#FFB78A', 400:'#FF9966', 500:'#F37E4A' },
        cream:  { 50:'#FFFBF2', 100:'#FFF4DB', 200:'#FFE6B0', 300:'#F8D27E', 400:'#E9B85A' },
        mint:   { 50:'#F2FBF6', 100:'#DCF5E6', 200:'#B8E9CC', 300:'#87D8AA', 400:'#5FC288' },
        lilac:  { 50:'#F8F4FC', 100:'#EFE4F8', 200:'#DCC6EF', 300:'#C3A1E2', 400:'#A57DCF' },
        cocoa:  { 50:'#FAF5F0', 100:'#EFE2D3', 200:'#D7BFA3', 300:'#B89677', 400:'#8C6A4B', 500:'#5E4530' },
      },
      fontFamily: {
        sans: ['Pretendard', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['"Gowun Dodum"', 'Pretendard', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'cute': '1.25rem',
      },
      boxShadow: {
        'soft': '0 4px 20px -8px rgba(184, 150, 119, 0.25)',
        'softer': '0 2px 12px -6px rgba(184, 150, 119, 0.18)',
      },
    },
  },
  plugins: [],
};

export default config;
