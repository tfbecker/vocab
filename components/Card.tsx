"use client";

import { useState, useRef, useEffect } from "react";

interface Comment {
  id: number;
  card_id: string;
  content: string;
  status: "open" | "completed";
  created_at: string;
}

interface CardProps {
  id?: string;
  front: string;
  back: string;
  notes?: string | null;
  isFlipped: boolean;
  onFlip: () => void;
  onAddComment?: (content: string) => void;
}

// Calculate dynamic font size based on text length
function getDynamicFontSize(text: string, baseSize: number = 30): string {
  const length = text.length;

  if (length <= 20) return `${baseSize}px`;
  if (length <= 50) return `${Math.max(baseSize * 0.8, 20)}px`;
  if (length <= 100) return `${Math.max(baseSize * 0.65, 16)}px`;
  if (length <= 200) return `${Math.max(baseSize * 0.5, 14)}px`;
  return `${Math.max(baseSize * 0.4, 12)}px`;
}

// Format relative time
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function Card({ id, front, back, notes, isFlipped, onFlip, onAddComment }: CardProps) {
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch comments when card is flipped and has an ID
  useEffect(() => {
    if (isFlipped && id) {
      fetchComments();
    }
  }, [isFlipped, id]);

  // Focus textarea when comment input is shown
  useEffect(() => {
    if (showCommentInput && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [showCommentInput]);

  const fetchComments = async () => {
    if (!id) return;
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/comments?cardId=${id}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't flip if clicking on comment area
    if ((e.target as HTMLElement).closest(".comment-area")) {
      return;
    }
    onFlip();
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !id || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId: id,
          content: commentText.trim()
        })
      });

      if (res.ok) {
        const data = await res.json();
        setComments(prev => [data.comment, ...prev]);
        setCommentText("");
        setShowCommentInput(false);
        setShowComments(true);
        onAddComment?.(commentText.trim());
      }
    } catch (error) {
      console.error("Failed to add comment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      const res = await fetch(`/api/comments?id=${commentId}`, {
        method: "DELETE"
      });

      if (res.ok) {
        setComments(prev => prev.filter(c => c.id !== commentId));
      }
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  const frontFontSize = getDynamicFontSize(front, 30);
  const backFontSize = getDynamicFontSize(back, 30);
  const notesFontSize = notes ? getDynamicFontSize(notes, 14) : "14px";
  const openComments = comments.filter(c => c.status === "open");
  const completedComments = comments.filter(c => c.status === "completed");

  return (
    <div
      className="w-full max-w-lg mx-auto cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="w-full min-h-[300px] flex flex-col items-center justify-center p-8 bg-slate-800 rounded-2xl border border-slate-700 shadow-xl">
        {!isFlipped ? (
          <>
            <p
              className="font-medium text-center text-white leading-relaxed"
              style={{ fontSize: frontFontSize }}
            >
              {front}
            </p>
            <p className="mt-6 text-slate-400 text-sm">Click or press Space to reveal</p>
          </>
        ) : (
          <>
            <p className="text-lg text-slate-400 mb-2 text-center">{front}</p>
            <div className="w-16 h-px bg-slate-600 my-4" />
            <p
              className="font-medium text-center text-sky-400 leading-relaxed"
              style={{ fontSize: backFontSize }}
            >
              {back}
            </p>
            {notes && (
              <p
                className="mt-4 text-slate-500 italic text-center leading-relaxed max-w-full overflow-hidden"
                style={{ fontSize: notesFontSize }}
              >
                {notes}
              </p>
            )}

            {/* Comments section */}
            {id && (
              <div className="comment-area mt-6 w-full border-t border-slate-700 pt-4" onClick={(e) => e.stopPropagation()}>
                {/* Header with count */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => setShowComments(!showComments)}
                    className="text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1"
                  >
                    {comments.length > 0 ? (
                      <>
                        <span>{showComments ? "Hide" : "Show"} feedback</span>
                        {openComments.length > 0 && (
                          <span className="bg-amber-600 text-white px-1.5 py-0.5 rounded-full text-[10px]">
                            {openComments.length}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-slate-500">No feedback yet</span>
                    )}
                  </button>
                  <button
                    onClick={() => setShowCommentInput(!showCommentInput)}
                    className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
                  >
                    + Add
                  </button>
                </div>

                {/* Add comment input */}
                {showCommentInput && (
                  <div className="space-y-2 mb-4">
                    <textarea
                      ref={textareaRef}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="What would you like to improve about this card?"
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-sky-500"
                      rows={2}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.metaKey) {
                          handleAddComment();
                        }
                        if (e.key === "Escape") {
                          setShowCommentInput(false);
                          setCommentText("");
                        }
                      }}
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => {
                          setShowCommentInput(false);
                          setCommentText("");
                        }}
                        className="px-3 py-1 text-xs text-slate-400 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddComment}
                        disabled={!commentText.trim() || submitting}
                        className="px-3 py-1 text-xs bg-sky-600 hover:bg-sky-500 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Comments list */}
                {showComments && comments.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {/* Open comments */}
                    {openComments.map((comment) => (
                      <div
                        key={comment.id}
                        className="bg-slate-700/50 rounded-lg px-3 py-2 text-xs group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-slate-300 flex-1">{comment.content}</p>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                            title="Delete comment"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-amber-500 text-[10px]">open</span>
                          <span className="text-slate-500 text-[10px]">{formatRelativeTime(comment.created_at)}</span>
                        </div>
                      </div>
                    ))}

                    {/* Completed comments (collapsed) */}
                    {completedComments.length > 0 && (
                      <details className="text-xs">
                        <summary className="text-slate-500 cursor-pointer hover:text-slate-400">
                          {completedComments.length} completed
                        </summary>
                        <div className="space-y-2 mt-2">
                          {completedComments.map((comment) => (
                            <div
                              key={comment.id}
                              className="bg-slate-700/30 rounded-lg px-3 py-2 opacity-60 group"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-slate-400 flex-1 line-through">{comment.content}</p>
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                                  title="Delete comment"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                              <span className="text-slate-500 text-[10px]">{formatRelativeTime(comment.created_at)}</span>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                )}

                {loadingComments && (
                  <div className="text-xs text-slate-500">Loading...</div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
