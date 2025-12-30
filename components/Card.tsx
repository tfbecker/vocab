"use client";

import { useState, useRef, useEffect } from "react";

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

export default function Card({ id, front, back, notes, isFlipped, onFlip, onAddComment }: CardProps) {
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea when comment input is shown
  useEffect(() => {
    if (showCommentInput && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [showCommentInput]);

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
        setCommentText("");
        setShowCommentInput(false);
        onAddComment?.(commentText.trim());
      }
    } catch (error) {
      console.error("Failed to add comment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const frontFontSize = getDynamicFontSize(front, 30);
  const backFontSize = getDynamicFontSize(back, 30);
  const notesFontSize = notes ? getDynamicFontSize(notes, 14) : "14px";

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

            {/* Comment button */}
            {id && (
              <div className="comment-area mt-6 w-full">
                {!showCommentInput ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCommentInput(true);
                    }}
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    + Add feedback
                  </button>
                ) : (
                  <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                    <textarea
                      ref={textareaRef}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="What would you like to improve about this card?"
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-sky-500"
                      rows={3}
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
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
