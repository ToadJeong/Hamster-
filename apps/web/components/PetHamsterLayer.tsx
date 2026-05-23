'use client';

/**
 * 화면을 자유롭게 돌아다니는 펫 햄스터 레이어.
 *
 * - SVG 캐릭터 + CSS 키프레임으로 걸음·호흡·귀 까닥·눈 깜빡임·꼬리 흔들기 애니메이션
 * - 마릿수/종류/위치는 localStorage에 저장 → 페이지 이동·새로고침에도 유지
 * - 무드: wander(산책) / chase(마우스 추적) / rest(쉬기)
 * - 클릭하면 점프 + 애교 말풍선
 * - 우상단 컨트롤: 종류 표시, 마릿수, 추가/제거 버튼, 잠시 숨김
 */

import { useEffect, useReducer, useRef, useState } from 'react';
import { PET_HAMSTER_KINDS, type PetHamster, type PetHamsterKind } from '@hamster/shared';

const STORAGE_KEY = 'hamster.pets.v1';
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
    const raw = localStorage.getItem(STORAGE_KEY);
    const pets = raw ? (JSON.parse(raw) as PetHamster[]) : [];
    const hidden = localStorage.getItem(HIDE_KEY) === '1';
    return { pets, hidden };
  } catch {
    return { pets: [], hidden: false };
  }
}

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
    } catch { /* ignore */ }
  }, [hydrated, state.pets, state.hidden]);

  if (!hydrated) return null;

  return (
    <>
      {!state.hidden && (
        <div className="pointer-events-none fixed inset-0 z-40">
          {state.pets.map((p) => (
            <PetSprite key={p.id} pet={p} onMove={(x, y) => dispatch({ type: 'move', id: p.id, x, y })} />
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
          <span className="text-cocoa-500">{state.pets.length}</span>
          {state.hidden && <span className="text-xs text-cocoa-300">·숨김</span>}
        </button>

        {open && (
          <div className="mt-2 w-64 rounded-cute border border-cream-200 bg-white p-3 shadow-soft">
            <p className="mb-2 text-xs font-semibold text-cocoa-500">우리집 햄스터 ({state.pets.length}/{MAX_PETS})</p>
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
              {state.pets.length === 0 && (
                <li className="text-center text-xs text-cocoa-300">아직 햄스터가 없어요</li>
              )}
            </ul>

            <p className="mt-3 mb-1 text-xs font-semibold text-cocoa-500">햄스터 입양하기</p>
            <div className="flex flex-wrap gap-1">
              {PET_HAMSTER_KINDS.map((k) => (
                <button
                  key={k.kind}
                  onClick={() => dispatch({ type: 'add', kind: k.kind })}
                  disabled={state.pets.length >= MAX_PETS}
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
  onMove,
}: {
  pet: PetHamster;
  onMove: (x: number, y: number) => void;
}) {
  const [pos, setPos] = useState({ x: pet.x, y: pet.y });
  const [dir, setDir] = useState<1 | -1>(1);
  const [mood, setMood] = useState<'wander' | 'chase' | 'rest'>('wander');
  const [cuddle, setCuddle] = useState<string | null>(null);
  const [hopping, setHopping] = useState(false);
  const cuddleTimer = useRef<number | null>(null);
  const hopTimer = useRef<number | null>(null);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const lastSaveRef = useRef<number>(Date.now());

  const meta = PET_HAMSTER_KINDS.find((k) => k.kind === pet.kind)!;

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

  // 무드 변경
  useEffect(() => {
    const t = setInterval(() => {
      const r = Math.random();
      setMood(r < 0.3 ? 'chase' : r < 0.45 ? 'rest' : 'wander');
    }, 4000 + Math.random() * 3000);
    return () => clearInterval(t);
  }, []);

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

        if (mood === 'rest') {
          x += (Math.random() - 0.5) * 0.0005;
          y += (Math.random() - 0.5) * 0.0005;
        } else if (mood === 'chase' && mouse) {
          const dx = mouse.x - x;
          const dy = mouse.y - y;
          const dist = Math.hypot(dx, dy);
          if (dist > 0.005) {
            const speed = 0.18 * dt;
            x += (dx / dist) * speed;
            y += (dy / dist) * speed;
            setDir(dx >= 0 ? 1 : -1);
          }
        } else {
          const speed = 0.08 * dt;
          const angle = (((pet.born_at + now) / 700) % (Math.PI * 2));
          x += Math.cos(angle) * speed;
          y += Math.sin(angle * 1.3) * speed * 0.6;
          setDir(Math.cos(angle) >= 0 ? 1 : -1);
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

  function handleClick() {
    const lines = ['🥰 안녕!', '😴 졸려요…', '🌻 좋아해요!', '🥕 당근…', '🐾 오늘도 화이팅!', '✨ 햄랜드 최고!'];
    setCuddle(lines[Math.floor(Math.random() * lines.length)]);
    setHopping(true);
    if (cuddleTimer.current) window.clearTimeout(cuddleTimer.current);
    if (hopTimer.current) window.clearTimeout(hopTimer.current);
    cuddleTimer.current = window.setTimeout(() => setCuddle(null), 2000);
    hopTimer.current = window.setTimeout(() => setHopping(false), 700);
  }

  const bodyAnimation =
    hopping ? 'pet-hop' :
    mood === 'rest'   ? 'pet-breathe' :
    mood === 'wander' ? 'pet-walk' :
                        'pet-walk'; // chase도 걸음

  return (
    <div
      className="pointer-events-auto absolute select-none"
      style={{
        left: `${pos.x * 100}%`,
        top: `${pos.y * 100}%`,
        transform: `translate(-50%, -100%) scaleX(${dir})`,
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
      <HamsterSvg color={meta.color} className={`pet-shadow ${bodyAnimation}`} />
    </div>
  );
}

/* ────────────────────────────────────────────
   SVG 햄스터 캐릭터 (둥글둥글한 옆모습)
   ──────────────────────────────────────────── */
function HamsterSvg({ color, className }: { color: string; className?: string }) {
  // ear/eye/tail은 sub-element로 분리해서 각자 애니메이션
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 56 44"
      width="56"
      height="44"
      className={className}
      aria-hidden
    >
      {/* 꼬리 */}
      <g className="pet-tail" style={{ transformOrigin: '12px 28px' }}>
        <path d="M11 28 q-3 1 -4 4" stroke={shade(color, -25)} strokeWidth="2" strokeLinecap="round" fill="none" />
      </g>

      {/* 발 */}
      <ellipse cx="20" cy="40" rx="4" ry="2" fill={shade(color, -30)} opacity="0.65" />
      <ellipse cx="36" cy="40" rx="4" ry="2" fill={shade(color, -30)} opacity="0.65" />

      {/* 몸통 (둥근 알 모양) */}
      <ellipse cx="30" cy="26" rx="20" ry="14" fill={color} />

      {/* 배 (밝게) */}
      <ellipse cx="30" cy="31" rx="13" ry="7" fill={shade(color, 12)} opacity="0.7" />

      {/* 귀 */}
      <g className="pet-ear-twitch">
        <circle cx="40" cy="13" r="4" fill={shade(color, -15)} />
        <circle cx="40" cy="13" r="2" fill={shade(color, 25)} />
      </g>
      <g className="pet-ear-twitch" style={{ animationDelay: '0.7s' }}>
        <circle cx="48" cy="16" r="3.5" fill={shade(color, -15)} />
        <circle cx="48" cy="16" r="1.7" fill={shade(color, 25)} />
      </g>

      {/* 눈 */}
      <g className="pet-blink" style={{ transformOrigin: '46px 22px' }}>
        <circle cx="46" cy="22" r="1.8" fill="#3B2A1C" />
        <circle cx="46.5" cy="21.4" r="0.6" fill="#fff" />
      </g>

      {/* 볼터치 */}
      <circle cx="50" cy="26" r="2" fill="#FFB7C7" opacity="0.6" />

      {/* 코 + 입 */}
      <circle cx="51.5" cy="24" r="0.8" fill="#3B2A1C" />
      <path d="M51 25 q-0.5 1 -1.3 1.2" stroke="#3B2A1C" strokeWidth="0.6" fill="none" strokeLinecap="round" />

      {/* 수염 */}
      <path d="M50 25 l4 -0.5" stroke="#3B2A1C" strokeWidth="0.4" opacity="0.6" />
      <path d="M50 25.5 l4 0" stroke="#3B2A1C" strokeWidth="0.4" opacity="0.6" />
      <path d="M50 26 l4 0.5" stroke="#3B2A1C" strokeWidth="0.4" opacity="0.6" />
    </svg>
  );
}

/** 색상을 어둡게/밝게 조정 (단순 hex 처리) */
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
