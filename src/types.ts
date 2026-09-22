export interface CloudmoonGame {
  icon_url: string;
  title: string;
  package_name: string;
  status: number; // 1 = playable, 4 = maintenance
  is_beta: boolean;
  maintenance_title?: string;
  maintenance_info?: string;
  min_vip_level?: number;
  is_high?: boolean;
  is_sensitive?: boolean;
  categories: string[];
  released_at?: number;
  unlimit?: boolean;
  restart_tips?: string;
}

export interface CloudmoonCategory {
  key: string;
  name: string;
  icon_url: string;
  count: number;
  tags?: string[];
  is_show: boolean;
}

export interface CloudmoonServer {
  id: number;
  name: string;
  ping?: number;
}

export type ViewMode = 'catalog' | 'player' | 'cloak' | 'ai-creator';

export type PerformanceMode = 'high' | 'battery' | 'ultra';

export interface SAIGame {
  id: string;
  title: string;
  description: string;
  genre: string;
  prompt: string;
  code: string;
  creatorUid: string;
  creatorName: string;
  createdAt: string;
  likesCount?: number;
  playsCount?: number;
  commentsCount?: number;
  difficulty?: 'easy' | 'normal' | 'hard' | 'EASY' | 'NORMAL' | 'HARD' | string;
  cameraMode?: 'tps' | 'fps' | 'topdown' | string;
  theme?: string;
  performanceMode?: 'ultra-60fps' | 'high-quality' | string;
}

export interface GameComment {
  id: string;
  gameId: string;
  userId?: string;
  userName: string;
  userPhoto?: string;
  text: string;
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  gamerTag?: string;
  email: string | null;
  photoURL: string | null;
  provider?: string;
  level?: number;
  xp?: number;
  bio?: string;
  unlockedAchievements?: string[];
  controllerLayout?: 'default' | 'wasd' | 'arrows';
}

export interface PlayHistoryItem {
  id?: string;
  gameId: string;
  gameTitle: string;
  gameIcon?: string;
  playCount?: number;
  lastPlayedAt?: any;
  packageName?: string;
  title?: string;
  iconUrl?: string;
}

export interface GameReview {
  id: string;
  gameId: string;
  gameTitle: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  rating: number;
  reviewText: string;
  createdAt: string;
}

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type BadgeCategory = 'all' | 'play' | 'creator' | 'stealth' | 'collection' | 'social';

export interface AchievementBadge {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: 'play' | 'creator' | 'stealth' | 'collection' | 'social';
  rarity: BadgeRarity;
  icon: string;
  xpReward: number;
  metric: 'historyCount' | 'savedGamesCount' | 'favoritesCount' | 'xp' | 'level' | 'stealthUsed' | 'lockUsed' | 'reviewedCount';
  targetValue: number;
  unit?: string;
}

export interface UserBadgeProgress {
  badge: AchievementBadge;
  isUnlocked: boolean;
  currentValue: number;
  targetValue: number;
  progressPercent: number;
  unlockedAt?: string;
}

export interface Friend {
  friendUid: string;
  displayName: string;
  gamerTag?: string;
  photoURL?: string;
  level?: number;
  xp?: number;
  status?: 'online' | 'in-game' | 'offline';
  currentGame?: string;
  addedAt: string;
}

export interface FriendRequest {
  id: string;
  fromUid: string;
  fromName: string;
  fromGamerTag?: string;
  fromPhotoURL?: string;
  toUid: string;
  toName?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface StampData {
  stampId: string;
  stampName: string;
  caption: string;
}

export interface LobbyMessage {
  id: string;
  userId: string;
  userName: string;
  userGamerTag?: string;
  userPhoto?: string;
  text: string;
  createdAt: string;
  stamp?: StampData;
  gameInvite?: {
    gameTitle: string;
    gameId: string;
    isCloudmoon?: boolean;
  };
}

export interface DirectChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  text: string;
  createdAt: string;
  stamp?: StampData;
}

export interface DirectChatSummary {
  id: string;
  participants: string[];
  participantNames?: { [uid: string]: string };
  participantPhotos?: { [uid: string]: string };
  lastMessage?: string;
  lastMessageTime?: string;
  updatedAt?: string;
}

export interface GroupChat {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  createdBy: string;
  creatorName: string;
  members: string[]; // array of UIDs
  memberNames?: { [uid: string]: string };
  memberPhotos?: { [uid: string]: string };
  memberGamerTags?: { [uid: string]: string };
  lastMessage?: string;
  lastMessageSenderName?: string;
  lastMessageTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GroupChatMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  senderGamerTag?: string;
  text: string;
  createdAt: string;
  stamp?: StampData;
}

