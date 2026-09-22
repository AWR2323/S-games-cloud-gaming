import React from 'react';
import { ShieldCheck, KeyRound, Monitor, Gamepad2, Layers, Zap, X } from 'lucide-react';

interface HelpGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReplayBoot?: () => void;
}

export const HelpGuideModal: React.FC<HelpGuideModalProps> = ({ isOpen, onClose, onReplayBoot }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl border border-white/[0.12] bg-gradient-to-b from-[#0f1338] via-[#0b0e2b] to-[#060818] shadow-[0_20px_60px_rgba(0,0,0,0.8)] p-6 sm:p-7 text-zinc-100 ring-1 ring-white/10">
        {/* Ambient glow in modal */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-56 w-56 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-56 w-56 rounded-full bg-violet-600/15 blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-5 relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-violet-600 text-white shadow-lg shadow-cyan-500/30">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>S games - 2608moon 利用ガイド</span>
                <span className="rounded-full bg-cyan-500/20 border border-cyan-500/40 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                  SYSTEM DOCS
                </span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">アーキテクチャ・認証方式・超低遅延ストリーミングの仕組み</p>
            </div>
          </div>
          <button
            id="close-help-modal-btn"
            onClick={onClose}
            className="rounded-xl p-2 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3.5 text-xs text-zinc-300 relative z-10 max-h-[68vh] overflow-y-auto pr-1 scrollbar-thin">
          {/* Important Notice on Authentication */}
          <div className="rounded-2xl border border-amber-500/40 bg-amber-950/25 p-4 space-y-2 shadow-inner">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <KeyRound className="h-4 w-4 text-amber-400 flex-shrink-0" />
              <span>ログイン時の重要な注意点（メールアドレスとパスワード）</span>
            </div>
            <p className="text-zinc-300 leading-relaxed text-[11px]">
              Googleのセキュリティ制限により、iframe内では「Googleでログイン」ボタンがブロックされます。
              安全にログインするには：
            </p>
            <ul className="list-disc list-inside space-y-1 text-zinc-400 pl-1 text-[11px]">
              <li><strong>「メールアドレスとパスワードでログイン」</strong>（紫色のボタン）をご利用ください。</li>
              <li>自宅などでGoogleアカウントで登録した場合は、Cloudmoonの設定画面でパスワードを事前設定しておくと、学校や外出先でも簡単にログインできます。</li>
            </ul>
          </div>

          {/* High speed 2608moon integration */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#12163b]/70 p-4 space-y-1.5 shadow-inner">
            <div className="flex items-center gap-2 text-cyan-300 font-bold">
              <Zap className="h-4 w-4 text-cyan-400 flex-shrink-0" />
              <span>https://2608moon.firebaseapp.com/ja/ 埋め込みと高速読み込み</span>
            </div>
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              公式日本語版 2608moon をそのまま埋め込み。DNSプリフェッチ・リソース事前接続・サーバーサイドメモリキャッシュ（10分間保持）・静的アセットHTTPキャッシュにより、初回も2回目以降も爆速でストリーミングが開始されます。
            </p>
          </div>

          {/* 4-Layer Shadow DOM Stealth Engine */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#12163b]/70 p-4 space-y-1.5 shadow-inner">
            <div className="flex items-center gap-2 text-violet-300 font-bold">
              <Layers className="h-4 w-4 text-violet-400 flex-shrink-0" />
              <span>4層Shadow DOM &amp; フィルター回避（sriail/Cloudmoon-InPlay 完全互換）</span>
            </div>
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              4重のネストされた Closed Shadow DOM と厳格なサンドボックス構造により、拡張機能や学校・職場の監視フィルターによるストリーム検出やブロックを回避します。
            </p>
          </div>

          {/* Adblocking Engine */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#12163b]/70 p-4 space-y-1.5 shadow-inner">
            <div className="flex items-center gap-2 text-emerald-300 font-bold">
              <ShieldCheck className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              <span>広告完全カット &amp; フレームレート向上</span>
            </div>
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              Google Ads、DoubleClick、ゲーム内バナー広告要素（<code className="text-emerald-400">.a-div-horizontal</code>、<code className="text-emerald-400">.a-div-box</code>）をサーバーとクライアントの両面で自動除去し、ゲーム描画の遅延を防ぎます。
            </p>
          </div>

          {/* Fullscreen UI Overlays */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#12163b]/70 p-4 space-y-1.5 shadow-inner">
            <div className="flex items-center gap-2 text-indigo-300 font-bold">
              <Monitor className="h-4 w-4 text-indigo-400 flex-shrink-0" />
              <span>全画面時もコントローラーUIを自動維持</span>
            </div>
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              全画面ボタンを押した際も、画面上の仮想キーボード、設定サイドバー、フローティングボタンが全画面表示領域に自動転送されるため、操作不能になりません。
            </p>
          </div>

          {/* Controller Support */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#12163b]/70 p-4 space-y-1.5 shadow-inner">
            <div className="flex items-center gap-2 text-pink-300 font-bold">
              <Gamepad2 className="h-4 w-4 text-pink-400 flex-shrink-0" />
              <span>ゲームパッド &amp; キーボード対応</span>
            </div>
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              BluetoothやUSBで接続したコントローラー（PlayStation、Xbox、Switch Proコンなど）に対応し、タッチやマウス操作も直感的に行えます。
            </p>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-white/[0.08] flex items-center justify-between relative z-10">
          {onReplayBoot ? (
            <button
              id="replay-boot-sequence-btn"
              onClick={() => {
                onClose();
                onReplayBoot();
              }}
              className="flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-900/60 px-3.5 py-2 text-xs font-bold text-cyan-300 transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.15)]"
            >
              <Zap className="h-3.5 w-3.5 text-cyan-400" />
              <span>起動画面を再生</span>
            </button>
          ) : (
            <div />
          )}

          <button
            id="dismiss-help-guide-btn"
            onClick={onClose}
            className="rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-600/30 hover:opacity-90 active:scale-98 transition-all cursor-pointer"
          >
            理解しました、ゲームを始める
          </button>
        </div>
      </div>
    </div>
  );
};
