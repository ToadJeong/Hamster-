/**
 * 클라이언트 측 비속어 필터.
 * 마이그레이션 0004의 chat_banned_words 테이블에서 가져온 목록을 사용.
 *
 * broadcast 메시지는 서버 검증이 어려우므로 첫 단계는 클라이언트 필터.
 * 우회 가능성이 있으니, 신고 기능을 함께 제공한다.
 */

export type BannedWordMatch = {
  word: string;
  index: number;
};

/** 메시지에서 금지어를 찾는다 (대소문자 무시, 공백·심볼 사이 제거 간단판) */
export function findBannedWords(message: string, words: string[]): BannedWordMatch[] {
  if (!message || words.length === 0) return [];
  // 단순 normalize: 공백/특수문자 제거, 소문자
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[\s​-‍﻿.,!?\-_*\\/'"`~()[\]{}]/g, '');

  const normMsg = normalize(message);
  const matches: BannedWordMatch[] = [];
  for (const w of words) {
    if (!w) continue;
    const nw = normalize(w);
    if (!nw) continue;
    const i = normMsg.indexOf(nw);
    if (i >= 0) matches.push({ word: w, index: i });
  }
  return matches;
}

/** 금지어를 *로 마스킹 */
export function maskBannedWords(message: string, words: string[]): string {
  let out = message;
  for (const w of words) {
    if (!w) continue;
    // 대소문자/공백 무시한 매칭은 비용이 크므로, 가장 흔한 정확/소문자 매칭만 처리
    const variants = [w, w.toLowerCase(), w.toUpperCase()];
    for (const v of variants) {
      while (out.toLowerCase().includes(v.toLowerCase())) {
        const idx = out.toLowerCase().indexOf(v.toLowerCase());
        out = out.slice(0, idx) + '*'.repeat(v.length) + out.slice(idx + v.length);
      }
    }
  }
  return out;
}
