'use client';

/**
 * 화면을 자유롭게 돌아다니는 펫 햄스터 레이어 (v2).
 *
 * 동작 규칙:
 *  - 1마리: 30% chase / 25% groom / 20% wave / 25% wander
 *  - 2마리 이상: 30%만 chase 가능, 나머지는 wander/groom/wave/sit 자유 행동
 *  - 매 5~9초마다 행동(무드) 재추첨, idle 행동(groom/wave/sit) 평균 3~4초 지속
 *
 * 인터랙션:
 *  - 햄스터 위에 마우스를 두고 클릭 → 점프 + 애교 말풍선
 *  - 만약 햄스터 바로 뒤에 button/a/input 같은 인터랙티브 요소가 있으면,
 *    클릭이 그 요소로 통과되도록 dispatchEvent로 forward (실수로 햄스터가 가려도 UI 동작 OK)
 *
 * 영속성: localStorage 'hamster.pets.v2' (구버전 v1도 마이그레이션해서 읽음)
 */

import { useEffect, useReducer, useRef, useState } from 'react';
import { PET_HAMSTER_KINDS, type PetHamster, type PetHamsterKind } from '@hamster/shared';

const STORAGE_KEY = 'hamster.pets.v2';
const STORAGE_KEY_V1 = 'hamster.pets.v1';
const HIDE_KEY = 'hamster.pets.hidden';
const MAX_PETS = 8;

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
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY_V1);
    const pets = raw ? (JSON.parse(raw) as PetHamster[]) : [];
    const hidden = localStorage.getItem(HIDE_KEY) === '1';
    return { pets, hidden };
  } catch {
    return { pets: [], hidden: false };
  }
}

