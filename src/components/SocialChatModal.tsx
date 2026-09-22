import React, { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  doc,
  getDocs,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { soundFX } from '../lib/sound';
import {
  Friend,
  FriendRequest,
  LobbyMessage,
  DirectChatMessage,
  UserProfile,
  GroupChat,
  GroupChatMessage,
} from '../types';
import {
  sendLobbyMessage,
  deleteLobbyMessage,
  sendDirectMessage,
  getDirectChatId,
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  createGroupChat,
  sendGroupMessage,
  addGroupMembers,
  leaveGroupChat,
} from '../lib/socialService';
import {
  MessageSquare,
  Users,
  UserPlus,
  Send,
  Trash2,
  Check,
  X,
  Search,
  Sparkles,
  Copy,
  Gamepad2,
  ArrowLeft,
  Circle,
  Play,
  Shield,
  Smile,
  LogOut,
  Zap,
  Flame,
  Plus,
  Crown,
  FolderPlus,
} from 'lucide-react';
import {
  DAIZU_STAMPS,
  DaizuBearIcon,
  DaizuStamp,
} from '../lib/daizuStamps';
import { DaizuStampPickerModal } from './DaizuStampPickerModal';
import { CreateGroupModal } from './CreateGroupModal';
import { GroupMembersModal } from './GroupMembersModal';
import { ErrorBoundary } from './ErrorBoundary';

interface SocialChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onOpenAuth: () => void;
  onLaunchGame?: (packageName: string) => void;
  onLaunchCommunityGame?: (gameId: string) => void;
}

