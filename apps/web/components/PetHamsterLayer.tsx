'use client';

/**
 * 펫 햄스터 레이어 v3
 *  - 종별 외형: 시리안/드워프 크기 차이, 등 줄(윈터화이트/중국), 화이트페이스(로보), 알비노 빨간 눈, 장모 풀, 길쭉한 몸(중국)
 *  - 두 눈은 동시에 깜빡임
 *  - 클릭 시 7가지 랜덤 반응(점프/빙글/옆구르기/누워서 발흔들기/깜짝/콧방귀/볼 부풀)
 *  - 1마리면 마우스 추적, 2+마리면 30%만 추적
 *  - 위에 버튼/링크/입력창이 있으면 클릭이 통과됨
 *  - localStorage v3에 저장 (v1/v2도 마이그레이션해서 읽음)
 */

import { useEffect, useReducer, useRef, useState } from 'react';
import {
  PET_HAMSTER_KINDS,
  type PetKindMeta,
  type PetHamster,
  type PetHamsterKind,
} from '@hamster/shared';

const STORAGE_KEY    = 'hamster.pets.v3';
const STORAGE_KEY_V2 = 'hamster.pets.v2';
const STORAGE_KEY_V1 = 'hamster.pets.v1';
const HIDE_KEY = 'hamster.pets.hidden';
const MAX_PETS = 10;

type State = { pets: PetHamster[]; hidden: boolean };
type Action =
  | { type: 'load'; pets: PetHamster[]; hidden: boolean }
  | { type: 'add'; kind: PetHamsterKind }
  | { type: 'remove'; id: string }
  | { type: 'move'; id: string; x: number; y: number }
  | { type: 'toggleHide' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'load': return { pets: action.pets, hidden: action.hidden };
    case 'add': {
      if (state.pets.length >= MAX_PETS) return state;
      const newPet: PetHamster = {
        id: crypto.randomUUID(),
        kind: action.kind,
        nickname: '햄찌' + Math.floor(Math.random() * 999),
        x: 0.1 + Math.random() * 0.8,
        y: 0.6 + Math.random() * 0.3,
        born_at: Date.now(),
      };
      return { ...state, pets: [...state.pets, newPet] };
    }
    case 'remove': return { ...state, pets: state.pets.filter((p) => p.id !== action.id) };
    case 'move':
      return { ...state, pets: state.pets.map((p) => p.id === action.id ? { ...p, x: action.x, y: action.y } : p) };
    case 'toggleHide': return { ...state, hidden: !state.hidden };
  }
}

function loadInitial(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
      || localStorage.getItem(STORAGE_KEY_V2)
      || localStorage.getItem(STORAGE_KEY_V1);
    let pets = raw ? (JSON.parse(raw) as PetHamster[]) : [];
    // 새 종이 추가되면서 기존 데이터의 kind가 유효한지 검증
    const validKinds = new Set(PET_HAMSTER_KINDS.map((k) => k.kind));
    pets = pets.filter((p) => validKinds.has(p.kind));
    const hidden = localStorage.getItem(HIDE_KEY) === '1';
    return { pets, hidden };
  } catch {
    return { pets: [], hidden: false };
  }
}

type Mood = 'wander' | 'chase' | 'rest' | 'groom' | 'wave';
type ClickReaction = 'hop' | 'spin' | 'roll' | 'belly' | 'startle' | 'cheek-puff' | 'wave';

