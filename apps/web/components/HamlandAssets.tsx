/**
 * Hamland Assets — Logo, Category Icons, Hero, Empty State illustration
 * All built on top of the Hamster character component.
 */

import * as React from 'react';
import { Hamster, PALETTES, type PaletteKey } from './Hamster';

/* ============================ LOGO ============================ */
export type LogoVariant = 'horizontal' | 'stacked' | 'mark';

export interface LogoWordmarkProps {
  variant?: LogoVariant;
  onDark?: boolean;
  className?: string;
}

export function LogoWordmark({ variant = 'horizontal', onDark = false, className }: LogoWordmarkProps) {
  const txt = onDark ? '#FBF5E2' : '#3B2A1C';
  const sub = onDark ? '#D4B384' : '#7C5E3E';
  const accent = '#E89595';

  if (variant === 'horizontal') {
    return (
      <svg viewBox="0 0 380 120" xmlns="http://www.w3.org/2000/svg" className={className}>
        <g transform="translate(8 4)"><svg width="112" height="112" viewBox="0 0 240 244"><Hamster palette="goldenSyrian" /></svg></g>
        <g transform="translate(132 68)" fontFamily="'Nanum Pen Script', 'Gowun Dodum', cursive" fill={txt}>
          <text x="0" y="0" fontSize="62" letterSpacing="2">햄랜드</text>
        </g>
        <g transform="translate(134 96)" fontFamily="ui-monospace, monospace" fill={sub}>
          <text x="0" y="0" fontSize="11" letterSpacing="0.22em">HAM · LAND</text>
        </g>
        <circle cx="364" cy="46" r="3.5" fill={accent} />
      </svg>
    );
  }
  if (variant === 'stacked') {
    return (
      <svg viewBox="0 0 220 280" xmlns="http://www.w3.org/2000/svg" className={className}>
        <g transform="translate(50 4)"><svg width="120" height="120" viewBox="0 0 240 244"><Hamster palette="goldenSyrian" /></svg></g>
        <g transform="translate(110 200)" textAnchor="middle" fontFamily="'Nanum Pen Script', 'Gowun Dodum', cursive" fill={txt}>
          <text fontSize="58" letterSpacing="2">햄랜드</text>
        </g>
        <g transform="translate(110 232)" textAnchor="middle" fontFamily="ui-monospace, monospace" fill={sub}>
          <text fontSize="11" letterSpacing="0.22em">HAMLAND · EST.2026</text>
        </g>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="70" cy="70" r="66"
        fill={onDark ? '#3B2A1C' : '#FBEDD0'}
        stroke={onDark ? '#5C3D2E' : '#E0A972'} strokeWidth="2.5" strokeDasharray="3 5" />
      <g transform="translate(15 18)"><svg width="110" height="112" viewBox="0 0 240 244"><Hamster palette="goldenSyrian" /></svg></g>
    </svg>
  );
}

/* ============================ CATEGORY ICON ============================ */
export type CategoryKind =
  | 'announcements' | 'species' | 'guides' | 'community'
  | 'products' | 'rescue' | 'hospitals' | 'identify';

interface HeadProps {
  cx?: number;
  cy?: number;
  r?: number;
  palette?: PaletteKey;
}

function HamsterHeadIcon({ cx = 50, cy = 56, r = 26, palette = 'goldenSyrian' }: HeadProps) {
  const p = PALETTES[palette];
  const outline = p.outline;
  const ow = Math.max(1.2, r * 0.085);
  return (
    <g>
      <g transform={`rotate(-14 ${cx - r * 0.62} ${cy - r * 0.72})`}>
        <ellipse cx={cx - r * 0.62} cy={cy - r * 0.72} rx={r * 0.28} ry={r * 0.36} fill={p.body} stroke={outline} strokeWidth={ow} />
        <ellipse cx={cx - r * 0.62} cy={cy - r * 0.66} rx={r * 0.14} ry={r * 0.2} fill={p.innerEar} />
      </g>
      <g transform={`rotate(14 ${cx + r * 0.62} ${cy - r * 0.72})`}>
        <ellipse cx={cx + r * 0.62} cy={cy - r * 0.72} rx={r * 0.28} ry={r * 0.36} fill={p.body} stroke={outline} strokeWidth={ow} />
        <ellipse cx={cx + r * 0.62} cy={cy - r * 0.66} rx={r * 0.14} ry={r * 0.2} fill={p.innerEar} />
      </g>
      <circle cx={cx} cy={cy} r={r} fill={p.body} stroke={outline} strokeWidth={ow} />
      <ellipse cx={cx - r * 0.72} cy={cy + r * 0.35} rx={r * 0.22} ry={r * 0.14} fill="#F4A8A8" opacity="0.6" />
      <ellipse cx={cx + r * 0.72} cy={cy + r * 0.35} rx={r * 0.22} ry={r * 0.14} fill="#F4A8A8" opacity="0.6" />
      <ellipse cx={cx - r * 0.3} cy={cy - r * 0.15} rx={r * 0.13} ry={r * 0.18} fill={p.outline} />
      <ellipse cx={cx + r * 0.3} cy={cy - r * 0.15} rx={r * 0.13} ry={r * 0.18} fill={p.outline} />
      <circle cx={cx - r * 0.26} cy={cy - r * 0.22} r={r * 0.05} fill="white" />
      <circle cx={cx + r * 0.34} cy={cy - r * 0.22} r={r * 0.05} fill="white" />
      <path
        d={`M ${cx - r * 0.1} ${cy + r * 0.16} Q ${cx} ${cy + r * 0.08}, ${cx + r * 0.1} ${cy + r * 0.16} Q ${cx + r * 0.05} ${cy + r * 0.28}, ${cx} ${cy + r * 0.32} Q ${cx - r * 0.05} ${cy + r * 0.28}, ${cx - r * 0.1} ${cy + r * 0.16} Z`}
        fill="#E08888"
      />
      <g stroke={outline} strokeWidth={ow * 0.6} fill="none" strokeLinecap="round">
        <path d={`M ${cx} ${cy + r * 0.32} L ${cx} ${cy + r * 0.42}`} />
        <path d={`M ${cx} ${cy + r * 0.42} q ${-r * 0.1} ${r * 0.07} ${-r * 0.17} ${r * 0.02}`} />
        <path d={`M ${cx} ${cy + r * 0.42} q ${r * 0.1} ${r * 0.07} ${r * 0.17} ${r * 0.02}`} />
      </g>
    </g>
  );
}

export interface CategoryIconProps {
  kind: CategoryKind;
  size?: number | string;
  className?: string;
}

export function CategoryIcon({ kind, size = 100, className }: CategoryIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="50" cy="50" r="48" fill="#FBEDD0" />

      {kind === 'announcements' && (
        <g>
          <HamsterHeadIcon cx={42} cy={56} r={22} />
          <g transform="translate(56 22) rotate(20)">
            <path d="M 0 6 L 22 0 L 22 18 L 0 12 Z" fill="#E89595" stroke="#6E4628" strokeWidth="1.5" strokeLinejoin="round" />
            <rect x="22" y="2" width="6" height="14" fill="#C97070" stroke="#6E4628" strokeWidth="1.5" />
          </g>
        </g>
      )}

      {kind === 'species' && (
        <g>
          <rect x="18" y="28" width="64" height="50" rx="3" fill="#D4B384" stroke="#6E4628" strokeWidth="1.5" />
          <rect x="18" y="28" width="32" height="50" rx="3" fill="#C9A876" stroke="#6E4628" strokeWidth="1.5" />
          <g stroke="#6E4628" strokeWidth="1.4" strokeLinecap="round" opacity="0.7">
            <path d="M 24 42 h 18" /><path d="M 24 50 h 14" />
            <path d="M 56 42 h 20" /><path d="M 56 50 h 18" /><path d="M 56 58 h 12" />
          </g>
          <g transform="translate(15 22)"><HamsterHeadIcon cx={20} cy={20} r={15} /></g>
        </g>
      )}

      {kind === 'guides' && (
        <g>
          <HamsterHeadIcon cx={48} cy={56} r={22} />
          <g transform="translate(60 14)">
            <path d="M 8 0 a 11 11 0 0 1 6 19 v 4 h -12 v -4 a 11 11 0 0 1 6 -19 Z" fill="#FBE38A" stroke="#6E4628" strokeWidth="1.5" strokeLinejoin="round" />
            <rect x="3" y="23" width="10" height="2" fill="#6E4628" />
            <rect x="4" y="26" width="8" height="2" fill="#6E4628" />
          </g>
        </g>
      )}

      {kind === 'community' && (
        <g>
          <g transform="translate(-2 8)"><HamsterHeadIcon cx={32} cy={48} r={18} /></g>
          <g transform="translate(18 14)"><HamsterHeadIcon cx={32} cy={48} r={16} palette="winterWhite" /></g>
          <g transform="translate(58 14)">
            <path d="M 4 4 h 32 a 4 4 0 0 1 4 4 v 14 a 4 4 0 0 1 -4 4 h -14 l -6 8 v -8 h -12 a 4 4 0 0 1 -4 -4 v -14 a 4 4 0 0 1 4 -4 Z" fill="white" stroke="#6E4628" strokeWidth="1.5" strokeLinejoin="round" />
            <circle cx="14" cy="15" r="1.6" fill="#6E4628" />
            <circle cx="22" cy="15" r="1.6" fill="#6E4628" />
            <circle cx="30" cy="15" r="1.6" fill="#6E4628" />
          </g>
        </g>
      )}

      {kind === 'products' && (
        <g>
          <HamsterHeadIcon cx={40} cy={58} r={20} palette="winterWhite" />
          <g transform="translate(54 26)">
            <path d="M 4 8 L 30 8 L 32 32 a 2 2 0 0 1 -2 2 L 4 34 a 2 2 0 0 1 -2 -2 Z" fill="#D6A576" stroke="#6E4628" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M 10 8 v -3 a 7 7 0 0 1 14 0 v 3" fill="none" stroke="#6E4628" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="17" cy="20" r="2.5" fill="#E89595" />
          </g>
        </g>
      )}

      {kind === 'rescue' && (
        <g>
          <HamsterHeadIcon cx={50} cy={58} r={22} />
          <g transform="translate(58 14)">
            <path d="M 18 26 L 4 14 a 6 6 0 1 1 14 -2 a 6 6 0 1 1 14 2 Z" fill="#E89595" stroke="#6E4628" strokeWidth="1.5" strokeLinejoin="round" />
            <rect x="14" y="11" width="8" height="3" fill="white" />
            <rect x="16.5" y="8.5" width="3" height="8" fill="white" />
          </g>
        </g>
      )}

      {kind === 'hospitals' && (
        <g>
          <HamsterHeadIcon cx={40} cy={58} r={20} palette="creamSyrian" />
          <g transform="translate(54 22)">
            <rect x="0" y="0" width="32" height="32" rx="5" fill="#BCD8C9" stroke="#3B7A5A" strokeWidth="1.8" />
            <rect x="13" y="4" width="6" height="24" fill="#3B7A5A" rx="1" />
            <rect x="4" y="13" width="24" height="6" fill="#3B7A5A" rx="1" />
          </g>
        </g>
      )}

      {kind === 'identify' && (
        <g>
          <HamsterHeadIcon cx={40} cy={56} r={22} />
          <g transform="translate(52 22)">
            <rect x="0" y="6" width="36" height="26" rx="4" fill="#3B2A1C" />
            <rect x="11" y="2" width="14" height="6" rx="1" fill="#3B2A1C" />
            <circle cx="18" cy="19" r="9" fill="#7C5E3E" />
            <circle cx="18" cy="19" r="5.5" fill="#E89595" />
            <circle cx="16" cy="17" r="1.5" fill="white" />
          </g>
        </g>
      )}
    </svg>
  );
}

