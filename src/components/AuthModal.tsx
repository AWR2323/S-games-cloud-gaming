import React, { useState, useEffect, useMemo } from 'react';
import { User } from 'firebase/auth';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithCredential,
  GoogleAuthProvider,
  signInAnonymously,
  updateProfile,
  signOut,
  db,
} from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { soundFX } from '../lib/sound';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  X,
  LogOut,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Gamepad2,
  Trophy,
  Award,
  Zap,
  CheckCircle2,
  Edit3,
  Save,
  Star,
  Bookmark,
  History,
  Sliders,
  Radio,
  ChevronRight,
} from 'lucide-react';
import { UserProfile } from '../types';
import { calculateAchievements, syncUnlockedBadgesToFirestore } from '../lib/achievements';
import { AchievementCollectionSection } from './AchievementCollectionSection';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  savedGamesCount?: number;
  favoritesCount?: number;
  historyCount?: number;
  onOpenMyGames?: () => void;
  initialTab?: 'profile' | 'achievements' | 'features' | 'settings';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  user,
  savedGamesCount = 0,
  favoritesCount = 0,
  historyCount = 0,
  onOpenMyGames,
  initialTab,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isEditingGamerTag, setIsEditingGamerTag] = useState<boolean>(false);
  const [gamerTagInput, setGamerTagInput] = useState<string>('');
  const [controllerLayout, setControllerLayout] = useState<'default' | 'wasd' | 'arrows'>('default');
  const [activeTab, setActiveTab] = useState<'profile' | 'achievements' | 'features' | 'settings'>('profile');

  // Update tab if initialTab changed when opened
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Load Firestore profile on mount or user change
  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      return;
    }

    const loadProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data() as any;
          setUserProfile({
            uid: user.uid,
            displayName: data.displayName || user.displayName || 'S games プレイヤー',
            gamerTag: data.gamerTag || `S-Player-${user.uid.slice(0, 5)}`,
            email: user.email || '',
            photoURL: data.photoURL || user.photoURL || '',
            provider: 'google.com',
            level: data.level || 3,
            xp: data.xp || 350,
            bio: data.bio || 'S games 2608moon クラウドゲーマー',
            controllerLayout: data.controllerLayout || 'default',
          });
          setGamerTagInput(data.gamerTag || `S-Player-${user.uid.slice(0, 5)}`);
          if (data.controllerLayout) setControllerLayout(data.controllerLayout);
        } else {
          // Initialize profile
          const initialTag = `S-Player-${user.uid.slice(0, 5)}`;
          const initialProfile: UserProfile = {
            uid: user.uid,
            displayName: user.displayName || 'S games プレイヤー',
            gamerTag: initialTag,
            email: user.email || '',
            photoURL: user.photoURL || '',
            provider: 'google.com',
            level: 1,
            xp: 100,
            bio: 'S games 2608moon クラウドゲーマー',
            controllerLayout: 'default',
          };
          await setDoc(
            doc(db, 'users', user.uid),
            {
              ...initialProfile,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
          setUserProfile(initialProfile);
          setGamerTagInput(initialTag);
        }
      } catch (err) {
        console.warn('Could not fetch user profile from Firestore:', err);
      }
    };

    loadProfile();
  }, [user]);

  // Synchronize authenticated Firebase user into Firestore profile and local state
  const syncFirebaseUserProfile = async (firebaseUser: User) => {
    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userDocRef);

      const defaultDisplayName =
        firebaseUser.displayName ||
        firebaseUser.email?.split('@')[0] ||
        'S games ゲーマー';

      const defaultGamerTag = firebaseUser.displayName
        ? `Player-${firebaseUser.displayName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10) || 'Gamer'}`
        : `Player-${firebaseUser.uid.slice(0, 6)}`;

      let profileData: UserProfile;

      if (userSnap.exists()) {
        profileData = userSnap.data() as UserProfile;
        if (firebaseUser.photoURL && profileData.photoURL !== firebaseUser.photoURL) {
          profileData.photoURL = firebaseUser.photoURL;
        }
        if (firebaseUser.email && !profileData.email) {
          profileData.email = firebaseUser.email;
        }
        if (firebaseUser.displayName && (!profileData.displayName || profileData.displayName === 'ゲストプレイヤー')) {
          profileData.displayName = firebaseUser.displayName;
        }
      } else {
        profileData = {
          uid: firebaseUser.uid,
          displayName: defaultDisplayName,
          gamerTag: defaultGamerTag,
          email: firebaseUser.email || '',
          photoURL: firebaseUser.photoURL || 'https://lh3.googleusercontent.com/a/default-user=s96-c',
          provider: firebaseUser.isAnonymous ? 'guest' : 'google.com',
          level: 1,
          xp: 250,
          bio: 'S games 2608moon クラウドゲーマー',
          controllerLayout: 'default',
        };
      }

      await setDoc(
        userDocRef,
        {
          ...profileData,
          updatedAt: serverTimestamp(),
          lastLoginAt: new Date().toISOString(),
        },
        { merge: true }
      );

      setUserProfile(profileData);
      setGamerTagInput(profileData.gamerTag || defaultGamerTag);
    } catch (dbErr) {
      console.warn('Firestore user profile sync warning:', dbErr);
      const fallbackProfile: UserProfile = {
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName || 'S games プレイヤー',
        gamerTag: `Player-${firebaseUser.uid.slice(0, 6)}`,
        email: firebaseUser.email || '',
        photoURL: firebaseUser.photoURL || '',
        provider: firebaseUser.isAnonymous ? 'guest' : 'google.com',
        level: 1,
        xp: 250,
        bio: 'S games 2608moon クラウドゲーマー',
        controllerLayout: 'default',
      };
      setUserProfile(fallbackProfile);
      setGamerTagInput(fallbackProfile.gamerTag);
    }
  };

  // Google Identity Services (GSI) init for inside-iframe environment
  useEffect(() => {
    if (isOpen && !user && (window as any).google?.accounts?.id && firebaseConfig.oAuthClientId) {
      try {
        (window as any).google.accounts.id.initialize({
          client_id: firebaseConfig.oAuthClientId,
          callback: async (response: { credential?: string }) => {
            if (response?.credential) {
              setLoading(true);
              setErrorMsg(null);
              try {
                const cred = GoogleAuthProvider.credential(response.credential);
                const userCred = await signInWithCredential(auth, cred);
                if (userCred.user) {
                  await syncFirebaseUserProfile(userCred.user);
                  soundFX.playUnlockSuccess();
                  setActiveTab('profile');
                }
              } catch (gsiErr: any) {
                console.error('GSI Firebase Credential Sign-In Error:', gsiErr);
                setErrorMsg(`Google認証エラー: ${gsiErr.message || gsiErr.code}`);
              } finally {
                setLoading(false);
              }
            }
          },
        });
      } catch (e) {
        console.warn('Google Identity Services init error:', e);
      }
    }
  }, [isOpen, user]);

  // Standard Firebase Google Sign-In Handler
  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setLoading(true);

    try {
      // 1. Direct Firebase Google Auth Popup
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await syncFirebaseUserProfile(result.user);
        soundFX.playUnlockSuccess();
        setActiveTab('profile');
      }
    } catch (err: any) {
      console.error('Firebase Google Sign-In Error:', err);

      // Attempt GSI prompt if popup was blocked or failed in iframe
      if ((window as any).google?.accounts?.id) {
        try {
          (window as any).google.accounts.id.prompt();
        } catch (gsiPromptErr) {
          console.warn('GSI prompt fallback error:', gsiPromptErr);
        }
      }

      if (err.code === 'auth/popup-blocked') {
        setErrorMsg('ブラウザのポップアップがブロックされました。ブラウザでポップアップを許可するか、下の「別ウィンドウで開く」をご利用ください。');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Google認証ウィンドウが閉じられました。');
      } else if (err.code === 'auth/unauthorized-domain') {
        setErrorMsg('Firebase承認ドメインの制限です。画面下の「別ウィンドウで開く」から直接アクセスしてください。');
      } else if (err.code === 'auth/cancelled-popup-request') {
        setErrorMsg('前回のログインリクエストがキャンセルされました。もう一度お試しください。');
      } else {
        setErrorMsg(`Google認証エラー (${err.code || err.message || '不明'})。画面が黒くなる場合は、下の「別ウィンドウで開く」をお試しください。`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Guest Mode Sign-In Handler via Firebase Anonymous Auth
  const handleGuestSignIn = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const result = await signInAnonymously(auth);
      if (result.user) {
        await syncFirebaseUserProfile(result.user);
        soundFX.playUnlockSuccess();
        setActiveTab('profile');
      }
    } catch (err: any) {
      console.error('Firebase Guest Sign-In Error:', err);
      setErrorMsg(`ゲスト認証エラー: ${err.message || err.code}`);
    } finally {
      setLoading(false);
    }
  };


  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOut(auth);
      setUserProfile(null);
      onClose();
    } catch (err: any) {
      console.error('Sign Out Error:', err);
      setErrorMsg(err.message || 'ログアウトに失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  // Save custom gamer tag
  const handleSaveGamerTag = async () => {
    if (!user || !gamerTagInput.trim()) return;
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          gamerTag: gamerTagInput.trim(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setUserProfile((prev) => (prev ? { ...prev, gamerTag: gamerTagInput.trim() } : null));
      setIsEditingGamerTag(false);
    } catch (err) {
      console.error('Error saving gamer tag:', err);
    }
  };

  // Save controller layout preference
  const handleSaveControllerLayout = async (layout: 'default' | 'wasd' | 'arrows') => {
    setControllerLayout(layout);
    if (!user) return;
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          controllerLayout: layout,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.error('Error saving controller layout:', err);
    }
  };

  // Calculate XP Progress for next level
  const userLevel = userProfile?.level || 1;
  const userXP = userProfile?.xp || 150;
  const xpNeeded = userLevel * 200;
  const xpPercent = Math.min(100, Math.round((userXP / xpNeeded) * 100));

  // Calculate dynamic achievement progress across play counts and accomplishments
  const achievementStats = useMemo(() => {
    return calculateAchievements({
      historyCount,
      savedGamesCount,
      favoritesCount,
      xp: userXP,
      level: userLevel,
      stealthUsed: typeof window !== 'undefined' && localStorage.getItem('sgames_stealth_used') === 'true',
      lockUsed: typeof window !== 'undefined' && localStorage.getItem('sgames_lock_used') === 'true',
    });
  }, [historyCount, savedGamesCount, favoritesCount, userXP, userLevel]);

  // Persist newly unlocked badges to Firestore user profile
  useEffect(() => {
    if (user && achievementStats.unlockedIds.length > 0) {
      syncUnlockedBadgesToFirestore(user.uid, achievementStats.unlockedIds);
    }
  }, [user, achievementStats.unlockedIds.length]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#060818]/75 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-white/[0.12] bg-gradient-to-b from-[#0f1338] via-[#0b0e2b] to-[#070818] p-6 sm:p-7 text-zinc-100 shadow-[0_20px_60px_rgba(0,0,0,0.85)] ring-1 ring-white/10">
        {/* Ambient neon orbs */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-56 w-56 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-56 w-56 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          id="close-auth-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-xl p-2 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer z-20"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5 relative z-10">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-violet-600 text-white shadow-lg shadow-cyan-500/30">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <span>S games ゲーマー認証</span>
              <span className="rounded-full bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/40 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300">
                Google クラウド同期
              </span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {user ? '認証済みプレイヤーアカウント & クラウド同期ハブ' : 'Google アカウントで1クリックログイン。セーブ・評価・お気に入り・XPを自動同期'}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-2xl border border-rose-500/40 bg-gradient-to-b from-rose-950/60 to-[#18080f] p-4 text-xs text-rose-200 relative z-10 shadow-lg flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-rose-400" />
            <div className="flex-1 space-y-1">
              <p className="font-bold text-rose-300">ログイン情報</p>
              <p className="leading-relaxed text-zinc-200">{errorMsg}</p>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-zinc-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {user ? (
          /* ================= Authenticated Gamer Dashboard ================= */
          <div className="space-y-4 relative z-10">
            {/* Segmented Profile Tabs */}
            <div className="flex items-center rounded-xl bg-[#06081a]/80 p-1 border border-white/[0.08] text-xs font-bold gap-1">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  activeTab === 'profile'
                    ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                プロフィール &amp; XP
              </button>
              <button
                onClick={() => setActiveTab('achievements')}
                className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
                  activeTab === 'achievements'
                    ? 'bg-gradient-to-r from-amber-500 to-violet-600 text-white shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Trophy className="h-3.5 w-3.5 text-amber-300" />
                <span>実績バッジ</span>
                <span className="text-[10px] bg-black/40 border border-white/10 px-1.5 py-0.2 rounded-full font-mono text-cyan-300">
                  {achievementStats.unlockedCount}/{achievementStats.totalCount}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('features')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  activeTab === 'features'
                    ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                解放機能
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  activeTab === 'settings'
                    ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                キー配置
              </button>
            </div>

            {activeTab === 'profile' && (
              <div className="space-y-3.5 animate-in fade-in duration-150">
                {/* Gamer ID Card with Level & XP */}
                <div className="rounded-2xl border border-white/[0.1] bg-[#12163b]/75 p-4 shadow-xl space-y-3">
                  <div className="flex items-center gap-3.5">
                    <div className="relative">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName || 'ユーザー'}
                          className="h-14 w-14 rounded-2xl border-2 border-cyan-400/60 object-cover shadow-lg"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 font-black text-xl text-white shadow-lg">
                          {user.displayName?.[0] || 'G'}
                        </div>
                      )}
                      <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-black text-black border border-[#12163b]">
                        ★
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        {isEditingGamerTag ? (
                          <div className="flex items-center gap-1.5 flex-1 mr-2">
                            <input
                              type="text"
                              value={gamerTagInput}
                              onChange={(e) => setGamerTagInput(e.target.value)}
                              className="rounded-lg bg-[#080a1c] border border-cyan-400 px-2 py-0.5 text-xs text-white focus:outline-none"
                              placeholder="ゲーマータグを入力"
                              maxLength={20}
                            />
                            <button
                              onClick={handleSaveGamerTag}
                              className="p-1 rounded-md bg-cyan-500 text-black hover:bg-cyan-400 cursor-pointer"
                              title="保存"
                            >
                              <Save className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-white truncate">
                              {userProfile?.gamerTag || user.displayName || 'S-Gamer'}
                            </h4>
                            <button
                              onClick={() => setIsEditingGamerTag(true)}
                              className="text-zinc-400 hover:text-cyan-300 p-0.5 cursor-pointer"
                              title="ゲーマータグを編集"
                            >
                              <Edit3 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                        <span className="rounded-md bg-violet-600/30 border border-violet-500/40 px-2 py-0.5 text-[10px] font-bold text-violet-300">
                          Lv.{userLevel}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">{user.email || 'SNS認証プレイヤー'}</p>
                      <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1.5 font-mono">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                        <span>Firestore クラウド同期中</span>
                      </p>
                    </div>
                  </div>

                  {/* Level & XP Progress Bar */}
                  <div className="space-y-1 pt-1 border-t border-white/[0.06]">
                    <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                      <span>プレイヤーEXP</span>
                      <span className="text-cyan-300 font-bold">{userXP} / {xpNeeded} XP ({xpPercent}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#070918] overflow-hidden border border-white/[0.08]">
                      <div
                        className="h-full bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-400 rounded-full transition-all duration-500"
                        style={{ width: `${xpPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Cloud Telemetry Stats (3 Bento blocks) */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-2xl border border-white/[0.08] bg-[#0c102e]/80 p-2.5 shadow-sm">
                    <Bookmark className="h-4 w-4 mx-auto text-amber-400 mb-1" />
                    <div className="text-lg font-black text-white font-mono">{favoritesCount}</div>
                    <div className="text-[10px] text-zinc-400">お気に入り</div>
                  </div>

                  <div className="rounded-2xl border border-white/[0.08] bg-[#0c102e]/80 p-2.5 shadow-sm">
                    <History className="h-4 w-4 mx-auto text-cyan-400 mb-1" />
                    <div className="text-lg font-black text-white font-mono">{historyCount}</div>
                    <div className="text-[10px] text-zinc-400">プレイ履歴</div>
                  </div>

                  <div
                    onClick={onOpenMyGames}
                    className="rounded-2xl border border-white/[0.08] bg-[#0c102e]/80 p-2.5 shadow-sm hover:border-violet-500/40 cursor-pointer transition-colors"
                  >
                    <Gamepad2 className="h-4 w-4 mx-auto text-violet-400 mb-1" />
                    <div className="text-lg font-black text-white font-mono">{savedGamesCount}</div>
                    <div className="text-[10px] text-zinc-400">作成ゲーム</div>
                  </div>
                </div>

                {/* Dynamic Unlocked Badges Preview */}
                <div className="rounded-2xl border border-white/[0.08] bg-[#0c102e]/60 p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-bold text-zinc-300 flex items-center gap-1.5">
                      <Trophy className="h-3.5 w-3.5 text-amber-400" />
                      <span>獲得した実績バッジ</span>
                      <span className="text-[10px] text-cyan-400 font-mono font-bold">
                        ({achievementStats.unlockedCount}/{achievementStats.totalCount})
                      </span>
                    </div>
                    <button
                      onClick={() => setActiveTab('achievements')}
                      className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 transition-colors cursor-pointer"
                    >
                      <span>コレクション一覧</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {achievementStats.progressList
                      .filter((p) => p.isUnlocked)
                      .slice(0, 6)
                      .map((p) => (
                        <span
                          key={p.badge.id}
                          onClick={() => setActiveTab('achievements')}
                          className="rounded-lg bg-[#101438] border border-cyan-500/40 hover:border-cyan-400 px-2 py-0.5 text-[10px] font-bold text-cyan-300 flex items-center gap-1 cursor-pointer transition-all hover:scale-102 shadow-xs"
                          title={p.badge.description}
                        >
                          <span className="text-amber-400">★</span>
                          <span>{p.badge.title}</span>
                          <span className="text-[9px] text-amber-300 font-mono">+{p.badge.xpReward}XP</span>
                        </span>
                      ))}

                    {achievementStats.unlockedCount === 0 && (
                      <div className="text-[10px] text-zinc-400 py-1">
                        ゲームをプレイまたはS AIでゲームを作ると実績バッジが解放されます！
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Achievement Badges Collection Tab */}
            {activeTab === 'achievements' && (
              <div className="animate-in fade-in duration-150">
                <AchievementCollectionSection
                  progressList={achievementStats.progressList}
                  unlockedCount={achievementStats.unlockedCount}
                  totalCount={achievementStats.totalCount}
                  completionPercent={achievementStats.completionPercent}
                  totalXpEarned={achievementStats.totalXpEarned}
                />
              </div>
            )}

            {activeTab === 'features' && (
              <div className="rounded-2xl border border-white/[0.08] bg-[#0b0e2b]/80 p-4 space-y-3 text-xs animate-in fade-in duration-150">
                <h4 className="font-bold text-cyan-300 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  <span>ログインで有効化されている全機能:</span>
                </h4>
                <div className="space-y-2 text-[11px] text-zinc-300">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">クラウドセーブ &amp; プレイ履歴の完全同期:</strong>
                      <p className="text-zinc-400 text-[10px]">学校やスマホなど別端末で開いても直前のゲームとプレイ時間が復元されます。</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">お気に入り（★）ゲームのワンタップ同期:</strong>
                      <p className="text-zinc-400 text-[10px]">お気に入りに登録した2608moonゲームやS AIゲームを専用タブで即アクセス。</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">S AI 3D/2Dゲームの無制限作成 &amp; 世界公開:</strong>
                      <p className="text-zinc-400 text-[10px]">Gemini APIを活用したオリジナルゲームをクラウド保存し、いいねやプレイ回数を収集。</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">ゲームレビュー &amp; 5つ星評価の投稿:</strong>
                      <p className="text-zinc-400 text-[10px]">他のプレイヤーへ感想やおすすめコメントを投稿可能。</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">プレイヤーXP &amp; レベルアップシステム:</strong>
                      <p className="text-zinc-400 text-[10px]">ゲームをプレイするたびに経験値を獲得し、限定バッジがアンロックされます。</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="rounded-2xl border border-white/[0.08] bg-[#0b0e2b]/80 p-4 space-y-3.5 text-xs animate-in fade-in duration-150">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-cyan-400" />
                  <span>クラウド操作レイアウト設定</span>
                </h4>
                <p className="text-[11px] text-zinc-400">
                  保存された操作配置は、どのPCや端末からログインしても自動的に適用されます。
                </p>

                <div className="space-y-2">
                  {[
                    { id: 'default', label: '標準 (WASD移動 + マウス視点 / タッチ)' },
                    { id: 'wasd', label: 'WASD重視 (FPS / パルクール向け)' },
                    { id: 'arrows', label: '矢印キー配置 (レトロ / アーケード向け)' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSaveControllerLayout(item.id as any)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        controllerLayout === item.id
                          ? 'border-cyan-400/80 bg-cyan-950/40 text-cyan-200 shadow-md shadow-cyan-500/10'
                          : 'border-white/[0.06] bg-[#070918] text-zinc-400 hover:text-white'
                      }`}
                    >
                      <span>{item.label}</span>
                      {controllerLayout === item.id && <CheckCircle2 className="h-4 w-4 text-cyan-400" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="pt-2 flex justify-between gap-3">
              <button
                id="sign-out-btn"
                onClick={handleSignOut}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-[#141842] hover:bg-rose-950/50 hover:border-rose-500/40 px-4 py-2.5 text-xs font-bold text-zinc-200 transition-all cursor-pointer disabled:opacity-50"
              >
                <LogOut className="h-4 w-4 text-rose-400" />
                <span>ログアウト</span>
              </button>

              <button
                onClick={onClose}
                className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-600/30 hover:opacity-90 active:scale-98 transition-all cursor-pointer"
              >
                ダッシュボードを閉じる
              </button>
            </div>
          </div>
        ) : (
          /* ================= Not Logged In: Google Only Login ================= */
          <div className="space-y-4 relative z-10">
            {/* Value Proposition Hero Banner */}
            <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/30 via-indigo-950/20 to-violet-950/30 p-4 space-y-2">
              <h4 className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
                <span>Googleログインで解放されるクラウド機能:</span>
              </h4>
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-zinc-300">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>全ゲームのクラウドセーブ</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>お気に入りゲーム即時同期</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>S AI ゲーム無制限生成</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>プレイヤーXP＆レベルアップ</span>
                </div>
                <div className="flex items-center gap-1.5 col-span-2 pt-1 border-t border-white/[0.06] text-amber-300 font-bold">
                  <Trophy className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                  <span>12+種類の実績バッジコレクション（プレイ数・成果で解放）</span>
                </div>
              </div>
            </div>

            {/* Firebase Google Sign-In Button */}
            <div className="rounded-2xl border-2 border-cyan-400/60 bg-gradient-to-r from-cyan-950/40 via-indigo-950/40 to-violet-950/40 p-1.5 shadow-[0_0_25px_rgba(34,211,238,0.25)]">
              <button
                id="google-signin-btn"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-between rounded-xl bg-white hover:bg-zinc-100 p-3.5 text-xs font-bold text-zinc-900 shadow-xl active:scale-98 transition-all cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  {loading ? (
                    <div className="h-6 w-6 rounded-full border-2 border-zinc-900 border-t-transparent animate-spin" />
                  ) : (
                    <svg className="h-6 w-6 flex-shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <div className="text-left">
                    <div className="font-black text-sm text-zinc-900 leading-tight">Google アカウントでログイン</div>
                    <div className="text-[11px] text-zinc-600 font-normal">Firebase Google認証 • クラウドデータ・セーブ・実績を自動同期</div>
                  </div>
                </div>

                <span className="rounded-full bg-cyan-100 border border-cyan-300 px-3 py-1.5 text-[11px] font-bold text-cyan-800 flex items-center gap-1.5 shadow-xs flex-shrink-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" />
                  <span>Firebase 認証</span>
                </span>
              </button>
            </div>

            {/* Quick Actions & Guest Mode */}
            <div className="pt-2 flex items-center justify-between text-[11px] text-zinc-400 border-t border-white/[0.08]">
              <button
                onClick={() => window.open(window.location.href, '_blank')}
                className="text-cyan-400 hover:text-cyan-300 underline cursor-pointer flex items-center gap-1"
                title="ブラウザポップアップ制限を回避して新しいタブで認証"
              >
                <span>別ウィンドウで開く</span>
                <span className="text-[10px] text-zinc-500">(画面が黒くなる場合)</span>
              </button>
              <button
                id="guest-mode-btn"
                onClick={handleGuestSignIn}
                disabled={loading}
                className="rounded-xl border border-white/[0.08] bg-[#0c102a] hover:bg-[#161c47] px-3.5 py-1.5 font-bold text-zinc-300 transition-colors cursor-pointer"
              >
                ゲストモードで続行
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