export const SocialChatModal: React.FC<SocialChatModalProps> = ({
  isOpen,
  onClose,
  user,
  onOpenAuth,
  onLaunchGame,
  onLaunchCommunityGame,
}) => {
  const [activeTab, setActiveTab] = useState<'lobby' | 'groups' | 'groupChat' | 'friends' | 'dm' | 'search'>('lobby');

  // Lobby Chat State
  const [lobbyMessages, setLobbyMessages] = useState<LobbyMessage[]>([]);
  const [lobbyInput, setLobbyInput] = useState<string>('');
  const [isSendingLobby, setIsSendingLobby] = useState<boolean>(false);

  // Group Chats State
  const [groups, setGroups] = useState<GroupChat[]>([]);
  const [activeGroup, setActiveGroup] = useState<GroupChat | null>(null);
  const [groupMessages, setGroupMessages] = useState<GroupChatMessage[]>([]);
  const [groupInput, setGroupInput] = useState<string>('');
  const [isSendingGroup, setIsSendingGroup] = useState<boolean>(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState<boolean>(false);
  const [showGroupMembersModal, setShowGroupMembersModal] = useState<boolean>(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState<boolean>(false);

  // Friends & Requests State
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);

  // Search State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [sentRequestMap, setSentRequestMap] = useState<{ [uid: string]: boolean }>({});

  // Direct Chat (DM) State
  const [activeFriend, setActiveFriend] = useState<Friend | null>(null);
  const [dmMessages, setDmMessages] = useState<DirectChatMessage[]>([]);
  const [dmInput, setDmInput] = useState<string>('');
  const [isSendingDm, setIsSendingDm] = useState<boolean>(false);

  // Daizu Stamp UI State
  const [showStampPicker, setShowStampPicker] = useState<boolean>(false);
  const [stampPickerTarget, setStampPickerTarget] = useState<'lobby' | 'dm' | 'group'>('lobby');
  const [selectedStampCategory, setSelectedStampCategory] = useState<'all' | 'emotion' | 'gaming' | 'cheer' | 'fun'>('all');

  // Status message / toast
  const [copiedTag, setCopiedTag] = useState<boolean>(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Scroll references
  const lobbyEndRef = useRef<HTMLDivElement | null>(null);
  const dmEndRef = useRef<HTMLDivElement | null>(null);
  const groupEndRef = useRef<HTMLDivElement | null>(null);

  // Quick preset chat phrases
  const quickPhrases = [
    'こんにちは！🎮',
    '一緒にゲーム遊ぼう！🔥',
    'おすすめのゲーム教えて！✨',
    '新作AIゲーム作ったよ！🚀',
    'ナイスプレイ！👏',
    '遅延ゼロで快適！⚡',
  ];

  // 1. Real-time subscription to Lobby Messages
  useEffect(() => {
    if (!isOpen) return;

    const q = query(
      collection(db, 'lobbyMessages'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgs: LobbyMessage[] = [];
        snapshot.forEach((docSnap) => {
          msgs.push(docSnap.data() as LobbyMessage);
        });
        // Sort ascending for chat flow
        setLobbyMessages(msgs.reverse());
      },
      (error) => {
        console.warn('Lobby chat subscription error:', error);
      }
    );

    return () => unsubscribe();
  }, [isOpen]);

  // Scroll to bottom on lobby messages update
  useEffect(() => {
    if (activeTab === 'lobby') {
      lobbyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [lobbyMessages, activeTab]);

  // 2. Real-time subscription to Friends list
  useEffect(() => {
    if (!isOpen || !user) {
      setFriends([]);
      return;
    }

    const q = collection(db, 'users', user.uid, 'friends');
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const flist: Friend[] = [];
        snapshot.forEach((docSnap) => {
          flist.push(docSnap.data() as Friend);
        });
        setFriends(flist);
      },
      (err) => {
        console.warn('Friends subscription error:', err);
      }
    );

    return () => unsubscribe();
  }, [isOpen, user]);

  // 3. Real-time subscription to Incoming and Outgoing Friend Requests
  useEffect(() => {
    if (!isOpen || !user) {
      setIncomingRequests([]);
      setOutgoingRequests([]);
      return;
    }

    // Incoming requests: toUid == current user
    const inQ = query(
      collection(db, 'friendRequests'),
      where('toUid', '==', user.uid),
      where('status', '==', 'pending')
    );

    const unsubIn = onSnapshot(
      inQ,
      (snapshot) => {
        const reqs: FriendRequest[] = [];
        snapshot.forEach((docSnap) => {
          reqs.push(docSnap.data() as FriendRequest);
        });
        setIncomingRequests(reqs);
      },
      (err) => console.warn('Incoming req error:', err)
    );

    // Outgoing requests: fromUid == current user
    const outQ = query(
      collection(db, 'friendRequests'),
      where('fromUid', '==', user.uid),
      where('status', '==', 'pending')
    );

    const unsubOut = onSnapshot(
      outQ,
      (snapshot) => {
        const reqs: FriendRequest[] = [];
        const map: { [uid: string]: boolean } = {};
        snapshot.forEach((docSnap) => {
          const r = docSnap.data() as FriendRequest;
          reqs.push(r);
          map[r.toUid] = true;
        });
        setOutgoingRequests(reqs);
        setSentRequestMap(map);
      },
      (err) => console.warn('Outgoing req error:', err)
    );

    return () => {
      unsubIn();
      unsubOut();
    };
  }, [isOpen, user]);

  // 4. Real-time subscription to Direct Messages when a friend is selected
  useEffect(() => {
    if (!isOpen || !user || !activeFriend || activeTab !== 'dm') {
      setDmMessages([]);
      return;
    }

    const chatId = getDirectChatId(user.uid, activeFriend.friendUid);
    const messagesQ = query(
      collection(db, 'directChats', chatId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(
      messagesQ,
      (snapshot) => {
        const msgs: DirectChatMessage[] = [];
        snapshot.forEach((docSnap) => {
          msgs.push(docSnap.data() as DirectChatMessage);
        });
        setDmMessages(msgs);
      },
      (err) => {
        console.warn('DM subscription error:', err);
      }
    );

    return () => unsubscribe();
  }, [isOpen, user, activeFriend, activeTab]);

  // 5. Real-time subscription to Group Chats user belongs to
  useEffect(() => {
    if (!isOpen || !user) {
      setGroups([]);
      return;
    }

    const groupsQ = query(
      collection(db, 'groupChats'),
      where('members', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      groupsQ,
      (snapshot) => {
        const list: GroupChat[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as GroupChat);
        });
        setGroups(list);
        if (activeGroup) {
          const fresh = list.find((g) => g.id === activeGroup.id);
          if (fresh) setActiveGroup(fresh);
        }
      },
      (err) => {
        console.warn('Groups subscription error:', err);
      }
    );

    return () => unsubscribe();
  }, [isOpen, user, activeGroup?.id]);

  // 6. Real-time subscription to active Group Messages
  useEffect(() => {
    if (!isOpen || !user || !activeGroup || activeTab !== 'groupChat') {
      setGroupMessages([]);
      return;
    }

    const messagesQ = query(
      collection(db, 'groupChats', activeGroup.id, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(
      messagesQ,
      (snapshot) => {
        const msgs: GroupChatMessage[] = [];
        snapshot.forEach((docSnap) => {
          msgs.push(docSnap.data() as GroupChatMessage);
        });
        setGroupMessages(msgs);
      },
      (err) => {
        console.warn('Group messages error:', err);
      }
    );

    return () => unsubscribe();
  }, [isOpen, user, activeGroup?.id, activeTab]);

  // Scroll to bottom on DM messages update
  useEffect(() => {
    if (activeTab === 'dm') {
      dmEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [dmMessages, activeTab]);

  // Scroll to bottom on Group messages update
  useEffect(() => {
    if (activeTab === 'groupChat') {
      groupEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [groupMessages, activeTab]);

  // Handle sending a Daizu Stamp
  const handleSendStamp = async (stamp: DaizuStamp, target: 'lobby' | 'dm' | 'group') => {
    if (!user) {
      onOpenAuth();
      return;
    }

    setShowStampPicker(false);
    soundFX.playStampPopping();

    const stampPayload = {
      stampId: stamp.id,
      stampName: stamp.name,
      caption: stamp.caption,
    };

    try {
      if (target === 'lobby') {
        setIsSendingLobby(true);
        await sendLobbyMessage(
          {
            uid: user.uid,
            displayName: user.displayName || 'プレイヤー',
            photoURL: user.photoURL || undefined,
          },
          stamp.caption,
          { stamp: stampPayload }
        );
      } else if (target === 'dm' && activeFriend) {
        setIsSendingDm(true);
        const chatId = getDirectChatId(user.uid, activeFriend.friendUid);
        await sendDirectMessage(
          chatId,
          {
            uid: user.uid,
            displayName: user.displayName || 'プレイヤー',
            photoURL: user.photoURL || undefined,
          },
          activeFriend.friendUid,
          stamp.caption,
          { stamp: stampPayload }
        );
      } else if (target === 'group' && activeGroup) {
        setIsSendingGroup(true);
        await sendGroupMessage(
          activeGroup.id,
          {
            uid: user.uid,
            displayName: user.displayName || 'プレイヤー',
            photoURL: user.photoURL || undefined,
          },
          stamp.caption,
          { stamp: stampPayload }
        );
      }
      soundFX.playMessageSent();
    } catch (err) {
      console.error('Failed to send stamp:', err);
      setStatusNotice('スタンプ送信に失敗しました');
    } finally {
      setIsSendingLobby(false);
      setIsSendingDm(false);
      setIsSendingGroup(false);
    }
  };

  // Handle creating a new Group Chat
  const handleCreateGroup = async (
    name: string,
    icon: string,
    selectedFriends: Friend[],
    description?: string
  ) => {
    if (!user) {
      onOpenAuth();
      return;
    }

    setIsCreatingGroup(true);
    try {
      const initialMembers = selectedFriends.map((f) => ({
        uid: f.friendUid,
        displayName: f.displayName,
        photoURL: f.photoURL || undefined,
        gamerTag: f.gamerTag || undefined,
      }));

      const newGroupId = await createGroupChat(
        {
          uid: user.uid,
          displayName: user.displayName || 'プレイヤー',
          photoURL: user.photoURL || undefined,
        },
        name,
        icon,
        initialMembers,
        description
      );

      soundFX.playBadgeEarned();
      setShowCreateGroupModal(false);
      setStatusNotice(`グループ「${name}」を作成しました！🎉`);
      setTimeout(() => setStatusNotice(null), 3500);

      // Construct provisional active group
      const newGroupData: GroupChat = {
        id: newGroupId,
        name,
        icon,
        description,
        createdBy: user.uid,
        creatorName: user.displayName || 'プレイヤー',
        members: [user.uid, ...selectedFriends.map((f) => f.friendUid)],
        memberNames: {
          [user.uid]: user.displayName || 'プレイヤー',
          ...Object.fromEntries(selectedFriends.map((f) => [f.friendUid, f.displayName])),
        },
        memberPhotos: {
          ...(user.photoURL ? { [user.uid]: user.photoURL } : {}),
          ...Object.fromEntries(
            selectedFriends.filter((f) => f.photoURL).map((f) => [f.friendUid, f.photoURL!])
          ),
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setActiveGroup(newGroupData);
      setActiveTab('groupChat');
    } catch (err) {
      console.error('Failed to create group:', err);
      setStatusNotice('グループの作成に失敗しました');
    } finally {
      setIsCreatingGroup(false);
    }
  };

  // Handle sending Group Message
  const handleSendGroupMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const text = (customText || groupInput).trim();
    if (!text || !user || !activeGroup || isSendingGroup) return;

    try {
      setIsSendingGroup(true);
      soundFX.playKeyClick();
      await sendGroupMessage(
        activeGroup.id,
        {
          uid: user.uid,
          displayName: user.displayName || 'プレイヤー',
          photoURL: user.photoURL || undefined,
        },
        text
      );
      soundFX.playMessageSent();
      if (!customText) setGroupInput('');
    } catch (err) {
      console.error('Failed to send group message:', err);
      setStatusNotice('グループメッセージの送信に失敗しました');
    } finally {
      setIsSendingGroup(false);
    }
  };

  // Handle adding members to group
  const handleAddGroupMembers = async (groupId: string, newFriends: Friend[]) => {
    if (!user) return;
    try {
      soundFX.playKeyClick();
      await addGroupMembers(
        groupId,
        newFriends.map((f) => ({
          uid: f.friendUid,
          displayName: f.displayName,
          photoURL: f.photoURL || undefined,
          gamerTag: f.gamerTag || undefined,
        }))
      );
      soundFX.playFriendAdded();
      setStatusNotice(`${newFriends.length} 名のフレンドをグループに追加しました！`);
      setTimeout(() => setStatusNotice(null), 3000);
    } catch (err) {
      console.error('Failed to add group members:', err);
      setStatusNotice('メンバーの追加に失敗しました');
    }
  };

  // Handle leaving group
  const handleLeaveGroup = async (groupId: string) => {
    if (!user) return;
    try {
      soundFX.playKeyClick();
      await leaveGroupChat(groupId, user.uid);
      setStatusNotice('グループから退出しました');
      setTimeout(() => setStatusNotice(null), 3000);
      if (activeGroup?.id === groupId) {
        setActiveGroup(null);
        setActiveTab('groups');
      }
    } catch (err) {
      console.error('Failed to leave group:', err);
      setStatusNotice('グループからの退出に失敗しました');
    }
  };

  // Handle sending Lobby message
  const handleSendLobby = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const text = customText || lobbyInput;
    if (!text.trim()) return;

    if (!user) {
      onOpenAuth();
      return;
    }

    try {
      setIsSendingLobby(true);
      soundFX.playKeyClick();
      await sendLobbyMessage(
        {
          uid: user.uid,
          displayName: user.displayName || 'プレイヤー',
          photoURL: user.photoURL || undefined,
        },
        text
      );
      soundFX.playMessageSent();
      if (!customText) setLobbyInput('');
    } catch (err) {
      console.error('Failed to send lobby message:', err);
      setStatusNotice('メッセージ送信に失敗しました');
    } finally {
      setIsSendingLobby(false);
    }
  };

  // Handle sending Direct Message
  const handleSendDm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dmInput.trim() || !user || !activeFriend) return;

    const chatId = getDirectChatId(user.uid, activeFriend.friendUid);
    try {
      setIsSendingDm(true);
      soundFX.playKeyClick();
      await sendDirectMessage(
        chatId,
        {
          uid: user.uid,
          displayName: user.displayName || 'プレイヤー',
          photoURL: user.photoURL || undefined,
        },
        activeFriend.friendUid,
        dmInput
      );
      soundFX.playMessageSent();
      setDmInput('');
    } catch (err) {
      console.error('Failed to send DM:', err);
      setStatusNotice('DM送信に失敗しました');
    } finally {
      setIsSendingDm(false);
    }
  };

  // Handle User Search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      soundFX.playKeyClick();
      const results = await searchUsers(searchQuery, user?.uid);
      setSearchResults(results);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle Send Friend Request
  const handleSendRequest = async (targetUser: { uid: string; displayName: string }) => {
    if (!user) {
      onOpenAuth();
      return;
    }

    try {
      soundFX.playKeyClick();
      await sendFriendRequest(
        {
          uid: user.uid,
          displayName: user.displayName || 'プレイヤー',
          photoURL: user.photoURL || undefined,
        },
        targetUser
      );
      soundFX.playMessageSent();
      setSentRequestMap((prev) => ({ ...prev, [targetUser.uid]: true }));
      setStatusNotice(`${targetUser.displayName} にフレンド申請を送信しました！`);
      setTimeout(() => setStatusNotice(null), 3500);
    } catch (err) {
      console.error('Send friend request failed:', err);
      setStatusNotice('申請の送信に失敗しました');
    }
  };

  // Handle Accept Friend Request
  const handleAcceptRequest = async (req: FriendRequest) => {
    if (!user) return;
    try {
      soundFX.playKeyClick();
      await acceptFriendRequest(req, {
        uid: user.uid,
        displayName: user.displayName || 'プレイヤー',
        photoURL: user.photoURL || undefined,
      });
      soundFX.playFriendAdded();
      setStatusNotice(`${req.fromName} とフレンドになりました！🎉`);
      setTimeout(() => setStatusNotice(null), 3500);
    } catch (err) {
      console.error('Accept friend request failed:', err);
    }
  };

  // Handle Reject Friend Request
  const handleRejectRequest = async (reqId: string) => {
    try {
      soundFX.playKeyClick();
      await rejectFriendRequest(reqId);
      setStatusNotice('フレンド申請をお断りしました');
      setTimeout(() => setStatusNotice(null), 3000);
    } catch (err) {
      console.error('Reject friend request failed:', err);
    }
  };

  // Handle Remove Friend
  const handleRemoveFriend = async (friend: Friend) => {
    if (!user) return;
    if (!window.confirm(`${friend.displayName} をフレンドから削除しますか？`)) return;

    try {
      soundFX.playKeyClick();
      await removeFriend(user.uid, friend.friendUid);
      if (activeFriend?.friendUid === friend.friendUid) {
        setActiveFriend(null);
        setActiveTab('friends');
      }
      setStatusNotice('フレンドを解除しました');
      setTimeout(() => setStatusNotice(null), 3000);
    } catch (err) {
      console.error('Remove friend failed:', err);
    }
  };

  // Copy User GamerTag / Friend Code
  const handleCopyTag = () => {
    if (!user) return;
    const tag = `S-Player-${user.uid.slice(0, 7)}`;
    navigator.clipboard.writeText(tag);
    soundFX.playKeyClick();
    setCopiedTag(true);
    setTimeout(() => setCopiedTag(false), 2500);
  };

  // Open Direct Message with Friend
  const handleOpenDm = (friend: Friend) => {
    soundFX.playKeyClick();
    setActiveFriend(friend);
    setActiveTab('dm');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-3 sm:p-5 animate-in fade-in duration-200">
      <div
        className="relative flex flex-col w-full max-w-4xl h-[90vh] max-h-[780px] rounded-3xl bg-[#090c22]/95 border border-white/10 shadow-[0_20px_70px_rgba(0,0,0,0.85)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Sci-Fi Header Neon Strip */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-400 via-violet-500 to-transparent" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-white/[0.08] bg-[#0c102c]/70">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-violet-600 p-[1.5px] shadow-lg shadow-cyan-500/20">
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-[#090c22]">
                <MessageSquare className="h-5 w-5 text-cyan-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-tight">S games コミュ &amp; チャット</h2>
                <span className="flex items-center gap-1 rounded-md bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-mono text-emerald-400 font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE
                </span>
              </div>
              <p className="text-xs text-zinc-400">リアルタイム全体ラウンジチャット ＆ フレンド1対1メッセージ</p>
            </div>
          </div>

          <button
            id="close-social-modal-btn"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Notification Toast Bar if present */}
        {statusNotice && (
          <div className="bg-cyan-950/90 border-b border-cyan-500/30 px-4 py-2 text-xs font-bold text-cyan-300 flex items-center justify-between animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-400 animate-pulse" />
              <span>{statusNotice}</span>
            </div>
            <button onClick={() => setStatusNotice(null)} className="text-zinc-400 hover:text-white">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Main Body with Sidebar Tabs and Content */}
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          {/* Tabs Navigation Sidebar */}
          <div className="w-full sm:w-64 border-b sm:border-b-0 sm:border-r border-white/[0.08] bg-[#0a0d26]/80 flex sm:flex-col justify-between p-2.5 sm:p-3.5 gap-1.5 overflow-x-auto sm:overflow-x-visible">
            <div className="flex sm:flex-col gap-1.5 flex-1">
              {/* Tab 1: Global Lobby Chat */}
              <button
                id="tab-social-lobby-btn"
                onClick={() => {
                  soundFX.playKeyClick();
                  setActiveTab('lobby');
                }}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'lobby'
                    ? 'bg-gradient-to-r from-cyan-600/80 to-indigo-600/80 text-white shadow-md shadow-cyan-600/20 border border-cyan-400/30'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <MessageSquare className="h-4 w-4 text-cyan-400" />
                <span className="flex-1 text-left">全体ロビー</span>
                <span className="rounded-full bg-cyan-950/80 border border-cyan-500/30 px-1.5 py-0.2 text-[10px] text-cyan-300 font-mono">
                  {lobbyMessages.length}
                </span>
              </button>

              {/* Tab 2: Group Messages */}
              <button
                id="tab-social-groups-btn"
                onClick={() => {
                  soundFX.playKeyClick();
                  setActiveTab('groups');
                }}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'groups'
                    ? 'bg-gradient-to-r from-indigo-600/80 to-cyan-600/80 text-white shadow-md shadow-indigo-600/20 border border-indigo-400/30'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Users className="h-4 w-4 text-cyan-400" />
                <span className="flex-1 text-left">グループメッセージ</span>
                <span className="rounded-full bg-indigo-950/80 border border-indigo-500/30 px-1.5 py-0.2 text-[10px] text-cyan-300 font-mono">
                  {groups.length}
                </span>
              </button>

              {/* Active Group Chat Tab (if a group is opened) */}
              {activeGroup && (
                <button
                  id="tab-social-groupchat-btn"
                  onClick={() => {
                    soundFX.playKeyClick();
                    setActiveTab('groupChat');
                  }}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'groupChat'
                      ? 'bg-gradient-to-r from-cyan-600/80 to-indigo-600/80 text-white shadow-md shadow-cyan-600/20 border border-cyan-400/30'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="text-base">{activeGroup.icon || '🎮'}</span>
                  <span className="flex-1 text-left truncate">{activeGroup.name}</span>
                  <span className="rounded-full bg-cyan-950/80 border border-cyan-500/30 px-1.5 py-0.2 text-[9px] text-cyan-300 font-mono">
                    {activeGroup.members.length}名
                  </span>
                </button>
              )}

              {/* Tab 3: Friends List */}
              <button
                id="tab-social-friends-btn"
                onClick={() => {
                  soundFX.playKeyClick();
                  setActiveTab('friends');
                }}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'friends'
                    ? 'bg-gradient-to-r from-violet-600/80 to-indigo-600/80 text-white shadow-md shadow-violet-600/20 border border-violet-400/30'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Users className="h-4 w-4 text-violet-400" />
                <span className="flex-1 text-left">フレンド一覧</span>
                <span className="rounded-full bg-violet-950/80 border border-violet-500/30 px-1.5 py-0.2 text-[10px] text-violet-300 font-mono">
                  {friends.length}
                </span>
              </button>

              {/* Direct Message (if a friend is selected) */}
              {activeFriend && (
                <button
                  id="tab-social-dm-btn"
                  onClick={() => {
                    soundFX.playKeyClick();
                    setActiveTab('dm');
                  }}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'dm'
                      ? 'bg-gradient-to-r from-emerald-600/80 to-cyan-600/80 text-white shadow-md shadow-emerald-600/20 border border-emerald-400/30'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="relative">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5" />
                    <Send className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                  <span className="flex-1 text-left truncate">DM: {activeFriend.displayName}</span>
                </button>
              )}

              {/* Tab 4: Search & Requests */}
              <button
                id="tab-social-search-btn"
                onClick={() => {
                  soundFX.playKeyClick();
                  setActiveTab('search');
                }}
                className={`relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'search'
                    ? 'bg-gradient-to-r from-cyan-600/80 to-blue-600/80 text-white shadow-md shadow-blue-600/20 border border-blue-400/30'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <UserPlus className="h-4 w-4 text-cyan-400" />
                <span className="flex-1 text-left">フレンド追加・申請</span>
                {incomingRequests.length > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-black animate-bounce">
                    {incomingRequests.length}
                  </span>
                )}
              </button>
            </div>

            {/* User Gamer Tag Footer Box */}
            {user ? (
              <div className="hidden sm:block mt-3 rounded-2xl bg-[#0e1233] border border-white/[0.08] p-3 text-xs">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] font-bold text-zinc-300">ログイン中</span>
                </div>
                <div className="text-[11px] text-zinc-400 font-mono truncate">
                  ID: {user.uid.slice(0, 10)}...
                </div>
                <button
                  onClick={handleCopyTag}
                  className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] py-1.5 text-[11px] font-bold text-cyan-300 transition-colors cursor-pointer"
                >
                  <Copy className="h-3 w-3" />
                  <span>{copiedTag ? 'コピー完了！' : 'フレンドコード共有'}</span>
                </button>
              </div>
            ) : (
              <div className="hidden sm:block mt-3 rounded-2xl bg-gradient-to-br from-violet-950/40 to-cyan-950/40 border border-cyan-500/30 p-3 text-center">
                <p className="text-[11px] text-zinc-300 font-medium mb-2">
                  ログインするとフレンド追加やチャット発言ができます
                </p>
                <button
                  onClick={onOpenAuth}
                  className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 py-1.5 text-xs font-bold text-white shadow-md hover:scale-[1.02] transition-transform cursor-pointer"
                >
                  ログイン
                </button>
              </div>
            )}
          </div>

          {/* Main Tab Content View */}
          <div className="flex-1 flex flex-col bg-[#07091c]/80 overflow-hidden relative">
            {/* TAB 1: Global Lobby Chat */}
            {activeTab === 'lobby' && (
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Lobby Header info banner */}
                <div className="px-4 py-2.5 border-b border-white/[0.06] bg-[#0c102a]/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <span className="inline-block h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                    <span>S games 全プレイヤー向けオープンプラットフォームラウンジ</span>
                  </div>
                  <span className="text-[11px] text-zinc-500 hidden md:inline">マナーを守って楽しく会話しましょう</span>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
                  {lobbyMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8 text-zinc-400">
                      <MessageSquare className="h-12 w-12 text-zinc-600 mb-3" />
                      <p className="text-sm font-bold text-zinc-300">まだメッセージがありません</p>
                      <p className="text-xs text-zinc-500 mt-1">下の入力欄から最初の挨拶を投稿してみよう！</p>
                    </div>
                  ) : (
                    lobbyMessages.map((msg) => {
                      const isMe = user && msg.userId === user.uid;
                      return (
                        <div
                          key={msg.id}
                          className={`flex items-start gap-3 group animate-in fade-in-50 duration-200 ${
                            isMe ? 'flex-row-reverse' : 'flex-row'
                          }`}
                        >
                          {/* User Avatar */}
                          {msg.userPhoto ? (
                            <img
                              src={msg.userPhoto}
                              alt={msg.userName}
                              className="h-8 w-8 rounded-full object-cover border border-cyan-500/30 flex-shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-violet-600 to-cyan-500 text-xs font-bold text-white flex-shrink-0">
                              {msg.userName?.[0] || 'U'}
                            </div>
                          )}

                          {/* Message Bubble Card */}
                          <div
                            className={`max-w-[78%] sm:max-w-[70%] rounded-2xl p-3 border text-xs relative ${
                              isMe
                                ? 'bg-gradient-to-r from-violet-900/60 to-indigo-900/60 border-violet-500/40 text-white'
                                : 'bg-[#101438]/90 border-white/[0.08] text-zinc-200'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-[11px] text-cyan-300 truncate">
                                {msg.userName}
                              </span>
                              {msg.userGamerTag && (
                                <span className="text-[9px] text-zinc-400 font-mono truncate">
                                  @{msg.userGamerTag}
                                </span>
                              )}
                              <span className="text-[10px] text-zinc-500 ml-auto">
                                {new Date(msg.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>

                            {/* Message content: Regular text, Stamp, or Groove */}
                            {msg.stamp ? (
                              <div className="py-1">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 border border-amber-400/40 rounded-md px-1.5 py-0.5">
                                    だいずべあ スタンプ
                                  </span>
                                  <span className="text-[11px] font-bold text-white">
                                    {msg.stamp.caption}
                                  </span>
                                </div>
                                <div className="p-2 rounded-xl bg-black/30 border border-amber-500/20 inline-block hover:scale-105 transition-transform">
                                  <DaizuBearIcon stampId={msg.stamp.stampId} size={72} animated={true} />
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs leading-relaxed whitespace-pre-wrap break-words">
                                {msg.text}
                              </p>
                            )}

                            {/* Game Invite Attachment if present */}
                            {msg.gameInvite && (
                              <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 text-amber-300">
                                  <Gamepad2 className="h-3.5 w-3.5" />
                                  <span className="font-bold truncate text-[11px]">
                                    {msg.gameInvite.gameTitle}
                                  </span>
                                </div>
                                <button
                                  onClick={() => {
                                    if (msg.gameInvite?.isCloudmoon && onLaunchGame) {
                                      onLaunchGame(msg.gameInvite.gameId);
                                      onClose();
                                    } else if (onLaunchCommunityGame) {
                                      onLaunchCommunityGame(msg.gameInvite!.gameId);
                                      onClose();
                                    }
                                  }}
                                  className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-1 text-[10px] font-bold text-black hover:brightness-110 cursor-pointer"
                                >
                                  <Play className="h-2.5 w-2.5 fill-current" />
                                  <span>参加</span>
                                </button>
                              </div>
                            )}

                            {/* Actions on hover */}
                            <div className="mt-1.5 flex items-center gap-2 text-[10px] text-zinc-400 opacity-80 group-hover:opacity-100 transition-opacity">
                              {!isMe && user && (
                                <button
                                  onClick={() =>
                                    handleSendRequest({
                                      uid: msg.userId,
                                      displayName: msg.userName,
                                    })
                                  }
                                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold cursor-pointer"
                                  title="フレンド申請を送る"
                                >
                                  <UserPlus className="h-3 w-3" />
                                  <span>フレンド申請</span>
                                </button>
                              )}

                              {isMe && (
                                <button
                                  onClick={() => deleteLobbyMessage(msg.id)}
                                  className="text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer ml-auto"
                                  title="メッセージを削除"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={lobbyEndRef} />
                </div>

                {/* Quick preset phrases bar */}
                <div className="px-4 py-2 border-t border-white/[0.06] bg-[#0c102a]/60 overflow-x-auto flex items-center gap-2 scrollbar-none">
                  {quickPhrases.map((phrase, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendLobby(undefined, phrase)}
                      className="rounded-full bg-white/[0.06] hover:bg-cyan-950 hover:border-cyan-500/40 border border-white/10 px-2.5 py-1 text-[11px] text-zinc-300 hover:text-cyan-300 whitespace-nowrap transition-all cursor-pointer flex-shrink-0"
                    >
                      {phrase}
                    </button>
                  ))}
                </div>

                {/* Chat Input Bar */}
                <form
                  onSubmit={handleSendLobby}
                  className="p-3 sm:p-4 border-t border-white/[0.08] bg-[#0c102c]/90 flex items-center gap-2"
                >
                  {/* Daizu Stamp Picker Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!user) {
                        onOpenAuth();
                        return;
                      }
                      soundFX.playKeyClick();
                      setStampPickerTarget('lobby');
                      setShowStampPicker(true);
                    }}
                    title="だいずべあ スタンプ"
                    className="flex items-center justify-center p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:text-amber-200 transition-all cursor-pointer flex-shrink-0"
                  >
                    <Smile className="h-4 w-4" />
                  </button>

                  <input
                    id="lobby-chat-input"
                    type="text"
                    value={lobbyInput}
                    onChange={(e) => setLobbyInput(e.target.value)}
                    placeholder={
                      user
                        ? '全体ロビーにメッセージを送信... (Enterで送信)'
                        : 'チャットを送信するにはログインしてください'
                    }
                    disabled={!user || isSendingLobby}
                    maxLength={500}
                    className="flex-1 rounded-xl border border-white/10 bg-[#070918] px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:border-cyan-500 focus:outline-none transition-colors"
                  />
                  <button
                    id="send-lobby-chat-btn"
                    type="submit"
                    disabled={!user || !lobbyInput.trim() || isSendingLobby}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-cyan-500/25 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex-shrink-0"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">送信</span>
                  </button>
                </form>
              </div>
            )}

            {/* TAB: Group Messages List */}
            {activeTab === 'groups' && (
              <div className="flex-1 flex flex-col h-full overflow-y-auto p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <Users className="h-4 w-4 text-cyan-400" />
                      <span>グループメッセージ ({groups.length})</span>
                    </h3>
                    <p className="text-xs text-zinc-400">
                      フレンドとグループを作成して、マルチプレイや作戦会議のチャットを楽しめます
                    </p>
                  </div>

                  <button
                    id="create-group-btn"
                    onClick={() => {
                      if (!user) {
                        onOpenAuth();
                        return;
                      }
                      soundFX.playKeyClick();
                      setShowCreateGroupModal(true);
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:brightness-110 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-cyan-500/25 transition-all cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>新規グループ作成</span>
                  </button>
                </div>

                {!user ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-400">
                    <Users className="h-10 w-10 text-cyan-400/50 mb-3" />
                    <p className="text-sm font-bold text-zinc-200">ログインが必要です</p>
                    <p className="text-xs text-zinc-500 max-w-sm mt-1 mb-4">
                      グループメッセージを利用するにはログインしてください
                    </p>
                    <button
                      onClick={onOpenAuth}
                      className="rounded-xl bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-xs font-bold text-white shadow-md cursor-pointer"
                    >
                      ログインする
                    </button>
                  </div>
                ) : groups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-400">
                    <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-950/40 border border-cyan-500/20 mb-3">
                      <Users className="h-8 w-8 text-cyan-400" />
                    </div>
                    <p className="text-sm font-bold text-zinc-200">参加しているグループはまだありません</p>
                    <p className="text-xs text-zinc-500 max-w-sm mt-1 mb-4">
                      フレンドを招待して新しいグループを作成してみましょう！ゲームのマルチ募集や仲間内のチャットに最適です。
                    </p>
                    <button
                      onClick={() => {
                        soundFX.playKeyClick();
                        setShowCreateGroupModal(true);
                      }}
                      className="flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-900/60 px-4 py-2 text-xs font-bold text-cyan-300 transition-colors cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      <span>グループを作成する</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {groups.map((grp) => {
                      const isCreator = user && grp.createdBy === user.uid;
                      return (
                        <div
                          key={grp.id}
                          onClick={() => {
                            soundFX.playKeyClick();
                            setActiveGroup(grp);
                            setActiveTab('groupChat');
                          }}
                          className="flex flex-col justify-between rounded-2xl bg-[#0d1130] border border-white/[0.08] p-4 hover:border-cyan-500/40 hover:bg-[#0f143a] transition-all shadow-md group cursor-pointer"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2.5">
                                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-950/70 border border-cyan-500/30 text-2xl">
                                  {grp.icon || '🎮'}
                                </span>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                                      {grp.name}
                                    </h4>
                                    {isCreator && (
                                      <span className="flex items-center gap-0.5 rounded px-1.5 py-0.2 bg-amber-500/20 border border-amber-500/40 text-[9px] font-bold text-amber-300">
                                        <Crown className="h-2.5 w-2.5" />
                                        オーナー
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-zinc-400">
                                    メンバー {grp.members.length} 名
                                  </span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  soundFX.playKeyClick();
                                  setActiveGroup(grp);
                                  setShowGroupMembersModal(true);
                                }}
                                title="メンバー管理"
                                className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                              >
                                <Users className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            {grp.description && (
                              <p className="text-xs text-zinc-400 line-clamp-2 mb-3">
                                {grp.description}
                              </p>
                            )}
                          </div>

                          <div className="mt-2 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
                            {/* Member stack preview */}
                            <div className="flex items-center -space-x-1.5">
                              {grp.members.slice(0, 4).map((mUid) => {
                                const photo = grp.memberPhotos?.[mUid];
                                const name = grp.memberNames?.[mUid] || 'M';
                                return photo ? (
                                  <img
                                    key={mUid}
                                    src={photo}
                                    alt={name}
                                    className="h-5 w-5 rounded-full object-cover border border-[#0d1130]"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div
                                    key={mUid}
                                    className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-900 border border-[#0d1130] text-[9px] font-bold text-cyan-200"
                                  >
                                    {name[0]}
                                  </div>
                                );
                              })}
                              {grp.members.length > 4 && (
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 border border-[#0d1130] text-[9px] font-bold text-zinc-300">
                                  +{grp.members.length - 4}
                                </div>
                              )}
                            </div>

                            {/* Last message preview */}
                            <div className="text-right truncate max-w-[180px] text-zinc-400">
                              {grp.lastMessage ? (
                                <span className="truncate">
                                  {grp.lastMessageSenderName && (
                                    <strong className="text-zinc-300 font-medium">
                                      {grp.lastMessageSenderName}:{' '}
                                    </strong>
                                  )}
                                  {grp.lastMessage}
                                </span>
                              ) : (
                                <span className="text-zinc-500 italic">メッセージなし</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB: Active Group Chat Room */}
            {activeTab === 'groupChat' && activeGroup && (
              <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#070918]">
                {/* Group Chat Room Header */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/[0.08] bg-[#0c102c]/70">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        soundFX.playKeyClick();
                        setActiveTab('groups');
                      }}
                      className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      title="グループ一覧へ"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>

                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{activeGroup.icon || '🎮'}</span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-black text-white">{activeGroup.name}</h3>
                          {user && activeGroup.createdBy === user.uid && (
                            <span className="flex items-center gap-0.5 rounded px-1.5 py-0.2 bg-amber-500/20 border border-amber-500/40 text-[9px] font-bold text-amber-300">
                              <Crown className="h-2.5 w-2.5" />
                              オーナー
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-400">
                          メンバー {activeGroup.members.length} 名
                          {activeGroup.description ? ` • ${activeGroup.description}` : ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        soundFX.playKeyClick();
                        setShowGroupMembersModal(true);
                      }}
                      className="flex items-center gap-1 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 px-2.5 py-1.5 text-xs font-bold text-cyan-300 transition-colors cursor-pointer"
                    >
                      <Users className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">メンバー管理</span>
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`グループ「${activeGroup.name}」から退出しますか？`)) {
                          handleLeaveGroup(activeGroup.id);
                        }
                      }}
                      className="flex items-center gap-1 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 px-2 py-1.5 text-xs font-bold text-rose-300 transition-colors cursor-pointer"
                      title="グループから退出"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Group Messages Stream */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
                  {groupMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8 text-zinc-400">
                      <Users className="h-10 w-10 text-cyan-500/40 mb-2" />
                      <p className="text-xs font-bold text-zinc-300">
                        グループ「{activeGroup.name}」のメッセージはまだありません
                      </p>
                      <p className="text-[11px] text-zinc-500 mt-1 max-w-sm">
                        メンバー同士でメッセージやだいずべあスタンプを送って作戦会議を始めましょう！
                      </p>
                    </div>
                  ) : (
                    groupMessages.map((msg) => {
                      const isMe = user && msg.senderId === user.uid;
                      const isLeader = msg.senderId === activeGroup.createdBy;
                      return (
                        <div
                          key={msg.id}
                          className={`flex items-start gap-2.5 ${
                            isMe ? 'flex-row-reverse' : 'flex-row'
                          }`}
                        >
                          {/* Avatar if not me */}
                          {!isMe && (
                            <div className="flex-shrink-0 mt-0.5">
                              {msg.senderPhoto ? (
                                <img
                                  src={msg.senderPhoto}
                                  alt={msg.senderName}
                                  className="h-8 w-8 rounded-full object-cover border border-cyan-500/40"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 text-xs font-bold text-white shadow">
                                  {msg.senderName[0] || 'U'}
                                </div>
                              )}
                            </div>
                          )}

                          <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                            {/* Sender name label */}
                            {!isMe && (
                              <div className="flex items-center gap-1.5 mb-1 px-1">
                                <span className="text-[11px] font-bold text-zinc-300">
                                  {msg.senderName}
                                </span>
                                {isLeader && (
                                  <span className="flex items-center gap-0.5 rounded px-1 py-0.2 bg-amber-500/20 border border-amber-500/40 text-[8px] font-bold text-amber-300">
                                    <Crown className="h-2 w-2" />
                                    リーダー
                                  </span>
                                )}
                              </div>
                            )}

                            <div
                              className={`rounded-2xl p-3 text-xs leading-relaxed break-words shadow-md ${
                                isMe
                                  ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-tr-sm'
                                  : 'bg-[#12163b] border border-white/10 text-zinc-200 rounded-tl-sm'
                              }`}
                            >
                              {/* Stamp message */}
                              {msg.stamp ? (
                                <div className="py-1">
                                  <div className="flex items-center gap-1.5 mb-1.5">
                                    <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 border border-amber-400/40 rounded-md px-1.5 py-0.5">
                                      スタンプ
                                    </span>
                                    <span className="text-[11px] font-bold text-white">
                                      {msg.stamp.caption}
                                    </span>
                                  </div>
                                  <div className="p-2 rounded-xl bg-black/30 border border-amber-500/20 inline-block">
                                    <DaizuBearIcon stampId={msg.stamp.stampId} size={64} animated={true} />
                                  </div>
                                </div>
                              ) : (
                                <p>{msg.text}</p>
                              )}

                              <span className="block mt-1 text-[9px] text-zinc-300/70 text-right">
                                {new Date(msg.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={groupEndRef} />
                </div>

                {/* Group Chat Input Bar */}
                <form
                  onSubmit={handleSendGroupMessage}
                  className="p-3 sm:p-4 border-t border-white/[0.08] bg-[#0c102c]/90 flex items-center gap-2"
                >
                  {/* Daizu Stamp Picker Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!user) {
                        onOpenAuth();
                        return;
                      }
                      soundFX.playKeyClick();
                      setStampPickerTarget('group');
                      setShowStampPicker(true);
                    }}
                    title="だいずべあ スタンプ"
                    className="flex items-center justify-center p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:text-amber-200 transition-all cursor-pointer flex-shrink-0"
                  >
                    <Smile className="h-4 w-4" />
                  </button>

                  <input
                    id="group-chat-input"
                    type="text"
                    value={groupInput}
                    onChange={(e) => setGroupInput(e.target.value)}
                    placeholder={`グループ「${activeGroup.name}」にメッセージを送信... (Enterで送信)`}
                    disabled={isSendingGroup}
                    maxLength={1000}
                    className="flex-1 rounded-xl border border-white/10 bg-[#070918] px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:border-cyan-500 focus:outline-none transition-colors"
                  />
                  <button
                    id="send-group-chat-btn"
                    type="submit"
                    disabled={!groupInput.trim() || isSendingGroup}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex-shrink-0"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>送信</span>
                  </button>
                </form>
              </div>
            )}

            {/* TAB 2: Friends List */}
            {activeTab === 'friends' && (
              <div className="flex-1 flex flex-col h-full overflow-y-auto p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <Users className="h-4 w-4 text-violet-400" />
                      <span>フレンドリスト ({friends.length}人)</span>
                    </h3>
                    <p className="text-xs text-zinc-400">オンライン中のフレンドとリアルタイム1対1チャットができます</p>
                  </div>

                  <button
                    onClick={() => setActiveTab('search')}
                    className="flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-violet-600/30 transition-all cursor-pointer"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>フレンドを探す</span>
                  </button>
                </div>

                {friends.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-400">
                    <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-950/40 border border-violet-500/20 mb-3">
                      <Users className="h-8 w-8 text-violet-400" />
                    </div>
                    <p className="text-sm font-bold text-zinc-200">フレンドがまだ登録されていません</p>
                    <p className="text-xs text-zinc-500 max-w-sm mt-1 mb-4">
                      「フレンド追加・申請」タブからゲーマータグを検索するか、全体ロビーでプレイヤーにフレンド申請を送信してみましょう！
                    </p>
                    <button
                      onClick={() => setActiveTab('search')}
                      className="rounded-xl border border-violet-500/40 bg-violet-950/40 hover:bg-violet-900/60 px-4 py-2 text-xs font-bold text-violet-300 transition-colors cursor-pointer"
                    >
                      フレンドを検索する
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {friends.map((fr) => (
                      <div
                        key={fr.friendUid}
                        className="flex items-center justify-between rounded-2xl bg-[#0d1130] border border-white/[0.08] p-3.5 hover:border-violet-500/40 transition-all shadow-md group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            {fr.photoURL ? (
                              <img
                                src={fr.photoURL}
                                alt={fr.displayName}
                                className="h-10 w-10 rounded-full object-cover border border-violet-400/40"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-sm font-bold text-white">
                                {fr.displayName[0] || 'F'}
                              </div>
                            )}
                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 border-2 border-[#0d1130]" />
                          </div>

                          <div>
                            <h4 className="text-xs font-bold text-white">{fr.displayName}</h4>
                            <p className="text-[10px] text-zinc-400 font-mono">
                              {fr.gamerTag ? `@${fr.gamerTag}` : 'オンライン'}
                            </p>
                            <span className="inline-block mt-0.5 rounded bg-emerald-950 border border-emerald-500/30 px-1.5 py-0.2 text-[9px] font-bold text-emerald-400">
                              Lv.{fr.level || 1} ゲーマー
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenDm(fr)}
                            title="1対1 DMチャットを開く"
                            className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:brightness-110 px-3 py-1.5 text-xs font-bold text-white shadow-md transition-all cursor-pointer"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>チャット</span>
                          </button>

                          <button
                            onClick={() => handleRemoveFriend(fr)}
                            title="フレンド解除"
                            className="text-zinc-500 hover:text-red-400 p-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: 1-on-1 Direct Chat with Active Friend */}
            {activeTab === 'dm' && activeFriend && (
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* DM Header */}
                <div className="px-4 py-3 border-b border-white/[0.08] bg-[#0d1130] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setActiveTab('friends')}
                      className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>

                    <div className="relative">
                      {activeFriend.photoURL ? (
                        <img
                          src={activeFriend.photoURL}
                          alt={activeFriend.displayName}
                          className="h-9 w-9 rounded-full object-cover border border-cyan-400/40"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-600 to-violet-600 text-xs font-bold text-white">
                          {activeFriend.displayName[0] || 'F'}
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border border-[#0d1130]" />
                    </div>

                    <div>
                      <h3 className="text-xs font-bold text-white">{activeFriend.displayName}</h3>
                      <p className="text-[10px] text-emerald-400 font-medium">オンライン • 1対1 ダイレクトメッセージ</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('friends')}
                    className="text-xs text-zinc-400 hover:text-white"
                  >
                    一覧へ戻る
                  </button>
                </div>

                {/* DM Message stream */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
                  {dmMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8 text-zinc-400">
                      <Send className="h-10 w-10 text-zinc-600 mb-2" />
                      <p className="text-xs font-bold text-zinc-300">
                        {activeFriend.displayName} とのメッセージはまだありません
                      </p>
                      <p className="text-[11px] text-zinc-500 mt-1">
                        「一緒に遊ぼう！」と最初のメッセージを送ってみましょう！
                      </p>
                    </div>
                  ) : (
                    dmMessages.map((msg) => {
                      const isMe = user && msg.senderId === user.uid;
                      return (
                        <div
                          key={msg.id}
                          className={`flex items-start gap-2.5 ${
                            isMe ? 'flex-row-reverse' : 'flex-row'
                          }`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl p-3 text-xs leading-relaxed break-words shadow-md ${
                              isMe
                                ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white'
                                : 'bg-[#12163b] border border-white/10 text-zinc-200'
                            }`}
                          >
                            {/* Stamp message */}
                            {msg.stamp ? (
                              <div className="py-1">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 border border-amber-400/40 rounded-md px-1.5 py-0.5">
                                    スタンプ
                                  </span>
                                  <span className="text-[11px] font-bold text-white">
                                    {msg.stamp.caption}
                                  </span>
                                </div>
                                <div className="p-2 rounded-xl bg-black/30 border border-amber-500/20 inline-block">
                                  <DaizuBearIcon stampId={msg.stamp.stampId} size={64} animated={true} />
                                </div>
                              </div>
                            ) : (
                              <p>{msg.text}</p>
                            )}

                            <span className="block mt-1 text-[9px] text-zinc-300/70 text-right">
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={dmEndRef} />
                </div>

                {/* DM Input Bar */}
                <form
                  onSubmit={handleSendDm}
                  className="p-3 sm:p-4 border-t border-white/[0.08] bg-[#0c102c]/90 flex items-center gap-2"
                >
                  {/* Daizu Stamp Picker Button */}
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playKeyClick();
                      setStampPickerTarget('dm');
                      setShowStampPicker(true);
                    }}
                    title="だいずべあ スタンプ"
                    className="flex items-center justify-center p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:text-amber-200 transition-all cursor-pointer flex-shrink-0"
                  >
                    <Smile className="h-4 w-4" />
                  </button>

                  <input
                    id="dm-chat-input"
                    type="text"
                    value={dmInput}
                    onChange={(e) => setDmInput(e.target.value)}
                    placeholder={`${activeFriend.displayName} にメッセージを送信...`}
                    disabled={isSendingDm}
                    maxLength={1000}
                    className="flex-1 rounded-xl border border-white/10 bg-[#070918] px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:border-cyan-500 focus:outline-none transition-colors"
                  />
                  <button
                    id="send-dm-chat-btn"
                    type="submit"
                    disabled={!dmInput.trim() || isSendingDm}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex-shrink-0"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>送信</span>
                  </button>
                </form>
              </div>
            )}

            {/* TAB 4: Search & Friend Requests */}
            {activeTab === 'search' && (
              <div className="flex-1 flex flex-col h-full overflow-y-auto p-4 sm:p-6 space-y-6">
                {/* Incoming Requests Section (High Priority) */}
                {incomingRequests.length > 0 && (
                  <div className="rounded-2xl border border-amber-500/40 bg-amber-950/20 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
                      <h4 className="text-xs font-bold text-amber-300">
                        届いているフレンド申請 ({incomingRequests.length}件)
                      </h4>
                    </div>

                    <div className="space-y-2">
                      {incomingRequests.map((req) => (
                        <div
                          key={req.id}
                          className="flex items-center justify-between rounded-xl bg-[#0e1233] border border-amber-500/30 p-3"
                        >
                          <div className="flex items-center gap-2.5">
                            {req.fromPhotoURL ? (
                              <img
                                src={req.fromPhotoURL}
                                alt={req.fromName}
                                className="h-8 w-8 rounded-full object-cover border border-amber-400"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-xs font-bold text-black">
                                {req.fromName[0] || 'U'}
                              </div>
                            )}
                            <div>
                              <div className="text-xs font-bold text-white">{req.fromName}</div>
                              <div className="text-[10px] text-zinc-400">あなたにフレンド申請を送りました</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleAcceptRequest(req)}
                              className="flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white shadow transition-colors cursor-pointer"
                            >
                              <Check className="h-3 w-3" />
                              <span>承認</span>
                            </button>
                            <button
                              onClick={() => handleRejectRequest(req.id)}
                              className="flex items-center gap-1 rounded-lg bg-white/[0.08] hover:bg-red-950 hover:text-red-300 px-2.5 py-1.5 text-xs text-zinc-400 transition-colors cursor-pointer"
                            >
                              <X className="h-3 w-3" />
                              <span>拒否</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Player Search Bar */}
                <div className="rounded-2xl border border-white/[0.08] bg-[#0c102a]/80 p-4">
                  <h3 className="text-xs font-bold text-white mb-1 flex items-center gap-2">
                    <Search className="h-4 w-4 text-cyan-400" />
                    <span>プレイヤーを検索</span>
                  </h3>
                  <p className="text-[11px] text-zinc-400 mb-3">
                    ユーザーネームまたはゲーマータグを入力してフレンドを検索できます
                  </p>

                  <form onSubmit={handleSearch} className="flex gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="例: Player-1234, S-Player..."
                      className="flex-1 rounded-xl border border-white/10 bg-[#070918] px-3.5 py-2 text-xs text-white placeholder:text-zinc-500 focus:border-cyan-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={isSearching || !searchQuery.trim()}
                      className="flex items-center gap-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-xs font-bold text-white shadow-md disabled:opacity-50 cursor-pointer"
                    >
                      <Search className="h-3.5 w-3.5" />
                      <span>検索</span>
                    </button>
                  </form>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <div className="text-[11px] font-bold text-cyan-400">検索結果:</div>
                      {searchResults.map((usr) => {
                        const isAlreadyFriend = friends.some((f) => f.friendUid === usr.uid);
                        const isRequested = sentRequestMap[usr.uid];

                        return (
                          <div
                            key={usr.uid}
                            className="flex items-center justify-between rounded-xl bg-[#0e1233] border border-white/[0.08] p-3"
                          >
                            <div className="flex items-center gap-2.5">
                              {usr.photoURL ? (
                                <img
                                  src={usr.photoURL}
                                  alt={usr.displayName || ''}
                                  className="h-8 w-8 rounded-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 text-xs font-bold text-white">
                                  {usr.displayName?.[0] || 'U'}
                                </div>
                              )}
                              <div>
                                <div className="text-xs font-bold text-white">{usr.displayName}</div>
                                <div className="text-[10px] text-zinc-400 font-mono">@{usr.gamerTag}</div>
                              </div>
                            </div>

                            {isAlreadyFriend ? (
                              <span className="text-[11px] font-bold text-emerald-400">フレンド済</span>
                            ) : isRequested ? (
                              <span className="text-[11px] font-bold text-zinc-400">申請中...</span>
                            ) : (
                              <button
                                onClick={() =>
                                  handleSendRequest({
                                    uid: usr.uid,
                                    displayName: usr.displayName || 'プレイヤー',
                                  })
                                }
                                className="flex items-center gap-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 px-3 py-1.5 text-xs font-bold text-white shadow cursor-pointer"
                              >
                                <UserPlus className="h-3 w-3" />
                                <span>申請を送る</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Sent Requests Section */}
                {outgoingRequests.length > 0 && (
                  <div className="rounded-2xl border border-white/[0.08] bg-[#0c102a]/60 p-4">
                    <h4 className="text-xs font-bold text-zinc-300 mb-2">送信済みの保留中リクエスト ({outgoingRequests.length}件)</h4>
                    <div className="space-y-2">
                      {outgoingRequests.map((req) => (
                        <div
                          key={req.id}
                          className="flex items-center justify-between rounded-xl bg-[#0e1233] border border-white/[0.06] p-2.5 text-xs"
                        >
                          <span className="text-zinc-200 truncate">{req.toName || '申請相手'}</span>
                          <span className="text-[10px] text-zinc-500">承認待ち</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Daizu Stamp Picker Modal */}
      <ErrorBoundary>
        <DaizuStampPickerModal
          isOpen={showStampPicker}
          onClose={() => setShowStampPicker(false)}
          category={selectedStampCategory}
          onSelectCategory={setSelectedStampCategory}
          onSelectStamp={(stamp) => handleSendStamp(stamp, stampPickerTarget)}
          targetName={
            stampPickerTarget === 'lobby'
              ? '全体ロビー'
              : stampPickerTarget === 'group'
              ? activeGroup?.name
                ? `グループ「${activeGroup.name}」`
                : 'グループ'
              : activeFriend?.displayName || 'フレンド'
          }
        />
      </ErrorBoundary>

      {/* Create Group Modal */}
      <ErrorBoundary>
        <CreateGroupModal
          isOpen={showCreateGroupModal}
          onClose={() => setShowCreateGroupModal(false)}
          onCreateGroup={handleCreateGroup}
          friends={friends}
          availableFriends={friends}
          isCreating={isCreatingGroup}
        />
      </ErrorBoundary>

      {/* Group Members Modal */}
      {activeGroup && (
        <ErrorBoundary>
          <GroupMembersModal
            isOpen={showGroupMembersModal}
            onClose={() => setShowGroupMembersModal(false)}
            group={activeGroup}
            currentUserUid={user?.uid || ''}
            currentUserId={user?.uid || ''}
            friends={friends}
            availableFriends={friends}
            onAddMembers={async (groupId, friendsToAdd) => {
              await handleAddGroupMembers(groupId, friendsToAdd);
            }}
            onLeaveGroup={async (groupId) => {
              await handleLeaveGroup(groupId);
            }}
          />
        </ErrorBoundary>
      )}
    </div>
  );
};
