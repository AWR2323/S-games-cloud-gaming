import React from 'react';
import {
  Gamepad2,
  Play,
  GraduationCap,
  Globe,
  HelpCircle,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Zap,
  Radio,
  User as UserIcon,
  Lock,
  BookOpen,
  MessageSquare,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { ViewMode, CloudmoonServer } from '../types';

interface NavbarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  servers: CloudmoonServer[];
  selectedServer: number | null;
  onSelectServer: (id: number) => void;
  onOpenHelp: () => void;
  isCloaked: boolean;
  onToggleCloak: () => void;
  activeGameTitle?: string;
  onReloadPlayer?: () => void;
  user: User | null;
  onOpenAuth: () => void;
  onLockApp?: () => void;
  onOpenTutorial?: () => void;
  onOpenSocial?: () => void;
  socialBadgeCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  servers,
  selectedServer,
  onSelectServer,
  onOpenHelp,
  isCloaked,
  onToggleCloak,
  activeGameTitle,
  onReloadPlayer,
  user,
  onOpenAuth,
  onLockApp,
  onOpenTutorial,
  onOpenSocial,
  socialBadgeCount,
}) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#070918]/85 backdrop-blur-2xl transition-all shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      {/* Top micro-neon beam */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-500 via-violet-500 to-transparent opacity-80" />

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6">
        {/* Brand Logo & Telemetry Indicator */}
        <div className="flex items-center gap-3 sm:gap-5">
          <button
            id="nav-logo-btn"
            onClick={() => onViewChange('catalog')}
            className="group flex items-center gap-3 text-left focus:outline-none cursor-pointer"
          >
            {/* Holographic Glowing Emblem */}
            <div className="relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 p-[1.5px] shadow-lg shadow-violet-600/25 group-hover:shadow-cyan-500/40 group-hover:scale-105 transition-all duration-300">
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-[#090c20]">
                <span className="font-black text-xl text-transparent bg-clip-text bg-gradient-to-tr from-white via-cyan-200 to-violet-300 tracking-tighter">
                  S
                </span>
              </div>
              {/* Radar pulse ping */}
              <div className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 border border-[#090c20]" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                  S games
                </span>
                <span className="hidden xs:inline-flex items-center gap-1 rounded-md bg-cyan-950/80 border border-cyan-500/30 px-2 py-0.5 text-[9px] font-black text-cyan-300 uppercase tracking-widest">
                  <Radio className="h-2.5 w-2.5 animate-pulse text-cyan-400" />
                  2608moon
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 hidden sm:flex items-center gap-1.5 font-medium">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>超低遅延クラウド &amp; AI 3Dジェネレーター</span>
              </p>
            </div>
          </button>

          {/* Active game live indicator when InPlay is active */}
          {currentView === 'player' && activeGameTitle && (
            <div className="hidden lg:flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 text-xs text-emerald-300 backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="truncate max-w-[160px] font-bold">{activeGameTitle}</span>
              {onReloadPlayer && (
                <button
                  id="nav-reload-stream-btn"
                  onClick={onReloadPlayer}
                  title="クラウドゲームを再読み込み"
                  className="ml-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <RefreshCw className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Central Segmented Cockpit Navigation */}
        <nav aria-label="メインナビゲーション" className="flex items-center rounded-2xl bg-[#0d1029]/90 border border-white/[0.08] p-1.5 shadow-inner backdrop-blur-md">
          <button
            id="tab-catalog-btn"
            onClick={() => onViewChange('catalog')}
            className={`flex items-center gap-1.5 sm:gap-2 rounded-xl px-2.5 sm:px-4 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
              currentView === 'catalog'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30 ring-1 ring-white/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
            }`}
          >
            <Gamepad2 className="h-4 w-4" />
            <span className="hidden sm:inline">ゲーム一覧</span>
          </button>

          <button
            id="tab-ai-creator-btn"
            onClick={() => onViewChange('ai-creator')}
            className={`relative flex items-center gap-1.5 sm:gap-2 rounded-xl px-2.5 sm:px-4 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
              currentView === 'ai-creator'
                ? 'bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/25 ring-1 ring-white/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
            }`}
          >
            <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
            <span>S AI スタジオ</span>
            <span className="hidden md:inline rounded-md bg-amber-400/20 px-1.5 py-0.5 text-[9px] font-black text-amber-300 border border-amber-400/40">
              3D
            </span>
          </button>

          <button
            id="tab-player-btn"
            onClick={() => onViewChange('player')}
            className={`flex items-center gap-1.5 sm:gap-2 rounded-xl px-2.5 sm:px-4 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
              currentView === 'player'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30 ring-1 ring-white/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
            }`}
          >
            <Play className="h-4 w-4 fill-current" />
            <span className="hidden sm:inline">InPlay</span>
          </button>
        </nav>

        {/* Right Controls & Telemetry Panel */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Live System Telemetry Badge */}
          <div
            className="hidden lg:flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-950/20 px-3 py-1.5 text-[11px] font-mono text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.1)]"
            title="システム稼働状態: 60FPS 超低遅延同期中"
          >
            <Zap className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
            <span className="font-bold">60 FPS</span>
            <span className="text-zinc-600">|</span>
            <span>21ms</span>
          </div>

          {/* Cloud Server selector */}
          {servers.length > 0 && (
            <div className="relative hidden xl:flex items-center">
              <Globe className="absolute left-2.5 h-3.5 w-3.5 text-cyan-400 pointer-events-none" />
              <select
                id="server-region-select"
                aria-label="接続サーバー地域"
                value={selectedServer || ''}
                onChange={(e) => onSelectServer(Number(e.target.value))}
                className="h-9 rounded-xl border border-white/[0.08] bg-[#0e112b] pl-8 pr-3 text-xs text-zinc-200 hover:border-cyan-500/40 focus:border-cyan-500 focus:outline-none appearance-none cursor-pointer font-bold transition-colors"
              >
                {servers.map((s) => (
                  <option key={s.id} value={s.id} className="bg-[#0e112b] text-zinc-200">
                    {s.name === 'Asia'
                      ? 'アジア (東京/SG)'
                      : s.name === 'US West'
                      ? '米国西部'
                      : s.name === 'US East'
                      ? '米国東部'
                      : `${s.name}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Instant Lock Button (Return to Password Gate Screen) */}
          {onLockApp && (
            <button
              id="nav-lock-app-btn"
              onClick={onLockApp}
              title="S gamesを施錠する (パスワード画面に戻る)"
              className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-950/30 hover:bg-amber-900/50 hover:border-amber-400/60 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-amber-300 transition-all cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.15)]"
            >
              <Lock className="h-4 w-4 text-amber-400" />
              <span className="hidden sm:inline">施錠</span>
            </button>
          )}

          {/* Classroom Stealth Mode Button */}
          <button
            id="stealth-cloak-toggle-btn"
            onClick={onToggleCloak}
            title="Classroom ステルスモード (画面・タブ名を一瞬で授業画面に偽装)"
            className={`flex items-center gap-1.5 rounded-xl border px-2.5 sm:px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              isCloaked
                ? 'border-emerald-500/60 bg-emerald-950/60 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.4)] ring-1 ring-emerald-400'
                : 'border-white/[0.08] bg-[#0e112b] text-zinc-300 hover:border-emerald-500/40 hover:text-emerald-300'
            }`}
          >
            <GraduationCap className="h-4 w-4 text-emerald-400" />
            <span className="hidden md:inline">偽装</span>
          </button>

          {/* Standalone InPlay Window */}
          <a
            id="open-standalone-inplay-btn"
            href="/inplay"
            target="_blank"
            rel="noopener noreferrer"
            title="別ウィンドウで全画面InPlayを開く"
            className="flex items-center justify-center rounded-xl border border-white/[0.08] bg-[#0e112b] p-2 text-zinc-400 hover:border-cyan-500/40 hover:text-cyan-300 transition-all cursor-pointer"
          >
            <ExternalLink className="h-4 w-4" />
          </a>

          {/* Social & Chat Hub Button */}
          {onOpenSocial && (
            <button
              id="nav-social-chat-btn"
              onClick={onOpenSocial}
              title="フレンド一覧 & チャット (全体ラウンジ / 1対1 DM)"
              className="relative flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-gradient-to-r from-cyan-950/60 to-indigo-950/60 hover:border-cyan-400 hover:from-cyan-900/70 hover:to-indigo-900/70 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-cyan-300 transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.2)]"
            >
              <MessageSquare className="h-4 w-4 text-cyan-400" />
              <span className="hidden sm:inline">チャット &amp; フレンド</span>
              {socialBadgeCount !== undefined && socialBadgeCount > 0 ? (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[10px] font-black text-black animate-pulse">
                  {socialBadgeCount}
                </span>
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          )}

          {/* Google Account / Firebase Login Capsule */}
          <button
            id="open-auth-btn"
            onClick={onOpenAuth}
            className={`flex items-center gap-2 rounded-xl border px-2.5 sm:px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              user
                ? 'border-violet-500/50 bg-gradient-to-r from-violet-950/50 to-indigo-950/50 text-white hover:border-violet-400 shadow-md shadow-violet-600/20'
                : 'border-white/[0.1] bg-[#0e112b] text-zinc-200 hover:border-white/20 hover:bg-[#141738]'
            }`}
          >
            {user ? (
              <>
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'ユーザー'}
                    className="h-5 w-5 rounded-full object-cover border border-cyan-400/50 ring-1 ring-violet-400/40"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-tr from-violet-600 to-cyan-500 text-[10px] font-bold text-white">
                    {user.displayName?.[0] || 'U'}
                  </div>
                )}
                <span className="hidden sm:inline max-w-[90px] truncate">
                  {user.displayName?.split(' ')[0] || 'マイページ'}
                </span>
              </>
            ) : (
              <>
                <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24">
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
                <span className="hidden sm:inline">ログイン</span>
              </>
            )}
          </button>

          {/* Interactive Tutorial Trigger */}
          {onOpenTutorial && (
            <button
              id="open-tutorial-btn"
              onClick={onOpenTutorial}
              title="チュートリアル &amp; はじめてガイド"
              className="flex items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-950/40 p-2 text-cyan-300 hover:border-cyan-400 hover:bg-cyan-900/50 hover:text-cyan-200 transition-all cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.2)]"
            >
              <BookOpen className="h-4 w-4" />
            </button>
          )}

          {/* Help & Documentation Modal Trigger */}
          <button
            id="open-help-guide-btn"
            onClick={onOpenHelp}
            title="ガイド &amp; 使い方"
            className="flex items-center justify-center rounded-xl border border-white/[0.08] bg-[#0e112b] p-2 text-zinc-400 hover:border-cyan-500/40 hover:text-cyan-300 transition-all cursor-pointer"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
