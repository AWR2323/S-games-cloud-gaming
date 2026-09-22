import { AchievementBadge, UserBadgeProgress } from '../types';
import { db } from './firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

export const ALL_ACHIEVEMENT_BADGES: AchievementBadge[] = [
  // --- Game Play Count Badges (ゲームプレイ数) ---
  {
    id: 'play_first_game',
    title: 'ファースト・インパルス',
    subtitle: '初クラウドダイブ',
    description: '2608moon または S AI ゲームを初めて起動してプレイする',
    category: 'play',
    rarity: 'common',
    icon: 'Gamepad2',
    xpReward: 50,
    metric: 'historyCount',
    targetValue: 1,
    unit: '本プレイ',
  },
  {
    id: 'play_explorer_3',
    title: 'クラウド探検家',
    subtitle: 'ジャンルを跨ぐ旅人',
    description: '3タイトル以上の異なるクラウドゲームをプレイする',
    category: 'play',
    rarity: 'common',
    icon: 'Compass',
    xpReward: 100,
    metric: 'historyCount',
    targetValue: 3,
    unit: '本プレイ',
  },
  {
    id: 'play_maniac_7',
    title: 'ゲームマニアック',
    subtitle: 'ハードコアゲーマー',
    description: '7タイトル以上のゲームをプレイしてライブラリを拡張する',
    category: 'play',
    rarity: 'rare',
    icon: 'Flame',
    xpReward: 250,
    metric: 'historyCount',
    targetValue: 7,
    unit: '本プレイ',
  },
  {
    id: 'play_conqueror_12',
    title: '2608moon 覇王',
    subtitle: 'クラウドストリーミングの頂点',
    description: '12タイトル以上のゲームを極めた伝説のストリーマー',
    category: 'play',
    rarity: 'epic',
    icon: 'Crown',
    xpReward: 500,
    metric: 'historyCount',
    targetValue: 12,
    unit: '本プレイ',
  },

  // --- Creator & Accomplishment Badges (成果・クリエイター) ---
  {
    id: 'creator_first_game',
    title: 'プロンプト錬金術師',
    subtitle: 'AIクリエイターの誕生',
    description: 'S AI ゲーム作成スタジオでオリジナルゲームを1本制作・保存する',
    category: 'creator',
    rarity: 'rare',
    icon: 'Sparkles',
    xpReward: 150,
    metric: 'savedGamesCount',
    targetValue: 1,
    unit: '本制作',
  },
  {
    id: 'creator_architect_3',
    title: 'インディー開発者',
    subtitle: 'ワールドビルダー',
    description: 'S AI スタジオで3本以上のオリジナルゲームを公開・保存する',
    category: 'creator',
    rarity: 'epic',
    icon: 'Cpu',
    xpReward: 400,
    metric: 'savedGamesCount',
    targetValue: 3,
    unit: '本制作',
  },
  {
    id: 'creator_master_5',
    title: 'S AI スタジオマスター',
    subtitle: '神域のゲームアーキテクト',
    description: 'S AI スタジオで5本以上のオリジナルゲームを開発・保存する',
    category: 'creator',
    rarity: 'legendary',
    icon: 'Code',
    xpReward: 800,
    metric: 'savedGamesCount',
    targetValue: 5,
    unit: '本制作',
  },

  // --- Collections (お気に入り) ---
  {
    id: 'collection_curator_3',
    title: 'ブックマーク収集家',
    subtitle: 'お気に入りライブラリ構築',
    description: 'お気に入りにゲームを3タイトル以上登録する',
    category: 'collection',
    rarity: 'common',
    icon: 'Bookmark',
    xpReward: 75,
    metric: 'favoritesCount',
    targetValue: 3,
    unit: '本登録',
  },
  {
    id: 'collection_master_6',
    title: '殿堂入りキュレーター',
    subtitle: '至高のコレクション',
    description: 'お気に入りにゲームを6タイトル以上厳選して保存する',
    category: 'collection',
    rarity: 'rare',
    icon: 'Star',
    xpReward: 200,
    metric: 'favoritesCount',
    targetValue: 6,
    unit: '本登録',
  },

  // --- Stealth & Security (ステルス & 防衛成果) ---
  {
    id: 'stealth_ninja',
    title: 'Classroom ステルス達人',
    subtitle: '完全隠蔽のスペシャリスト',
    description: 'Google Classroom 瞬時偽装機能（Escキーまたは偽装ボタン）を使用する',
    category: 'stealth',
    rarity: 'common',
    icon: 'EyeOff',
    xpReward: 100,
    metric: 'stealthUsed',
    targetValue: 1,
    unit: '回発動',
  },
  {
    id: 'guardian_shield',
    title: '絶対防壁ガーディアン',
    subtitle: '鉄壁のパスワード施錠',
    description: '離席時に Google ログイン風施錠機能を使ってブラウザを保護する',
    category: 'stealth',
    rarity: 'common',
    icon: 'ShieldCheck',
    xpReward: 100,
    metric: 'lockUsed',
    targetValue: 1,
    unit: '回施錠',
  },

  // --- Social / Veteran (経験値 & レベル成果) ---
  {
    id: 'veteran_level_3',
    title: 'ルーキーエリート',
    subtitle: 'サイバーライセンス昇格',
    description: 'プレイヤーレベル Lv.3 に到達する（ゲームプレイや制作でXP獲得）',
    category: 'social',
    rarity: 'rare',
    icon: 'Zap',
    xpReward: 200,
    metric: 'level',
    targetValue: 3,
    unit: 'Lv到達',
  },
  {
    id: 'veteran_legend_5',
    title: 'サイバーレジェンド',
    subtitle: 'S games 永遠の英雄',
    description: 'プレイヤーレベル Lv.5 (XP 500以上) に到達する',
    category: 'social',
    rarity: 'legendary',
    icon: 'Award',
    xpReward: 1000,
    metric: 'level',
    targetValue: 5,
    unit: 'Lv到達',
  },
];

