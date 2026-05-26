/**
 * 활동 기반 레벨 계산 (개드립류 커뮤니티처럼).
 * 글/댓글/육아일기/가이드/구조/별빛 활동으로 포인트가 쌓이고 레벨이 오른다.
 * 별도 저장 없이 활동 개수를 합산해 계산한다.
 */

export type ActivityCounts = {
  guides: number;
  posts: number;
  comments: number;
  moments: number;
  rescues: number;
  tributes: number;
};

export const POINT_WEIGHTS: Record<keyof ActivityCounts, number> = {
  guides: 10,
  posts: 5,
  moments: 4,
  rescues: 8,
  comments: 2,
  tributes: 1,
};

export function computePoints(c: ActivityCounts): number {
  return (
    c.guides * POINT_WEIGHTS.guides +
    c.posts * POINT_WEIGHTS.posts +
    c.moments * POINT_WEIGHTS.moments +
    c.rescues * POINT_WEIGHTS.rescues +
    c.comments * POINT_WEIGHTS.comments +
    c.tributes * POINT_WEIGHTS.tributes
  );
}

// 귀여운 햄찌 등급 (레벨 구간별)
const TITLES = [
  '갓 태어난 핑크 햄찌',   // 1
  '솜털 햄찌',             // 2
  '볼주머니 견습생',       // 3
  '휠 도는 햄찌',          // 4
  '해바라기씨 수집가',     // 5
  '베테랑 햄집사',         // 6
  '햄스터 박사',           // 7
  '별빛 햄집사',           // 8
  '햄랜드 마스터',         // 9+
];

export type LevelInfo = {
  level: number;
  title: string;
  points: number;
  into: number;   // 현재 레벨에서 쌓은 포인트
  need: number;   // 다음 레벨까지 필요한 총량
  pct: number;    // 진행률(%)
};

/** 레벨 L 도달까지 누적: 25*L*(L-1) (레벨당 필요량 50*L 증가) */
export function computeLevel(points: number): LevelInfo {
  let level = 1;
  let acc = 0;
  while (points >= acc + 50 * level) {
    acc += 50 * level;
    level += 1;
  }
  const need = 50 * level;
  const into = points - acc;
  return {
    level,
    title: TITLES[Math.min(level - 1, TITLES.length - 1)],
    points,
    into,
    need,
    pct: Math.min(100, Math.round((into / need) * 100)),
  };
}
