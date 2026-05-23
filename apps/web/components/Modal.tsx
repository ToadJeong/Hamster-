'use client';

/**
 * 햄랜드 톤에 맞는 커스텀 모달 시스템.
 * window.prompt / alert / confirm 대신 사용.
 *
 * 사용법:
 *   const modal = useModal();
 *   const ok = await modal.confirm({ title: '삭제할까요?', message: '...' });
 *   if (ok) await modal.alert({ title: '삭제 완료' });
 *   const pw = await modal.prompt({ title: '비밀번호 입력', inputType: 'password' });
 */

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

type AlertOptions = { title: string; message?: string; tone?: 'info' | 'success' | 'error' };
type ConfirmOptions = AlertOptions & { confirmText?: string; cancelText?: string };
type PromptOptions = {
  title: string;
  message?: string;
  placeholder?: string;
  inputType?: 'text' | 'password' | 'email' | 'tel';
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
};

type ResolveFn = (v: any) => void;
type ModalState =
  | { kind: 'closed' }
  | { kind: 'alert';   opts: AlertOptions;   resolve: ResolveFn }
  | { kind: 'confirm'; opts: ConfirmOptions; resolve: ResolveFn }
  | { kind: 'prompt';  opts: PromptOptions;  resolve: ResolveFn };

type Ctx = {
  alert:   (opts: AlertOptions)   => Promise<void>;
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
  prompt:  (opts: PromptOptions)  => Promise<string | null>;
};

const ModalCtx = createContext<Ctx | null>(null);

export function useModal(): Ctx {
  const c = useContext(ModalCtx);
  if (!c) throw new Error('useModal must be used inside ModalProvider');
  return c;
}

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ModalState>({ kind: 'closed' });
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  function close(result: any) {
    if (state.kind !== 'closed') {
      state.resolve(result);
      setState({ kind: 'closed' });
      setInputValue('');
    }
  }

  const api: Ctx = {
    alert: (opts) =>
      new Promise<void>((resolve) => setState({ kind: 'alert', opts, resolve })),
    confirm: (opts) =>
      new Promise<boolean>((resolve) => setState({ kind: 'confirm', opts, resolve })),
    prompt: (opts) =>
      new Promise<string | null>((resolve) => {
        setInputValue(opts.defaultValue ?? '');
        setState({ kind: 'prompt', opts, resolve });
      }),
  };

  // 모달 열릴 때 input focus + Esc 처리
  useEffect(() => {
    if (state.kind === 'closed') return;
    setTimeout(() => inputRef.current?.focus(), 50);
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        close(state.kind === 'confirm' ? false : state.kind === 'prompt' ? null : undefined);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.kind]);

  return (
    <ModalCtx.Provider value={api}>
      {children}
      {state.kind !== 'closed' && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          onMouseDown={(e) => {
            // 백드롭 클릭 시 취소
            if (e.target === e.currentTarget) {
              close(state.kind === 'confirm' ? false : state.kind === 'prompt' ? null : undefined);
            }
          }}
        >
          {/* 백드롭 */}
          <div className="absolute inset-0 bg-cocoa-500/40 backdrop-blur-sm" />
          {/* 모달 박스 */}
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-sm overflow-hidden rounded-cute border border-cream-200 bg-white shadow-soft"
          >
            <div className="p-5">
              <h3 className="font-display text-lg font-bold text-cocoa-500">
                {iconFor(state)} {state.opts.title}
              </h3>
              {state.opts.message && (
                <p className="mt-2 whitespace-pre-line text-sm text-cocoa-400">
                  {state.opts.message}
                </p>
              )}
              {state.kind === 'prompt' && (
                <form
                  onSubmit={(e) => { e.preventDefault(); close(inputValue); }}
                  className="mt-3"
                >
                  <input
                    ref={inputRef}
                    type={state.opts.inputType ?? 'text'}
                    placeholder={state.opts.placeholder}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="input"
                  />
                </form>
              )}
            </div>

            <div className="flex gap-2 border-t border-cream-100 bg-cream-50 px-4 py-3">
              {(state.kind === 'confirm' || state.kind === 'prompt') && (
                <button
                  onClick={() => close(state.kind === 'confirm' ? false : null)}
                  className="flex-1 rounded-full border border-cream-200 bg-white px-4 py-2 text-sm font-semibold text-cocoa-500 hover:bg-cream-100"
                >
                  {state.kind === 'confirm'
                    ? (state.opts as ConfirmOptions).cancelText ?? '취소'
                    : (state.opts as PromptOptions).cancelText ?? '취소'}
                </button>
              )}
              <button
                onClick={() => close(
                  state.kind === 'alert' ? undefined :
                  state.kind === 'confirm' ? true :
                  inputValue
                )}
                className="flex-1 rounded-full bg-peach-400 px-4 py-2 text-sm font-semibold text-white shadow-soft hover:bg-peach-500"
              >
                {state.kind === 'alert'   ? '확인'
               : state.kind === 'confirm' ? ((state.opts as ConfirmOptions).confirmText ?? '확인')
                                           : ((state.opts as PromptOptions).confirmText ?? '확인')}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalCtx.Provider>
  );
}

function iconFor(s: Exclude<ModalState, { kind: 'closed' }>): string {
  if (s.kind === 'alert' && s.opts.tone === 'error') return '⚠️';
  if (s.kind === 'alert' && s.opts.tone === 'success') return '✅';
  if (s.kind === 'confirm') return '🤔';
  if (s.kind === 'prompt') return '✏️';
  return '🐹';
}