export interface UserStatsForAchievements {
  historyCount: number;
  savedGamesCount: number;
  favoritesCount: number;
  xp: number;
  level: number;
  stealthUsed?: boolean;
  lockUsed?: boolean;
  reviewedCount?: number;
}

/**
 * Calculates current achievement status and progress for all badges
 */
export function calculateAchievements(stats: UserStatsForAchievements): {
  progressList: UserBadgeProgress[];
  unlockedCount: number;
  totalCount: number;
  completionPercent: number;
  totalXpEarned: number;
  unlockedIds: string[];
} {
  const stealthUsedValue =
    (stats.stealthUsed || (typeof window !== 'undefined' && localStorage.getItem('sgames_stealth_used') === 'true')) ? 1 : 0;
  const lockUsedValue =
    (stats.lockUsed || (typeof window !== 'undefined' && localStorage.getItem('sgames_lock_used') === 'true')) ? 1 : 0;

  let unlockedCount = 0;
  let totalXpEarned = 0;
  const unlockedIds: string[] = [];

  const progressList: UserBadgeProgress[] = ALL_ACHIEVEMENT_BADGES.map((badge) => {
    let currentValue = 0;

    switch (badge.metric) {
      case 'historyCount':
        currentValue = stats.historyCount || 0;
        break;
      case 'savedGamesCount':
        currentValue = stats.savedGamesCount || 0;
        break;
      case 'favoritesCount':
        currentValue = stats.favoritesCount || 0;
        break;
      case 'xp':
        currentValue = stats.xp || 0;
        break;
      case 'level':
        currentValue = stats.level || 1;
        break;
      case 'stealthUsed':
        currentValue = stealthUsedValue;
        break;
      case 'lockUsed':
        currentValue = lockUsedValue;
        break;
      case 'reviewedCount':
        currentValue = stats.reviewedCount || 0;
        break;
      default:
        currentValue = 0;
    }

    const isUnlocked = currentValue >= badge.targetValue;
    const progressPercent = Math.min(100, Math.round((currentValue / badge.targetValue) * 100));

    if (isUnlocked) {
      unlockedCount += 1;
      totalXpEarned += badge.xpReward;
      unlockedIds.push(badge.id);
    }

    return {
      badge,
      isUnlocked,
      currentValue,
      targetValue: badge.targetValue,
      progressPercent,
    };
  });

  const totalCount = ALL_ACHIEVEMENT_BADGES.length;
  const completionPercent = Math.round((unlockedCount / totalCount) * 100);

  return {
    progressList,
    unlockedCount,
    totalCount,
    completionPercent,
    totalXpEarned,
    unlockedIds,
  };
}

/**
 * Persists newly unlocked achievement badges into the Firestore user document
 */
export async function syncUnlockedBadgesToFirestore(uid: string, badgeIds: string[]): Promise<void> {
  if (!uid || badgeIds.length === 0) return;
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      unlockedAchievements: arrayUnion(...badgeIds),
    });
  } catch {
    // Non-fatal or permissions handling
  }
}

/**
 * Dispatches an event to display the slide-in achievement unlocked banner
 */
export function dispatchAchievementUnlocked(badge: AchievementBadge): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('sgames:achievement-unlocked', {
      detail: badge,
    })
  );
}

/**
 * Checks current user telemetry against previously notified badges,
 * triggering the slide-in notification for any newly earned badges.
 */
export function checkAndNotifyNewAchievements(
  stats: UserStatsForAchievements,
  uid?: string
): AchievementBadge[] {
  if (typeof window === 'undefined') return [];

  const { progressList } = calculateAchievements(stats);
  const newlyUnlocked: AchievementBadge[] = [];

  const storageKey = uid ? `sgames_notified_badges_${uid}` : 'sgames_notified_badges_guest';
  let notifiedSet = new Set<string>();

  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      notifiedSet = new Set(JSON.parse(raw));
    }
  } catch {}

  progressList.forEach(({ badge, isUnlocked }) => {
    if (isUnlocked && !notifiedSet.has(badge.id)) {
      notifiedSet.add(badge.id);
      newlyUnlocked.push(badge);
    }
  });

  if (newlyUnlocked.length > 0) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(notifiedSet)));
    } catch {}

    // Dispatch each newly unlocked badge in order
    newlyUnlocked.forEach((badge) => {
      dispatchAchievementUnlocked(badge);
    });

    if (uid) {
      syncUnlockedBadgesToFirestore(
        uid,
        newlyUnlocked.map((b) => b.id)
      );
    }
  }

  return newlyUnlocked;
}

