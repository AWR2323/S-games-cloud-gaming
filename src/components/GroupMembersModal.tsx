import React, { useState } from 'react';
import { X, Users, UserPlus, LogOut, Crown, Check } from 'lucide-react';
import { Friend, GroupChat } from '../types';
import { soundFX } from '../lib/sound';

interface GroupMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: GroupChat;
  currentUserUid?: string;
  currentUserId?: string;
  friends?: Friend[];
  availableFriends?: Friend[];
  onAddMembers: (groupId: string, newFriends: Friend[]) => Promise<void>;
  onLeaveGroup: (groupId: string) => Promise<void>;
}

export const GroupMembersModal: React.FC<GroupMembersModalProps> = ({
  isOpen,
  onClose,
  group,
  currentUserUid,
  currentUserId,
  friends = [],
  availableFriends = [],
  onAddMembers,
  onLeaveGroup,
}) => {
  const [selectedFriendUids, setSelectedFriendUids] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);

  if (!isOpen) return null;

  const activeUserUid = currentUserUid || currentUserId || '';
  const friendList = (friends && friends.length > 0) ? friends : (availableFriends || []);

  // Friends not yet in this group
  const nonMemberFriends = (friendList || []).filter(
    (f) => f && f.friendUid && !group.members.includes(f.friendUid)
  );

  const toggleFriend = (uid: string) => {
    soundFX.playKeyClick();
    setSelectedFriendUids((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleAddSubmit = async () => {
    if (selectedFriendUids.length === 0) return;
    setIsAdding(true);
    try {
      const chosen = friendList.filter((f) => selectedFriendUids.includes(f.friendUid));
      await onAddMembers(group.id, chosen);
      setSelectedFriendUids([]);
      setShowAddSection(false);
      soundFX.playBadgeEarned();
    } finally {
      setIsAdding(false);
    }
  };

  const handleLeave = async () => {
    if (!window.confirm(`本当にグループ「${group.name}」から退出しますか？`)) {
      return;
    }
    setIsLeaving(true);
    try {
      await onLeaveGroup(group.id);
      onClose();
    } finally {
      setIsLeaving(false);
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
        className="w-full max-w-md rounded-2xl border border-white/10 bg-gradient-to-b from-[#13173d] via-[#0d102b] to-[#080a1c] p-4 sm:p-5 shadow-2xl text-white flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl p-1.5 rounded-xl bg-white/[0.06] border border-white/10">
              {group.icon || '🎮'}
            </span>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                {group.name}
              </h3>
              <p className="text-[10px] text-zinc-400">
                メンバー {group.members.length} 名 • 作成者: {group.creatorName}
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
        <div className="flex-1 overflow-y-auto py-3 space-y-4 scrollbar-thin">
          {/* Members List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-cyan-400" />
                <span>参加メンバー一覧</span>
              </span>
              <button
                onClick={() => {
                  soundFX.playKeyClick();
                  setShowAddSection(!showAddSection);
                }}
                className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>{showAddSection ? '閉じる' : 'メンバー追加'}</span>
              </button>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
              {group.members.map((uid) => {
                const isCreator = uid === group.createdBy;
                const isMe = uid === activeUserUid;
                const name = group.memberNames?.[uid] || (isMe ? 'あなた' : 'メンバー');
                const photo = group.memberPhotos?.[uid];
                const gamerTag = group.memberGamerTags?.[uid];

                return (
                  <div
                    key={uid}
                    className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {photo ? (
                        <img
                          src={photo}
                          alt={name}
                          className="w-7 h-7 rounded-full object-cover border border-white/10 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                          {name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white truncate">{name}</span>
                          {isMe && (
                            <span className="text-[9px] bg-cyan-500/20 text-cyan-300 rounded px-1 font-bold">
                              自分
                            </span>
                          )}
                        </div>
                        {gamerTag && (
                          <span className="text-[10px] font-mono text-zinc-400 truncate block">
                            {gamerTag}
                          </span>
                        )}
                      </div>
                    </div>

                    {isCreator && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full flex-shrink-0">
                        <Crown className="h-3 w-3" />
                        <span>リーダー</span>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add Members Section */}
          {showAddSection && (
            <div className="p-3 rounded-xl border border-cyan-500/30 bg-cyan-950/20 animate-in fade-in-50 duration-150">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-cyan-200">フレンドをグループに招待</span>
                <span className="text-[10px] text-zinc-400">
                  選択中: {selectedFriendUids.length} 名
                </span>
              </div>

              {nonMemberFriends.length === 0 ? (
                <p className="text-xs text-zinc-400 text-center py-2">
                  追加できるフレンドが全員参加済みです
                </p>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 scrollbar-thin mb-3">
                  {nonMemberFriends.map((friend) => {
                    const isChecked = selectedFriendUids.includes(friend.friendUid);
                    return (
                      <div
                        key={friend.friendUid}
                        onClick={() => toggleFriend(friend.friendUid)}
                        className={`flex items-center justify-between p-2 rounded-lg border text-xs transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-cyan-500/20 border-cyan-400 text-white'
                            : 'bg-black/30 border-white/10 hover:border-white/20 text-zinc-300'
                        }`}
                      >
                        <span className="font-bold truncate">{friend.displayName}</span>
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border ${
                            isChecked
                              ? 'bg-cyan-500 border-cyan-400 text-black'
                              : 'border-white/20 bg-black/40'
                          }`}
                        >
                          {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {nonMemberFriends.length > 0 && (
                <button
                  type="button"
                  onClick={handleAddSubmit}
                  disabled={isAdding || selectedFriendUids.length === 0}
                  className="w-full py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black text-xs font-black transition-colors cursor-pointer"
                >
                  {isAdding ? '追加中...' : '選択したフレンドを追加'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer with Leave Group */}
        <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
          <button
            type="button"
            onClick={handleLeave}
            disabled={isLeaving}
            className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 py-1.5 px-3 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>{isLeaving ? '退出中...' : 'グループから退出'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundFX.playKeyClick();
              onClose();
            }}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition-colors cursor-pointer"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