/* ============================ HERO SCENE ============================ */
export function HeroScene({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 900 500" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="hl-wall-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FDF3DA" />
          <stop offset="100%" stopColor="#F5E3BC" />
        </linearGradient>
      </defs>
      <rect width="900" height="500" fill="url(#hl-wall-grad)" />
      <rect y="370" width="900" height="130" fill="#C9A876" />
      <rect y="364" width="900" height="6" fill="#A07C50" />

      <g transform="translate(60 60)">
        <rect width="180" height="180" fill="#C8E0E8" stroke="#6E4628" strokeWidth="5" rx="4" />
        <line x1="90" y1="0" x2="90" y2="180" stroke="#6E4628" strokeWidth="3" />
        <line x1="0" y1="90" x2="180" y2="90" stroke="#6E4628" strokeWidth="3" />
        <circle cx="135" cy="40" r="22" fill="#FBE38A" opacity="0.9" />
        <rect x="-10" y="180" width="200" height="8" fill="#A07C50" />
      </g>

      <g transform="translate(560 230)">
        <circle cx="80" cy="80" r="68" fill="#FBEDD0" stroke="#6E4628" strokeWidth="4" />
        <g stroke="#A07C50" strokeWidth="2.5">
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={i} x1="80" y1="80"
              x2={80 + Math.cos(i * Math.PI / 6) * 64}
              y2={80 + Math.sin(i * Math.PI / 6) * 64} />
          ))}
        </g>
        <circle cx="80" cy="80" r="9" fill="#6E4628" />
        <rect x="74" y="148" width="12" height="20" fill="#6E4628" />
      </g>

      <g transform="translate(280 130)">
        <svg width="320" height="324" viewBox="0 0 240 244" x="0" y="0">
          <Hamster palette="goldenSyrian" accessory="seed" />
        </svg>
      </g>
      <g transform="translate(620 250)">
        <svg width="150" height="152" viewBox="0 0 240 244"><Hamster palette="winterWhite" /></svg>
      </g>
    </svg>
  );
}

/* ============================ EMPTY STATE ILLUSTRATION ============================ */
export type EmptyKind = 'posts' | 'rescue' | 'guides' | 'search' | 'error';

const EMPTY_PALETTE: Record<EmptyKind, PaletteKey> = {
  posts: 'creamSyrian',
  rescue: 'goldenSyrian',
  guides: 'djungarian',
  search: 'campbell',
  error: 'goldenBlack',
};

export function EmptyIllustration({ kind, className }: { kind: EmptyKind; className?: string }) {
  return (
    <svg viewBox="0 0 240 200" xmlns="http://www.w3.org/2000/svg" className={className}>
      <g transform="translate(60 -8)">
        <svg width="120" height="124" viewBox="0 0 240 244">
          <Hamster
            palette={EMPTY_PALETTE[kind]}
            pose={kind === 'posts' ? 'sleep' : 'sit'}
            accessory={kind === 'posts' ? 'zzz' : kind === 'rescue' ? 'heart' : undefined}
          />
        </svg>
      </g>
    </svg>
  );
}