type Mood = 'wander' | 'chase' | 'rest' | 'groom' | 'wave';

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
  // 여러 마리일 때 chase 가능한 햄스터 ID 30%만 선정
  const chaseIndexes = new Set<string>(
    totalCount <= 1
      ? state.pets.map((p) => p.id)
      : state.pets.slice(0, Math.max(1, Math.round(totalCount * 0.3))).map((p) => p.id)
  );

  return (
    <>
      {/* 햄스터 레이어: 부모는 클릭 통과, 자식 SVG도 통과, 중심 작은 영역만 클릭 받음 */}
      {!state.hidden && (
        <div className="pointer-events-none fixed inset-0 z-40">
          {state.pets.map((p) => (
            <PetSprite
              key={p.id}
              pet={p}
              canChase={chaseIndexes.has(p.id)}
              onMove={(x, y) => dispatch({ type: 'move', id: p.id, x, y })}
            />
          ))}
        </div>
      )}

      {/* 우상단 컨트롤 */}
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
          <div className="mt-2 w-64 rounded-cute border border-cream-200 bg-white p-3 shadow-soft">
            <p className="mb-2 text-xs font-semibold text-cocoa-500">우리집 햄스터 ({totalCount}/{MAX_PETS})</p>
            <ul className="max-h-40 space-y-1 overflow-auto">
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

            <p className="mt-3 mb-1 text-xs font-semibold text-cocoa-500">햄스터 입양하기</p>
            <div className="flex flex-wrap gap-1">
              {PET_HAMSTER_KINDS.map((k) => (
                <button
                  key={k.kind}
                  onClick={() => dispatch({ type: 'add', kind: k.kind })}
                  disabled={totalCount >= MAX_PETS}
                  style={{ background: k.color }}
                  className="rounded-full px-2.5 py-1 text-xs font-medium text-cocoa-500 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  + {k.label}
                </button>
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
  const [pos, setPos] = useState({ x: pet.x, y: pet.y });
  const [dir, setDir] = useState<1 | -1>(1);
  const [mood, setMood] = useState<Mood>('wander');
  const [cuddle, setCuddle] = useState<string | null>(null);
  const [hopping, setHopping] = useState(false);
  const cuddleTimer = useRef<number | null>(null);
  const hopTimer = useRef<number | null>(null);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const lastSaveRef = useRef<number>(Date.now());
  const containerRef = useRef<HTMLDivElement | null>(null);

  const meta = PET_HAMSTER_KINDS.find((k) => k.kind === pet.kind)!;

  // 마우스 위치 추적
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

  // 무드 결정 (canChase 여부에 따라 후보 가중치 변경)
  useEffect(() => {
    function pickMood() {
      const r = Math.random();
      if (canChase) {
        // 1마리 또는 30%에 속한 햄스터
        if (r < 0.30) return 'chase';
        if (r < 0.55) return 'wander';
        if (r < 0.75) return 'groom';
        if (r < 0.90) return 'wave';
        return 'rest';
      } else {
        // chase 없이 자유 활동
        if (r < 0.40) return 'wander';
        if (r < 0.70) return 'groom';
        if (r < 0.88) return 'wave';
        return 'rest';
      }
    }
    setMood(pickMood());
    const t = setInterval(() => setMood(pickMood()),
      5000 + Math.random() * 4000);
    return () => clearInterval(t);
  }, [canChase]);

  // 이동 루프
  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;

      setPos((prev) => {
        let { x, y } = prev;
        const mouse = mouseRef.current;

        if (mood === 'chase' && mouse) {
          const dx = mouse.x - x;
          const dy = mouse.y - y;
          const dist = Math.hypot(dx, dy);
          if (dist > 0.005) {
            const speed = 0.18 * dt;
            x += (dx / dist) * speed;
            y += (dy / dist) * speed;
            setDir(dx >= 0 ? 1 : -1);
          }
        } else if (mood === 'wander') {
          const speed = 0.07 * dt;
          const angle = (((pet.born_at + now) / 800) % (Math.PI * 2));
          x += Math.cos(angle) * speed;
          y += Math.sin(angle * 1.2) * speed * 0.5;
          setDir(Math.cos(angle) >= 0 ? 1 : -1);
        } else {
          // rest / groom / wave: 한 자리에서 살짝만 흔들림 (이동 거의 없음)
          x += (Math.random() - 0.5) * 0.0003;
          y += (Math.random() - 0.5) * 0.0003;
        }

        x = Math.max(0.03, Math.min(0.97, x));
        y = Math.max(0.1, Math.min(0.92, y));

        if (now - lastSaveRef.current > 2000) {
          onMove(x, y);
          lastSaveRef.current = now;
        }
        return { x, y };
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pet.born_at, mood, onMove]);

  // 클릭 핸들러: 햄스터 아래에 인터랙티브 요소가 있으면 그쪽으로 dispatch
  function handleClick(e: React.MouseEvent) {
    const el = containerRef.current;
    if (!el) return;

    // 햄스터를 잠깐 숨기고 elementFromPoint로 아래 요소 확인
    el.style.pointerEvents = 'none';
    const below = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    el.style.pointerEvents = '';

    const interactive = below?.closest('a, button, input, textarea, select, label, [role="button"], [role="link"]') as HTMLElement | null;
    if (interactive) {
      // 클릭 통과
      interactive.click();
      // 입력 요소면 포커스도
      if (interactive instanceof HTMLInputElement || interactive instanceof HTMLTextAreaElement) {
        interactive.focus();
      }
      return;
    }

    // 진짜 햄스터를 클릭한 경우 → 점프 + 애교
    const lines = ['🥰 안녕!', '😴 졸려요…', '🌻 좋아해요!', '🥕 당근…', '🐾 오늘도 화이팅!', '✨ 햄랜드 최고!'];
    setCuddle(lines[Math.floor(Math.random() * lines.length)]);
    setHopping(true);
    if (cuddleTimer.current) window.clearTimeout(cuddleTimer.current);
    if (hopTimer.current)    window.clearTimeout(hopTimer.current);
    cuddleTimer.current = window.setTimeout(() => setCuddle(null), 2000);
    hopTimer.current = window.setTimeout(() => setHopping(false), 700);
  }

  return (
    <div
      ref={containerRef}
      className="pet-clickable-center absolute select-none"
      style={{
        left: `${pos.x * 100}%`,
        top: `${pos.y * 100}%`,
        transform: `translate(-50%, -100%) scaleX(${dir})`,
        // 가로 60×세로 56 정도의 클릭 영역, 그 외 화면은 통과
        width: 60,
        height: 56,
        marginLeft: -30,
        marginTop: -56,
      }}
      role="button"
      aria-label={`${pet.nickname} 햄스터 (${meta.label})`}
      onClick={handleClick}
    >
      {cuddle && (
        <div
          className="pointer-events-none absolute left-1/2 top-0 whitespace-nowrap rounded-full bg-white px-3 py-1 text-xs shadow-soft pet-cuddle-pop"
          style={{ transform: `scaleX(${dir})` }}
        >
          {cuddle}
        </div>
      )}
      <CuteHamsterSvg color={meta.color} mood={mood} hopping={hopping} />
    </div>
  );
}

/* ────────────────────────────────────────────
   귀여운 chibi 햄스터 SVG
   ──────────────────────────────────────────── */
function CuteHamsterSvg({
  color,
  mood,
  hopping,
}: {
  color: string;
  mood: Mood;
  hopping: boolean;
}) {
  const lighter = shade(color, 18);
  const darker  = shade(color, -25);
  const isWalking = mood === 'wander' || mood === 'chase';
  const isGrooming = mood === 'groom';
  const isWaving   = mood === 'wave';

  const bodyAnim =
    hopping        ? 'pet-hop' :
    mood === 'rest'? 'pet-breathe' :
    isWalking      ? 'pet-walk' :
                     'pet-breathe';

  return (
    <svg
      viewBox="0 0 60 56"
      width="60"
      height="56"
      xmlns="http://www.w3.org/2000/svg"
      className={`pet-shadow ${bodyAnim}`}
      aria-hidden
    >
      {/* 그림자 (땅) */}
      <ellipse cx="30" cy="52" rx="18" ry="2.4" fill="rgba(140,106,75,0.18)" />

      {/* 다리 (걸을 때 좌우 번갈아 움직임) */}
      <g>
        <ellipse
          cx="22" cy="48" rx="5" ry="3"
          fill={darker}
          className={isWalking ? 'pet-leg-left' : ''}
          style={{ transformOrigin: '22px 45px' }}
        />
        <ellipse
          cx="38" cy="48" rx="5" ry="3"
          fill={darker}
          className={isWalking ? 'pet-leg-right' : ''}
          style={{ transformOrigin: '38px 45px' }}
        />
      </g>

      {/* 꼬리 (작은 도트) */}
      <circle cx="9" cy="34" r="2" fill={darker} />

      {/* 몸통 — 둥글둥글한 알 */}
      <ellipse cx="30" cy="32" rx="20" ry="17" fill={color} />

      {/* 배 — 살짝 밝게 */}
      <ellipse cx="30" cy="38" rx="14" ry="9" fill={lighter} opacity="0.85" />

      {/* 귀 두 개 (좌/우) — 좌우 살짝 다른 타이밍으로 까닥 */}
      <g className="pet-ear" style={{ transformOrigin: '18px 18px' }}>
        <ellipse cx="18" cy="14" rx="5" ry="6" fill={darker} />
        <ellipse cx="18" cy="14.5" rx="2.6" ry="3.4" fill="#FFC6D8" />
      </g>
      <g className="pet-ear" style={{ transformOrigin: '42px 18px', animationDelay: '1s' }}>
        <ellipse cx="42" cy="14" rx="5" ry="6" fill={darker} />
        <ellipse cx="42" cy="14.5" rx="2.6" ry="3.4" fill="#FFC6D8" />
      </g>

      {/* 얼굴 영역 (살짝 더 밝음) */}
      <ellipse cx="30" cy="26" rx="16" ry="12.5" fill={lighter} opacity="0.55" />

      {/* 눈 (둘) - 큰 동그라미 + 흰색 하이라이트 */}
      <g className="pet-blink" style={{ transformOrigin: '23px 25px' }}>
        <ellipse cx="23" cy="25" rx="2.8" ry="3.2" fill="#2E1F12" />
        <circle cx="22.3" cy="24" r="0.9" fill="#fff" />
      </g>
      <g className="pet-blink" style={{ transformOrigin: '37px 25px', animationDelay: '0.2s' }}>
        <ellipse cx="37" cy="25" rx="2.8" ry="3.2" fill="#2E1F12" />
        <circle cx="36.3" cy="24" r="0.9" fill="#fff" />
      </g>

      {/* 코 + 입 */}
      <ellipse cx="30" cy="30" rx="1.1" ry="0.9" fill="#3B2A1C" />
      <path d="M30 31 q-1.2 1.4 -2.6 0.4 M30 31 q1.2 1.4 2.6 0.4"
            stroke="#3B2A1C" strokeWidth="0.6" fill="none" strokeLinecap="round" />

      {/* 볼터치 (양쪽) — 행복할 때 살짝 부풂 */}
      <g className="pet-cheek-puff" style={{ transformOrigin: '17px 30px' }}>
        <circle cx="17" cy="30" r="2.3" fill="#FFB7C7" opacity="0.75" />
      </g>
      <g className="pet-cheek-puff" style={{ transformOrigin: '43px 30px', animationDelay: '0.8s' }}>
        <circle cx="43" cy="30" r="2.3" fill="#FFB7C7" opacity="0.75" />
      </g>

      {/* 앞발 — 평소엔 배 앞쪽에, 그루밍/애교 시 다른 위치 */}
      {/* 왼쪽 앞발 */}
      <g
        className={isGrooming ? 'pet-groom-paw' : ''}
        style={{ transformOrigin: '25px 38px' }}
      >
        <ellipse cx="25" cy="40" rx="3" ry="2.4" fill={darker} />
      </g>
      {/* 오른쪽 앞발 (애교 손 흔들기 가능) */}
      <g
        className={isWaving ? 'pet-wave-paw' : isGrooming ? 'pet-groom-paw' : ''}
        style={{ transformOrigin: '35px 38px', animationDelay: isGrooming ? '0.3s' : '0s' }}
      >
        <ellipse cx="35" cy="40" rx="3" ry="2.4" fill={darker} />
      </g>

      {/* 수염 — 매우 옅게 */}
      <g stroke="#3B2A1C" strokeWidth="0.35" opacity="0.45">
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

/** 색상 어둡게/밝게 (단순 hex 처리) */
function shade(hex: string, percent: number): string {
  const c = hex.replace('#', '');
  if (c.length !== 6) return hex;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const adjust = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v + (percent / 100) * (percent > 0 ? (255 - v) : v))));
  return '#' + [adjust(r), adjust(g), adjust(b)].map((v) => v.toString(16).padStart(2, '0')).join('');
}