export function PetHamsterLayer() {
  const [state, dispatch] = useReducer(reducer, { pets: [], hidden: false });
  const [hydrated, setHydrated] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const initial = loadInitial();
    if (initial.pets.length === 0) {
      initial.pets = [{
        id: crypto.randomUUID(),
        kind: 'golden',
        nickname: '햄찌',
        x: 0.85, y: 0.8, born_at: Date.now(),
      }];
    }
    dispatch({ type: 'load', pets: initial.pets, hidden: initial.hidden });
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.pets));
      localStorage.setItem(HIDE_KEY, state.hidden ? '1' : '0');
    } catch {}
  }, [hydrated, state.pets, state.hidden]);

  if (!hydrated) return null;

  const totalCount = state.pets.length;
  const chaseIds = new Set<string>(
    totalCount <= 1
      ? state.pets.map((p) => p.id)
      : state.pets.slice(0, Math.max(1, Math.round(totalCount * 0.3))).map((p) => p.id)
  );

  // 입양 패널: 카테고리별 그룹
  const grouped = {
    '시리안': PET_HAMSTER_KINDS.filter((k) => k.category === '시리안'),
    '드워프': PET_HAMSTER_KINDS.filter((k) => k.category === '드워프'),
  };

  return (
    <>
      {!state.hidden && (
        <div className="pointer-events-none fixed inset-0 z-40">
          {state.pets.map((p) => (
            <PetSprite
              key={p.id}
              pet={p}
              canChase={chaseIds.has(p.id)}
              onMove={(x, y) => dispatch({ type: 'move', id: p.id, x, y })}
            />
          ))}
        </div>
      )}

      <div className="fixed right-2 top-14 z-50 md:right-5 md:top-20">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 rounded-full border border-cream-200 bg-white px-2.5 py-1.5 text-sm shadow-soft hover:shadow-softer"
          aria-label="펫 햄스터 관리"
        >
          <span className="text-base">🐹</span>
          <span className="text-cocoa-500">{totalCount}</span>
          {state.hidden && <span className="text-xs text-cocoa-300">·숨김</span>}
        </button>

        {open && (
          <div className="mt-2 max-h-[70vh] w-72 overflow-auto rounded-cute border border-cream-200 bg-white p-3 shadow-soft">
            <p className="mb-2 text-xs font-semibold text-cocoa-500">우리집 햄스터 ({totalCount}/{MAX_PETS})</p>
            <ul className="max-h-32 space-y-1 overflow-auto">
              {state.pets.map((p) => {
                const meta = PET_HAMSTER_KINDS.find((k) => k.kind === p.kind)!;
                return (
                  <li key={p.id} className="flex items-center justify-between gap-2 rounded-lg bg-cream-50 px-2 py-1 text-sm">
                    <span className="flex items-center gap-1.5">
                      <span style={{ background: meta.color }} className="grid h-5 w-5 place-items-center rounded-full text-[11px]">🐹</span>
                      <span className="text-cocoa-500">{p.nickname}</span>
                      <span className="text-xs text-cocoa-300">({meta.label})</span>
                    </span>
                    <button
                      onClick={() => dispatch({ type: 'remove', id: p.id })}
                      className="text-xs text-cocoa-300 hover:text-red-400"
                      aria-label="이 햄스터 보내기"
                    >⌫</button>
                  </li>
                );
              })}
              {totalCount === 0 && (
                <li className="text-center text-xs text-cocoa-300">아직 햄스터가 없어요</li>
              )}
            </ul>

            <div className="mt-3 space-y-2">
              {(Object.keys(grouped) as Array<keyof typeof grouped>).map((cat) => (
                <div key={cat}>
                  <p className="mb-1 text-xs font-semibold text-cocoa-500">{cat} 입양하기</p>
                  <div className="flex flex-wrap gap-1">
                    {grouped[cat].map((k) => (
                      <button
                        key={k.kind}
                        onClick={() => dispatch({ type: 'add', kind: k.kind })}
                        disabled={totalCount >= MAX_PETS}
                        style={{ background: k.color, color: shadeText(k.color) }}
                        className="rounded-full border border-cream-200 px-2.5 py-1 text-xs font-medium transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        + {k.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex justify-between border-t border-cream-200 pt-2 text-xs">
              <button
                onClick={() => dispatch({ type: 'toggleHide' })}
                className="text-cocoa-400 hover:text-peach-500"
              >
                {state.hidden ? '👀 다시 보이기' : '🫥 잠시 숨기기'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ────────────────────────────────────────────
   개별 햄스터 스프라이트
   ──────────────────────────────────────────── */
function PetSprite({
  pet,
  canChase,
  onMove,
}: {
  pet: PetHamster;
  canChase: boolean;
  onMove: (x: number, y: number) => void;
}) {
  const meta = PET_HAMSTER_KINDS.find((k) => k.kind === pet.kind)!;
  const [pos, setPos] = useState({ x: pet.x, y: pet.y });
  const [dir, setDir] = useState<1 | -1>(1);
  const [mood, setMood] = useState<Mood>('wander');
  const [cuddle, setCuddle] = useState<string | null>(null);
  const [reaction, setReaction] = useState<ClickReaction | null>(null);
  const cuddleTimer = useRef<number | null>(null);
  const reactionTimer = useRef<number | null>(null);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const lastSaveRef = useRef<number>(Date.now());
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 마우스 추적
  useEffect(() => {
    function onPointer(e: PointerEvent) {
      mouseRef.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };
    }
    window.addEventListener('pointermove', onPointer, { passive: true });
    return () => window.removeEventListener('pointermove', onPointer);
  }, []);

  // 무드
  useEffect(() => {
    function pickMood(): Mood {
      const r = Math.random();
      if (canChase) {
        if (r < 0.30) return 'chase';
        if (r < 0.55) return 'wander';
        if (r < 0.75) return 'groom';
        if (r < 0.90) return 'wave';
        return 'rest';
      } else {
        if (r < 0.40) return 'wander';
        if (r < 0.70) return 'groom';
        if (r < 0.88) return 'wave';
        return 'rest';
      }
    }
    setMood(pickMood());
    const t = setInterval(() => setMood(pickMood()), 5000 + Math.random() * 4000);
    return () => clearInterval(t);
  }, [canChase]);

  // 이동
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000; last = now;
      setPos((prev) => {
        let { x, y } = prev;
        const mouse = mouseRef.current;
        if (mood === 'chase' && mouse) {
          const dx = mouse.x - x;
          const dy = mouse.y - y;
          const dist = Math.hypot(dx, dy);
          if (dist > 0.005) {
            // 로보는 가장 빠르고 시리안은 좀 느림
            const speed = (meta.size < 0.7 ? 0.22 : 0.16) * dt;
            x += (dx / dist) * speed;
            y += (dy / dist) * speed;
            setDir(dx >= 0 ? 1 : -1);
          }
        } else if (mood === 'wander') {
          const speed = (meta.size < 0.7 ? 0.10 : 0.07) * dt;
          const angle = (((pet.born_at + now) / 800) % (Math.PI * 2));
          x += Math.cos(angle) * speed;
          y += Math.sin(angle * 1.2) * speed * 0.5;
          setDir(Math.cos(angle) >= 0 ? 1 : -1);
        } else {
          x += (Math.random() - 0.5) * 0.0003;
          y += (Math.random() - 0.5) * 0.0003;
        }
        x = Math.max(0.03, Math.min(0.97, x));
        y = Math.max(0.1, Math.min(0.92, y));
        if (now - lastSaveRef.current > 2000) {
          onMove(x, y); lastSaveRef.current = now;
        }
        return { x, y };
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pet.born_at, mood, meta.size, onMove]);

  // 혼잣말 (클릭 없이 가끔 말풍선) — 햄스터마다 다른 타이밍
  useEffect(() => {
    const idleLines = [
      '🌰 배고프다…', '😪 졸려…', '🎵 룰루랄라~', '🤔 여긴 어디지?',
      '🏃 달려볼까?', '🥱 하암~', '👀 누구 없나?', '🧀 간식 어디 갔지',
      '✨ 오늘도 평화롭다', '🐾 심심해~', '💭 햄생이란…',
    ];
    let timer: number;
    const schedule = () => {
      timer = window.setTimeout(() => {
        // 점프/클릭 반응 중이 아니면 혼잣말
        setReaction((r) => r);
        setCuddle((c) => c ?? idleLines[Math.floor(Math.random() * idleLines.length)]);
        window.setTimeout(() => setCuddle(null), 2200);
        schedule();
      }, 9000 + Math.random() * 12000);
    };
    schedule();
    return () => window.clearTimeout(timer);
  }, []);

  function handleClick(e: React.MouseEvent) {
    const el = containerRef.current;
    if (!el) return;

    // 햄스터 뒤에 인터랙티브 요소가 있으면 그쪽으로 클릭 전달
    el.style.pointerEvents = 'none';
    const below = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    el.style.pointerEvents = '';
    const interactive = below?.closest('a, button, input, textarea, select, label, [role="button"], [role="link"]') as HTMLElement | null;
    if (interactive) {
      interactive.click();
      if (interactive instanceof HTMLInputElement || interactive instanceof HTMLTextAreaElement) {
        interactive.focus();
      }
      return;
    }

    // 클릭 반응 다양화
    const reactions: { r: ClickReaction; lines: string[] }[] = [
      { r: 'hop',        lines: ['🥰 안녕!', '✨ 햄랜드 최고!', '🐾 좋아요!'] },
      { r: 'spin',       lines: ['🌀 어지러워~', '💫 와아!'] },
      { r: 'roll',       lines: ['🎢 데굴데굴!', '🌪 옆굴러!'] },
      { r: 'belly',      lines: ['😴 만져 만져…', '💤 배 보여줄게요'] },
      { r: 'startle',    lines: ['😱 깜짝!', '⚡ 으악!', '🙀 놀랐어요!'] },
      { r: 'cheek-puff', lines: ['🥜 우물우물', '🌻 씨앗 줘요?'] },
      { r: 'wave',       lines: ['👋 반가워요!', '🤗 같이 놀아요!'] },
    ];
    const pick = reactions[Math.floor(Math.random() * reactions.length)];
    const line = pick.lines[Math.floor(Math.random() * pick.lines.length)];
    setReaction(pick.r);
    setCuddle(line);
    if (cuddleTimer.current) clearTimeout(cuddleTimer.current);
    if (reactionTimer.current) clearTimeout(reactionTimer.current);
    cuddleTimer.current = window.setTimeout(() => setCuddle(null), 2000);
    reactionTimer.current = window.setTimeout(() => setReaction(null), 1400);
  }

  // 기본 몸 애니메이션 (걷기/호흡)
  const baseAnim =
    mood === 'rest'   ? 'pet-breathe' :
    mood === 'wander' ? 'pet-walk' :
    mood === 'chase'  ? 'pet-walk' : 'pet-breathe';

  // 클릭 반응이 우선
  const animClass =
    reaction === 'hop'     ? 'pet-hop' :
    reaction === 'spin'    ? 'pet-spin' :
    reaction === 'roll'    ? 'pet-roll' :
    reaction === 'belly'   ? 'pet-belly' :
    reaction === 'startle' ? 'pet-startle' :
                              baseAnim;

  const scale = meta.size * 1.35; // 전체적으로 더 크게

  return (
    <div
      ref={containerRef}
      className="pet-clickable-center absolute select-none"
      style={{
        left: `${pos.x * 100}%`,
        top: `${pos.y * 100}%`,
        transform: 'translate(-50%, -100%)',
        width:  60 * scale,
        height: 56 * scale,
        marginLeft: -30 * scale,
        marginTop:  -56 * scale,
      }}
      role="button"
      aria-label={`${pet.nickname} 햄스터 (${meta.label})`}
      onClick={handleClick}
    >
      {/* 말풍선은 좌우반전 밖에 둬서 글씨가 항상 똑바로 보이게 */}
      {cuddle && (
        <div className="pointer-events-none absolute left-1/2 top-0 z-10 whitespace-nowrap rounded-full bg-white px-3 py-1 text-xs shadow-soft pet-cuddle-pop">
          {cuddle}
        </div>
      )}
      {/* 좌우반전은 햄스터 그림에만 적용 */}
      <div style={{ transform: `scaleX(${dir})`, width: '100%', height: '100%' }}>
        <CuteHamsterSvg meta={meta} mood={mood} reaction={reaction} animClass={animClass} />
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   귀여운 chibi 햄스터 SVG (종별 외형 차별화)
   ──────────────────────────────────────────── */
function CuteHamsterSvg({
  meta,
  mood,
  reaction,
  animClass,
}: {
  meta: PetKindMeta;
  mood: Mood;
  reaction: ClickReaction | null;
  animClass: string;
}) {
  const isLong   = meta.bodyShape === 'long';
  const isTiny   = meta.bodyShape === 'tiny';
  const isWalking = (mood === 'wander' || mood === 'chase') && !reaction;
  const isGrooming = mood === 'groom' && !reaction;
  const isWaving   = (mood === 'wave' && !reaction) || reaction === 'wave';

  const eyeFill = meta.eyeColor ?? '#2E1F12';
  const darker  = meta.earColor;
  const lighter = meta.belly;

  // 중국햄스터는 가로로 길쭉, 로보는 작고 동그란 비율
  const bodyRx = isLong ? 22 : isTiny ? 17 : 20;
  const bodyRy = isLong ? 13 : isTiny ? 14 : 17;
  const headOffsetX = isLong ? 12 : 0;     // 긴 몸일 때 머리가 한쪽에 치우침

  return (
    <svg
      viewBox="0 0 60 56"
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      className={`pet-shadow ${animClass}`}
      aria-hidden
    >
      {/* 그림자 */}
      <ellipse cx="30" cy="52" rx={18 * (meta.size)} ry="2.4" fill="rgba(140,106,75,0.22)" />

      {/* 다리 — 걸을 때만 좌우 흔들림 */}
      <g>
        <ellipse cx="22" cy="48" rx="5" ry="3" fill={darker}
          className={isWalking ? 'pet-leg-left' : ''}
          style={{ transformOrigin: '22px 45px' }} />
        <ellipse cx="38" cy="48" rx="5" ry="3" fill={darker}
          className={isWalking ? 'pet-leg-right' : ''}
          style={{ transformOrigin: '38px 45px' }} />
      </g>

      {/* 꼬리 (긴 몸이면 꼬리도 더 길게) */}
      {isLong ? (
        <path d="M9 34 q-6 -2 -8 4" stroke={darker} strokeWidth="2" strokeLinecap="round" fill="none" />
      ) : (
        <circle cx="9" cy="34" r="2" fill={darker} />
      )}

      {/* 몸통 */}
      <ellipse cx={30 - headOffsetX/2} cy="32" rx={bodyRx} ry={bodyRy} fill={meta.color} />

      {/* 등 줄무늬 (윈터화이트, 중국) */}
      {meta.stripe && (
        <path
          d={isLong
            ? `M${10} 22 L${50} 22`
            : `M${30 - bodyRx + 4} 20 L${30 - bodyRx/2} 16 L${30} 14 L${30 + bodyRx/2} 16 L${30 + bodyRx - 4} 20`
          }
          stroke={shadeRaw(meta.color, -45)}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      )}

      {/* 배 — 살짝 밝게 */}
      <ellipse cx={30 - headOffsetX/2} cy="38" rx={bodyRx - 6} ry={bodyRy - 8} fill={lighter} opacity="0.85" />

      {/* 밴디드 흰띠 */}
      {meta.kind === 'banded' && (
        <ellipse cx="30" cy="34" rx="18" ry="6" fill="#FFFAF1" />
      )}

      {/* 장모(테디) 풀풀한 느낌 */}
      {meta.kind === 'teddy' && (
        <>
          <circle cx="14" cy="34" r="3" fill={meta.color} />
          <circle cx="46" cy="34" r="3" fill={meta.color} />
          <circle cx="20" cy="42" r="2.5" fill={meta.color} />
          <circle cx="40" cy="42" r="2.5" fill={meta.color} />
        </>
      )}

      {/* 화이트페이스 (로보) */}
      {meta.whiteFace && (
        <ellipse cx="30" cy="26" rx="14" ry="10" fill="#FFFAF0" />
      )}

      {/* 귀 (좌우 동시) */}
      <g className="pet-ear" style={{ transformOrigin: '18px 18px' }}>
        <ellipse cx="18" cy="14" rx="5" ry="6" fill={darker} />
        <ellipse cx="18" cy="14.5" rx="2.6" ry="3.4" fill={meta.earInner} />
      </g>
      <g className="pet-ear" style={{ transformOrigin: '42px 18px' }}>
        <ellipse cx="42" cy="14" rx="5" ry="6" fill={darker} />
        <ellipse cx="42" cy="14.5" rx="2.6" ry="3.4" fill={meta.earInner} />
      </g>

      {/* 얼굴 (살짝 밝은 영역) */}
      <ellipse cx="30" cy="26" rx="16" ry="12.5" fill={lighter} opacity="0.4" />

      {/* 눈 — 양쪽 동시 깜빡임 (같은 클래스 + 같은 delay 0) */}
      <g className="pet-blink" style={{ transformOrigin: '30px 25px' }}>
        <ellipse cx="23" cy="25" rx="2.8" ry="3.2" fill={eyeFill} />
        <circle cx="22.3" cy="24" r="0.9" fill="#fff" />
        <ellipse cx="37" cy="25" rx="2.8" ry="3.2" fill={eyeFill} />
        <circle cx="36.3" cy="24" r="0.9" fill="#fff" />
      </g>

      {/* 코 + 입 */}
      <ellipse cx="30" cy="30" rx="1.1" ry="0.9" fill="#3B2A1C" />
      <path d="M30 31 q-1.2 1.4 -2.6 0.4 M30 31 q1.2 1.4 2.6 0.4"
            stroke="#3B2A1C" strokeWidth="0.6" fill="none" strokeLinecap="round" />

      {/* 볼터치 — cheek-puff 반응 시 더 크게 부풂 */}
      <g className={reaction === 'cheek-puff' ? 'pet-cheek-puff' : ''} style={{ transformOrigin: '17px 30px' }}>
        <circle cx="17" cy="30" r={reaction === 'cheek-puff' ? 3.5 : 2.3} fill="#FFB7C7" opacity="0.78" />
      </g>
      <g className={reaction === 'cheek-puff' ? 'pet-cheek-puff' : ''} style={{ transformOrigin: '43px 30px' }}>
        <circle cx="43" cy="30" r={reaction === 'cheek-puff' ? 3.5 : 2.3} fill="#FFB7C7" opacity="0.78" />
      </g>

      {/* 앞발 — 그루밍/애교 손 */}
      <g className={isGrooming ? 'pet-groom-paw' : ''} style={{ transformOrigin: '25px 38px' }}>
        <ellipse cx="25" cy="40" rx="3" ry="2.4" fill={darker} />
      </g>
      <g className={isWaving ? 'pet-wave-paw' : isGrooming ? 'pet-groom-paw' : ''} style={{ transformOrigin: '35px 38px' }}>
        <ellipse cx="35" cy="40" rx="3" ry="2.4" fill={darker} />
      </g>

      {/* 수염 */}
      <g stroke="#3B2A1C" strokeWidth="0.35" opacity="0.5">
        <path d="M14 28 l3 0.5" />
        <path d="M14 30 l3 0" />
        <path d="M14 32 l3 -0.5" />
        <path d="M46 28 l-3 0.5" />
        <path d="M46 30 l-3 0" />
        <path d="M46 32 l-3 -0.5" />
      </g>
    </svg>
  );
}

/** 색상을 어둡게/밝게 (hex) */
function shadeRaw(hex: string, percent: number): string {
  const c = hex.replace('#', '');
  if (c.length !== 6) return hex;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const adjust = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v + (percent / 100) * (percent > 0 ? (255 - v) : v))));
  return '#' + [adjust(r), adjust(g), adjust(b)].map((v) => v.toString(16).padStart(2, '0')).join('');
}

/** 배경 색에 따라 흰 또는 진한 갈색 텍스트 결정 */
function shadeText(bg: string): string {
  const c = bg.replace('#', '');
  if (c.length !== 6) return '#5E4530';
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.65 ? '#5E4530' : '#FFFFFF';
}
