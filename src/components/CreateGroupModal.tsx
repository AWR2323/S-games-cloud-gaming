import React, { useState } from 'react';
import { X, Users, Check, Search, Sparkles } from 'lucide-react';
import { Friend } from '../types';
import { soundFX } from '../lib/sound';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  friends?: Friend[];
  availableFriends?: Friend[];
  onCreateGroup: (name: string, icon: string, selectedFriends: Friend[], description?: string) => Promise<void>;
  isCreating: boolean;
}

const DEFAULT_GROUP_ICONS = ['🎮', '⚔️', '🏆', '🔥', '🐻', '👾', '🎯', '🚀', '💬', '⚡', '👑', '🕹️', '🎧', '🌟'];

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  friends = [],
  availableFriends = [],
  onCreateGroup,
  isCreating,
}) => {
  const [groupName, setGroupName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🎮');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedFriendUids, setSelectedFriendUids] = useState<string[]>([]);
  const [friendSearch, setFriendSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const friendList = (friends && friends.length > 0) ? friends : (availableFriends || []);

  const toggleFriend = (friendUid: string) => {
    soundFX.playKeyClick();
    setSelectedFriendUids((prev) =>
      prev.includes(friendUid) ? prev.filter((id) => id !== friendUid) : [...prev, friendUid]
    );
  };

  const filteredFriends = (friendList || []).filter((f) => {
    if (!f || !f.displayName) return false;
    const q = friendSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      f.displayName.toLowerCase().includes(q) ||
      (f.gamerTag && f.gamerTag.toLowerCase().includes(q))
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = groupName.trim();
    if (!trimmed) {
      setErrorMsg('グループ名を入力してください');
      return;
    }

    if (selectedFriendUids.length === 0) {
      setErrorMsg('グループに招待するフレンドを少なくとも1名選択してください');
      return;
    }

    setErrorMsg(null);
    const chosenFriends = friendList.filter((f) => selectedFriendUids.includes(f.friendUid));
    try {
      await onCreateGroup(trimmed, selectedIcon, chosenFriends, groupDescription.trim());
      setGroupName('');
      setGroupDescription('');
      setSelectedFriendUids([]);
      setFriendSearch('');
    } catch (err) {
      console.error('Create group failed in modal:', err);
      setErrorMsg('グループ作成に失敗しました。もう一度お試しください。');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in-50 duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          soundFX.playKeyClick();
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-cyan-500/40 bg-gradient-to-b from-[#13173d] via-[#0d102b] to-[#080a1c] p-4 sm:p-6 shadow-2xl shadow-cyan-500/10 text-white flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white shadow-md shadow-cyan-500/30">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-cyan-200 tracking-wide flex items-center gap-1.5">
                新規グループメッセージ作成
              </h3>
              <p className="text-[10px] text-zinc-400">
                フレンド同士でチャット＆スタンプを共有できるグループを作成
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 scrollbar-thin">
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold">
              {errorMsg}
            </div>
          )}

          {/* Group Icon & Name */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">
              グループアイコン & グループ名 <span className="text-rose-400">*</span>
            </label>
            <div className="flex items-center gap-2">
              {/* Selected Icon Trigger */}
              <div className="flex-shrink-0 w-12 h-12 rounded-xl border border-cyan-500/40 bg-cyan-950/40 flex items-center justify-center text-2xl shadow-inner shadow-cyan-500/20">
                {selectedIcon}
              </div>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="例: 夜更かしゲーミング部, モンハン隊"
                maxLength={40}
                required
                className="flex-1 rounded-xl border border-white/10 bg-[#080b1e] px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:border-cyan-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Icon Picker Chips */}
            <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {DEFAULT_GROUP_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => {
                    soundFX.playKeyClick();
                    setSelectedIcon(icon);
                  }}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-base transition-all cursor-pointer ${
                    selectedIcon === icon
                      ? 'bg-cyan-500/30 border border-cyan-400 scale-110 shadow-sm shadow-cyan-500/40'
                      : 'bg-white/[0.04] border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Description */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">
              グループ説明 (任意)
            </label>
            <input
              type="text"
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              placeholder="例: オンラインマルチ対戦の集合・作戦会議チャット"
              maxLength={100}
              className="w-full rounded-xl border border-white/10 bg-[#080b1e] px-3.5 py-2 text-xs text-white placeholder:text-zinc-500 focus:border-cyan-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Invite Friends Checklist */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <span>メンバーに招待するフレンド</span>
                <span className="text-rose-400">*</span>
              </label>
              <span className="text-[10px] text-cyan-300 font-mono font-bold">
                選択中: {selectedFriendUids.length} 名
              </span>
            </div>

            {/* Filter input */}
            {friends.length > 4 && (
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                <input
                  type="text"
                  value={friendSearch}
                  onChange={(e) => setFriendSearch(e.target.value)}
                  placeholder="フレンド名で絞り込み..."
                  className="w-full rounded-lg border border-white/10 bg-[#060814] pl-8 pr-3 py-1.5 text-[11px] text-white placeholder:text-zinc-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            )}

            {friends.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-white/10 bg-white/[0.02] text-center">
                <p className="text-xs text-zinc-400 font-bold mb-1">
                  まだフレンドがいません
                </p>
                <p className="text-[10px] text-zinc-500">
                  「フレンド検索」タブからユーザーを探してフレンド申請を送ってみましょう！
                </p>
              </div>
            ) : filteredFriends.length === 0 ? (
              <div className="p-3 text-center text-xs text-zinc-500">
                該当するフレンドが見つかりませんでした
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                {filteredFriends.map((friend) => {
                  const isChecked = selectedFriendUids.includes(friend.friendUid);
                  return (
                    <div
                      key={friend.friendUid}
                      onClick={() => toggleFriend(friend.friendUid)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-cyan-950/40 border-cyan-400/70 text-white shadow-sm'
                          : 'bg-white/[0.03] border-white/10 hover:border-white/20 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {friend.photoURL ? (
                          <img
                            src={friend.photoURL}
                            alt={friend.displayName}
                            className="w-8 h-8 rounded-full object-cover border border-white/10 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-black text-white flex-shrink-0">
                            {friend.displayName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">
                            {friend.displayName}
                          </p>
                          <p className="text-[10px] font-mono text-zinc-400 truncate">
                            {friend.gamerTag || `Lv.${friend.level || 1}`}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all flex-shrink-0 ${
                          isChecked
                            ? 'bg-cyan-500 border-cyan-400 text-black'
                            : 'border-white/20 bg-black/40'
                        }`}
                      >
                        {isChecked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={() => {
                soundFX.playKeyClick();
                onClose();
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isCreating || friends.length === 0}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-cyan-500/30 hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{isCreating ? '作成中...' : 'グループを作成する'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
