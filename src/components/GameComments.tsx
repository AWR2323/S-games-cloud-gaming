import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Trash2,
  User as UserIcon,
  Sparkles,
  LogIn,
  AlertCircle,
  Clock,
  Check,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  increment,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { GameComment } from '../types';

interface GameCommentsProps {
  gameId: string;
  gameTitle: string;
  gameCreatorUid?: string;
  isSavedInFirestore: boolean;
  user: User | null;
  onOpenAuth: () => void;
  onSaveToFirestoreRequest?: () => void;
}

const QUICK_COMMENTS = [
  '難しくて面白い！ 🔥',
  'クリアできた！ 🎉',
  '神ゲー！ ✨',
  'パルクール最高 🚀',
  '操作しやすい！ 🎮',
  '激ムズだけど楽しい 😂',
];

export const GameComments: React.FC<GameCommentsProps> = ({
  gameId,
  gameTitle,
  gameCreatorUid,
  isSavedInFirestore,
  user,
  onOpenAuth,
  onSaveToFirestoreRequest,
}) => {
  const [comments, setComments] = useState<GameComment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>('');
  const [guestName, setGuestName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [postSuccess, setPostSuccess] = useState<boolean>(false);

  // Real-time comments listener for the current game
  useEffect(() => {
    if (!isSavedInFirestore || !gameId || gameId === 'starter-3d-roblox-obby' || gameId.startsWith('ai-')) {
      setComments([]);
      return;
    }

    setLoading(true);
    const commentsRef = collection(db, 'games', gameId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'desc'), limit(50));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: GameComment[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        setComments(list);
        setLoading(false);
      },
      (err) => {
        console.warn('Comments listener error:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [gameId, isSavedInFirestore]);

  // Submit comment
  const handleSubmitComment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    if (!isSavedInFirestore) {
      setErrorMsg('コメントを投稿するには、まずゲームをFirebaseに保存してください。');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const authorName = user
        ? user.displayName || 'S games プレイヤー'
        : guestName.trim() || 'ゲストプレイヤー';

      const commentData = {
        gameId,
        userId: user ? user.uid : 'guest',
        userName: authorName,
        userPhoto: user?.photoURL || '',
        text: inputText.trim(),
        createdAt: new Date().toISOString(),
      };

      // Add to subcollection
      await addDoc(collection(db, 'games', gameId, 'comments'), commentData);

      // Increment comments count on game document
      try {
        const gameRef = doc(db, 'games', gameId);
        await updateDoc(gameRef, { commentsCount: increment(1) });
      } catch (e) {
        // non-fatal
      }

      setInputText('');
      setPostSuccess(true);
      setTimeout(() => setPostSuccess(false), 2000);
    } catch (err: any) {
      console.error('Error posting comment:', err);
      setErrorMsg('コメントの投稿に失敗しました: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete comment (author or game creator)
  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('このコメントを削除しますか？')) return;
    try {
      await deleteDoc(doc(db, 'games', gameId, 'comments', commentId));
      try {
        const gameRef = doc(db, 'games', gameId);
        await updateDoc(gameRef, { commentsCount: increment(-1) });
      } catch (e) {}
    } catch (err: any) {
      console.error('Error deleting comment:', err);
    }
  };

  // Time format helper
  const formatTimeAgo = (isoDate: string) => {
    try {
      const diffMs = Date.now() - new Date(isoDate).getTime();
      const mins = Math.floor(diffMs / 60000);
      if (mins < 1) return 'たった今';
      if (mins < 60) return `${mins}分前`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}時間前`;
      const days = Math.floor(hours / 24);
      if (days < 7) return `${days}日前`;
      return new Date(isoDate).toLocaleDateString('ja-JP');
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-800/90 bg-zinc-900/60 p-5 space-y-5 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600/20 text-violet-400">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>ゲームの感想・コメント</span>
              {isSavedInFirestore && (
                <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[11px] font-semibold text-violet-300">
                  {comments.length} 件
                </span>
              )}
            </h3>
            <p className="text-xs text-zinc-400">
              「{gameTitle}」についての感想や攻略のコツをシェアしよう！
            </p>
          </div>
        </div>

        {!user && (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 rounded-xl border border-violet-500/30 bg-violet-950/40 px-3 py-1.5 text-xs font-semibold text-violet-300 hover:bg-violet-900/50 hover:text-white transition-colors cursor-pointer"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>ログインして投稿</span>
          </button>
        )}
      </div>

      {/* When game is not yet saved to Firestore */}
      {!isSavedInFirestore ? (
        <div className="rounded-xl border border-dashed border-violet-500/30 bg-violet-950/20 p-5 text-center space-y-3">
          <Sparkles className="h-7 w-7 text-violet-400 mx-auto" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white">
              このゲームをFirebaseに保存するとコメント機能が解放されます
            </h4>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              上部の「Firebase に保存」ボタンを押すことで、他のプレイヤーも遊べるようになり、感想や応援コメントをもらえるようになります。
            </p>
          </div>
          {onSaveToFirestoreRequest && (
            <button
              onClick={onSaveToFirestoreRequest}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-violet-600/30 hover:brightness-110 transition-all cursor-pointer"
            >
              <span>今すぐFirebaseに保存する</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Quick Reaction Chips */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1">
              <span>ワンタップで感想を送信:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK_COMMENTS.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setInputText((prev) => (prev ? `${prev} ${chip}` : chip))}
                  className="rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-xs text-zinc-300 hover:border-violet-500/50 hover:text-violet-300 hover:bg-zinc-900 transition-all cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Comment Input Form */}
          <form onSubmit={handleSubmitComment} className="space-y-3">
            {!user && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-zinc-400 whitespace-nowrap">投稿者名:</label>
                <input
                  type="text"
                  placeholder="ニックネーム（省略時はゲスト）"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  maxLength={20}
                  className="w-48 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
                />
              </div>
            )}

            <div className="relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="このゲームを遊んだ感想、スコア、面白かったポイントなどを書いてみよう..."
                rows={2}
                maxLength={500}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-200 placeholder-zinc-500 focus:border-violet-500 focus:outline-none resize-none"
              />
              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                <span className="text-[10px] text-zinc-500">{inputText.length} / 500</span>
                <button
                  type="submit"
                  disabled={!inputText.trim() || isSubmitting}
                  className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-violet-600/30 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>送信中...</span>
                  ) : postSuccess ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-300" />
                      <span>投稿完了!</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>送信</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-950/30 border border-rose-900/50 rounded-lg p-2.5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </form>

          {/* Comments List */}
          <div className="space-y-3 pt-2">
            {loading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-16 rounded-xl bg-zinc-950/60 animate-pulse border border-zinc-800/80" />
                ))}
              </div>
            ) : comments.length > 0 ? (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {comments.map((c) => {
                  const isAuthor = c.userId && c.userId === gameCreatorUid;
                  const canDelete = user && (user.uid === c.userId || user.uid === gameCreatorUid);

                  return (
                    <div
                      key={c.id}
                      className="group flex items-start justify-between gap-3 rounded-xl border border-zinc-800/80 bg-zinc-950/70 p-3 hover:border-zinc-700 transition-colors"
                    >
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        {c.userPhoto ? (
                          <img
                            src={c.userPhoto}
                            alt={c.userName}
                            className="h-8 w-8 rounded-full object-cover border border-zinc-700 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 text-white font-bold text-xs shrink-0">
                            {c.userName ? c.userName.slice(0, 1) : 'U'}
                          </div>
                        )}

                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-zinc-200 truncate">
                              {c.userName}
                            </span>
                            {isAuthor && (
                              <span className="rounded bg-violet-500/20 px-1.5 py-0.2 text-[10px] font-semibold text-violet-300">
                                作者
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-[10px] text-zinc-500">
                              <Clock className="h-3 w-3" />
                              {formatTimeAgo(c.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-300 whitespace-pre-wrap break-words leading-relaxed">
                            {c.text}
                          </p>
                        </div>
                      </div>

                      {canDelete && (
                        <button
                          onClick={() => handleDeleteComment(c.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 transition-all cursor-pointer"
                          title="コメントを削除"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-zinc-800 p-6 text-center text-zinc-500 space-y-1.5">
                <MessageSquare className="h-6 w-6 mx-auto opacity-40 text-violet-400" />
                <p className="text-xs">まだコメントがありません。</p>
                <p className="text-[11px] text-zinc-400">
                  上のフォームから最初の感想や攻略メッセージを投稿してみましょう！
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
