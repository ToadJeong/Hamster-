'use client';

/**
 * 읽은 글 추적 (클라이언트).
 *  - 비회원: localStorage에만 저장
 *  - 회원: bump_view RPC가 서버 read_marks에도 기록하므로 기기 간 동기화됨.
 *          ReadStateLoader가 로그인 시 서버 read_marks를 localStorage로 끌어와 병합.
 *
 * 표시는 localStorage 기반(즉시 반영) + 서버 병합(교차 기기)로 통일.
 */

export type ReadType = 'guide' | 'community' | 'rescue' | 'announcement';

const KEY = (t: ReadType) => `hamster.read.${t}`;
const EVENT = 'hamster:read-changed';

function load(t: ReadType): Set<string> {
  try {
    const raw = localStorage.getItem(KEY(t));
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function save(t: ReadType, set: Set<string>) {
  try {
    // 최근 1000개만 유지
    const arr = Array.from(set).slice(-1000);
    localStorage.setItem(KEY(t), JSON.stringify(arr));
    window.dispatchEvent(new CustomEvent(EVENT, { detail: { type: t } }));
  } catch {}
}

export function isRead(t: ReadType, id: string): boolean {
  return load(t).has(id);
}

export function markRead(t: ReadType, id: string) {
  const set = load(t);
  if (set.has(id)) return;
  set.add(id);
  save(t, set);
}

export function mergeRead(t: ReadType, ids: string[]) {
  const set = load(t);
  let changed = false;
  for (const id of ids) {
    if (!set.has(id)) { set.add(id); changed = true; }
  }
  if (changed) save(t, set);
}

export const READ_EVENT = EVENT;
