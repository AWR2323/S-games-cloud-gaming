import React, { useState, useEffect, useRef } from 'react';
import {
  Trophy,
  Sparkles,
  Award,
  Gamepad2,
  Compass,
  Flame,
  Crown,
  Cpu,
  Code,
  Bookmark,
  Star,
  EyeOff,
  ShieldCheck,
  Zap,
  CheckCircle2,
  X,
  ExternalLink,
} from 'lucide-react';
import { AchievementBadge, BadgeRarity } from '../types';
import { soundFX } from '../lib/sound';

interface AchievementToastNotificationProps {
  onOpenAchievements?: () => void;
}

const renderBadgeIcon = (iconName: string, className: string) => {
  switch (iconName) {
    case 'Gamepad2':
      return <Gamepad2 className={className} />;
    case 'Compass':
      return <Compass className={className} />;
    case 'Flame':
      return <Flame className={className} />;
    case 'Crown':
      return <Crown className={className} />;
    case 'Sparkles':
      return <Sparkles className={className} />;
    case 'Cpu':
      return <Cpu className={className} />;
    case 'Code':
      return <Code className={className} />;
    case 'Bookmark':
      return <Bookmark className={className} />;
    case 'Star':
      return <Star className={className} />;
    case 'EyeOff':
      return <EyeOff className={className} />;
    case 'ShieldCheck':
      return <ShieldCheck className={className} />;
    case 'Zap':
      return <Zap className={className} />;
    case 'Award':
    default:
      return <Award className={className} />;
  }
};

const RARITY_THEMES: Record<
  BadgeRarity,
  {
    border: string;
    glow: string;
    bgGlow: string;
    badgeBg: string;
    text: string;
    accent: string;
    tagBg: string;
  }
> = {
  common: {
    border: 'border-cyan-400/60',
    glow: 'shadow-[0_0_35px_rgba(6,182,212,0.35)]',
    bgGlow: 'bg-cyan-500/20',
    badgeBg: 'bg-cyan-950/90 text-cyan-300 border-cyan-500/50',
    text: 'text-cyan-300',
    accent: '#06b6d4',
    tagBg: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40',
  },
  rare: {
    border: 'border-violet-400/60',
    glow: 'shadow-[0_0_35px_rgba(139,92,246,0.4)]',
    bgGlow: 'bg-violet-500/20',
    badgeBg: 'bg-violet-950/90 text-violet-300 border-violet-500/50',
    text: 'text-violet-300',
    accent: '#8b5cf6',
    tagBg: 'bg-violet-950/80 text-violet-300 border-violet-500/40',
  },
  epic: {
    border: 'border-amber-400/70',
    glow: 'shadow-[0_0_40px_rgba(245,158,11,0.45)]',
    bgGlow: 'bg-amber-500/20',
    badgeBg: 'bg-amber-950/90 text-amber-300 border-amber-500/50',
    text: 'text-amber-300',
    accent: '#f59e0b',
    tagBg: 'bg-amber-950/80 text-amber-300 border-amber-500/50',
  },
  legendary: {
    border: 'border-rose-400/80',
    glow: 'shadow-[0_0_45px_rgba(244,63,94,0.5)]',
    bgGlow: 'bg-rose-500/25',
    badgeBg: 'bg-rose-950/90 text-rose-300 border-rose-500/60',
    text: 'text-rose-300',
    accent: '#f43f5e',
    tagBg: 'bg-rose-950/90 text-rose-300 border-rose-500/60',
  },
};

const DISPLAY_DURATION_MS = 5000;

