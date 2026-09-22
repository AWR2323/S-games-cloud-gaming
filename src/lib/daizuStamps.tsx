import React from 'react';

export interface DaizuStamp {
  id: string;
  name: string;
  category: 'emotion' | 'gaming' | 'cheer' | 'fun';
  caption: string;
  badgeColor: string;
  bgGradient: string;
  description: string;
}

export const DAIZU_STAMPS: DaizuStamp[] = [
  {
    id: 'daizu_sparkle',
    name: 'だいずベア・キラキラ',
    caption: 'わーい！✨',
    category: 'emotion',
    badgeColor: 'text-amber-300 border-amber-400/40 bg-amber-950/60',
    bgGradient: 'from-amber-500/20 to-orange-500/10',
    description: '目を輝かせて大喜びするだいずべあ',
  },
  {
    id: 'daizu_game',
    name: 'ゲーム中・全集中',
    caption: 'ゲーム中！🎮',
    category: 'gaming',
    badgeColor: 'text-cyan-300 border-cyan-400/40 bg-cyan-950/60',
    bgGradient: 'from-cyan-500/20 to-blue-500/10',
    description: 'ヘッドセットとコントローラーを構えるだいずべあ',
  },
  {
    id: 'daizu_gg',
    name: 'グッジョブ・GG',
    caption: 'GG！神プレイ🔥',
    category: 'cheer',
    badgeColor: 'text-emerald-300 border-emerald-400/40 bg-emerald-950/60',
    bgGradient: 'from-emerald-500/20 to-teal-500/10',
    description: 'グッドサインでナイスプレイを褒めるだいずべあ',
  },
  {
    id: 'daizu_groove',
    name: 'グルーヴ・ノリノリ',
    caption: 'ノリノリ音波🎶',
    category: 'fun',
    badgeColor: 'text-fuchsia-300 border-fuchsia-400/40 bg-fuchsia-950/60',
    bgGradient: 'from-fuchsia-500/20 to-pink-500/10',
    description: 'ネオンヘッドホンでグルーヴに乗るだいずべあ',
  },
  {
    id: 'daizu_cry',
    name: 'やられた・ぴえん',
    caption: '惜しかった〜😭',
    category: 'emotion',
    badgeColor: 'text-blue-300 border-blue-400/40 bg-blue-950/60',
    bgGradient: 'from-blue-500/20 to-indigo-500/10',
    description: 'ゲームオーバーで涙ぐむだいずべあ',
  },
  {
    id: 'daizu_fire',
    name: '燃えてきた・突撃',
    caption: 'リベンジ！🔥',
    category: 'gaming',
    badgeColor: 'text-rose-300 border-rose-400/40 bg-rose-950/60',
    bgGradient: 'from-rose-500/20 to-red-500/10',
    description: '闘志を燃やしてもう一戦挑むだいずべあ',
  },
  {
    id: 'daizu_tea',
    name: 'まったり・きなこ休憩',
    caption: 'おつかれさま☕',
    category: 'cheer',
    badgeColor: 'text-amber-200 border-amber-300/40 bg-stone-900/60',
    bgGradient: 'from-amber-600/20 to-yellow-600/10',
    description: 'お茶をすすってほっこり休憩するだいずべあ',
  },
  {
    id: 'daizu_sleep',
    name: 'おやすみ・充電中',
    caption: 'また明日！💤',
    category: 'emotion',
    badgeColor: 'text-violet-300 border-violet-400/40 bg-violet-950/60',
    bgGradient: 'from-violet-500/20 to-purple-500/10',
    description: 'すやすや眠るだいずべあ',
  },
];

export interface GrooveMessagePreset {
  id: string;
  title: string;
  bpm: number;
  beatPattern: string; // e.g. '4-on-the-floor', 'syncopated', 'lofi-chill', 'hyper-electro'
  toneFrequency: number; // Hz base tone
  synthType: 'sine' | 'square' | 'triangle' | 'sawtooth';
  gradient: string;
  borderAccent: string;
  glowColor: string;
  iconTag: string;
}

