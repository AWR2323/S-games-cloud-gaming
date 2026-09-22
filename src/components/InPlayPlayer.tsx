import React, { useEffect, useRef, useState } from 'react';
import {
  Home,
  Maximize2,
  Minimize2,
  RefreshCw,
  ShieldCheck,
  Zap,
  ArrowLeft,
  ExternalLink,
  GraduationCap,
  Keyboard,
  SlidersHorizontal,
  Sparkles,
  Star,
} from 'lucide-react';
import { CloudmoonGame } from '../types';
import { User } from 'firebase/auth';
import { db } from '../lib/firebase';
import { doc, setDoc, serverTimestamp, updateDoc, increment } from 'firebase/firestore';

interface InPlayPlayerProps {
  initialUrl?: string;
  activeGame?: CloudmoonGame | null;
  onBackToCatalog: () => void;
  onToggleCloak: () => void;
  serverRegionName?: string;
  user?: User | null;
  onOpenReview?: (gameId: string, gameTitle: string) => void;
}

const SHADOW_LAYERS = 4;
const ALLOW_PERMISSIONS =
  'accelerometer; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; clipboard-read; clipboard-write; xr-spatial-tracking; gamepad';
const SANDBOX_FLAGS =
  'allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts allow-downloads allow-pointer-lock allow-top-navigation-by-user-activation';