export const AchievementToastNotification: React.FC<AchievementToastNotificationProps> = ({
  onOpenAchievements,
}) => {
  const [queue, setQueue] = useState<AchievementBadge[]>([]);
  const [currentBadge, setCurrentBadge] = useState<AchievementBadge | null>(null);
  const [isExiting, setIsExiting] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(100);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const remainingTimeRef = useRef<number>(DISPLAY_DURATION_MS);

  // Listen to the custom achievement unlocked event
  useEffect(() => {
    const handleAchievementUnlocked = (e: Event) => {
      const customEvent = e as CustomEvent<AchievementBadge>;
      if (customEvent.detail) {
        setQueue((prev) => [...prev, customEvent.detail]);
      }
    };

    window.addEventListener('sgames:achievement-unlocked', handleAchievementUnlocked);
    return () => {
      window.removeEventListener('sgames:achievement-unlocked', handleAchievementUnlocked);
    };
  }, []);

  // Process queue when current badge finishes or queue updates
  useEffect(() => {
    if (!currentBadge && queue.length > 0) {
      const nextBadge = queue[0];
      setQueue((prev) => prev.slice(1));
      setCurrentBadge(nextBadge);
      setIsExiting(false);
      setProgress(100);
      remainingTimeRef.current = DISPLAY_DURATION_MS;

      // Play triumphant fanfare sound
      soundFX.playBadgeEarned();
    }
  }, [currentBadge, queue]);

  // Handle countdown progress and auto-dismiss
  useEffect(() => {
    if (!currentBadge || isExiting) return;

    if (isPaused) {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    startTimeRef.current = Date.now();
    const totalRemaining = remainingTimeRef.current;

    // Progress bar animation ticker
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const left = Math.max(0, totalRemaining - elapsed);
      const pct = (left / DISPLAY_DURATION_MS) * 100;
      setProgress(pct);
    }, 50);

    // Timeout to trigger slide-out exit
    timerRef.current = setTimeout(() => {
      dismissCurrent();
    }, totalRemaining);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [currentBadge, isExiting, isPaused]);

  const dismissCurrent = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    setIsExiting(true);
    setTimeout(() => {
      setCurrentBadge(null);
      setIsExiting(false);
    }, 420);
  };

  const handleMouseEnter = () => {
    // Record remaining time and pause countdown while reading
    if (!isExiting && startTimeRef.current > 0) {
      const elapsed = Date.now() - startTimeRef.current;
      remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
      setIsPaused(true);
    }
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  const handleClickToast = () => {
    if (onOpenAchievements) {
      onOpenAchievements();
      dismissCurrent();
    }
  };

  if (!currentBadge) return null;

  const theme = RARITY_THEMES[currentBadge.rarity] || RARITY_THEMES.common;

  return (
    <aside
      aria-label="実績解除通知"
      className="fixed top-3 sm:top-5 left-1/2 -translate-x-1/2 z-[99999] w-[92%] max-w-md pointer-events-auto"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={`relative overflow-hidden rounded-2xl border-2 ${theme.border} bg-gradient-to-b from-[#0f143c]/95 via-[#0b0f2e]/95 to-[#06081c]/98 p-3.5 sm:p-4 text-white backdrop-blur-2xl ${
          theme.glow
        } ${isExiting ? 'animate-achievement-out' : 'animate-achievement-in'}`}
      >
        {/* Animated holographic shine beam */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -bottom-10 w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine-sweep" />
          <div
            className={`absolute top-0 right-0 -mr-12 -mt-12 h-36 w-36 rounded-full ${theme.bgGlow} blur-3xl animate-aura-pulse pointer-events-none`}
          />
        </div>

        {/* Content Container */}
        <div className="relative z-10 flex items-start gap-3">
          {/* Badge Icon Frame with Neon Ring */}
          <div className="relative flex-shrink-0">
            <div
              className={`flex h-12 w-12 sm:h-13 sm:w-13 items-center justify-center rounded-2xl border-2 ${theme.badgeBg} shadow-lg relative overflow-hidden`}
            >
              <div
                className={`absolute inset-0 ${theme.bgGlow} opacity-60 animate-pulse`}
              />
              {renderBadgeIcon(
                currentBadge.icon,
                `h-6 w-6 sm:h-7 sm:w-7 ${theme.text} relative z-10 drop-shadow-[0_0_8px_currentColor]`
              )}
            </div>
            {/* Status Star Badge */}
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-black shadow-md ring-2 ring-[#0b0f2e]">
              <Sparkles className="h-2.5 w-2.5 text-black fill-black" />
            </span>
          </div>

          {/* Texts and Telemetry */}
          <div className="flex-1 min-w-0 pr-6">
            {/* Subheading row: Achievement Unlocked Tag + XP Reward */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-300 font-mono">
                <Trophy className="h-3 w-3 text-amber-400" />
                <span>実績解除！</span>
              </span>

              <span
                className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-bold uppercase ${theme.tagBg}`}
              >
                {currentBadge.rarity.toUpperCase()}
              </span>

              <span className="text-[10px] font-mono font-black text-amber-300 bg-amber-950/60 border border-amber-500/40 px-1.5 py-0.2 rounded-md shadow-xs">
                +{currentBadge.xpReward} XP
              </span>
            </div>

            {/* Badge Title & Subtitle */}
            <div className="mt-1">
              <h3 className="text-sm font-black text-white tracking-wide truncate flex items-center gap-1.5">
                <span>{currentBadge.title}</span>
              </h3>
              <p className="text-[11px] text-cyan-300 font-medium truncate mt-0.2">
                {currentBadge.subtitle}
              </p>
            </div>

            {/* Description & Condition Cleared */}
            <p className="text-[11px] text-zinc-300/90 line-clamp-1 mt-1 leading-snug">
              {currentBadge.description}
            </p>

            {/* Action link */}
            <div className="mt-2 flex items-center justify-between gap-2 pt-1 border-t border-white/[0.08]">
              <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono font-medium">
                <CheckCircle2 className="h-3 w-3" />
                <span>達成完了</span>
              </div>

              {onOpenAchievements && (
                <button
                  type="button"
                  onClick={handleClickToast}
                  className="text-[10px] text-cyan-300 hover:text-white font-bold flex items-center gap-0.5 transition-colors cursor-pointer"
                >
                  <span>コレクションを見る</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </button>
              )}
            </div>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              dismissCurrent();
            }}
            className="absolute top-0 right-0 p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-white/10"
            title="通知を閉じる"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Dynamic Countdown Progress Bar at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#060814]">
          <div
            className="h-full transition-all duration-75 ease-linear shadow-[0_0_8px_currentColor]"
            style={{
              width: `${progress}%`,
              backgroundColor: theme.accent,
            }}
          />
        </div>
      </div>
    </aside>
  );
};