export const GROOVE_PRESETS: GrooveMessagePreset[] = [
  {
    id: 'cyber-bass',
    title: 'サイバーベース',
    bpm: 128,
    beatPattern: 'heavy-pulse',
    toneFrequency: 130.81, // C3
    synthType: 'sawtooth',
    gradient: 'from-cyan-950/70 via-indigo-950/60 to-[#0c0f2a]',
    borderAccent: 'border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.35)]',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    iconTag: '⚡ BASS',
  },
  {
    id: 'lofi-chill',
    title: 'ローファイ・チル',
    bpm: 84,
    beatPattern: 'smooth-swing',
    toneFrequency: 220.0, // A3
    synthType: 'triangle',
    gradient: 'from-violet-950/70 via-purple-950/60 to-[#0d0d26]',
    borderAccent: 'border-violet-400/60 shadow-[0_0_20px_rgba(168,85,247,0.35)]',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    iconTag: '🌙 CHILL',
  },
  {
    id: 'hyper-rush',
    title: 'ハイパー・ラッシュ',
    bpm: 160,
    beatPattern: 'breakbeat',
    toneFrequency: 329.63, // E4
    synthType: 'square',
    gradient: 'from-rose-950/70 via-amber-950/60 to-[#1b0d22]',
    borderAccent: 'border-rose-400/60 shadow-[0_0_20px_rgba(244,63,94,0.35)]',
    glowColor: 'rgba(244, 63, 94, 0.4)',
    iconTag: '🔥 RUSH',
  },
  {
    id: 'synth-disco',
    title: 'シンセ・ファンク',
    bpm: 118,
    beatPattern: 'funky-groove',
    toneFrequency: 261.63, // C4
    synthType: 'sine',
    gradient: 'from-emerald-950/70 via-cyan-950/60 to-[#081824]',
    borderAccent: 'border-emerald-400/60 shadow-[0_0_20px_rgba(52,211,153,0.35)]',
    glowColor: 'rgba(52, 211, 153, 0.4)',
    iconTag: '✨ FUNK',
  },
];

/**
 * DaizuBear Avatar / Stamp SVG Renderer
 */