export const InPlayPlayer: React.FC<InPlayPlayerProps> = ({
  initialUrl = 'https://2608moon.firebaseapp.com/ja/',
  activeGame,
  onBackToCatalog,
  onToggleCloak,
  serverRegionName = 'アジア (東京)',
  user,
  onOpenReview,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const currentIframeRef = useRef<HTMLIFrameElement | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>(initialUrl);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControlsGuide, setShowControlsGuide] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [simulatedPing, setSimulatedPing] = useState<number>(24);
  const [embedMode, setEmbedMode] = useState<'direct' | 'proxy'>('direct');

  // Record play history & grant XP to logged-in user
  useEffect(() => {
    if (!user || !activeGame) return;
    const recordHistory = async () => {
      try {
        const pkg = activeGame.package_name;
        const historyRef = doc(db, 'users', user.uid, 'history', pkg);
        await setDoc(
          historyRef,
          {
            packageName: pkg,
            title: activeGame.title,
            iconUrl: activeGame.icon_url,
            lastPlayedAt: serverTimestamp(),
          },
          { merge: true }
        );
        // Grant +30 XP for starting a game session
        await updateDoc(doc(db, 'users', user.uid), {
          xp: increment(30),
        });
      } catch (err) {
        console.warn('Could not record play history:', err);
      }
    };
    recordHistory();
  }, [user, activeGame]);

  // Random generator for Shadow DOM layers matching Cloudmoon InPlay
  const generateRandomId = () => {
    return 'x' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
  };

  // Build the frame (Direct mode uses standard high-speed iframe, Proxy mode uses 4-layer closed Shadow DOM)
  const buildFrame = (targetUrl: string, mode: 'direct' | 'proxy') => {
    if (!containerRef.current) return;
    setIsLoading(true);

    containerRef.current.innerHTML = '';

    // If Direct Mode: Ultra-fast loading directly from Firebase CDN
    if (mode === 'direct') {
      const iframe = document.createElement('iframe');
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.style.margin = '0';
      iframe.style.padding = '0';
      iframe.style.display = 'block';
      iframe.style.overflow = 'hidden';
      iframe.style.background = '#0d1117';

      iframe.setAttribute('sandbox', SANDBOX_FLAGS);
      iframe.setAttribute('allow', ALLOW_PERMISSIONS);
      iframe.setAttribute('allowfullscreen', '');
      iframe.setAttribute(
        'title',
        activeGame?.title ? `S games - ${activeGame.title}` : 'S games - 2608moon 日本語クラウドゲーム'
      );
      iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
      iframe.setAttribute('importance', 'high');
      iframe.setAttribute('loading', 'eager');

      iframe.src = targetUrl;

      iframe.addEventListener('load', () => {
        setIsLoading(false);
        try {
          iframe.focus();
          iframe.contentWindow?.focus();
        } catch (e) {}
      });

      iframe.addEventListener('error', () => {
        setIsLoading(false);
      });

      containerRef.current.appendChild(iframe);
      currentIframeRef.current = iframe;
      return;
    }

    // If Proxy Mode: 4-Layer Closed Shadow DOM Container (Cloudmoon InPlay spec)
    let currentHost = document.createElement('div');
    currentHost.style.width = '100%';
    currentHost.style.height = '100%';
    currentHost.style.margin = '0';
    currentHost.style.padding = '0';
    currentHost.style.border = 'none';
    currentHost.style.display = 'block';
    currentHost.style.overflow = 'hidden';
    currentHost.setAttribute('data-id', generateRandomId());
    containerRef.current.appendChild(currentHost);

    for (let i = 0; i < SHADOW_LAYERS; i++) {
      const shadowRoot = currentHost.attachShadow({ mode: 'closed' });
      if (i < SHADOW_LAYERS - 1) {
        const nextHost = document.createElement('div');
        nextHost.style.width = '100%';
        nextHost.style.height = '100%';
        nextHost.style.margin = '0';
        nextHost.style.padding = '0';
        nextHost.style.border = 'none';
        nextHost.style.display = 'block';
        nextHost.style.overflow = 'hidden';
        shadowRoot.appendChild(nextHost);
        currentHost = nextHost;
      } else {
        const iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.style.margin = '0';
        iframe.style.padding = '0';
        iframe.style.display = 'block';
        iframe.style.overflow = 'hidden';
        iframe.style.background = '#0d1117';

        iframe.setAttribute('sandbox', SANDBOX_FLAGS);
        iframe.setAttribute('allow', ALLOW_PERMISSIONS);
        iframe.setAttribute('allowfullscreen', '');
        iframe.setAttribute(
          'title',
          activeGame?.title ? `S games - ${activeGame.title}` : 'S games - 2608moon 日本語'
        );
        iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
        iframe.setAttribute('importance', 'high');
        iframe.setAttribute('loading', 'eager');

        // Proxy URL
        let proxied = targetUrl;
        if (targetUrl.includes('2608moon.firebaseapp.com')) {
          proxied = targetUrl.replace('https://2608moon.firebaseapp.com', '/cm-ja');
        } else if (!targetUrl.startsWith('/') && !targetUrl.startsWith('http://localhost')) {
          proxied = '/proxy/' + encodeURIComponent(targetUrl);
        }

        iframe.src = proxied;

        iframe.addEventListener('load', () => {
          setIsLoading(false);
          try {
            iframe.focus();
            iframe.contentWindow?.focus();
          } catch (e) {}
        });

        iframe.addEventListener('error', () => {
          setIsLoading(false);
        });

        shadowRoot.appendChild(iframe);
        currentIframeRef.current = iframe;
      }
    }
  };

  // Mount and rebuild when URL or embedMode changes
  useEffect(() => {
    buildFrame(currentUrl, embedMode);
  }, [currentUrl, embedMode]);

  // Ping jitter simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setSimulatedPing(Math.floor(18 + Math.random() * 10));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Listen for Cloudmoon InPlay messages (e.g. LOAD_GAME from intercepted window.open)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'LOAD_GAME') {
        const gameUrl = event.data.url;
        console.log('[InPlay Player] 受信 LOAD_GAME:', gameUrl);
        let fixedURL = gameUrl;
        if (gameUrl.startsWith('/')) {
          fixedURL = 'https://2608moon.firebaseapp.com' + gameUrl;
        } else if (gameUrl.includes('web.cloudmoonapp.com')) {
          fixedURL = gameUrl.replace('https://web.cloudmoonapp.com', 'https://2608moon.firebaseapp.com/ja');
        }
        setCurrentUrl(fixedURL);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Handle Fullscreen toggle
  const toggleFullscreen = () => {
    const frame = currentIframeRef.current;
    if (frame && frame.contentWindow) {
      frame.contentWindow.postMessage({ type: 'REQUEST_FULLSCREEN' }, '*');
    }

    const container = containerRef.current?.parentElement;
    if (!document.fullscreenElement) {
      if (container?.requestFullscreen) {
        container.requestFullscreen().catch(() => {});
      } else if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  // Reload current game
  const handleReload = () => {
    buildFrame(currentUrl, embedMode);
  };

  // Return to 2608moon Japanese Home
  const handleGoHome = () => {
    const homeUrl = 'https://2608moon.firebaseapp.com/ja/';
    setCurrentUrl(homeUrl);
    buildFrame(homeUrl, embedMode);
  };

  return (
    <div className="relative flex flex-col h-[calc(100vh-4rem)] w-full bg-[#05060e] overflow-hidden select-none">
      {/* Top Player Status Bar */}
      <div className="flex h-11 w-full items-center justify-between border-b border-white/[0.08] bg-[#0a0d26]/95 backdrop-blur-xl px-4 text-xs shadow-md">
        <div className="flex items-center gap-3">
          <button
            id="player-back-catalog-btn"
            onClick={onBackToCatalog}
            className="flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-[#141842] hover:bg-[#1f245c] px-3 py-1.5 text-zinc-200 transition-all cursor-pointer font-bold shadow-xs hover:border-cyan-400/50"
            title="ゲーム一覧に戻る"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-cyan-400" />
            <span>ゲーム一覧</span>
          </button>

          {activeGame ? (
            <div className="flex items-center gap-2">
              <img
                src={activeGame.icon_url}
                alt={activeGame.title}
                className="h-5 w-5 rounded-lg object-cover border border-cyan-500/30 shadow-xs"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="font-bold text-white truncate max-w-[180px] sm:max-w-[280px]">
                {activeGame.title}
              </span>
            </div>
          ) : (
            <span className="font-bold text-zinc-200">2608moon 日本語クラウドゲーミング</span>
          )}

          <div className="hidden sm:flex items-center gap-1 rounded-full bg-violet-950/70 border border-violet-500/40 px-2.5 py-0.5 text-[11px] text-violet-300 font-bold">
            <Zap className="h-3 w-3 text-amber-400" />
            <span>{serverRegionName}</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-zinc-400 text-[11px] font-mono">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
            <span>{simulatedPing} ms</span>
          </div>
        </div>

        {/* Right tools & Mode switch */}
        <div className="flex items-center gap-2">
          {/* Mode Switcher for Fast Loading vs Shadow DOM Proxy */}
          <div className="hidden sm:flex items-center rounded-xl bg-[#060817] border border-white/[0.1] p-0.5 text-[11px]">
            <button
              id="embed-mode-direct-btn"
              onClick={() => setEmbedMode('direct')}
              className={`rounded-lg px-2.5 py-1 font-bold transition-all ${
                embedMode === 'direct'
                  ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Firebase CDN直通で最速ロード"
            >
              ⚡ 高速ダイレクト
            </button>
            <button
              id="embed-mode-proxy-btn"
              onClick={() => setEmbedMode('proxy')}
              className={`rounded-lg px-2.5 py-1 font-bold transition-all ${
                embedMode === 'proxy'
                  ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="4層Shadow DOM & 広告ブロックプロキシ"
            >
              🛡️ 4層プロキシ
            </button>
          </div>

          {activeGame && onOpenReview && (
            <button
              id="player-review-btn"
              onClick={() => onOpenReview(activeGame.package_name, activeGame.title)}
              className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-[#1e1708] hover:bg-amber-950/60 px-3 py-1.5 text-amber-300 transition-all cursor-pointer font-bold shadow-xs hover:border-amber-400"
              title="このゲームを評価・レビューする"
            >
              <Star className="h-3.5 w-3.5 fill-current text-amber-400" />
              <span className="hidden sm:inline">レビュー</span>
            </button>
          )}

          <button
            id="player-controls-guide-btn"
            onClick={() => setShowControlsGuide(!showControlsGuide)}
            className="flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-[#141842] hover:bg-[#1f245c] px-3 py-1.5 text-zinc-200 transition-all cursor-pointer font-bold shadow-xs hover:border-cyan-400/50"
            title="コントローラー & 操作設定"
          >
            <Keyboard className="h-3.5 w-3.5 text-violet-400" />
            <span className="hidden sm:inline">操作設定</span>
          </button>

          <button
            id="player-recover-screen-btn"
            onClick={handleReload}
            className="flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-[#240a16] hover:bg-[#381023] px-2.5 py-1.5 text-rose-300 hover:text-rose-200 transition-all cursor-pointer font-bold shadow-xs hover:border-rose-400 text-xs"
            title="Googleログインなどで画面が真っ黒になった際にワンクリックで即時復帰します"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">画面復帰</span>
          </button>

          <a
            id="player-popout-btn"
            href={`/inplay?url=${encodeURIComponent(currentUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-[#141842] hover:bg-[#1f245c] px-2.5 py-1.5 text-zinc-300 transition-all shadow-xs hover:text-cyan-300 hover:border-cyan-400/50 text-xs font-medium"
            title="Googleログインが可能な新しいタブで開く"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden md:inline">別タブ (Google可)</span>
          </a>

          <button
            id="player-fullscreen-top-btn"
            onClick={toggleFullscreen}
            className="flex items-center gap-1 rounded-xl border border-white/[0.1] bg-[#141842] hover:bg-[#1f245c] px-2.5 py-1.5 text-zinc-300 transition-all cursor-pointer shadow-xs hover:text-cyan-300 hover:border-cyan-400/50"
            title="全画面表示"
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Black Screen Prevention Banner for Google Login inside iframe */}
      <div className="bg-gradient-to-r from-amber-950/70 via-slate-900/90 to-amber-950/70 border-b border-amber-500/30 px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-200">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
          <span>
            <strong>【Googleログイン時の黒画面防止】</strong>: ゲーム画面内の「Googleでログイン」を押すとブラウザ制限で画面が黒くなります。「メール/パスワード」でログインするか、右上の「別タブ」をご利用ください。
          </span>
        </div>
        <button
          onClick={handleReload}
          className="ml-auto text-[11px] bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-lg px-2.5 py-0.5 font-bold cursor-pointer transition-colors flex items-center gap-1"
        >
          <RefreshCw className="h-3 w-3" />
          <span>黒画面を即直す</span>
        </button>
      </div>

      {/* Frame Container holding the 2608moon iframe */}
      <div className="relative flex-1 w-full h-full bg-black overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-sm gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-3 border-violet-500 border-t-transparent" />
            <p className="text-sm font-medium text-zinc-200">
              2608moon 日本語クラウドストリームに高速接続中...
            </p>
            <p className="text-xs text-zinc-500">
              高速キャッシュ適用 • 広告カット • 仮想コントローラー接続中
            </p>
          </div>
        )}

        <div
          ref={containerRef}
          id="inplay-shadow-container"
          className="w-full h-full"
        />

        {/* Floating Bottom-Left Controls Dock */}
        <div
          id="btn-dock"
          className="absolute bottom-6 left-6 z-40 flex items-center gap-3 pointer-events-auto"
        >
          <button
            id="dock-home-btn"
            onClick={handleGoHome}
            title="2608moon ホーム"
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-[#0e1233]/90 text-zinc-100 shadow-[0_8px_25px_rgba(0,0,0,0.7)] backdrop-blur-xl transition-all hover:scale-105 hover:border-cyan-400 hover:text-cyan-300 active:scale-95 cursor-pointer"
          >
            <Home className="h-5 w-5" />
          </button>

          <button
            id="dock-fullscreen-btn"
            onClick={toggleFullscreen}
            title="全画面表示 (仮想ボタン・キーボード操作を維持)"
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-[#0e1233]/90 text-zinc-100 shadow-[0_8px_25px_rgba(0,0,0,0.7)] backdrop-blur-xl transition-all hover:scale-105 hover:border-cyan-400 hover:text-cyan-300 active:scale-95 cursor-pointer"
          >
            <Maximize2 className="h-5 w-5" />
          </button>

          <button
            id="dock-reload-btn"
            onClick={handleReload}
            title="ゲーム画面を再読み込み"
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-[#0e1233]/90 text-zinc-100 shadow-[0_8px_25px_rgba(0,0,0,0.7)] backdrop-blur-xl transition-all hover:scale-105 hover:border-cyan-400 hover:text-cyan-300 active:scale-95 cursor-pointer"
          >
            <RefreshCw className="h-5 w-5" />
          </button>

          <button
            id="dock-cloak-btn"
            onClick={onToggleCloak}
            title="一瞬で Classroom に偽装"
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/40 bg-[#06241a]/90 text-emerald-300 shadow-[0_8px_25px_rgba(0,0,0,0.7)] backdrop-blur-xl transition-all hover:scale-105 hover:border-emerald-400 hover:text-emerald-200 active:scale-95 cursor-pointer"
          >
            <GraduationCap className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Controls Guide Overlay Drawer */}
      {showControlsGuide && (
        <div className="absolute top-14 right-4 z-50 w-88 rounded-2xl border border-white/[0.12] bg-[#0c0f2e]/98 p-5 shadow-2xl backdrop-blur-2xl text-xs text-zinc-300 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.08]">
            <span className="font-bold text-white flex items-center gap-2">
              <Keyboard className="h-4 w-4 text-cyan-400" />
              操作方法 & 設定ガイド
            </span>
            <button
              id="close-controls-guide-btn"
              onClick={() => setShowControlsGuide(false)}
              className="text-zinc-400 hover:text-white cursor-pointer rounded-lg p-1 hover:bg-white/10 transition-colors"
            >
              ✕
            </button>
          </div>
          <div className="space-y-2.5">
            <div>
              <p className="font-medium text-white mb-0.5">🎮 画面上の仮想コントローラー:</p>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                画面内にジョイスティックやアクションボタンが表示され、クリック・タッチ・キー割り当てで操作可能です。
              </p>
            </div>
            <div>
              <p className="font-medium text-white mb-0.5">⚙️ フローティング設定ボール:</p>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                画面端の小さな丸いアイコンをクリックすると、画質（HD/SD）、フレームレート（30/60FPS）、キーマッピングを直接変更できます。
              </p>
            </div>
            <div>
              <p className="font-medium text-white mb-0.5">⚡ 高速モードについて:</p>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                右上の「⚡ 高速ダイレクト」を選ぶと、Firebase CDN から最速で直接読み込みます。通信制限やブロックがある場合は「🛡️ 4層プロキシ」をご利用ください。
              </p>
            </div>
            <div>
              <p className="font-medium text-white mb-0.5">🔑 ログイン時の注意点:</p>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                セキュリティ仕様上、iframe 内では Google 連携ボタンが弾かれます。<strong>「メールアドレスとパスワード」</strong>でログインしてください。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
