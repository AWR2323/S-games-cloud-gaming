import React, { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { db } from '../lib/firebase';
import {
  collection,
  addDoc,
  getDoc,
  doc,
  query,
  orderBy,
  limit,
  onSnapshot,
  updateDoc,
  increment,
} from 'firebase/firestore';
import { SAIGame } from '../types';
import { DEFAULT_3D_ROBLOX_OBBY_HTML } from '../data/default3dGame';
import {
  Sparkles,
  Play,
  RotateCcw,
  Maximize2,
  Save,
  Code,
  Check,
  AlertCircle,
  Gamepad2,
  Layers,
  Wand2,
  Clock,
  User as UserIcon,
  ChevronRight,
  Flame,
  Share2,
  Copy,
  Heart,
  Globe,
  Users,
  CheckCheck,
  Eye,
  ExternalLink,
  Search,
  MessageSquare,
  Zap,
  Download,
  Camera,
  ShieldAlert,
  Gauge,
  Cpu,
  Smartphone,
  Sliders,
} from 'lucide-react';
import { GameComments } from './GameComments';

interface SAIGameCreatorProps {
  user: User | null;
  onOpenAuth: () => void;
  onPlayCloudmoonGame: () => void;
  initialGameId?: string | null;
  onClearInitialGameId?: () => void;
}

const SAMPLE_PROMPTS = [
  {
    title: '🏃 3Dパルクール・オビー (Roblox風)',
    genre: '3Dパルクール',
    prompt: 'RobloxのObbyのような3Dアスレチック。Three.jsで空中ブロック、動く床、消える足場、コイン、ゴールフラッグを配置。PCはWASD+Space、モバイルはRobloxと同じ左ジョイスティック+右ジャンプ+右スワイプカメラ回転！',
    theme: 'ネオンサイバー',
    camera: 'tps' as const,
    diff: 'normal' as const,
  },
  {
    title: '🏎️ 3Dサイバーシティ・カーレース',
    genre: '3Dレース',
    prompt: 'ネオン輝く未来ハイウェイを疾走する3Dカーレース。ライバル車、ニトロブーストパッド、スピードメーター、迫力のエンジンWeb Audioサウンドを搭載。',
    theme: 'ネオンサイバー',
    camera: 'tps' as const,
    diff: 'normal' as const,
  },
  {
    title: '🧟 3Dサバイバルシューター / TPS',
    genre: '3Dアクション',
    prompt: '侵略エイリアン・ドローンを撃退する3DサバイバルTPS。360度カメラエイム、レーザー発射、体力ゲージ、ウェーブ制バトル、爆発エフェクト付き。',
    theme: '宇宙銀河',
    camera: 'tps' as const,
    diff: 'hard' as const,
  },
  {
    title: '🚀 3Dスペース・ドッグファイト',
    genre: '3Dアクション',
    prompt: '巨大宇宙要塞の周辺で繰り広げられる3Dスペースコンバット。小惑星帯をくぐり抜け、追尾ミサイルで敵宇宙艦隊を殲滅するハイスピード3Dアクション。',
    theme: '宇宙銀河',
    camera: 'fps' as const,
    diff: 'normal' as const,
  },
  {
    title: '👾 2D宇宙レトロインベーダー DX',
    genre: '2Dシューティング',
    prompt: '宇宙を舞台にしたインベーダー風レトロシューティング。敵撃破で3WAY弾やシールドが出現し、巨大ボス戦とシンセサイザーBGMが鳴り響くアーケード名作。',
    theme: 'ネオンサイバー',
    camera: 'topdown' as const,
    diff: 'normal' as const,
  },
  {
    title: '🧱 2Dサイバーブロック崩し DX',
    genre: '2Dアーケード',
    prompt: 'サイバーネオンブロック崩し。パドルで光るボールを弾き、マルチボール・貫通レーザー・爆発ボムを駆使して全ステージクリアを目指す爽快パズル。',
    theme: 'ネオンサイバー',
    camera: 'topdown' as const,
    diff: 'easy' as const,
  },
];

const GIMMICK_CHIPS = [
  '動く空中足場',
  'トランポリン大ジャンプ台',
  '回転レーザートラップ',
  '消えるブロック床',
  'ニトロ超加速パッド',
  'クリスタル収集クエスト',
  '巨大ボス戦',
  'タイムアタック制限時間',
];

// Pre-built fallback instant game (3D Parkour with Roblox-style mobile controls)
const DEFAULT_SAMPLE_GAME: SAIGame = {
  id: 'starter-3d-roblox-obby',
  title: 'S-Obby 3D: ネオンパルクール',
  description: 'Three.jsで作られた本格3Dアスレチックゲーム！PCはWASD＋SPACEで移動＆ジャンプ、モバイルはRobloxと同じ【左バーチャルスティック＋右ジャンプボタン＋画面スワイプ視点回転】で快適に遊べます。',
  genre: '3Dパルクール',
  prompt: 'Three.jsを使用したRoblox風3Dパルクール・アスレチックゲーム（モバイルRoblox操作完備）',
  creatorUid: 'system',
  creatorName: 'S AI Master',
  createdAt: new Date().toISOString(),
  code: DEFAULT_3D_ROBLOX_OBBY_HTML,
};

export const SAIGameCreator: React.FC<SAIGameCreatorProps> = ({
  user,
  onOpenAuth,
  onPlayCloudmoonGame,
  initialGameId,
  onClearInitialGameId,
}) => {
  const [prompt, setPrompt] = useState<string>('');
  const [genre, setGenre] = useState<string>('3Dパルクール');
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');
  const [cameraMode, setCameraMode] = useState<'tps' | 'fps' | 'topdown'>('tps');
  const [theme, setTheme] = useState<string>('ネオンサイバー');
  const [performanceMode, setPerformanceMode] = useState<'ultra-60fps' | 'high-quality'>('ultra-60fps');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatingStep, setGeneratingStep] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeGame, setActiveGame] = useState<SAIGame>(DEFAULT_SAMPLE_GAME);
  const [showCode, setShowCode] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [communityGames, setCommunityGames] = useState<SAIGame[]>([]);
  const [loadingCommunity, setLoadingCommunity] = useState<boolean>(false);
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [hasLikedCurrent, setHasLikedCurrent] = useState<boolean>(false);
  const [isLiking, setIsLiking] = useState<boolean>(false);
  const [communitySearch, setCommunitySearch] = useState<string>('');
  const [communityCategory, setCommunityCategory] = useState<'all' | '3D' | '2D'>('all');
  const playerContainerRef = useRef<HTMLDivElement>(null);

  // Helper to generate full shareable URL
  const getGameShareUrl = (gameId: string) => {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}?game=${encodeURIComponent(gameId)}`;
  };

  // Copy share URL to clipboard
  const handleCopyShareLink = async (gameId: string) => {
    const url = getGameShareUrl(gameId);
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
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (e) {
      console.warn('Clipboard copy failed:', e);
    }
  };

  // Native share dialog
  const handleNativeShare = async (game: SAIGame) => {
    const url = getGameShareUrl(game.id);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${game.title} - S games`,
          text: `S AIで作成されたゲーム「${game.title}」を今すぐ遊ぼう！`,
          url: url,
        });
      } catch (e) {
        // user cancelled
      }
    } else {
      handleCopyShareLink(game.id);
    }
  };

  // Download standalone HTML file for offline play
  const handleDownloadHtml = () => {
    try {
      const blob = new Blob([activeGame.code], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeTitle = (activeGame.title || 'sai-game').replace(/[/\\?%*:|"<>]/g, '-');
      a.download = `${safeTitle}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.warn('HTML download error:', err);
    }
  };

  // Real-time listener for community games from Firestore
  useEffect(() => {
    setLoadingCommunity(true);
    const q = query(collection(db, 'games'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched: SAIGame[] = [];
        snapshot.forEach((docSnap) => {
          fetched.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        setCommunityGames(fetched);
        setLoadingCommunity(false);
      },
      (err) => {
        console.warn('Real-time community games fetch error:', err);
        setLoadingCommunity(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Load shared game when initialGameId is passed
  useEffect(() => {
    if (!initialGameId) return;

    let isMounted = true;
    async function loadSharedGame() {
      try {
        const docRef = doc(db, 'games', initialGameId!);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && isMounted) {
          const loadedGame = { id: docSnap.id, ...(docSnap.data() as any) } as SAIGame;
          setActiveGame(loadedGame);
          setIframeKey((k) => k + 1);
          setSaveSuccess(true);
          setTimeout(() => {
            playerContainerRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 150);
        }
      } catch (err) {
        console.error('Failed to load shared game from Firestore:', err);
      }
    }

    loadSharedGame();
    return () => {
      isMounted = false;
    };
  }, [initialGameId]);

  // Step ticker while generating
  useEffect(() => {
    if (!isGenerating) {
      setGeneratingStep(0);
      return;
    }
    const interval = setInterval(() => {
      setGeneratingStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 1100);
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Generate game using S AI via backend
  const handleGenerate = async (targetPrompt?: string) => {
    const promptToSend = targetPrompt || prompt;
    if (!promptToSend.trim()) {
      setErrorMsg('作りたいゲームの内容を入力してください。');
      return;
    }

    try {
      setIsGenerating(true);
      setErrorMsg(null);
      setSaveSuccess(false);
      setHasLikedCurrent(false);
      setGeneratingStep(0);

      const res = await fetch('/api/ai/generate-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToSend,
          genre,
          difficulty,
          cameraMode,
          theme,
          performanceMode,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.game) {
        throw new Error(data.error || 'ゲームの生成に失敗しました。');
      }

      const newGame: SAIGame = {
        id: `ai-${Date.now()}`,
        title: data.game.title || 'S AI 生成ゲーム',
        description: data.game.description || promptToSend,
        genre: data.game.genre || genre,
        prompt: promptToSend,
        code: data.game.code,
        difficulty,
        cameraMode,
        theme,
        performanceMode,
        creatorUid: user ? user.uid : 'guest',
        creatorName: user ? (user.displayName || 'S games プレイヤー') : 'ゲスト',
        createdAt: new Date().toISOString(),
        likesCount: 0,
        playsCount: 1,
      };

      setActiveGame(newGame);
      setIframeKey((prev) => prev + 1);

      setTimeout(() => {
        playerContainerRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      console.error('Game generation error:', err);
      setErrorMsg(err.message || 'AIゲーム生成中にエラーが発生しました。');
    } finally {
      setIsGenerating(false);
    }
  };

  // Add gimmick to prompt
  const handleAddGimmick = (gimmick: string) => {
    setPrompt((prev) => {
      if (!prev.trim()) return `「${gimmick}」を搭載した楽しいゲーム`;
      return `${prev}、「${gimmick}」も追加`;
    });
  };

  // Save game to Firebase Firestore
  const handleSaveToFirestore = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }

    try {
      setIsSaving(true);
      setErrorMsg(null);

      const gamePayload = {
        title: activeGame.title,
        description: activeGame.description,
        genre: activeGame.genre,
        prompt: activeGame.prompt,
        code: activeGame.code,
        difficulty: activeGame.difficulty || difficulty,
        cameraMode: activeGame.cameraMode || cameraMode,
        theme: activeGame.theme || theme,
        performanceMode: activeGame.performanceMode || performanceMode,
        creatorUid: user.uid,
        creatorName: user.displayName || 'S games プレイヤー',
        createdAt: new Date().toISOString(),
        likesCount: activeGame.likesCount || 0,
        playsCount: (activeGame.playsCount || 0) + 1,
      };

      const docRef = await addDoc(collection(db, 'games'), gamePayload);
      const savedId = docRef.id;

      setSaveSuccess(true);
      setActiveGame((prev) => ({
        ...prev,
        id: savedId,
        creatorUid: user.uid,
        creatorName: user.displayName || 'S games プレイヤー',
      }));

      setShowShareModal(true);
    } catch (err: any) {
      console.error('Error saving game to Firestore:', err);
      setErrorMsg('Firebase への保存に失敗しました: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Like game in Firestore
  const handleLikeGame = async () => {
    if (!activeGame.id || activeGame.id === 'starter-3d-roblox-obby' || hasLikedCurrent || isLiking) return;
    try {
      setIsLiking(true);
      const gameRef = doc(db, 'games', activeGame.id);
      await updateDoc(gameRef, { likesCount: increment(1) });
      setActiveGame((prev) => ({ ...prev, likesCount: (prev.likesCount || 0) + 1 }));
      setHasLikedCurrent(true);
    } catch (err) {
      console.warn('Failed to like game:', err);
    } finally {
      setIsLiking(false);
    }
  };

  // Select a game from community list to play
  const handleSelectGameToPlay = async (game: SAIGame) => {
    setActiveGame(game);
    setIframeKey((k) => k + 1);
    setSaveSuccess(true);
    setHasLikedCurrent(false);
    playerContainerRef.current?.scrollIntoView({ behavior: 'smooth' });

    if (game.id && game.id !== 'starter-3d-roblox-obby') {
      try {
        await updateDoc(doc(db, 'games', game.id), { playsCount: increment(1) });
      } catch (e) {
        // non-fatal
      }
    }
  };

  const handleFullscreen = () => {
    const iframe = document.getElementById('ai-game-frame') as HTMLIFrameElement;
    if (iframe && iframe.requestFullscreen) {
      iframe.requestFullscreen();
    }
  };

  const filteredCommunityGames = communityGames.filter((game) => {
    const matchesSearch =
      game.title.toLowerCase().includes(communitySearch.toLowerCase()) ||
      (game.description && game.description.toLowerCase().includes(communitySearch.toLowerCase())) ||
      (game.creatorName && game.creatorName.toLowerCase().includes(communitySearch.toLowerCase()));

    if (!matchesSearch) return false;

    if (communityCategory === '3D') {
      return game.genre.includes('3D');
    }
    if (communityCategory === '2D') {
      return !game.genre.includes('3D');
    }
    return true;
  });

  const isSavedInFirestore = !!(
    activeGame.id &&
    activeGame.id !== 'starter-3d-roblox-obby' &&
    !activeGame.id.startsWith('ai-')
  );

  const generatingStepsText = [
    '3D/2Dゲームエンジン＆ステージ構築中...',
    'Roblox互換デュアルタッチ操作バインド中...',
    'Web Audioシンセサイザー効果音＆BGM合成中...',
    '60FPS物理演算＆コリジョンをコンパイル中...',
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-8 space-y-8">
      {/* Studio Header: Cyberpunk High-Tech Console */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.1] bg-gradient-to-b from-[#0f1230] via-[#090c24] to-[#050612] p-6 sm:p-10 shadow-2xl">
        {/* Ambient Aurora Orbs */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-80 w-80 rounded-full bg-violet-600/20 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-80 w-80 rounded-full bg-cyan-500/18 blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-gradient-to-r from-cyan-950/60 via-indigo-950/40 to-violet-950/60 px-4 py-1.5 text-xs font-bold text-cyan-300 backdrop-blur-xl shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
            <span>S AI GENESIS STUDIO v3.2 • 3D＆Roblox操作・完全自律コンパイラ</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
            あなたのアイデアを、
            <br />
            <span className="text-shimmer font-black">
              超高クオリティな3Dゲーム
            </span>
            へ即座に具現化
          </h1>

          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-2xl font-normal">
            自然な日本語を入力するだけで、S AI が Three.js 3Dグラフィック・物理演算・Roblox風スマホコントローラー・Web Audioシンセサイザーを全自動プログラミング。ブラウザですぐにプレイ＆Firebaseクラウド保存・ワンクリックHTML書き出しが可能です。
          </p>
        </div>

        {/* Input Form Console */}
        <div className="relative z-10 mt-6 space-y-4 rounded-2xl border border-white/[0.08] bg-[#0c0f2b]/95 p-4 sm:p-6 backdrop-blur-xl shadow-2xl">
          {/* Top Options Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Genre */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-400 flex items-center gap-1.5">
                <Gamepad2 className="h-3.5 w-3.5 text-violet-400" />
                <span>ジャンル</span>
              </label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full rounded-xl border border-white/[0.1] bg-[#12163b] px-3.5 py-2.5 text-xs text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none cursor-pointer font-bold transition-all shadow-inner"
              >
                <option value="3Dパルクール">🏃 3Dパルクール (Roblox Obby)</option>
                <option value="3Dレース">🏎️ 3Dネオンレーシング</option>
                <option value="3Dアクション">🧟 3Dサバイバルシューター / TPS</option>
                <option value="3Dアドベンチャー">🚀 3Dスペース・ドッグファイト</option>
                <option value="2Dシューティング">👾 2D宇宙インベーダー DX</option>
                <option value="2Dアーケード">🧱 2Dネオンブロック崩し DX</option>
                <option value="2Dパズル">⚡ 2Dサイバーパズル</option>
              </select>
            </div>

            {/* Difficulty */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-400 flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
                <span>難易度</span>
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full rounded-xl border border-white/[0.1] bg-[#12163b] px-3.5 py-2.5 text-xs text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none cursor-pointer font-bold transition-all shadow-inner"
              >
                <option value="easy">🟢 Easy (初心者・爽快)</option>
                <option value="normal">🟡 Normal (標準バランス)</option>
                <option value="hard">🔴 Hard (激ムズ・玄人向け)</option>
              </select>
            </div>

            {/* Camera Mode */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-400 flex items-center gap-1.5">
                <Camera className="h-3.5 w-3.5 text-cyan-400" />
                <span>カメラ視点</span>
              </label>
              <select
                value={cameraMode}
                onChange={(e) => setCameraMode(e.target.value as any)}
                className="w-full rounded-xl border border-white/[0.1] bg-[#12163b] px-3.5 py-2.5 text-xs text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none cursor-pointer font-bold transition-all shadow-inner"
              >
                <option value="tps">🎥 TPS (3人称追従カメラ)</option>
                <option value="fps">🎯 FPS (1人称主観視点)</option>
                <option value="topdown">📐 Top-Down (見下ろし視点)</option>
              </select>
            </div>

            {/* Performance Mode */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-400 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-emerald-400" />
                <span>パフォーマンス最適化</span>
              </label>
              <select
                value={performanceMode}
                onChange={(e) => setPerformanceMode(e.target.value as any)}
                className="w-full rounded-xl border border-white/[0.1] bg-[#12163b] px-3.5 py-2.5 text-xs text-emerald-300 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none cursor-pointer font-bold transition-all shadow-inner"
              >
                <option value="ultra-60fps">⚡ 60FPS 超高速モード (推奨)</option>
                <option value="high-quality">🌟 ネオンFX高品質モード</option>
              </select>
            </div>
          </div>

          {/* Prompt input */}
          <div className="relative">
            <textarea
              id="sai-prompt-input"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="どんなゲームを作りたいですか？ (例: 空中の動くネオン床を飛び移り、コインを集めてゴールを目指す3Dパルクールゲーム！)"
              className="w-full rounded-2xl border border-white/[0.1] bg-[#07091a] p-4 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none transition-all resize-none shadow-inner"
            />
          </div>

          {/* Gimmick Chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-zinc-400 flex items-center gap-1">
              <Sliders className="h-3.5 w-3.5 text-cyan-400" />
              ワンタップでギミックを追加:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {GIMMICK_CHIPS.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAddGimmick(chip)}
                  className="rounded-xl border border-white/[0.08] bg-[#141842]/80 px-3 py-1.5 text-[11px] font-medium text-zinc-300 hover:border-cyan-400 hover:bg-cyan-950/50 hover:text-cyan-200 transition-all cursor-pointer shadow-xs"
                >
                  + {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Preset Prompts */}
          <div className="space-y-2 pt-2 border-t border-white/[0.06]">
            <p className="text-[11px] font-bold text-zinc-400 flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 text-amber-400" />
              殿堂入り即座生成プリセット:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {SAMPLE_PROMPTS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(item.prompt);
                    setGenre(item.genre);
                    setCameraMode(item.camera);
                    setDifficulty(item.diff);
                    setTheme(item.theme);
                  }}
                  className="flex items-center gap-2 rounded-2xl border border-white/[0.06] bg-[#12163b]/70 p-2.5 text-left hover:border-cyan-400/60 hover:bg-[#191f52] transition-all cursor-pointer group shadow-sm"
                >
                  <span className="text-xs font-bold text-zinc-200 group-hover:text-cyan-300 transition-colors">
                    {item.title}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {errorMsg && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Generator Progress Banner during generation */}
          {isGenerating && (
            <div className="rounded-xl border border-cyan-500/40 bg-gradient-to-r from-cyan-950/40 via-violet-950/40 to-indigo-950/40 p-4 space-y-2.5 animate-pulse">
              <div className="flex items-center justify-between text-xs text-cyan-300 font-bold">
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 rounded-full border-2 border-cyan-300 border-t-transparent animate-spin" />
                  <span>{generatingStepsText[generatingStep] || 'ゲームをコンパイル中...'}</span>
                </div>
                <span>ステップ {generatingStep + 1} / 4</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-all duration-500 rounded-full"
                  style={{ width: `${((generatingStep + 1) / 4) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 text-[11px] text-zinc-400">
              <Smartphone className="h-3.5 w-3.5 text-cyan-400" />
              <span>PC: WASD + Space移動 | スマホ: Roblox式バーチャルスティック &amp; ジャンプ</span>
            </div>

            <button
              id="generate-game-btn"
              onClick={() => handleGenerate()}
              disabled={isGenerating}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 px-7 py-3 text-xs sm:text-sm font-black text-white shadow-xl shadow-violet-600/30 hover:scale-[1.02] active:scale-98 transition-all cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>S AI ゲーム生成中...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  <span>S AI にゲームを作成してもらう</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Active Playable Game Monitor Section */}
      <div ref={playerContainerRef} className="space-y-4">
        {/* Monitor Title & Control Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/20 flex-shrink-0">
              <Play className="h-5 w-5 fill-current ml-0.5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-white">{activeGame.title}</h2>
                <span className="rounded-full bg-violet-500/20 border border-violet-500/30 px-2.5 py-0.5 text-[11px] font-bold text-violet-300">
                  {activeGame.genre}
                </span>
                {isSavedInFirestore && (
                  <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    <span>Firebase 公開中</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1 flex-wrap">
                <span className="flex items-center gap-1">
                  <UserIcon className="h-3 w-3 text-zinc-500" />
                  <span>作者: {activeGame.creatorName || 'S games プレイヤー'}</span>
                </span>
                {activeGame.playsCount !== undefined && (
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3 text-zinc-500" />
                    <span>{activeGame.playsCount} プレイ</span>
                  </span>
                )}
                {activeGame.likesCount !== undefined && (
                  <span className="flex items-center gap-1 text-rose-400">
                    <Heart className="h-3 w-3 fill-rose-500 text-rose-500" />
                    <span>{activeGame.likesCount} いいね</span>
                  </span>
                )}
                {activeGame.commentsCount !== undefined && activeGame.commentsCount > 0 && (
                  <span className="flex items-center gap-1 text-sky-400">
                    <MessageSquare className="h-3 w-3 text-sky-400" />
                    <span>{activeGame.commentsCount} コメント</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Download standalone HTML file */}
            <button
              id="download-game-html-btn"
              onClick={handleDownloadHtml}
              className="flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-[#12163b] px-3.5 py-2 text-xs font-bold text-zinc-200 hover:bg-[#1a1f4e] hover:text-white transition-all cursor-pointer shadow-sm"
              title="オフラインでも遊べるHTMLファイルとしてダウンロード"
            >
              <Download className="h-4 w-4 text-cyan-400" />
              <span>HTML保存</span>
            </button>

            {/* Like button */}
            {isSavedInFirestore && (
              <button
                id="like-ai-game-btn"
                onClick={handleLikeGame}
                disabled={hasLikedCurrent || isLiking}
                className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                  hasLikedCurrent
                    ? 'border-rose-500/50 bg-rose-950/50 text-rose-300'
                    : 'border-white/[0.1] bg-[#12163b] text-zinc-300 hover:text-rose-400 hover:border-rose-500/40'
                }`}
                title="このゲームにいいね！"
              >
                <Heart className={`h-4 w-4 ${hasLikedCurrent ? 'fill-rose-500 text-rose-500' : ''}`} />
                <span>{hasLikedCurrent ? 'いいね済' : 'いいね'}</span>
                {activeGame.likesCount ? <span className="font-mono">({activeGame.likesCount})</span> : null}
              </button>
            )}

            {/* Share link button */}
            {isSavedInFirestore && (
              <button
                id="share-ai-game-btn"
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-950/40 px-3.5 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-900/50 hover:text-white transition-all cursor-pointer shadow-sm"
                title="他の人に共有する"
              >
                <Share2 className="h-4 w-4" />
                <span>共有リンク</span>
              </button>
            )}

            <button
              id="reload-ai-game-btn"
              onClick={() => setIframeKey((k) => k + 1)}
              className="flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-[#12163b] px-3.5 py-2 text-xs font-bold text-zinc-300 hover:bg-[#1a1f4e] hover:text-white transition-all cursor-pointer"
              title="リセット / 最初からやり直す"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">リセット</span>
            </button>

            <button
              id="fullscreen-ai-game-btn"
              onClick={handleFullscreen}
              className="flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-[#12163b] px-3.5 py-2 text-xs font-bold text-zinc-300 hover:bg-[#1a1f4e] hover:text-white transition-all cursor-pointer"
              title="全画面表示"
            >
              <Maximize2 className="h-4 w-4" />
              <span className="hidden sm:inline">全画面</span>
            </button>

            <button
              id="view-code-ai-game-btn"
              onClick={() => setShowCode(!showCode)}
              className="flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-[#12163b] px-3.5 py-2 text-xs font-bold text-zinc-300 hover:bg-[#1a1f4e] hover:text-white transition-all cursor-pointer"
              title="ソースコードを表示"
            >
              <Code className="h-4 w-4 text-violet-400" />
              <span className="hidden sm:inline">{showCode ? 'コード非表示' : 'コード確認'}</span>
            </button>

            <button
              id="save-ai-game-btn"
              onClick={handleSaveToFirestore}
              disabled={isSaving || saveSuccess}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold shadow-lg transition-all cursor-pointer ${
                saveSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white hover:opacity-90 active:scale-98'
              }`}
            >
              {saveSuccess ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Firebase 公開済み</span>
                </>
              ) : isSaving ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>保存中...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Firebase に保存・共有</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Performance HUD Status Bar */}
        <div className="flex items-center justify-between rounded-2xl bg-[#0c0f2b] border border-white/[0.08] px-4 py-2.5 text-[11px] font-mono text-zinc-400 shadow-md">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <Zap className="h-3.5 w-3.5 animate-pulse" />
              60 FPS リアルタイム
            </span>
            <span className="hidden sm:inline text-zinc-600">|</span>
            <span className="hidden sm:flex items-center gap-1 text-cyan-300">
              <Cpu className="h-3.5 w-3.5 text-cyan-400" />
              WebGL: Three.js r128
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden md:inline text-zinc-400">Audio: Web Audio API Synth</span>
            <span className="text-zinc-600 hidden md:inline">|</span>
            <span className="text-violet-300 font-bold flex items-center gap-1">
              <Smartphone className="h-3.5 w-3.5 text-violet-400" />
              Roblox式デュアルタッチ操作
            </span>
          </div>
        </div>

        {/* Sandboxed Game Iframe Stage */}
        <div className="relative w-full rounded-3xl border border-white/[0.12] bg-[#04050b] overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center min-h-[500px] sm:min-h-[640px] ring-1 ring-white/10">
          <iframe
            key={iframeKey}
            id="ai-game-frame"
            srcDoc={activeGame.code}
            title={activeGame.title}
            sandbox="allow-scripts allow-modals allow-same-origin"
            className="w-full h-[520px] sm:h-[640px] border-0"
          />
        </div>

        {/* Code inspection drawer */}
        {showCode && (
          <div className="rounded-2xl border border-white/[0.08] bg-[#090b1c] p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-mono">S AI Generated HTML5 / Three.js / JS Source Code</span>
              <button
                onClick={() => navigator.clipboard.writeText(activeGame.code)}
                className="hover:text-white cursor-pointer font-bold text-cyan-400"
              >
                コードをクリップボードにコピー
              </button>
            </div>
            <pre className="max-h-72 overflow-y-auto rounded-xl bg-[#060712] p-4 font-mono text-xs text-emerald-400 leading-relaxed select-text border border-white/[0.04]">
              {activeGame.code}
            </pre>
          </div>
        )}

        {/* Game Comments and Reviews */}
        <GameComments
          gameId={activeGame.id}
          gameTitle={activeGame.title}
          gameCreatorUid={activeGame.creatorUid}
          isSavedInFirestore={isSavedInFirestore}
          user={user}
          onOpenAuth={onOpenAuth}
          onSaveToFirestoreRequest={handleSaveToFirestore}
        />
      </div>

      {/* Share Modal Dialog */}
      {showShareModal && isSavedInFirestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border border-cyan-500/40 bg-[#0d0f26] p-6 text-zinc-100 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-400 text-white shadow-lg shadow-emerald-500/30">
                <Globe className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <span>Firebase に保存・クラウド公開完了！</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  世界中のプレイヤーがこのリンクから即座にプレイできます
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-[#070814] p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-400">タイトル:</span>
                <span className="text-cyan-300 font-bold">{activeGame.title}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-400">ジャンル:</span>
                <span className="rounded bg-violet-500/20 px-2 py-0.5 text-violet-300 text-[11px] font-bold">
                  {activeGame.genre}
                </span>
              </div>

              {/* Shareable Link Input */}
              <div className="space-y-1.5 pt-2">
                <label className="text-[11px] font-bold text-zinc-400">共有リンク（URL）:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getGameShareUrl(activeGame.id)}
                    className="flex-1 rounded-xl border border-white/[0.08] bg-[#141630] px-3 py-2 text-xs font-mono text-zinc-200 select-all focus:outline-none"
                  />
                  <button
                    onClick={() => handleCopyShareLink(activeGame.id)}
                    className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-3.5 py-2 text-xs font-bold text-white hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
                  >
                    {copiedLink ? (
                      <>
                        <CheckCheck className="h-3.5 w-3.5 text-emerald-300" />
                        <span>コピー済!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>コピー</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                onClick={() => handleNativeShare(activeGame)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-[#141630] px-4 py-2.5 text-xs font-bold text-zinc-200 hover:bg-[#1f224a] transition-colors cursor-pointer"
              >
                <Share2 className="h-4 w-4 text-cyan-400" />
                <span>SNSや友達にシェア</span>
              </button>

              <button
                onClick={() => setShowShareModal(false)}
                className="w-full sm:w-auto flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-violet-600/30 hover:opacity-95 transition-opacity cursor-pointer"
              >
                完了 / 閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Community / Saved Games Section */}
      <div className="space-y-5 pt-6 border-t border-white/[0.08]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-500 text-white shadow-lg shadow-violet-500/20">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-white">みんなの S AI 作成ゲーム広場</h3>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  リアルタイム同期中
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Firestore に保存された全プレイヤーのオリジナル3D/2D作品。タップして今すぐ遊べます！
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onPlayCloudmoonGame}
              className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#141630] px-4 py-2 text-xs text-cyan-300 hover:text-white font-bold cursor-pointer transition-colors"
            >
              <span>Cloudmoon カタログへ</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Community Search and Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 rounded-2xl border border-white/[0.08] bg-[#0c0e22] p-1 flex-wrap">
            <button
              onClick={() => setCommunityCategory('all')}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                communityCategory === 'all'
                  ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              すべての作品 ({communityGames.length})
            </button>
            <button
              onClick={() => setCommunityCategory('3D')}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                communityCategory === '3D'
                  ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              ✨ 3Dパルクール / 3Dレース
            </button>
            <button
              onClick={() => setCommunityCategory('2D')}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                communityCategory === '2D'
                  ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              2Dアーケード / シューティング
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="タイトルや作者で検索..."
              value={communitySearch}
              onChange={(e) => setCommunitySearch(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-[#141630] py-2 pl-8 pr-3 text-xs text-zinc-200 placeholder-zinc-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>

        {loadingCommunity ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-44 rounded-3xl bg-[#0e1026] animate-pulse border border-white/[0.06]" />
            ))}
          </div>
        ) : filteredCommunityGames.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCommunityGames.map((game) => (
              <div
                key={game.id}
                className="neon-border-hover group relative flex flex-col justify-between rounded-3xl border border-white/[0.08] bg-gradient-to-b from-[#0f1230] to-[#070918] p-5 transition-all duration-200 shadow-xl"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                      {game.title}
                    </h4>
                    <span className="rounded-full bg-violet-500/20 border border-violet-500/30 px-2.5 py-0.5 text-[10px] font-bold text-violet-300 whitespace-nowrap">
                      {game.genre}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 mt-2 line-clamp-2 leading-relaxed">
                    {game.description}
                  </p>
                </div>

                <div className="mt-4 pt-3.5 border-t border-white/[0.06] space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span className="flex items-center gap-1.5 truncate max-w-[150px]">
                      <UserIcon className="h-3.5 w-3.5 text-zinc-500" />
                      <span className="truncate font-medium">{game.creatorName || 'S games プレイヤー'}</span>
                    </span>

                    <div className="flex items-center gap-2.5 text-zinc-400 font-medium">
                      {game.playsCount !== undefined && (
                        <span className="flex items-center gap-1" title="プレイ数">
                          <Eye className="h-3 w-3 text-zinc-500" />
                          <span>{game.playsCount}</span>
                        </span>
                      )}
                      {game.likesCount !== undefined && (
                        <span className="flex items-center gap-1 text-rose-400 font-bold" title="いいね数">
                          <Heart className="h-3 w-3 fill-rose-500 text-rose-500" />
                          <span>{game.likesCount}</span>
                        </span>
                      )}
                      {game.commentsCount !== undefined && game.commentsCount > 0 && (
                        <span className="flex items-center gap-1 text-sky-400" title="コメント数">
                          <MessageSquare className="h-3 w-3 text-sky-400" />
                          <span>{game.commentsCount}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSelectGameToPlay(game)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 py-2.5 text-xs font-bold text-white shadow-md shadow-violet-600/20 hover:opacity-90 transition-all cursor-pointer"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>今すぐプレイ</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyShareLink(game.id);
                      }}
                      className="flex items-center justify-center rounded-xl border border-white/[0.08] bg-[#12163b] p-2.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      title="共有リンクをコピー"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-white/[0.08] p-8 text-center text-zinc-500 space-y-2">
            <Gamepad2 className="h-8 w-8 mx-auto opacity-50 text-cyan-400" />
            <p className="text-xs">
              {communitySearch
                ? '検索条件に一致するゲームがありませんでした。'
                : 'まだ保存されたゲームがありません。上のスタジオから第1作目を自動生成してみましょう！'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
