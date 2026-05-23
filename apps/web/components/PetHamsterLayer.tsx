'use client';

/**
 * 화면을 자유롭게 돌아다니는 펫 햄스터 레이어.
 *
 * - 마릿수/종류/위치는 localStorage(`hamster.pets.v1`)에 저장 → 페이지 이동·새로고침에도 유지
 * - 마우스를 가끔(약 30% 확률) 추적, 평소엔 랜덤 산책
 * - 클릭하면 점프하며 애교 (말풍선)
 * - 우상단 컨트롤: 종류 표시, 마릿수, 추가/제거 버튼
 * - pointer-events: 햄스터 자체는 받지만, 화면을 가리지 않도록 옵션 제공
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

  // 마운트 시 localStorage에서 로드
  useEffect(() => {
    const initial = loadInitial();
    if (initial.pets.length === 0) {
      // 첫 방문: 골든 1마리 자동 입주
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

  // 변경 시 저장
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
      {/* 펫 레이어 (전체 화면) */}
      {!state.hidden && (
        <div className="pointer-events-none fixed inset-0 z-40">
          {state.pets.map((p) => (
            <PetSprite
              key={p.id}
              pet={p}
              onMove={(x, y) => dispatch({ type: 'move', id: p.id, x, y })}
            />
          ))}
        </div>
      )}

      {/* 우상단 컨트롤 */}
      <div className="fixed right-3 top-16 z-50 md:right-5 md:top-20">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 rounded-full border border-cream-200 bg-white px-3 py-1.5 text-sm shadow-soft hover:shadow-softer"
          aria-label="펫 햄스터 관리"
        >
          <span className="text-base">🐹</span>
          <span className="text-cocoa-500">{state.pets.length}마리</span>
          {state.hidden && <span className="badge bg-cocoa-100 text-cocoa-400">숨김</span>}
        </button>

        {open && (
          <div className="mt-2 w-64 rounded-cute border border-cream-200 bg-white p-3 shadow-soft">
            <p className="mb-2 text-xs font-semibold text-cocoa-500">우리집 햄스터들 ({state.pets.length}/{MAX_PETS})</p>
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
                    >
                      ⌫
                    </button>
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

/** 개별 햄스터 스프라이트: 이동 / 마우스 추적 / 클릭 애교 */
function PetSprite({
  pet,
  onMove,
}: {
  pet: PetHamster;
  onMove: (x: number, y: number) => void;
}) {
  const [pos, setPos] = useState({ x: pet.x, y: pet.y });
  const [dir, setDir] = useState<1 | -1>(1); // 1: →, -1: ←
  const [cuddle, setCuddle] = useState<string | null>(null);
  const cuddleTimer = useRef<number | null>(null);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const moodRef = useRef<'wander' | 'chase' | 'rest'>('wander');
  const lastSaveRef = useRef<number>(Date.now());

  const meta = PET_HAMSTER_KINDS.find((k) => k.kind === pet.kind)!;

  // 마우스 위치 추적 (화면 비율로 정규화)
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

  // 무드 변경 (랜덤): chase 30% / rest 15% / wander 55%
  useEffect(() => {
    const t = setInterval(() => {
      const r = Math.random();
      moodRef.current = r < 0.3 ? 'chase' : r < 0.45 ? 'rest' : 'wander';
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
        const mood = moodRef.current;
        const mouse = mouseRef.current;

        if (mood === 'rest') {
          // 쉬는 중: 살짝 흔들리기만
          x += (Math.random() - 0.5) * 0.0005;
          y += (Math.random() - 0.5) * 0.0005;
        } else if (mood === 'chase' && mouse) {
          // 마우스 추적
          const dx = mouse.x - x;
          const dy = mouse.y - y;
          const dist = Math.hypot(dx, dy);
          if (dist > 0.005) {
            const speed = 0.18 * dt; // 화면 비율/초
            x += (dx / dist) * speed;
            y += (dy / dist) * speed;
            setDir(dx >= 0 ? 1 : -1);
          }
        } else {
          // 산책 (베지에 같은 랜덤 워크)
          const speed = 0.08 * dt;
          const angle = (((pet.born_at + now) / 700) % (Math.PI * 2));
          x += Math.cos(angle) * speed;
          y += Math.sin(angle * 1.3) * speed * 0.6;
          setDir(Math.cos(angle) >= 0 ? 1 : -1);
        }

        // 경계 (5%~95%)
        x = Math.max(0.03, Math.min(0.97, x));
        y = Math.max(0.1, Math.min(0.92, y));

        // 매 2초마다 localStorage에 위치 저장 (state로 dispatch는 비싸니 주기적으로만)
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
  }, [pet.born_at, onMove]);

  // 클릭하면 애교
  function handleClick() {
    const lines = ['🥰 안녕!', '😴 졸려요…', '🌻 좋아해요!', '🥕 당근…', '🐾 오늘은 어떤 글 쓸까?', '✨ 햄찌랜드 최고!'];
    setCuddle(lines[Math.floor(Math.random() * lines.length)]);
    if (cuddleTimer.current) window.clearTimeout(cuddleTimer.current);
    cuddleTimer.current = window.setTimeout(() => setCuddle(null), 2200);
  }

  return (
    <div
      className="pointer-events-auto absolute select-none transition-transform"
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
          className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-3 py-1 text-xs shadow-soft"
          style={{ transform: `translate(-50%, 0) scaleX(${dir})` }}
        >
          {cuddle}
        </div>
      )}
      <div
        className="grid h-9 w-9 cursor-pointer place-items-center rounded-full shadow-soft transition-transform hover:scale-110"
        style={{ background: meta.color }}
        title={`${pet.nickname} (${meta.label})`}
      >
        <span className="text-xl leading-none">🐹</span>
      </div>
    </div>
  );
}
