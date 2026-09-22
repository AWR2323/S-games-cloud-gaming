import React from 'react';
import { X, Sparkles } from 'lucide-react';
import { DAIZU_STAMPS, DaizuStamp, DaizuBearIcon } from '../lib/daizuStamps';
import { soundFX } from '../lib/sound';

interface DaizuStampPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStamp: (stamp: DaizuStamp) => void;
  category: 'all' | 'emotion' | 'gaming' | 'cheer' | 'fun';
  onSelectCategory: (cat: 'all' | 'emotion' | 'gaming' | 'cheer' | 'fun') => void;
  targetName?: string;
}

export const DaizuStampPickerModal: React.FC<DaizuStampPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectStamp,
  category,
  onSelectCategory,
  targetName = '全体ロビー',
}) => {
  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'すべて' },
    { id: 'gaming', label: '🎮 ゲーム' },
    { id: 'cheer', label: '👏 応援・挨拶' },
    { id: 'emotion', label: '💖 感情' },
    { id: 'fun', label: '🎶 グルーヴ' },
  ] as const;

  const filteredStamps =
    category === 'all'
      ? DAIZU_STAMPS
      : DAIZU_STAMPS.filter((s) => s.category === category);

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in-50 duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          soundFX.playKeyClick();
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-amber-400/40 bg-gradient-to-b from-[#181328] via-[#100e22] to-[#0a0916] p-4 sm:p-5 shadow-2xl shadow-amber-500/10 text-white flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-400/20 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <DaizuBearIcon stampId="daizu_sparkle" size={32} animated={false} />
              <Sparkles className="absolute -top-1 -right-1 h-3.5 w-3.5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black text-amber-200 tracking-wide flex items-center gap-1.5">
                だいずべあ スタンプパレット
              </h3>
              <p className="text-[10px] text-zinc-400">
                送信先: <span className="text-amber-300 font-bold">{targetName}</span>
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

        {/* Categories Tabs */}
        <div className="flex items-center gap-1.5 py-2.5 overflow-x-auto scrollbar-none border-b border-white/[0.06]">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                soundFX.playKeyClick();
                onSelectCategory(cat.id);
              }}
              className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                category === cat.id
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black shadow-sm shadow-amber-500/30'
                  : 'bg-white/[0.05] text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Stamps Grid */}
        <div className="flex-1 overflow-y-auto py-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5 scrollbar-thin">
          {filteredStamps.map((stamp) => (
            <button
              key={stamp.id}
              onClick={() => onSelectStamp(stamp)}
              title={stamp.description}
              className={`group flex flex-col items-center justify-center p-3 rounded-2xl border transition-all hover:scale-105 active:scale-95 cursor-pointer bg-gradient-to-b ${stamp.bgGradient} hover:border-amber-400/80 border-white/10 shadow-sm`}
            >
              <div className="w-16 h-16 flex items-center justify-center mb-1.5">
                <DaizuBearIcon stampId={stamp.id} size={64} animated={true} />
              </div>
              <span className="text-[11px] font-bold text-amber-200 group-hover:text-amber-100 text-center line-clamp-1">
                {stamp.caption}
              </span>
              <span className="text-[9px] text-zinc-400 group-hover:text-zinc-300 text-center line-clamp-1 mt-0.5">
                {stamp.name}
              </span>
            </button>
          ))}
        </div>

        {/* Footer tip */}
        <div className="pt-2.5 border-t border-white/[0.06] text-center text-[10px] text-zinc-500 flex items-center justify-center gap-1.5">
          <span>タップするとワンタッチでチャットに送信されます 🐾</span>
        </div>
      </div>
    </div>
  );
};
