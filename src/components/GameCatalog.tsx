import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Flame,
  Play,
  Sparkles,
  Users,
  AlertCircle,
  Zap,
  Heart,
  Eye,
  Share2,
  CheckCheck,
  User as UserIcon,
  MessageSquare,
  Gamepad2,
  Cpu,
  Smartphone,
  ChevronRight,
  ShieldCheck,
  ArrowRight,
  Radio,
  Clock,
  Compass,
  Star,
  Bookmark,
  History,
} from 'lucide-react';
import { CloudmoonGame, CloudmoonCategory, SAIGame, PlayHistoryItem } from '../types';
import { db } from '../lib/firebase';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { GameReviewModal } from './GameReviewModal';

interface GameCatalogProps {
  games: CloudmoonGame[];
  categories: CloudmoonCategory[];
  memberCount: string;
  loading: boolean;
  user: User | null;
  onOpenAuth: () => void;
  onLaunchGame: (game: CloudmoonGame) => void;
  onLaunchCustomUrl: (url: string) => void;
  onOpenAICreator?: () => void;
  onLaunchCommunityGame?: (gameId: string) => void;
}

// Japanese category labels map
const CATEGORY_NAMES_JA: Record<string, string> = {
  all: 'すべてのゲーム',
  favorites: '★ お気に入り',
  action: 'アクション',
  rpg: 'RPG',
  anime: 'アニメ',
  simulation: 'シミュレーション',
  strategy: '戦略・ストラテジー',
  casual: 'カジュアル',
  'sports & racing': 'スポーツ＆レース',
  arcade: 'アーケード',
  apps: 'アプリ・ツール',
  adventure: 'アドベンチャー',
  puzzle: 'パズル',
};

