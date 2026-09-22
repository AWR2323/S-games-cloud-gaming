import React, { useState } from 'react';
import { X, Music, Volume2, Radio, Send, Play } from 'lucide-react';
import { GROOVE_PRESETS, GrooveMessagePreset } from '../lib/daizuStamps';
import { soundFX } from '../lib/sound';

interface GrooveMessageComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendGroove: (preset: GrooveMessagePreset, text: string) => void;
  targetName?: string;
  isSending?: boolean;
}

export const GrooveMessageComposerModal: React.FC<GrooveMessageComposerModalProps> = ({
  isOpen,
  onClose,
  onSendGroove,
  targetName = '全体ロビー',
  isSending = false,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<GrooveMessagePreset>(GROOVE_PRESETS[0]);
  const [messageText, setMessageText] = useState<string>('');
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);

  if (!isOpen) return null;

  const handlePreviewBeat = (preset: GrooveMessagePreset) => {
    setIsPlayingPreview(true);
    soundFX.playGrooveBeat(preset.synthType, preset.toneFrequency, preset.bpm);
    setTimeout(() => {
      setIsPlayingPreview(false);
    }, (60 / preset.bpm) * 1000 * 2.5);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    onSendGroove(selectedPreset, messageText);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in-50 duration-150">
      <div className="w-full max-w-lg rounded-2xl border border-cyan-400/40 bg-gradient-to-b from-[#12163b] via-[#0e1230] to-[#070918] p-4 sm:p-6 shadow-2xl shadow-cyan-500/10 text-white flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-600 to-violet-600 text-white shadow-md shadow-cyan-500/30">
              <Music className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black text-cyan-200 tracking-wide flex items-center gap-1.5">
                グルーヴメッセージ作成
              </h3>
              <p className="text-[10px] text-zinc-400">
                送信先: <span className="text-cyan-300 font-bold">{targetName}</span> • 音楽ビート＆シンセ波形付きメッセージ
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundFX.playKeyClick();
              onClose();
            }}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSend} className="flex-1 overflow-y-auto py-4 space-y-4 scrollbar-thin">
          {/* Preset Selector */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-2 flex items-center justify-between">
              <span>リズムビート・スタイル選択</span>
              <span className="text-[10px] text-cyan-400">タップして試聴 🎧</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {GROOVE_PRESETS.map((preset) => {
                const isSelected = selectedPreset.id === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => {
                      setSelectedPreset(preset);
                      handlePreviewBeat(preset);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                      isSelected
                        ? `bg-gradient-to-r ${preset.gradient} ${preset.borderAccent}`
                        : 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black text-white group-hover:text-cyan-200">
                        {preset.title}
                      </span>
                      <span className="rounded bg-black/40 px-1.5 py-0.5 text-[9px] font-mono text-cyan-300 border border-cyan-400/20">
                        {preset.bpm} BPM
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-2">
                      <span className="font-mono">{preset.iconTag}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreviewBeat(preset);
                        }}
                        className="flex items-center gap-1 text-cyan-400 hover:text-cyan-200 font-bold"
                        title="サウンド試聴"
                      >
                        <Volume2 className="h-3 w-3" />
                        <span>試聴</span>
                      </button>
                    </div>

                    {/* Animated visualizer bar line */}
                    {isSelected && (
                      <div className="mt-2.5 flex items-end gap-1 h-3 overflow-hidden">
                        {[40, 90, 60, 100, 75, 45, 80, 50, 95, 60].map((h, i) => (
                          <div
                            key={i}
                            className="flex-1 bg-gradient-to-t from-cyan-400 to-violet-400 rounded-t animate-pulse"
                            style={{
                              height: `${h}%`,
                              animationDelay: `${i * 0.08}s`,
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Message Text Input */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">
              添えるメッセージ (任意)
            </label>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="グルーヴに乗せて一言！ (例: 今夜みんなでオンライン対戦しようぜ！🔥)"
              maxLength={200}
              rows={3}
              className="w-full rounded-xl border border-white/10 bg-[#080b1e] px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:border-cyan-500 focus:outline-none transition-colors resize-none"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
              <span>グルーヴカードを受信したプレイヤーもタップでビート再生できます</span>
              <span>{messageText.length} / 200</span>
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="rounded-xl border border-white/10 bg-[#090d24] p-3">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-2">
              メッセージプレビュー表示
            </span>
            <div
              className={`p-3.5 rounded-xl border bg-gradient-to-r ${selectedPreset.gradient} ${selectedPreset.borderAccent}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-xs">
                  <Radio className="h-3.5 w-3.5 animate-pulse text-cyan-400" />
                  <span>{selectedPreset.title}</span>
                  <span className="text-[9px] font-mono opacity-70">({selectedPreset.bpm} BPM)</span>
                </div>
                <button
                  type="button"
                  onClick={() => handlePreviewBeat(selectedPreset)}
                  className="flex items-center gap-1 rounded-full bg-cyan-400/20 hover:bg-cyan-400/30 border border-cyan-400/40 px-2 py-0.5 text-[10px] text-cyan-300 font-bold"
                >
                  <Play className="h-2.5 w-2.5 fill-current" />
                  <span>{isPlayingPreview ? '再生中...' : 'ビート再生'}</span>
                </button>
              </div>

              <p className="text-xs text-white leading-relaxed mt-1 whitespace-pre-wrap">
                {messageText.trim() || '🎶 ノリノリでゲーム楽しもう！'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={() => {
                soundFX.playKeyClick();
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSending}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-violet-600 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-cyan-500/30 hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              <span>グルーヴメッセージを送信</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