export const DaizuBearIcon: React.FC<{
  stampId: string;
  size?: number;
  className?: string;
  animated?: boolean;
}> = ({ stampId, size = 64, className = '', animated = true }) => {
  // Base colors for Daizu bear (warm toasted soybean cream / golden honey ears)
  const furColor = '#f3ddb3';
  const earInner = '#e6b980';
  const beanNose = '#5a3d28';
  const cheekPink = '#ff9ebb';

  switch (stampId) {
    case 'daizu_game':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className={`${className} ${animated ? 'hover:scale-110 transition-transform' : ''}`}
        >
          <circle cx="50" cy="50" r="48" fill="#131c38" stroke="#06b6d4" strokeWidth="2.5" />
          {/* Bear Ears */}
          <circle cx="28" cy="28" r="14" fill={furColor} />
          <circle cx="28" cy="28" r="8" fill={earInner} />
          <circle cx="72" cy="28" r="14" fill={furColor} />
          <circle cx="72" cy="28" r="8" fill={earInner} />
          {/* Headset Band */}
          <path d="M 22 45 A 32 32 0 0 1 78 45" fill="none" stroke="#06b6d4" strokeWidth="5" strokeLinecap="round" />
          <rect x="18" y="38" width="7" height="14" rx="3" fill="#38bdf8" />
          <rect x="75" y="38" width="7" height="14" rx="3" fill="#38bdf8" />
          {/* Head */}
          <ellipse cx="50" cy="54" rx="30" ry="26" fill={furColor} />
          {/* Cheeks */}
          <circle cx="34" cy="58" r="4.5" fill={cheekPink} opacity="0.8" />
          <circle cx="66" cy="58" r="4.5" fill={cheekPink} opacity="0.8" />
          {/* Focused Eyes with Glint */}
          <circle cx="40" cy="50" r="4.5" fill="#2d1d13" />
          <circle cx="41.5" cy="48.5" r="1.5" fill="#ffffff" />
          <circle cx="60" cy="50" r="4.5" fill="#2d1d13" />
          <circle cx="61.5" cy="48.5" r="1.5" fill="#ffffff" />
          {/* Soybean Nose & Snout */}
          <ellipse cx="50" cy="58" rx="7" ry="5.5" fill="#fff5e6" />
          <ellipse cx="50" cy="56" rx="3.5" ry="2.5" fill={beanNose} />
          {/* Game Controller in Paws */}
          <rect x="36" y="66" width="28" height="15" rx="5" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
          <circle cx="42" cy="73.5" r="2.5" fill="#38bdf8" />
          <circle cx="58" cy="71" r="1.5" fill="#f43f5e" />
          <circle cx="61" cy="74" r="1.5" fill="#10b981" />
          <circle cx="55" cy="74" r="1.5" fill="#eab308" />
        </svg>
      );

    case 'daizu_groove':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className={`${className} ${animated ? 'animate-bounce' : ''}`}
        >
          <circle cx="50" cy="50" r="48" fill="#240e34" stroke="#d946ef" strokeWidth="2.5" />
          {/* Musical soundwaves */}
          <path d="M 12 50 Q 18 35, 24 50 T 36 50" fill="none" stroke="#f472b6" strokeWidth="2" opacity="0.8" />
          <path d="M 64 50 Q 76 35, 82 50 T 88 50" fill="none" stroke="#f472b6" strokeWidth="2" opacity="0.8" />
          {/* Ears with neon rings */}
          <circle cx="28" cy="28" r="14" fill={furColor} />
          <circle cx="28" cy="28" r="8" fill="#ec4899" />
          <circle cx="72" cy="28" r="14" fill={furColor} />
          <circle cx="72" cy="28" r="8" fill="#ec4899" />
          {/* DJ Headset */}
          <path d="M 22 45 A 32 32 0 0 1 78 45" fill="none" stroke="#ec4899" strokeWidth="6" strokeLinecap="round" />
          <circle cx="22" cy="46" r="7" fill="#a855f7" stroke="#ffffff" strokeWidth="1.5" />
          <circle cx="78" cy="46" r="7" fill="#a855f7" stroke="#ffffff" strokeWidth="1.5" />
          {/* Head */}
          <ellipse cx="50" cy="54" rx="30" ry="26" fill={furColor} />
          {/* Cheeks */}
          <circle cx="34" cy="58" r="5" fill={cheekPink} />
          <circle cx="66" cy="58" r="5" fill={cheekPink} />
          {/* Happy Grooving Eyes (arcs) */}
          <path d="M 36 49 Q 41 43, 46 49" fill="none" stroke="#2d1d13" strokeWidth="3" strokeLinecap="round" />
          <path d="M 54 49 Q 59 43, 64 49" fill="none" stroke="#2d1d13" strokeWidth="3" strokeLinecap="round" />
          {/* Snout & Smile */}
          <ellipse cx="50" cy="59" rx="8" ry="6" fill="#fff5e6" />
          <ellipse cx="50" cy="57" rx="3.5" ry="2.5" fill={beanNose} />
          <path d="M 46 62 Q 50 67, 54 62" fill="none" stroke="#2d1d13" strokeWidth="2.5" strokeLinecap="round" />
          {/* Music Notes */}
          <text x="70" y="24" fill="#f472b6" fontSize="16" fontWeight="bold">♪</text>
          <text x="18" y="26" fill="#38bdf8" fontSize="14" fontWeight="bold">♫</text>
        </svg>
      );

    case 'daizu_gg':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className={`${className} ${animated ? 'hover:rotate-6 transition-transform' : ''}`}
        >
          <circle cx="50" cy="50" r="48" fill="#062e24" stroke="#10b981" strokeWidth="2.5" />
          {/* Ears */}
          <circle cx="28" cy="28" r="14" fill={furColor} />
          <circle cx="28" cy="28" r="8" fill={earInner} />
          <circle cx="72" cy="28" r="14" fill={furColor} />
          <circle cx="72" cy="28" r="8" fill={earInner} />
          {/* Head */}
          <ellipse cx="50" cy="53" rx="30" ry="26" fill={furColor} />
          {/* Cheeks */}
          <circle cx="34" cy="58" r="5" fill={cheekPink} />
          <circle cx="66" cy="58" r="5" fill={cheekPink} />
          {/* Wink Eye */}
          <path d="M 36 50 Q 41 45, 46 50" fill="none" stroke="#2d1d13" strokeWidth="3" strokeLinecap="round" />
          <circle cx="60" cy="50" r="4.5" fill="#2d1d13" />
          <circle cx="61.5" cy="48.5" r="1.5" fill="#ffffff" />
          {/* Snout */}
          <ellipse cx="50" cy="59" rx="8" ry="6" fill="#fff5e6" />
          <ellipse cx="50" cy="57" rx="3.5" ry="2.5" fill={beanNose} />
          <path d="M 46 62 Q 50 66, 54 62" fill="none" stroke="#2d1d13" strokeWidth="2.5" strokeLinecap="round" />
          {/* Thumbs Up Paw */}
          <g transform="translate(62, 58)">
            <ellipse cx="10" cy="14" rx="7" ry="8" fill={furColor} stroke="#2d1d13" strokeWidth="1.5" />
            <rect x="7" y="2" width="6" height="12" rx="3" fill={furColor} stroke="#2d1d13" strokeWidth="1.5" />
            <circle cx="10" cy="3" r="2.5" fill={earInner} />
          </g>
          {/* GG Badge */}
          <rect x="18" y="68" width="32" height="14" rx="4" fill="#10b981" />
          <text x="34" y="79" fill="#062e24" fontSize="10" fontWeight="900" textAnchor="middle">GG !!</text>
        </svg>
      );

    case 'daizu_cry':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className={`${className}`}
        >
          <circle cx="50" cy="50" r="48" fill="#0f172a" stroke="#3b82f6" strokeWidth="2.5" />
          {/* Ears */}
          <circle cx="28" cy="28" r="14" fill={furColor} />
          <circle cx="28" cy="28" r="8" fill={earInner} />
          <circle cx="72" cy="28" r="14" fill={furColor} />
          <circle cx="72" cy="28" r="8" fill={earInner} />
          {/* Head */}
          <ellipse cx="50" cy="53" rx="30" ry="26" fill={furColor} />
          {/* Sad Eyes */}
          <circle cx="38" cy="49" r="5" fill="#2d1d13" />
          <circle cx="39.5" cy="47.5" r="1.5" fill="#ffffff" />
          <circle cx="62" cy="49" r="5" fill="#2d1d13" />
          <circle cx="63.5" cy="47.5" r="1.5" fill="#ffffff" />
          {/* Tear streams */}
          <path d="M 38 55 Q 35 68, 32 75" fill="none" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round" />
          <path d="M 62 55 Q 65 68, 68 75" fill="none" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round" />
          {/* Droop Mouth */}
          <ellipse cx="50" cy="59" rx="8" ry="6" fill="#fff5e6" />
          <ellipse cx="50" cy="57" rx="3.5" ry="2.5" fill={beanNose} />
          <path d="M 46 64 Q 50 61, 54 64" fill="none" stroke="#2d1d13" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'daizu_fire':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className={`${className}`}
        >
          <circle cx="50" cy="50" r="48" fill="#2e0d15" stroke="#f43f5e" strokeWidth="2.5" />
          {/* Flame background */}
          <path d="M 50 14 Q 58 26, 52 35 Q 64 28, 68 40 Q 56 46, 50 42 Q 44 46, 32 40 Q 36 28, 48 35 Z" fill="#fb923c" opacity="0.9" />
          {/* Ears */}
          <circle cx="28" cy="30" r="14" fill={furColor} />
          <circle cx="28" cy="30" r="8" fill="#f87171" />
          <circle cx="72" cy="30" r="14" fill={furColor} />
          <circle cx="72" cy="30" r="8" fill="#f87171" />
          {/* Headband with flame */}
          <ellipse cx="50" cy="55" rx="30" ry="26" fill={furColor} />
          <rect x="22" y="38" width="56" height="8" rx="3" fill="#dc2626" />
          <circle cx="50" cy="42" r="3" fill="#fef08a" />
          {/* Determined Eyebrows & Eyes */}
          <line x1="34" y1="46" x2="44" y2="49" stroke="#2d1d13" strokeWidth="3" strokeLinecap="round" />
          <line x1="66" y1="46" x2="56" y2="49" stroke="#2d1d13" strokeWidth="3" strokeLinecap="round" />
          <circle cx="39" cy="52" r="4" fill="#2d1d13" />
          <circle cx="61" cy="52" r="4" fill="#2d1d13" />
          {/* Snout */}
          <ellipse cx="50" cy="60" rx="8" ry="6" fill="#fff5e6" />
          <ellipse cx="50" cy="58" rx="3.5" ry="2.5" fill={beanNose} />
          <path d="M 46 64 L 54 64" stroke="#2d1d13" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'daizu_tea':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className={`${className}`}
        >
          <circle cx="50" cy="50" r="48" fill="#1c1917" stroke="#d97706" strokeWidth="2.5" />
          {/* Ears */}
          <circle cx="28" cy="28" r="14" fill={furColor} />
          <circle cx="28" cy="28" r="8" fill={earInner} />
          <circle cx="72" cy="28" r="14" fill={furColor} />
          <circle cx="72" cy="28" r="8" fill={earInner} />
          {/* Head */}
          <ellipse cx="50" cy="52" rx="30" ry="26" fill={furColor} />
          {/* Cheeks */}
          <circle cx="33" cy="57" r="5" fill={cheekPink} />
          <circle cx="67" cy="57" r="5" fill={cheekPink} />
          {/* Closed Happy Eyes */}
          <path d="M 35 48 Q 40 44, 45 48" fill="none" stroke="#2d1d13" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 55 48 Q 60 44, 65 48" fill="none" stroke="#2d1d13" strokeWidth="2.5" strokeLinecap="round" />
          {/* Snout */}
          <ellipse cx="50" cy="57" rx="7" ry="5" fill="#fff5e6" />
          <ellipse cx="50" cy="55" rx="3" ry="2" fill={beanNose} />
          <path d="M 47 60 Q 50 63, 53 60" fill="none" stroke="#2d1d13" strokeWidth="2" strokeLinecap="round" />
          {/* Teacup in Paws with steam */}
          <rect x="42" y="65" width="16" height="14" rx="4" fill="#047857" stroke="#10b981" strokeWidth="1.5" />
          <path d="M 46 62 Q 44 58, 47 54" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
          <path d="M 53 62 Q 55 58, 52 54" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
        </svg>
      );

    case 'daizu_sleep':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className={`${className}`}
        >
          <circle cx="50" cy="50" r="48" fill="#1e1b4b" stroke="#818cf8" strokeWidth="2.5" />
          {/* Stars & Night Moon */}
          <path d="M 78 20 A 8 8 0 0 1 70 32 A 9 9 0 1 0 78 20" fill="#fde047" />
          {/* Nightcap on Ear */}
          <circle cx="28" cy="28" r="14" fill={furColor} />
          <path d="M 22 28 Q 14 12, 38 10 L 44 26 Z" fill="#6366f1" />
          <circle cx="38" cy="10" r="3.5" fill="#ffffff" />
          {/* Ears */}
          <circle cx="72" cy="28" r="14" fill={furColor} />
          <circle cx="72" cy="28" r="8" fill={earInner} />
          {/* Head */}
          <ellipse cx="50" cy="54" rx="30" ry="26" fill={furColor} />
          {/* Sleeping Eyes */}
          <path d="M 35 52 L 44 52" stroke="#2d1d13" strokeWidth="3" strokeLinecap="round" />
          <path d="M 56 52 L 65 52" stroke="#2d1d13" strokeWidth="3" strokeLinecap="round" />
          {/* Snout & Bubble */}
          <ellipse cx="50" cy="60" rx="8" ry="6" fill="#fff5e6" />
          <ellipse cx="50" cy="58" rx="3.5" ry="2.5" fill={beanNose} />
          <circle cx="64" cy="58" r="5" fill="#93c5fd" opacity="0.7" />
          <text x="68" y="44" fill="#a5b4fc" fontSize="12" fontWeight="bold">Z</text>
          <text x="76" y="38" fill="#a5b4fc" fontSize="9" fontWeight="bold">z</text>
        </svg>
      );

    case 'daizu_sparkle':
    default:
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className={`${className} ${animated ? 'hover:scale-110 transition-transform' : ''}`}
        >
          <circle cx="50" cy="50" r="48" fill="#2d1f05" stroke="#f59e0b" strokeWidth="2.5" />
          {/* Sparkles around head */}
          <path d="M 20 22 L 22 17 L 24 22 L 29 24 L 24 26 L 22 31 L 20 26 L 15 24 Z" fill="#fbbf24" />
          <path d="M 78 20 L 80 15 L 82 20 L 87 22 L 82 24 L 80 29 L 78 24 L 73 22 Z" fill="#fbbf24" />
          {/* Ears */}
          <circle cx="28" cy="28" r="14" fill={furColor} />
          <circle cx="28" cy="28" r="8" fill={earInner} />
          <circle cx="72" cy="28" r="14" fill={furColor} />
          <circle cx="72" cy="28" r="8" fill={earInner} />
          {/* Head */}
          <ellipse cx="50" cy="53" rx="30" ry="26" fill={furColor} />
          {/* Cheeks */}
          <circle cx="34" cy="58" r="5.5" fill={cheekPink} />
          <circle cx="66" cy="58" r="5.5" fill={cheekPink} />
          {/* Sparkly Big Anime Eyes */}
          <circle cx="39" cy="49" r="6" fill="#2d1d13" />
          <circle cx="41" cy="47" r="2.5" fill="#ffffff" />
          <circle cx="38" cy="52" r="1" fill="#ffffff" />
          <circle cx="61" cy="49" r="6" fill="#2d1d13" />
          <circle cx="63" cy="47" r="2.5" fill="#ffffff" />
          <circle cx="60" cy="52" r="1" fill="#ffffff" />
          {/* Soybean Snout & Wide Happy Mouth */}
          <ellipse cx="50" cy="58" rx="8" ry="6" fill="#fff5e6" />
          <ellipse cx="50" cy="56" rx="3.5" ry="2.5" fill={beanNose} />
          <path d="M 45 61 Q 50 67, 55 61" fill="#f43f5e" stroke="#2d1d13" strokeWidth="2" />
        </svg>
      );
  }
};
