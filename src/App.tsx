import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { GameCatalog } from './components/GameCatalog';
import { InPlayPlayer } from './components/InPlayPlayer';
import { ClassroomCloak } from './components/ClassroomCloak';
import { HelpGuideModal } from './components/HelpGuideModal';
import { AuthModal } from './components/AuthModal';
import { SAIGameCreator } from './components/SAIGameCreator';
import { GameReviewModal } from './components/GameReviewModal';
import { PasswordGateScreen } from './components/PasswordGateScreen';
import { SGamesBootScreen } from './components/SGamesBootScreen';
import { SGamesTutorialModal } from './components/SGamesTutorialModal';
import { AchievementToastNotification } from './components/AchievementToastNotification';
import { SocialChatModal } from './components/SocialChatModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Lock, BookOpen, MessageSquare } from 'lucide-react';
import { soundFX } from './lib/sound';
import { CloudmoonGame, CloudmoonCategory, CloudmoonServer, ViewMode } from './types';
import { auth, onAuthStateChanged, User, db } from './lib/firebase';
import { collection, query, where, onSnapshot, doc, setDoc, serverTimestamp, updateDoc, increment } from 'firebase/firestore';
import { checkAndNotifyNewAchievements } from './lib/achievements';

export default function App() {
  const [games, setGames] = useState<CloudmoonGame[]>([]);
  const [categories, setCategories] = useState<CloudmoonCategory[]>([]);
  const [servers, setServers] = useState<CloudmoonServer[]>([]);
  const [selectedServer, setSelectedServer] = useState<number | null>(null);
  const [memberCount, setMemberCount] = useState<string>('350000');
  const [loading, setLoading] = useState<boolean>(true);

  // S games Entry Access Gate State
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const sessionUnlocked = sessionStorage.getItem('sgames_unlocked_session') === 'true';
    const rememberDevice = localStorage.getItem('sgames_remember_device') === 'true';
    const deviceUnlocked = localStorage.getItem('sgames_device_unlocked') === 'true';
    return !(sessionUnlocked || (rememberDevice && deviceUnlocked));
  });

  // Cyber Startup Boot Screen & Interactive Tutorial States
  const [isBooting, setIsBooting] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);

  const [currentView, setCurrentView] = useState<ViewMode>('catalog');
  const [activeGame, setActiveGame] = useState<CloudmoonGame | null>(null);
  const [currentStreamUrl, setCurrentStreamUrl] = useState<string>('https://2608moon.firebaseapp.com/ja/');
  const [isCloaked, setIsCloaked] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [playerKey, setPlayerKey] = useState<number>(0);
  const [hasVisitedPlayer, setHasVisitedPlayer] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [initialSharedGameId, setInitialSharedGameId] = useState<string | null>(null);

  // User Profile Telemetry Stats for AuthModal & Achievements
  const [savedGamesCount, setSavedGamesCount] = useState<number>(0);
  const [favoritesCount, setFavoritesCount] = useState<number>(0);
  const [historyCount, setHistoryCount] = useState<number>(0);
  const [userXP, setUserXP] = useState<number>(0);
  const [userLevel, setUserLevel] = useState<number>(1);
  const [authModalTab, setAuthModalTab] = useState<'profile' | 'achievements' | 'features' | 'settings'>('profile');

  // Global Review Modal
  const [reviewModalGame, setReviewModalGame] = useState<{ id: string; title: string } | null>(null);

  // Social & Real-time Chat Modal State
  const [showSocialModal, setShowSocialModal] = useState<boolean>(false);
  const [incomingRequestsCount, setIncomingRequestsCount] = useState<number>(0);

  // Parse direct shared game link from URL (e.g. ?game=xyz or ?sai=xyz)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const sharedGame = params.get('game') || params.get('sai');
      if (sharedGame) {
        setInitialSharedGameId(sharedGame);
        setCurrentView('ai-creator');
      }
    } catch (e) {
      console.warn('URL parsing error:', e);
    }
  }, []);

  // Subscribe to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to user telemetry statistics if logged in
  useEffect(() => {
    if (!user) {
      setSavedGamesCount(0);
      setFavoritesCount(0);
      setHistoryCount(0);
      setUserXP(0);
      setUserLevel(1);
      return;
    }

    // 1. My created games count
    const gamesQ = query(collection(db, 'games'), where('creatorUid', '==', user.uid));
    const unsubGames = onSnapshot(gamesQ, (snap) => setSavedGamesCount(snap.size), () => {});

    // 2. Favorites count
    const favsQ = collection(db, 'users', user.uid, 'favorites');
    const unsubFavs = onSnapshot(favsQ, (snap) => setFavoritesCount(snap.size), () => {});

    // 3. Play History count
    const histQ = collection(db, 'users', user.uid, 'history');
    const unsubHist = onSnapshot(histQ, (snap) => setHistoryCount(snap.size), () => {});

    // 4. User profile document for XP and Level
    const unsubProfile = onSnapshot(
      doc(db, 'users', user.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserXP(data.xp || 0);
          setUserLevel(data.level || 1);
        }
      },
      () => {}
    );

    return () => {
      unsubGames();
      unsubFavs();
      unsubHist();
      unsubProfile();
    };
  }, [user]);

  // Subscribe to incoming friend requests to show notification badge
  useEffect(() => {
    if (!user) {
      setIncomingRequestsCount(0);
      return;
    }
    const reqQ = query(
      collection(db, 'friendRequests'),
      where('toUid', '==', user.uid),
      where('status', '==', 'pending')
    );
    const unsub = onSnapshot(
      reqQ,
      (snapshot) => {
        setIncomingRequestsCount(snapshot.size);
      },
      () => {}
    );
    return () => unsub();
  }, [user]);

  // Check and trigger slide-in notification when achievements are unlocked
  useEffect(() => {
    checkAndNotifyNewAchievements(
      {
        historyCount,
        savedGamesCount,
        favoritesCount,
        xp: userXP,
        level: userLevel,
        stealthUsed:
          typeof window !== 'undefined' && localStorage.getItem('sgames_stealth_used') === 'true',
        lockUsed:
          typeof window !== 'undefined' && localStorage.getItem('sgames_lock_used') === 'true',
      },
      user?.uid
    );
  }, [historyCount, savedGamesCount, favoritesCount, userXP, userLevel, user?.uid]);

  // Fetch games, categories, servers from Cloudmoon API via our backend with instant caching
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [gamesRes, catRes, srvRes] = await Promise.allSettled([
          fetch('/api/cloudmoon/games').then((r) => (r.ok ? r.json() : null)),
          fetch('/api/cloudmoon/categories').then((r) => (r.ok ? r.json() : null)),
          fetch('/api/cloudmoon/servers').then((r) => (r.ok ? r.json() : null)),
        ]);

        if (gamesRes.status === 'fulfilled' && gamesRes.value?.data?.list) {
          setGames(gamesRes.value.data.list);
          if (gamesRes.value.data.member_count) {
            setMemberCount(gamesRes.value.data.member_count);
          }
        }

        if (catRes.status === 'fulfilled' && catRes.value?.data?.list) {
          setCategories(catRes.value.data.list);
        }

        if (srvRes.status === 'fulfilled' && srvRes.value?.data?.list) {
          const srvList = srvRes.value.data.list;
          setServers(srvList);
          if (srvList.length > 0) {
            setSelectedServer(srvList[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load initial Cloudmoon data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Synchronize dynamic Title & Favicon for Classroom stealth disguise & Japanese labeling
  useEffect(() => {
    let favicon = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }

    if (isCloaked) {
      document.title = 'ホーム - Classroom';
      favicon.href = 'https://ssl.gstatic.com/classroom/favicon.png';
    } else if (isLocked) {
      document.title = 'ログイン - Google アカウント';
      favicon.href = 'https://ssl.gstatic.com/classroom/favicon.png';
    } else {
      if (currentView === 'player' && activeGame) {
        document.title = `${activeGame.title} - S games (2608moon)`;
      } else if (currentView === 'ai-creator') {
        document.title = 'S AI ゲーム作成スタジオ - S games';
      } else {
        document.title = 'S games - 2608moon 日本語クラウドゲーム';
      }
      favicon.href = 'https://ssl.gstatic.com/classroom/favicon.png';
    }
  }, [isCloaked, isLocked, currentView, activeGame]);

  // Unlock, Boot Sequence and Lock handlers
  const handleUnlock = useCallback(() => {
    setIsLocked(false);
    setIsBooting(true);
  }, []);

  const handleBootComplete = useCallback(() => {
    setIsBooting(false);
    const tutorialCompleted = localStorage.getItem('sgames_tutorial_completed') === 'true';
    if (!tutorialCompleted) {
      setShowTutorial(true);
    }
  }, []);

  const handleLockApp = useCallback(() => {
    soundFX.playLockEngage();
    localStorage.setItem('sgames_lock_used', 'true');
    sessionStorage.removeItem('sgames_unlocked_session');
    localStorage.removeItem('sgames_device_unlocked');
    setIsLocked(true);
    setIsBooting(false);
  }, []);

  // Launch a game from the catalog into the 2608moon Japanese runner
  const handleLaunchGame = useCallback((game: CloudmoonGame) => {
    setActiveGame(game);
    setHasVisitedPlayer(true);
    const targetUrl = `https://2608moon.firebaseapp.com/ja/game/${encodeURIComponent(game.package_name)}/`;
    setCurrentStreamUrl(targetUrl);
    setCurrentView('player');
    setPlayerKey((prev) => prev + 1);

    // Record session into Firestore for logged-in user
    if (user) {
      try {
        const pkg = game.package_name;
        setDoc(
          doc(db, 'users', user.uid, 'history', pkg),
          {
            packageName: pkg,
            title: game.title,
            iconUrl: game.icon_url,
            lastPlayedAt: serverTimestamp(),
          },
          { merge: true }
        ).catch(() => {});

        // Add XP for game play
        updateDoc(doc(db, 'users', user.uid), {
          xp: increment(30),
        }).catch(() => {});
      } catch (e) {}
    }
  }, [user]);

  // Launch a custom package or URL
  const handleLaunchCustomUrl = useCallback((url: string) => {
    setActiveGame(null);
    setHasVisitedPlayer(true);
    let target = url;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      target = url;
    } else {
      target = `https://2608moon.firebaseapp.com/ja/game/${encodeURIComponent(url)}/`;
    }
    setCurrentStreamUrl(target);
    setCurrentView('player');
    setPlayerKey((prev) => prev + 1);
  }, []);

  // Switch view with visited tracking
  const handleViewChange = useCallback((view: ViewMode) => {
    if (view === 'player') {
      setHasVisitedPlayer(true);
    }
    setCurrentView(view);
  }, []);

  // Reload current player stream
  const handleReloadPlayer = useCallback(() => {
    setPlayerKey((prev) => prev + 1);
  }, []);

  // Toggle Classroom Stealth Cloak
  const handleToggleCloak = useCallback(() => {
    setIsCloaked((prev) => {
      const next = !prev;
      if (next) {
        localStorage.setItem('sgames_stealth_used', 'true');
      }
      return next;
    });
  }, []);

  const selectedServerObj = servers.find((s) => s.id === selectedServer);

  return (
    <div className="min-h-screen w-full cyber-canvas-bg font-sans text-zinc-100 antialiased selection:bg-cyan-500 selection:text-black relative overflow-x-hidden">
      {/* Top Achievement Unlocked Slide-In Notification */}
      <AchievementToastNotification
        onOpenAchievements={() => {
          setAuthModalTab('achievements');
          setShowAuthModal(true);
        }}
      />

      {/* Dynamic Ambient Neon Glow Orbs in Background */}
      <div className="fixed top-[-10%] left-[-5%] h-[500px] w-[500px] rounded-full bg-violet-600/15 blur-[120px] pointer-events-none animate-float-orb -z-10" />
      <div
        className="fixed top-[20%] right-[-10%] h-[600px] w-[600px] rounded-full bg-cyan-500/12 blur-[140px] pointer-events-none animate-float-orb -z-10"
        style={{ animationDelay: '-4s' }}
      />
      <div
        className="fixed bottom-[-10%] left-[30%] h-[550px] w-[550px] rounded-full bg-indigo-600/10 blur-[130px] pointer-events-none animate-float-orb -z-10"
        style={{ animationDelay: '-2s' }}
      />

      {isCloaked ? (
        <ClassroomCloak onExitCloak={() => setIsCloaked(false)} />
      ) : isLocked ? (
        <PasswordGateScreen
          onUnlock={handleUnlock}
          onToggleCloak={handleToggleCloak}
        />
      ) : isBooting ? (
        <SGamesBootScreen onComplete={handleBootComplete} />
      ) : (
        <>
          <Navbar
            currentView={currentView}
            onViewChange={handleViewChange}
            servers={servers}
            selectedServer={selectedServer}
            onSelectServer={setSelectedServer}
            onOpenHelp={() => setShowHelpModal(true)}
            isCloaked={isCloaked}
            onToggleCloak={handleToggleCloak}
            activeGameTitle={activeGame?.title}
            onReloadPlayer={handleReloadPlayer}
            user={user}
            onOpenAuth={() => setShowAuthModal(true)}
            onLockApp={handleLockApp}
            onOpenTutorial={() => setShowTutorial(true)}
            onOpenSocial={() => setShowSocialModal(true)}
            socialBadgeCount={incomingRequestsCount}
          />

          <main className="w-full relative z-10">
            {/* Game Catalog View */}
            <div className={currentView === 'catalog' ? 'block' : 'hidden'}>
              <GameCatalog
                games={games}
                categories={categories}
                memberCount={memberCount}
                loading={loading}
                user={user}
                onOpenAuth={() => setShowAuthModal(true)}
                onLaunchGame={handleLaunchGame}
                onLaunchCustomUrl={handleLaunchCustomUrl}
                onOpenAICreator={() => setCurrentView('ai-creator')}
                onLaunchCommunityGame={(gameId) => {
                  setInitialSharedGameId(gameId);
                  setCurrentView('ai-creator');
                }}
              />
            </div>

            {/* S AI Game Creator Studio View */}
            <div className={currentView === 'ai-creator' ? 'block' : 'hidden'}>
              <SAIGameCreator
                user={user}
                onOpenAuth={() => setShowAuthModal(true)}
                onPlayCloudmoonGame={() => setCurrentView('catalog')}
                initialGameId={initialSharedGameId}
                onClearInitialGameId={() => setInitialSharedGameId(null)}
              />
            </div>

            {/* InPlay Player View - Kept active in DOM once loaded for 0ms tab switching & instant gameplay */}
            {hasVisitedPlayer && (
              <div className={currentView === 'player' ? 'block' : 'hidden'}>
                <InPlayPlayer
                  key={playerKey}
                  initialUrl={currentStreamUrl}
                  activeGame={activeGame}
                  onBackToCatalog={() => setCurrentView('catalog')}
                  onToggleCloak={handleToggleCloak}
                  serverRegionName={selectedServerObj?.name || 'アジア'}
                  user={user}
                  onOpenReview={(gameId, gameTitle) => setReviewModalGame({ id: gameId, title: gameTitle })}
                />
              </div>
            )}
          </main>

          {/* Futuristic Platform Cockpit Footer */}
          <footer className="mt-20 border-t border-white/[0.08] bg-[#050716]/90 backdrop-blur-2xl py-10 relative z-10">
            <div className="mx-auto max-w-7xl px-4 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 p-[1.5px] shadow-lg shadow-cyan-500/20">
                  <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#070918]">
                    <span className="font-black text-sm text-cyan-300">S</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-white tracking-tight">S games</span>
                    <span className="rounded-md bg-cyan-950/80 border border-cyan-500/30 px-1.5 py-0.2 text-[9px] font-mono text-cyan-300">
                      v3.8 ULTRA
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    2608moon / Cloudmoon 日本語クラウドゲーミング &amp; S AI 3Dジェネレーター
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-400">
                <button
                  onClick={() => setShowHelpModal(true)}
                  className="hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  利用ガイド
                </button>
                <span className="text-zinc-700">•</span>
                <button
                  onClick={() => setShowTutorial(true)}
                  className="hover:text-cyan-300 transition-colors cursor-pointer flex items-center gap-1 text-cyan-400"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>チュートリアル</span>
                </button>
                <span className="text-zinc-700">•</span>
                <button
                  onClick={handleToggleCloak}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Classroom 瞬時偽装
                </button>
                <span className="text-zinc-700">•</span>
                <button
                  onClick={() => setCurrentView('ai-creator')}
                  className="hover:text-amber-300 transition-colors cursor-pointer"
                >
                  S AI スタジオ
                </button>
                <span className="text-zinc-700">•</span>
                <button
                  onClick={handleLockApp}
                  className="hover:text-amber-300 text-amber-400/90 transition-colors cursor-pointer flex items-center gap-1 font-medium"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>S gamesを施錠 (パスワード画面)</span>
                </button>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-mono bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>全ストリーミングノード正常稼働中</span>
              </div>
            </div>
          </footer>

          <HelpGuideModal
            isOpen={showHelpModal}
            onClose={() => setShowHelpModal(false)}
            onReplayBoot={() => setIsBooting(true)}
          />

          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            user={user}
            savedGamesCount={savedGamesCount}
            favoritesCount={favoritesCount}
            historyCount={historyCount}
            initialTab={authModalTab}
            onOpenMyGames={() => {
              setShowAuthModal(false);
              setCurrentView('ai-creator');
            }}
          />

          {reviewModalGame && (
            <GameReviewModal
              isOpen={true}
              onClose={() => setReviewModalGame(null)}
              gameId={reviewModalGame.id}
              gameTitle={reviewModalGame.title}
              user={user}
              onOpenAuth={() => setShowAuthModal(true)}
            />
          )}

          <SGamesTutorialModal
            isOpen={showTutorial}
            onClose={() => setShowTutorial(false)}
            onLaunchCreator={() => {
              setShowTutorial(false);
              setCurrentView('ai-creator');
            }}
          />

          {/* Floating Quick Action Pill for Chat & Friends */}
          <button
            id="floating-social-btn"
            onClick={() => {
              soundFX.playKeyClick();
              setShowSocialModal(true);
            }}
            title="フレンド & チャットを開く"
            className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full border border-cyan-400/40 bg-gradient-to-r from-[#0d102c]/95 via-[#13173d]/95 to-[#1c1445]/95 hover:border-cyan-300 hover:from-cyan-950 hover:to-violet-950 px-3.5 sm:px-4 py-2.5 text-xs font-black text-cyan-300 shadow-[0_8px_32px_rgba(0,0,0,0.75)] hover:shadow-[0_0_25px_rgba(6,182,212,0.45)] hover:scale-105 transition-all backdrop-blur-2xl cursor-pointer group"
          >
            <div className="relative">
              <MessageSquare className="h-4 w-4 text-cyan-400 group-hover:rotate-12 transition-transform" />
              {incomingRequestsCount > 0 ? (
                <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-400 text-[9px] font-black text-black animate-bounce">
                  {incomingRequestsCount}
                </span>
              ) : (
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              )}
            </div>
            <span className="tracking-tight font-bold">チャット &amp; フレンド</span>
          </button>

          {/* Social & Real-time Chat Modal */}
          <ErrorBoundary>
            <SocialChatModal
              isOpen={showSocialModal}
              onClose={() => setShowSocialModal(false)}
              user={user}
              onOpenAuth={() => setShowAuthModal(true)}
              onLaunchGame={(pkg) => {
                const matched = games.find((g) => g.package_name === pkg);
                if (matched) {
                  handleLaunchGame(matched);
                } else {
                  handleLaunchGame({
                    package_name: pkg,
                    title: pkg,
                    icon_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200',
                    status: 1,
                    is_beta: false,
                    categories: ['game'],
                  });
                }
              }}
              onLaunchCommunityGame={(gameId) => {
                setInitialSharedGameId(gameId);
                setCurrentView('ai-creator');
              }}
            />
          </ErrorBoundary>
        </>
      )}
    </div>
  );
}
