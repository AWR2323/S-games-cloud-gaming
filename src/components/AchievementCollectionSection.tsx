import React, { useState } from 'react';
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
  Lock,
  CheckCircle2,
  Filter,
  ChevronRight,
  Info,
} from 'lucide-react';
import { UserBadgeProgress, BadgeCategory, BadgeRarity } from '../types';
import { soundFX } from '../lib/sound';
import { dispatchAchievementUnlocked } from '../lib/achievements';

interface AchievementCollectionSectionProps {
  progressList: UserBadgeProgress[];
  unlockedCount: number;
  totalCount: number;
  completionPercent: number;
  totalXpEarned: number;
}

// Icon mapper for dynamic string icon names
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

const RARITY_CONFIG: Record<
  BadgeRarity,
  { label: string; border: string; bg: string; text: string; glow: string; badgeBg: string }
> = {
  common: {
    label: 'COMMON',
    border: 'border-cyan-500/30 hover:border-cyan-400',
    bg: 'bg-[#0b122e]/80',
    text: 'text-cyan-400',
    glow: 'shadow-[0_0_15px_rgba(6,182,212,0.15)]',
    badgeBg: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40',
  },
  rare: {
    label: 'RARE',
    border: 'border-violet-500/40 hover:border-violet-400',
    bg: 'bg-[#120d2e]/80',
    text: 'text-violet-400',
    glow: 'shadow-[0_0_15px_rgba(139,92,246,0.2)]',
    badgeBg: 'bg-violet-950/80 text-violet-300 border-violet-500/40',
  },
  epic: {
    label: 'EPIC',
    border: 'border-amber-500/40 hover:border-amber-400',
    bg: 'bg-[#1e150b]/80',
    text: 'text-amber-400',
    glow: 'shadow-[0_0_20px_rgba(245,158,11,0.25)]',
    badgeBg: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
  },
  legendary: {
    label: 'LEGENDARY',
    border: 'border-rose-500/50 hover:border-rose-400',
    bg: 'bg-gradient-to-br from-[#1b0a2a]/90 via-[#260e1d]/80 to-[#1b1208]/90',
    text: 'text-rose-400',
    glow: 'shadow-[0_0_25px_rgba(244,63,94,0.3)]',
    badgeBg: 'bg-rose-950/90 text-rose-300 border-rose-500/50',
  },
};