export const GameCatalog: React.FC<GameCatalogProps> = ({
  games,
  categories,
  memberCount,
  loading,
  user,
  onOpenAuth,
  onLaunchGame,
  onLaunchCustomUrl,
  onOpenAICreator,
  onLaunchCommunityGame,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [customPackage, setCustomPackage] = useState<string>('');
  const [communityGames, setCommunityGames] = useState<SAIGame[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Favorites state (Set of package_name strings)
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // User play history
  const [playHistory, setPlayHistory] = useState<PlayHistoryItem[]>([]);

  // Review Modal State
  const [reviewModalGame, setReviewModalGame] = useState<{ id: string; title: string } | null>(null);

  // 1. Sync Favorites with Firestore or LocalStorage
  useEffect(() => {
    if (user) {
      const favsRef = collection(db, 'users', user.uid, 'favorites');
      const unsubscribe = onSnapshot(
        favsRef,
        (snapshot) => {
          const favSet = new Set<string>();
          snapshot.forEach((d) => favSet.add(d.id));
          setFavorites(favSet);
        },
        (err) => {
          console.warn('Favorites listener error:', err);
        }
      );
      return () => unsubscribe();
    } else {
      try {
        const local = localStorage.getItem('sgames_guest_favorites');
        if (local) {
          setFavorites(new Set(JSON.parse(local)));
        }
      } catch (e) {}
    }
  }, [user]);

  // 2. Sync Play History with Firestore if logged in
  useEffect(() => {
    if (!user) {
      setPlayHistory([]);
      return;
    }

    const historyRef = collection(db, 'users', user.uid, 'history');
    const q = query(historyRef, orderBy('lastPlayedAt', 'desc'), limit(8));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: PlayHistoryItem[] = [];
        snapshot.forEach((d) => {
          const data = (d.data() || {}) as any;
          const pkg = data.packageName || data.gameId || d.id;
          list.push({
            id: d.id,
            gameId: pkg,
            gameTitle: data.title || data.gameTitle || 'ゲーム',
            gameIcon: data.iconUrl || data.gameIcon || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200',
            playCount: data.playCount || 1,
            lastPlayedAt: data.lastPlayedAt,
            packageName: pkg,
            title: data.title || data.gameTitle || 'ゲーム',
            iconUrl: data.iconUrl || data.gameIcon,
          });
        });
        setPlayHistory(list);
      },
      (err) => {
        console.warn('History listener error:', err);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // 3. Fetch Community Games from Firestore
  useEffect(() => {
    const q = query(collection(db, 'games'), orderBy('createdAt', 'desc'), limit(6));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched: SAIGame[] = [];
        snapshot.forEach((docSnap) => {
          fetched.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        setCommunityGames(fetched);
      },
      (err) => {
        console.warn('Community games fetch error in catalog:', err);
      }
    );
    return () => unsubscribe();
  }, []);

  // Toggle Favorite Handler
  const handleToggleFavorite = async (e: React.MouseEvent, game: CloudmoonGame) => {
    e.stopPropagation();
    const pkg = game.package_name;
    const isFav = favorites.has(pkg);
    const newFavs = new Set(favorites);

    if (isFav) {
      newFavs.delete(pkg);
    } else {
      newFavs.add(pkg);
    }
    setFavorites(newFavs);

    if (user) {
      try {
        const favDocRef = doc(db, 'users', user.uid, 'favorites', pkg);
        if (isFav) {
          await deleteDoc(favDocRef);
        } else {
          await setDoc(favDocRef, {
            packageName: pkg,
            title: game.title,
            iconUrl: game.icon_url,
            addedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        console.error('Error updating favorite:', err);
      }
    } else {
      try {
        localStorage.setItem('sgames_guest_favorites', JSON.stringify(Array.from(newFavs)));
      } catch (e) {}
    }
  };

  const handleCopyLink = async (gameId: string) => {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const url = `${origin}${pathname}?game=${encodeURIComponent(gameId)}`;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        const input = document.createElement('input');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopiedId(gameId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      console.warn('Clipboard error:', e);
    }
  };

  // Top highlight games from Cloudmoon/2608moon
  const featuredPackages = [
    'com.roblox.client',
    'com.supercell.brawlstars',
    'high::com.netmarble.sololv',
    'jp.pokemon.pokemontcgp',
    'com.dxx.firenow',
    'high::com.levelinfinite.sgameGlobal',
  ];

  const featuredGames = useMemo(() => {
    return games
      .filter((g) =>
        featuredPackages.some(
          (pkg) =>
            g.package_name.includes(pkg) ||
            g.title.toLowerCase().includes('roblox') ||
            g.title.toLowerCase().includes('brawl')
        )
      )
      .slice(0, 6);
  }, [games]);

  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      const matchesSearch =
        game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.package_name.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesCat = true;
      if (selectedCategory === 'favorites') {
        matchesCat = favorites.has(game.package_name);
      } else if (selectedCategory !== 'all') {
        matchesCat =
          !!game.categories &&
          game.categories.some((c) => c.toLowerCase() === selectedCategory.toLowerCase());
      }

      return matchesSearch && matchesCat;
    });
  }, [games, searchQuery, selectedCategory, favorites]);

  const handleCustomLaunch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPackage.trim()) return;
    const pkg = customPackage.trim();
    if (pkg.startsWith('http://') || pkg.startsWith('https://')) {
      onLaunchCustomUrl(pkg);
    } else {
      onLaunchCustomUrl(`https://2608moon.firebaseapp.com/ja/game/${pkg}/`);
    }
    setCustomPackage('');
  };

  const quickLaunchChips = [
    { label: 'Roblox (ロブロックス)', pkg: 'com.roblox.client' },
    { label: 'Brawl Stars (ブロスタ)', pkg: 'com.supercell.brawlstars' },
    { label: 'ポケポケ (TCGP)', pkg: 'jp.pokemon.pokemontcgp' },
    { label: '俺だけレベルアップな件', pkg: 'high::com.netmarble.sololv' },
    { label: 'Free Fire MAX', pkg: 'com.dxx.firenow' },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full pb-28 text-zinc-100 cyber-canvas-bg">
      {/* Hero Command Arena Banner */}
      <div className="relative overflow-hidden border-b border-white/[0.08] px-4 pt-10 pb-12 sm:px-8 sm:pt-14 sm:pb-16 bg-gradient-to-b from-[#080b24]/90 via-[#06081c]/80 to-transparent">
        {/* Ambient Aurora Orbs */}
        <div className="pointer-events-none absolute -top-48 right-1/4 h-[500px] w-[500px] rounded-full bg-violet-600/25 blur-[130px] animate-float-orb" />
        <div
          className="pointer-events-none absolute -top-40 left-10 h-[420px] w-[420px] rounded-full bg-cyan-500/20 blur-[120px] animate-float-orb"
          style={{ animationDelay: '-3s' }}
        />
        <div className="pointer-events-none absolute bottom-0 right-10 h-80 w-80 rounded-full bg-indigo-600/20 blur-[100px]" />

        <div className="relative mx-auto max-w-7xl space-y-8 z-10">
          {/* Top Title & Telemetry Deck */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="space-y-4 max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-gradient-to-r from-cyan-950/70 via-indigo-950/50 to-violet-950/70 px-4 py-1.5 text-xs font-bold text-cyan-300 shadow-[0_0_25px_rgba(6,182,212,0.25)] backdrop-blur-2xl">
                <Radio className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
                <span>2608moon 日本語クラウドエンジン • 待ち時間0秒超低遅延</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
                次世代クラウドで、
                <br />
                <span className="text-shimmer font-black">
                  あらゆるゲームを瞬時に解き放つ
                </span>
              </h1>

              <p className="text-xs sm:text-sm lg:text-base text-zinc-300 leading-relaxed max-w-2xl font-normal">
                ダウンロード・インストール不要。ブラウザを開くだけで220本以上の本格ゲームを60FPSで快適プレイ。
                さらに自律型S AIが、あなたの指示から3Dパルクールやレースゲームを全自動プログラミングします。
              </p>

              {/* Login Promotion Card for Guests */}
              {!user && (
                <div className="flex items-center gap-3 rounded-2xl border border-cyan-500/30 bg-cyan-950/30 p-3 max-w-xl">
                  <ShieldCheck className="h-5 w-5 text-cyan-400 flex-shrink-0" />
                  <p className="text-xs text-zinc-300 flex-1">
                    <strong className="text-white">Google / Apple / SNSログイン</strong>で、セーブデータやお気に入り、ゲーム評価、XPランクアップをクラウド永続同期！
                  </p>
                  <button
                    onClick={onOpenAuth}
                    className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-3 py-1.5 text-xs font-bold text-white shadow-md hover:brightness-110 transition-all cursor-pointer whitespace-nowrap"
                  >
                    ログイン
                  </button>
                </div>
              )}
            </div>

            {/* Performance Stats Bento Cards */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 self-start lg:self-auto w-full lg:w-auto">
              <div className="cyber-glass-card rounded-2xl p-4 hover:border-cyan-500/50 transition-all duration-300 group">
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
                  <Zap className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  <span>ストリーミング</span>
                </div>
                <div className="mt-1 text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>60 FPS</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5 font-mono">平均遅延: 18~24ms</div>
              </div>

              <div className="cyber-glass-card rounded-2xl p-4 hover:border-violet-500/50 transition-all duration-300 group">
                <div className="flex items-center gap-2 text-violet-400 text-xs font-bold">
                  <Gamepad2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  <span>タイトル数</span>
                </div>
                <div className="mt-1 text-2xl sm:text-3xl font-black text-white tracking-tight">
                  220+ 本
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">毎日アップデート更新</div>
              </div>

              <div className="cyber-glass-card rounded-2xl p-4 hover:border-emerald-500/50 transition-all duration-300 group">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                  <Users className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  <span>オンライン</span>
                </div>
                <div className="mt-1 text-2xl sm:text-3xl font-black text-white tracking-tight font-mono">
                  {memberCount ? Number(memberCount).toLocaleString() : '350,000+'}
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">グローバル接続中</div>
              </div>

              <div className="cyber-glass-card rounded-2xl p-4 hover:border-amber-500/50 transition-all duration-300 group">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                  <Sparkles className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  <span>S AI 生成</span>
                </div>
                <div className="mt-1 text-2xl sm:text-3xl font-black text-white tracking-tight">
                  3D / 2D
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">自律プログラミング</div>
              </div>
            </div>
          </div>

          {/* Quick Direct Runner Launcher Bar */}
          <div className="cyber-glass-card rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-violet-600 text-white shadow-lg shadow-cyan-500/20">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <span>クイックダイレクトランナー</span>
                    <span className="rounded-full bg-cyan-500/20 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-mono text-cyan-300">
                      0ms起動
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400">
                    人気ゲームをワンクリック、またはパッケージ名を入力して直接ストリーミング
                  </p>
                </div>
              </div>

              {/* Quick Launch Chips */}
              <div className="flex flex-wrap items-center gap-2">
                {quickLaunchChips.map((item, idx) => (
                  <button
                    key={`quick-${item.pkg}-${idx}`}
                    id={`quick-launch-${item.pkg.replace(/[^a-zA-Z0-9]/g, '-')}`}
                    onClick={() => {
                      const matched = games.find((g) => g.package_name === item.pkg);
                      if (matched) {
                        onLaunchGame(matched);
                      } else {
                        onLaunchCustomUrl(`https://2608moon.firebaseapp.com/ja/game/${item.pkg}/`);
                      }
                    }}
                    className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#090d28]/80 hover:bg-[#121845] hover:border-cyan-400/50 px-3 py-1.5 text-xs font-bold text-zinc-200 transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    <Play className="h-3 w-3 text-cyan-400 fill-current" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Package Form */}
            <form onSubmit={handleCustomLaunch} className="flex flex-col sm:flex-row gap-2 pt-1">
              <div className="relative flex-1">
                <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  id="custom-package-input"
                  type="text"
                  placeholder="パッケージ名を入力 (例: com.roblox.client または https://...)"
                  value={customPackage}
                  onChange={(e) => setCustomPackage(e.target.value)}
                  className="w-full rounded-2xl border border-white/[0.1] bg-[#06081c]/90 py-3 pl-10 pr-4 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 focus:outline-none transition-all shadow-inner"
                />
              </div>
              <button
                id="custom-package-launch-btn"
                type="submit"
                className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-violet-600 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-cyan-500/25 hover:opacity-95 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>ストリーム開始</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mx-auto max-w-7xl px-4 sm:px-8 pt-8 space-y-10">
        {/* Play History (Quick Resume) Bar for Logged-in Users */}
        {user && playHistory.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-black text-white">最近プレイしたゲーム (Quick Resume)</h3>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono">クラウド同期済み</span>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {playHistory.map((item, idx) => (
                <div
                  key={`history-${item.gameId || item.id || idx}-${idx}`}
                  onClick={() => {
                    const matched = games.find((g) => g.package_name === item.gameId);
                    if (matched) onLaunchGame(matched);
                    else onLaunchCustomUrl(`https://2608moon.firebaseapp.com/ja/game/${item.gameId}/`);
                  }}
                  className="flex-shrink-0 flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-[#0c102e]/80 hover:border-cyan-400/60 p-2.5 pr-4 transition-all cursor-pointer group shadow-md"
                >
                  <img
                    src={item.gameIcon || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200'}
                    alt={item.gameTitle}
                    className="h-10 w-10 rounded-xl object-cover border border-white/10 group-hover:scale-105 transition-transform"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                      {item.gameTitle}
                    </h4>
                    <span className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                      <Play className="h-2.5 w-2.5 text-cyan-400 fill-current" />
                      再開する
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Featured Spotlight Grid */}
        {featuredGames.length > 0 && searchQuery === '' && selectedCategory === 'all' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-500/10">
                  <Flame className="h-5 w-5 fill-amber-400/20 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">大人気おすすめタイトル</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">待ち時間なし・超低遅延ストリーミングですぐにプレイ可能</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {featuredGames.map((game, idx) => {
                const isFav = favorites.has(game.package_name);
                return (
                  <div
                    key={`featured-${game.package_name}-${idx}`}
                    className="cyber-glass-card-interactive group relative flex items-center justify-between rounded-3xl p-4 shadow-xl transition-all duration-300"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="relative flex-shrink-0">
                        <img
                          src={game.icon_url}
                          alt={game.title}
                          className="h-16 w-16 rounded-2xl object-cover border border-white/[0.12] shadow-lg group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                        {/* Bookmark Button */}
                        <button
                          onClick={(e) => handleToggleFavorite(e, game)}
                          className={`absolute -top-1.5 -left-1.5 p-1 rounded-full border shadow-md transition-all cursor-pointer ${
                            isFav
                              ? 'bg-amber-500 border-amber-400 text-black'
                              : 'bg-black/60 border-white/20 text-zinc-400 hover:text-amber-300'
                          }`}
                          title={isFav ? 'お気に入りから解除' : 'お気に入りに追加'}
                        >
                          <Bookmark className="h-3 w-3 fill-current" />
                        </button>
                      </div>

                      <div className="min-w-0 space-y-1">
                        <h3 className="font-bold text-sm sm:text-base text-white truncate group-hover:text-cyan-300 transition-colors">
                          {game.title}
                        </h3>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {game.categories?.slice(0, 2).map((cat, catIdx) => (
                            <span
                              key={`feat-cat-${cat}-${catIdx}`}
                              className="rounded-md bg-[#161a40] px-2 py-0.5 text-[10px] font-bold text-zinc-300"
                            >
                              {CATEGORY_NAMES_JA[cat.toLowerCase()] || cat}
                            </span>
                          ))}
                          <button
                            onClick={() => setReviewModalGame({ id: game.package_name, title: game.title })}
                            className="text-[10px] font-bold text-amber-300 flex items-center gap-1 hover:underline cursor-pointer ml-1"
                          >
                            <Star className="h-3 w-3 fill-current" />
                            レビュー
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      id={`featured-play-${game.package_name.replace(/[^a-zA-Z0-9]/g, '-')}`}
                      onClick={() => onLaunchGame(game)}
                      className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white shadow-lg shadow-violet-600/30 group-hover:scale-110 active:scale-95 transition-all cursor-pointer flex-shrink-0"
                      title={`${game.title} をプレイ`}
                    >
                      <Play className="h-5 w-5 fill-current ml-0.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Search & Category Filter Controls */}
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-b border-white/[0.08] pb-5">
            {/* Cyber Search Box */}
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                id="games-search-input"
                type="text"
                placeholder="ゲーム名、パッケージ名、ジャンルで検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-white/[0.1] bg-[#06081c]/90 py-3.5 pl-11 pr-4 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 focus:outline-none transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  id="clear-search-btn"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-400 self-end sm:self-auto font-mono">
              <span>ライブラリ該当:</span>
              <span className="font-bold text-white text-sm bg-[#0c102e] px-3 py-1 rounded-xl border border-white/[0.1] text-cyan-300">
                {filteredGames.length} タイトル
              </span>
            </div>
          </div>

          {/* Category Chips Scrollbar with Favorites Tab */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            <button
              id="cat-all-btn"
              onClick={() => setSelectedCategory('all')}
              className={`rounded-2xl px-4 py-2 text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white shadow-lg shadow-violet-600/30 ring-1 ring-white/20'
                  : 'border border-white/[0.08] bg-[#080b24]/90 text-zinc-300 hover:text-white hover:border-white/20'
              }`}
            >
              すべてのゲーム
            </button>

            {/* Favorites Filter Tab */}
            <button
              id="cat-favorites-btn"
              onClick={() => setSelectedCategory('favorites')}
              className={`flex items-center gap-1.5 rounded-2xl px-4 py-2 text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'favorites'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg shadow-amber-500/25 ring-1 ring-white/20'
                  : 'border border-amber-500/30 bg-[#080b24]/90 text-amber-300 hover:text-amber-200 hover:border-amber-400/50'
              }`}
            >
              <Bookmark className="h-3.5 w-3.5 fill-current" />
              <span>お気に入り ({favorites.size})</span>
            </button>

            {categories
              .filter((c) => c.key !== 'all')
              .map((cat, idx) => {
                const label = CATEGORY_NAMES_JA[cat.key.toLowerCase()] || cat.name;
                const isSelected = selectedCategory === cat.key;
                return (
                  <button
                    key={`cat-${cat.key || idx}-${idx}`}
                    id={`cat-${cat.key}-btn`}
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/25 ring-1 ring-white/20'
                        : 'border border-white/[0.08] bg-[#080b24]/90 text-zinc-300 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <span>{label}</span>
                    {cat.count > 0 && (
                      <span className="rounded-full bg-white/[0.1] px-2 py-0.2 text-[10px] text-zinc-300 font-medium">
                        {cat.count}
                      </span>
                    )}
                  </button>
                );
              })}
          </div>
        </div>

        {/* Loading Skeleton or Game Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
            {Array.from({ length: 18 }).map((_, i) => (
              <div
                key={`catalog-skeleton-${i}`}
                className="animate-pulse rounded-3xl border border-white/[0.08] bg-[#0d102b] p-3.5 space-y-3"
              >
                <div className="aspect-square w-full rounded-2xl bg-zinc-800/80" />
                <div className="h-3.5 w-3/4 rounded bg-zinc-800/80" />
                <div className="h-2.5 w-1/2 rounded bg-zinc-800/80" />
              </div>
            ))}
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-3xl border border-white/[0.08] bg-[#0b0e26]/60 p-8">
            <AlertCircle className="h-12 w-12 text-zinc-600 mb-3" />
            <h3 className="text-base font-bold text-white">該当するゲームが見つかりませんでした</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm">
              {selectedCategory === 'favorites'
                ? 'お気に入りに登録されたゲームがまだありません。ゲームカードの★マークを押して登録してみましょう！'
                : `「${searchQuery}」に一致するタイトルがありません。別のキーワードをお試しください。`}
            </p>
            <button
              id="reset-filter-btn"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="mt-4 rounded-xl bg-[#141840] border border-white/[0.08] px-5 py-2.5 text-xs font-bold text-zinc-200 hover:bg-[#1f245c] cursor-pointer transition-colors"
            >
              すべてのゲームを表示
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
            {filteredGames.map((game, idx) => {
              const isMaintenance = game.status === 4;
              const isFav = favorites.has(game.package_name);
              return (
                <div
                  key={`game-${game.package_name}-${idx}`}
                  className="cyber-glass-card-interactive group relative flex flex-col justify-between rounded-3xl p-3.5 transition-all duration-200 shadow-lg"
                >
                  <div>
                    {/* Game Icon with Hover Play Trigger & Favorite Button */}
                    <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-[#070814] border border-white/[0.08] shadow-inner">
                      <img
                        src={game.icon_url}
                        alt={game.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLElement).style.opacity = '0.5';
                        }}
                      />

                      {/* Favorite Button Overlay */}
                      <button
                        onClick={(e) => handleToggleFavorite(e, game)}
                        className={`absolute top-2 right-2 p-1.5 rounded-xl border backdrop-blur-md shadow-md transition-all cursor-pointer z-10 ${
                          isFav
                            ? 'bg-amber-500 border-amber-400 text-black'
                            : 'bg-black/50 border-white/20 text-zinc-300 hover:text-amber-300 hover:bg-black/75'
                        }`}
                        title={isFav ? 'お気に入り解除' : 'お気に入り登録'}
                      >
                        <Bookmark className="h-3.5 w-3.5 fill-current" />
                      </button>

                      {isMaintenance && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/75 backdrop-blur-xs">
                          <span className="rounded-lg bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
                            メンテナンス中
                          </span>
                        </div>
                      )}

                      {/* Hover Play Overlay */}
                      {!isMaintenance && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 backdrop-blur-xs transition-opacity duration-200 group-hover:opacity-100">
                          <button
                            id={`play-overlay-${game.package_name.replace(/[^a-zA-Z0-9]/g, '-')}`}
                            onClick={() => onLaunchGame(game)}
                            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 text-white shadow-xl shadow-cyan-500/40 hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                            title={`${game.title} をプレイ`}
                          >
                            <Play className="h-5 w-5 fill-current ml-0.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Title & Metadata */}
                    <div className="mt-3 space-y-1">
                      <div className="flex items-start justify-between gap-1">
                        <h4
                          className="font-bold text-xs sm:text-sm text-zinc-100 line-clamp-1 group-hover:text-cyan-300 transition-colors flex-1"
                          title={game.title}
                        >
                          {game.title}
                        </h4>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400 line-clamp-1">
                          {game.categories
                            ?.map((cat) => CATEGORY_NAMES_JA[cat.toLowerCase()] || cat)
                            .join(', ') || 'ゲーム'}
                        </span>
                        <button
                          onClick={() => setReviewModalGame({ id: game.package_name, title: game.title })}
                          className="text-[10px] text-amber-300 hover:text-amber-200 flex items-center gap-0.5 cursor-pointer flex-shrink-0"
                          title="レビューを見る・書く"
                        >
                          <Star className="h-3 w-3 fill-current" />
                          <span>評価</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Play Action Button */}
                  <div className="mt-3 pt-2.5 border-t border-white/[0.08]">
                    <button
                      id={`game-card-play-btn-${game.package_name.replace(/[^a-zA-Z0-9]/g, '-')}`}
                      disabled={isMaintenance}
                      onClick={() => onLaunchGame(game)}
                      className={`w-full flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all cursor-pointer ${
                        isMaintenance
                          ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-violet-600/30 via-indigo-600/30 to-cyan-600/30 border border-cyan-500/40 text-cyan-200 hover:bg-gradient-to-r hover:from-violet-600 hover:to-cyan-500 hover:text-white shadow-md hover:shadow-cyan-500/25'
                      }`}
                    >
                      <Play className="h-3 w-3 fill-current" />
                      <span>{isMaintenance ? '利用不可' : 'プレイ'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewModalGame && (
        <GameReviewModal
          isOpen={true}
          onClose={() => setReviewModalGame(null)}
          gameId={reviewModalGame.id}
          gameTitle={reviewModalGame.title}
          user={user}
          onOpenAuth={onOpenAuth}
        />
      )}
    </div>
  );
};
