import React, { useState } from 'react';
import {
  Gamepad2,
  EyeOff,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { soundFX } from '../lib/sound';

interface SGamesTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchCreator?: () => void;
}

export const SGamesTutorialModal: React.FC<SGamesTutorialModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen) return null;

  const steps = [
    {
      stepNumber: 1,
      badge: 'CLOUD STREAMING',
      title: 'インストール不要！即座にクラウドプレイ',
      subtitle: '2608moon & InPlay 高速ストリーミング',
      icon: Gamepad2,
      accentColor: 'from-cyan-500 to-blue-600',
      iconBg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
      description:
        'Roblox、原神、アクション、RPGなどの大人気ゲームを、端末の容量を使わずブラウザ上で即座にストリーミングプレイできます。',
      points: [
        'インストール・ダウンロード時間ゼロで即起動',
        'PC・Chromebook・タブレット全対応（キーボード＆コントローラー完全対応）',
        '低遅延サーバーで快適な60FPSゲーム体験',
      ],
      tip: '「ゲーム一覧」から遊びたいタイトルをクリックするだけでゲームが始まります。',
    },
    {
      stepNumber: 2,
      badge: 'STEALTH CLOAK',
      title: '緊急 Classroom 瞬時偽装機能',
      subtitle: 'キーボード [Esc] キーで一瞬で安全に',
      icon: EyeOff,
      accentColor: 'from-emerald-500 to-teal-600',
      iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
      description:
        '学校や周囲の視線が気になるとき、いつでもキーボードの [Esc] キーまたは上部の「偽装」ボタンを押すと、一瞬で本物の Google Classroom（課題一覧・メモ帳）に切り替わります。',
      points: [
        'ブラウザのタブ名やアイコンも Classroom に自動完全偽装',
        '実際の学校課題管理や学習メモ帳としてもそのまま利用可能',
        '右下の目立たない復帰ボタン、または再度Escキーでいつでもゲームに戻れます',
      ],
      tip: 'ゲームプレイ中・カタログ画面どこからでも [Esc] キーで即座に作動します。',
    },
    {
      stepNumber: 3,
      badge: 'AI GAME STUDIO',
      title: 'S AI ゲーム作成スタジオ',
      subtitle: 'アイデアを日本語で入力してゲームを即自動生成',
      icon: Sparkles,
      accentColor: 'from-amber-500 to-purple-600',
      iconBg: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
      description:
        '「宇宙シューティング」「横スクロールアクション」など、あなたの作りたいゲームのアイデアを伝えるだけで、AIがゲームをコード生成してその場で遊べるようになります。',
      points: [
        '日本語のプロンプトで自分だけのオリジナルゲームを制作',
        '難易度やルール、デザインのリアルタイム微調整・チャット対話修正',
        '作ったゲームを即時テストプレイ＆ローカルに保存可能',
      ],
      tip: '上部メニューの「S AI スタジオ」からいつでも自由に使えます。',
    },
    {
      stepNumber: 4,
      badge: 'SECURITY LOCK',
      title: '安全なワンクリック施錠 (パスワード1013)',
      subtitle: 'Google ログイン画面で完全にブロック',
      icon: ShieldCheck,
      accentColor: 'from-indigo-500 to-violet-600',
      iconBg: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40',
      description:
        '画面右上の「施錠」アイコンを押すと、Google アカウントのリアルなログイン画面へ即座に施錠されます。合言葉（1013）を入力するまで誰も開くことができません。',
      points: [
        '離席時や端末を置く際もワンクリックで安全に保護',
        'Google Classroom ログイン画面風に精巧に偽装',
        'パスワードは [ 1013 ] のみで解錠されます',
      ],
      tip: 'ナビゲーションバーの鍵アイコンをクリックするといつでも施錠できます。',
    },
  ];

  const handleFinish = () => {
    soundFX.playUnlockSuccess();
    if (dontShowAgain) {
      localStorage.setItem('sgames_tutorial_completed', 'true');
    }
    onClose();
  };

  const current = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-2xl bg-[#0e1227] border border-cyan-500/30 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(6,182,212,0.2)] overflow-hidden text-white">
        {/* Top Glowing Header Bar */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${current.accentColor}`} />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-cyan-950/60 border border-cyan-500/40 px-2.5 py-1 rounded-full text-xs font-mono text-cyan-300">
              <Zap className="h-3.5 w-3.5 text-cyan-400" />
              <span>S GAMES GUIDE</span>
            </div>
            <span className="text-xs text-zinc-400 font-mono">
              STEP {current.stepNumber} / {steps.length}
            </span>
          </div>

          <button
            onClick={() => {
              soundFX.playKeyClick();
              handleFinish();
            }}
            className="flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-700/60 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
          >
            <span>チュートリアルをスキップ</span>
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Badge & Step Title */}
          <div className="flex items-start gap-4">
            <div
              className={`h-14 w-14 rounded-2xl border flex items-center justify-center flex-shrink-0 shadow-lg ${current.iconBg}`}
            >
              <current.icon className="h-7 w-7" />
            </div>

            <div>
              <div className="inline-block text-[10px] font-mono tracking-wider font-bold text-cyan-400 uppercase bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30 mb-1.5">
                {current.badge}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {current.title}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                {current.subtitle}
              </p>
            </div>
          </div>

          {/* Description Paragraph */}
          <p className="text-sm text-zinc-300 leading-relaxed bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-4">
            {current.description}
          </p>

          {/* Bullet Points */}
          <div className="space-y-2">
            {current.points.map((point, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-zinc-200">
                <CheckCircle2 className="h-4 w-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span>{point}</span>
              </div>
            ))}
          </div>

          {/* Pro-Tip Box */}
          <div className="flex items-center gap-2.5 bg-cyan-950/30 border border-cyan-500/20 rounded-xl p-3 text-xs text-cyan-300">
            <span className="font-bold uppercase tracking-wider text-cyan-400 font-mono">
              💡 HINT:
            </span>
            <span>{current.tip}</span>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-zinc-950/80 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-4">
          {/* Do not show again checkbox */}
          <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0 cursor-pointer"
            />
            <span>次回から自動表示しない</span>
          </label>

          {/* Step Navigation */}
          <div className="flex items-center gap-3">
            {/* Step Dots */}
            <div className="flex items-center gap-1.5 mr-2">
              {steps.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    soundFX.playKeyClick();
                    setCurrentStep(idx);
                  }}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    idx === currentStep
                      ? 'w-6 bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]'
                      : 'w-2 bg-zinc-700 hover:bg-zinc-500'
                  }`}
                  aria-label={`Step ${idx + 1}`}
                />
              ))}
            </div>

            {/* Back Button */}
            {currentStep > 0 && (
              <button
                type="button"
                onClick={() => {
                  soundFX.playKeyClick();
                  setCurrentStep((prev) => Math.max(0, prev - 1));
                }}
                className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700 transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>戻る</span>
              </button>
            )}

            {/* Next / Start Button */}
            <button
              type="button"
              onClick={() => {
                soundFX.playKeyClick();
                if (isLast) {
                  handleFinish();
                } else {
                  setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1));
                }
              }}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
            >
              <span>{isLast ? 'S games を始める！' : '次へ'}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