export const AchievementCollectionSection: React.FC<AchievementCollectionSectionProps> = ({
  progressList,
  unlockedCount,
  totalCount,
  completionPercent,
  totalXpEarned,
}) => {
  const [activeCategory, setActiveCategory] = useState<BadgeCategory>('all');
  const [filterMode, setFilterMode] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [selectedBadge, setSelectedBadge] = useState<UserBadgeProgress | null>(null);

  const categories: { id: BadgeCategory; label: string; count: number }[] = [
    { id: 'all', label: 'すべて', count: totalCount },
    {
      id: 'play',
      label: 'プレイ実績',
      count: progressList.filter((p) => p.badge.category === 'play').length,
    },
    {
      id: 'creator',
      label: 'クリエイター',
      count: progressList.filter((p) => p.badge.category === 'creator').length,
    },
    {
      id: 'collection',
      label: 'お気に入り',
      count: progressList.filter((p) => p.badge.category === 'collection').length,
    },
    {
      id: 'stealth',
      label: 'ステルス・防衛',
      count: progressList.filter((p) => p.badge.category === 'stealth').length,
    },
    {
      id: 'social',
      label: 'レベル・称号',
      count: progressList.filter((p) => p.badge.category === 'social').length,
    },
  ];

  const filteredBadges = progressList.filter((item) => {
    if (activeCategory !== 'all' && item.badge.category !== activeCategory) {
      return false;
    }
    if (filterMode === 'unlocked' && !item.isUnlocked) {
      return false;
    }
    if (filterMode === 'locked' && item.isUnlocked) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Overview Showcase Card */}
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-[#0d1235] via-[#101340] to-[#1c1236] p-4 shadow-xl">
        <div className="absolute top-0 right-0 -mr-10 -mt-10 h-32 w-32 rounded-full bg-cyan-500/10 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 h-28 w-28 rounded-full bg-violet-600/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-violet-600 text-white shadow-lg shadow-cyan-500/25">
              <Trophy className="h-6 w-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black text-white">実績バッジコレクション</h4>
                <span className="rounded-full bg-cyan-950/80 border border-cyan-500/40 px-2 py-0.5 text-[9px] font-bold text-cyan-300">
                  ACHIEVEMENTS
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                ゲームプレイ数・制作・ステルスなどの成果でバッジを解放しXPを獲得
              </p>
            </div>
          </div>

          {/* Quick Stat Capsules & Notification Test Button */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end flex-wrap">
            <button
              type="button"
              onClick={() => {
                const badgeToTest =
                  progressList.find((p) => p.isUnlocked)?.badge || progressList[0]?.badge;
                if (badgeToTest) {
                  dispatchAchievementUnlocked(badgeToTest);
                }
              }}
              className="rounded-xl border border-cyan-500/40 bg-cyan-950/60 hover:bg-cyan-900/80 px-2.5 py-1.5 text-xs font-bold text-cyan-300 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:scale-102"
              title="実績解除通知のスライドアニメーションをテスト再生します"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>通知演出テスト</span>
            </button>
            <div className="rounded-xl border border-white/[0.08] bg-[#07091c]/80 px-3 py-1.5 text-right">
              <div className="text-[10px] text-zinc-400 font-mono">解放状況</div>
              <div className="text-sm font-black text-cyan-300 font-mono">
                {unlockedCount} <span className="text-zinc-500 text-xs">/ {totalCount}</span>
              </div>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-[#07091c]/80 px-3 py-1.5 text-right">
              <div className="text-[10px] text-zinc-400 font-mono">累計獲得XP</div>
              <div className="text-sm font-black text-amber-300 font-mono">
                +{totalXpEarned} XP
              </div>
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-3.5 space-y-1.5">
          <div className="flex justify-between text-[11px] font-mono">
            <span className="text-zinc-400">コンプリート進行度</span>
            <span className="font-bold text-cyan-300">{completionPercent}% COMPLETE</span>
          </div>
          <div className="h-2 w-full rounded-full bg-[#060818] overflow-hidden border border-white/[0.08]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-amber-400 transition-all duration-500 shadow-[0_0_12px_rgba(6,182,212,0.5)]"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Category Pills and Filter Controls */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-thin">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  soundFX.playKeyClick();
                  setActiveCategory(cat.id);
                }}
                className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                    : 'bg-[#0c102a]/80 text-zinc-400 hover:text-white border border-white/[0.06]'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[9px] px-1 py-0.2 rounded-full font-mono ${
                    activeCategory === cat.id ? 'bg-black/20 text-black' : 'bg-white/10 text-zinc-400'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            ))}
          </div>

          {/* Status Filter Toggle */}
          <div className="flex items-center rounded-lg bg-[#07091c] p-0.5 border border-white/[0.08] text-[10px] font-bold flex-shrink-0">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                filterMode === 'all' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              全表示
            </button>
            <button
              onClick={() => setFilterMode('unlocked')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                filterMode === 'unlocked' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              獲得済み ({unlockedCount})
            </button>
            <button
              onClick={() => setFilterMode('locked')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                filterMode === 'locked' ? 'bg-zinc-800 text-amber-300' : 'text-zinc-400 hover:text-white'
              }`}
            >
              未獲得 ({totalCount - unlockedCount})
            </button>
          </div>
        </div>
      </div>

      {/* Badges Grid Collection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
        {filteredBadges.map((item) => {
          const rarity = RARITY_CONFIG[item.badge.rarity];
          const isUnlocked = item.isUnlocked;

          return (
            <div
              key={item.badge.id}
              onClick={() => {
                soundFX.playKeyClick();
                setSelectedBadge(item);
              }}
              className={`relative rounded-2xl border p-3 transition-all duration-200 cursor-pointer ${
                rarity.bg
              } ${
                isUnlocked
                  ? `${rarity.border} ${rarity.glow}`
                  : 'border-white/[0.06] opacity-70 hover:opacity-100 hover:border-white/20'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Badge Icon Frame */}
                <div className="relative flex-shrink-0">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl border transition-transform group-hover:scale-105 ${
                      isUnlocked
                        ? `${rarity.badgeBg} border-white/20 shadow-md`
                        : 'bg-zinc-900/90 border-zinc-800 text-zinc-500'
                    }`}
                  >
                    {renderBadgeIcon(
                      item.badge.icon,
                      `h-6 w-6 ${isUnlocked ? rarity.text : 'text-zinc-600'}`
                    )}
                  </div>

                  {/* Status Badge Over Icon */}
                  {isUnlocked ? (
                    <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-black shadow">
                      <CheckCircle2 className="h-3 w-3 text-black stroke-[3]" />
                    </span>
                  ) : (
                    <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                      <Lock className="h-2.5 w-2.5" />
                    </span>
                  )}
                </div>

                {/* Badge Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h5
                      className={`text-xs font-black truncate ${
                        isUnlocked ? 'text-white' : 'text-zinc-300'
                      }`}
                    >
                      {item.badge.title}
                    </h5>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-bold uppercase flex-shrink-0 ${rarity.badgeBg}`}
                    >
                      {rarity.label}
                    </span>
                  </div>

                  <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">
                    {item.badge.subtitle}
                  </p>

                  <p className="text-[10px] text-zinc-400/90 line-clamp-2 mt-1 leading-tight">
                    {item.badge.description}
                  </p>

                  {/* Progress & Reward Footer */}
                  <div className="mt-2 flex items-center justify-between gap-2 pt-1 border-t border-white/[0.05]">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <div className="h-1.5 flex-1 rounded-full bg-zinc-900 border border-white/[0.05] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isUnlocked
                              ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]'
                              : 'bg-cyan-500/70'
                          }`}
                          style={{ width: `${item.progressPercent}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-mono text-zinc-400 flex-shrink-0">
                        {item.currentValue} / {item.targetValue}
                      </span>
                    </div>

                    <span className="text-[9px] font-mono font-bold text-amber-300 bg-amber-950/40 border border-amber-500/30 px-1.5 py-0.2 rounded flex-shrink-0">
                      +{item.badge.xpReward} XP
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredBadges.length === 0 && (
        <div className="rounded-xl border border-white/[0.06] bg-[#0c102a]/40 p-6 text-center text-xs text-zinc-400">
          該当する実績バッジが見つかりませんでした。
        </div>
      )}

      {/* Selected Badge Detail Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-sm rounded-3xl border border-cyan-500/40 bg-[#0e122d] p-5 text-white shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${
                    selectedBadge.isUnlocked
                      ? RARITY_CONFIG[selectedBadge.badge.rarity].badgeBg
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                  }`}
                >
                  {renderBadgeIcon(
                    selectedBadge.badge.icon,
                    `h-7 w-7 ${
                      selectedBadge.isUnlocked
                        ? RARITY_CONFIG[selectedBadge.badge.rarity].text
                        : 'text-zinc-600'
                    }`
                  )}
                </div>
                <div>
                  <span
                    className={`text-[9px] font-mono px-2 py-0.5 rounded border font-bold uppercase ${
                      RARITY_CONFIG[selectedBadge.badge.rarity].badgeBg
                    }`}
                  >
                    {RARITY_CONFIG[selectedBadge.badge.rarity].label}
                  </span>
                  <h4 className="text-sm font-black text-white mt-1">
                    {selectedBadge.badge.title}
                  </h4>
                  <p className="text-xs text-cyan-300">{selectedBadge.badge.subtitle}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedBadge(null)}
                className="text-zinc-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-300 bg-zinc-900/60 border border-white/[0.06] p-3 rounded-xl leading-relaxed">
              {selectedBadge.badge.description}
            </p>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-400">獲得条件</span>
                <span className="text-cyan-300 font-bold">
                  {selectedBadge.currentValue} / {selectedBadge.targetValue}{' '}
                  {selectedBadge.badge.unit || ''}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-zinc-900 overflow-hidden border border-white/[0.08]">
                <div
                  className={`h-full rounded-full ${
                    selectedBadge.isUnlocked ? 'bg-emerald-400' : 'bg-cyan-500'
                  }`}
                  style={{ width: `${selectedBadge.progressPercent}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/[0.08] text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-400">状態:</span>
                {selectedBadge.isUnlocked ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    獲得済み
                  </span>
                ) : (
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <Lock className="h-3.5 w-3.5" />
                    未解放
                  </span>
                )}
              </div>
              <div className="text-amber-300 font-mono font-bold bg-amber-950/50 border border-amber-500/30 px-2 py-0.5 rounded">
                報酬: +{selectedBadge.badge.xpReward} XP
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  dispatchAchievementUnlocked(selectedBadge.badge);
                }}
                className="flex-1 py-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-xs font-bold text-cyan-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span>通知をテスト再生</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedBadge(null)}
                className="flex-1 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
