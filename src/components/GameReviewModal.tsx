import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  X,
  Star,
  Sparkles,
  Send,
  Trash2,
  Clock,
  ShieldCheck,
  AlertCircle,
  ThumbsUp,
  Award,
} from 'lucide-react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  setDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
  increment,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { GameReview } from '../types';

interface GameReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  gameTitle: string;
  user: User | null;
  onOpenAuth: () => void;
}

export const GameReviewModal: React.FC<GameReviewModalProps> = ({
  isOpen,
  onClose,
  gameId,
  gameTitle,
  user,
  onOpenAuth,
}) => {
  const [reviews, setReviews] = useState<GameReview[]>([]);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState<string>('');
  const [tag, setTag] = useState<string>('神ゲー');
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const TAGS = ['神ゲー 🔥', '低遅延で快適 ⚡', 'グラフィック最高 🌟', '激ムズ難易度 💀', '暇つぶしに最適 ☕', '音楽が良い 🎵'];

  // Subscribe to reviews for this game
  useEffect(() => {
    if (!isOpen || !gameId) return;

    setLoading(true);
    // Sanitize gameId for document IDs / queries
    const sanitizedGameId = gameId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const reviewsRef = collection(db, 'reviews');
    const q = query(reviewsRef, where('gameId', '==', sanitizedGameId), limit(30));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: GameReview[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            gameId: data.gameId,
            gameTitle: data.gameTitle || gameTitle,
            userId: data.userId,
            userName: data.userName || 'S-Gamer',
            userPhoto: data.userPhoto || '',
            rating: data.rating || 5,
            reviewText: data.reviewText || '',
            createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : new Date().toISOString(),
          });
        });
        // Sort descending by date locally
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setReviews(list);
        setLoading(false);
      },
      (err) => {
        console.warn('Reviews listener warning:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isOpen, gameId, gameTitle]);

  if (!isOpen) return null;

  const sanitizedGameId = gameId.replace(/[^a-zA-Z0-9_-]/g, '_');

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }

    if (!reviewText.trim()) {
      setErrorMsg('レビュー本文を入力してください。');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);

      const reviewId = `${sanitizedGameId}_${user.uid}`;
      const fullText = tag ? `【${tag}】 ${reviewText.trim()}` : reviewText.trim();

      await setDoc(
        doc(db, 'reviews', reviewId),
        {
          id: reviewId,
          gameId: sanitizedGameId,
          gameTitle,
          userId: user.uid,
          userName: user.displayName || 'S-Gamer',
          userPhoto: user.photoURL || '',
          rating,
          reviewText: fullText,
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Award XP to user for reviewing a game!
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          xp: increment(100),
        });
      } catch (e) {
        // non-fatal
      }

      setReviewText('');
      setSuccessMsg('レビューを投稿しました！（+100 XP 獲得！）');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error('Error submitting review:', err);
      setErrorMsg(err.message || 'レビューの投稿に失敗しました。');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'reviews', reviewId));
    } catch (err) {
      console.error('Error deleting review:', err);
    }
  };

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : '5.0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-white/[0.12] bg-gradient-to-b from-[#0e1235] via-[#090c25] to-[#060818] p-6 text-zinc-100 shadow-[0_25px_60px_rgba(0,0,0,0.85)] ring-1 ring-white/10 max-h-[90vh] flex flex-col">
        {/* Glow ambient */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-48 w-48 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-xl p-2 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer z-10"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/[0.08] relative z-10">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-violet-600 text-white shadow-lg shadow-amber-500/20">
            <Star className="h-6 w-6 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white truncate max-w-[280px]">
                {gameTitle}
              </h3>
              <span className="flex items-center gap-1 rounded-md bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.5 text-[11px] font-bold text-amber-300 font-mono">
                ★ {averageRating}
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              クラウドコミュニティのレビュー＆星評価 ({reviews.length} 件)
            </p>
          </div>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 relative z-10">
          {/* Post Form */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#12163b]/70 p-4 space-y-3 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                あなたの評価をつける:
              </span>
              {/* Star Selector */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="p-1 text-zinc-600 hover:scale-125 transition-transform cursor-pointer"
                  >
                    <Star
                      className={`h-5 w-5 ${
                        (hoverRating || rating) >= star
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-zinc-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Tag Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {TAGS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTag(t)}
                  className={`rounded-lg px-2 py-0.5 text-[10px] font-bold transition-all cursor-pointer ${
                    tag === t
                      ? 'border border-cyan-400 bg-cyan-950/80 text-cyan-300 shadow-sm'
                      : 'border border-white/[0.06] bg-[#070918] text-zinc-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-2">
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder={
                  user
                    ? 'プレイした感想や攻略のコツ、遅延の感覚などを書いてみよう...'
                    : 'ログインしてレビューを投稿（+100 XP ボーナス）'
                }
                rows={2}
                maxLength={400}
                className="w-full rounded-xl border border-white/[0.08] bg-[#070918] p-3 text-xs text-white placeholder-zinc-500 focus:border-cyan-400 focus:outline-none resize-none"
              />

              {errorMsg && (
                <div className="text-[11px] text-rose-400 bg-rose-950/40 p-2 rounded-lg border border-rose-500/30">
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="text-[11px] text-emerald-300 bg-emerald-950/40 p-2 rounded-lg border border-emerald-500/30">
                  {successMsg}
                </div>
              )}

              <div className="flex justify-between items-center pt-1">
                <span className="text-[10px] text-zinc-400 font-mono">
                  {reviewText.length}/400 文字
                </span>

                {user ? (
                  <button
                    type="submit"
                    disabled={submitting || !reviewText.trim()}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-violet-600/30 hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{submitting ? '投稿中...' : 'レビューを投稿'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onOpenAuth}
                    className="flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-1.5 text-xs font-bold text-white transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>ログインして投稿</span>
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Existing Community Reviews List */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-zinc-300">みんなのレビュー</h4>

            {loading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-16 rounded-2xl bg-[#090d29] animate-pulse border border-white/[0.06]" />
                ))}
              </div>
            ) : reviews.length > 0 ? (
              <div className="space-y-2">
                {reviews.map((r) => {
                  const isMyReview = user && user.uid === r.userId;
                  return (
                    <div
                      key={r.id}
                      className="rounded-2xl border border-white/[0.06] bg-[#090d28]/70 p-3.5 space-y-1.5 hover:border-white/[0.12] transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {r.userPhoto ? (
                            <img
                              src={r.userPhoto}
                              alt={r.userName}
                              className="h-6 w-6 rounded-full object-cover border border-cyan-500/40"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-violet-600 flex items-center justify-center text-[10px] font-bold text-white">
                              {r.userName[0] || 'U'}
                            </div>
                          )}
                          <span className="text-xs font-bold text-white truncate max-w-[140px]">
                            {r.userName}
                          </span>
                          {/* Star display */}
                          <div className="flex items-center text-amber-400">
                            {Array.from({ length: r.rating }).map((_, idx) => (
                              <Star key={idx} className="h-3 w-3 fill-current" />
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-zinc-400">
                            {new Date(r.createdAt).toLocaleDateString('ja-JP')}
                          </span>
                          {isMyReview && (
                            <button
                              onClick={() => handleDeleteReview(r.id)}
                              className="text-zinc-500 hover:text-rose-400 p-1 cursor-pointer"
                              title="自分のレビューを削除"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                        {r.reviewText}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/[0.08] p-6 text-center text-zinc-500 text-xs">
                まだレビューがありません。最初のレビューを投稿してみましょう！
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
