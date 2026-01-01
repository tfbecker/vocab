"use client";

import { useEffect, useState, useCallback } from "react";

interface Card {
  id: string;
  deck: string;
  front: string;
  back: string;
  notes: string | null;
  due: string;
  reps: number;
  created_at: string;
}

interface Comment {
  id: number;
  card_id: string;
  content: string;
  status: "open" | "completed";
  created_at: string;
}

interface CardVersion {
  id: number;
  version_number: number;
  front: string;
  back: string;
  notes: string | null;
  change_type: string;
  change_reason: string | null;
  triggered_by_comment_id: number | null;
  comment_content?: string;
  created_at: string;
}

interface Deck {
  slug: string;
  name: string;
}

interface CardListResponse {
  cards: Card[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  decks: Deck[];
}

export default function CardsPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedDeck, setSelectedDeck] = useState<string>("");
  const [sortBy, setSortBy] = useState<"created" | "due" | "front">("created");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Modal state
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [editBack, setEditBack] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [cardComments, setCardComments] = useState<Comment[]>([]);
  const [cardVersions, setCardVersions] = useState<CardVersion[]>([]);
  const [loadingCard, setLoadingCard] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "50");
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      if (search) params.set("search", search);
      if (selectedDeck) params.set("deck", selectedDeck);

      const res = await fetch(`/api/cards?${params}`);
      const data: CardListResponse = await res.json();

      setCards(data.cards || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setDecks(data.decks || []);
    } catch (error) {
      console.error("Failed to fetch cards:", error);
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedDeck, sortBy, sortOrder]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const openEditModal = async (card: Card) => {
    setEditingCard(card);
    setEditBack(card.back);
    setEditNotes(card.notes || "");
    setCardComments([]);
    setCardVersions([]);
    setShowHistory(false);
    setShowDeleteConfirm(false);
    setLoadingCard(true);

    try {
      // Fetch card details with comments
      const res = await fetch(`/api/cards/${card.id}`);
      if (res.ok) {
        const data = await res.json();
        setCardComments(data.comments || []);
      }

      // Fetch version history
      const historyRes = await fetch(`/api/cards/${card.id}/history`);
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setCardVersions(historyData.versions || []);
      }
    } catch (error) {
      console.error("Failed to fetch card details:", error);
    } finally {
      setLoadingCard(false);
    }
  };

  const closeEditModal = () => {
    setEditingCard(null);
    setShowDeleteConfirm(false);
    setShowHistory(false);
  };

  const handleSave = async () => {
    if (!editingCard) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/cards/${editingCard.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          back: editBack,
          notes: editNotes || null
        })
      });

      if (res.ok) {
        // Refresh the list
        await fetchCards();
        closeEditModal();
      }
    } catch (error) {
      console.error("Failed to save card:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingCard) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/cards/${editingCard.id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        await fetchCards();
        closeEditModal();
      }
    } catch (error) {
      console.error("Failed to delete card:", error);
    } finally {
      setDeleting(false);
    }
  };

  const handleMarkCommentResolved = async (commentId: number) => {
    try {
      const res = await fetch("/api/comments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: commentId,
          status: "completed"
        })
      });

      if (res.ok) {
        setCardComments(prev =>
          prev.map(c => c.id === commentId ? { ...c, status: "completed" as const } : c)
        );
      }
    } catch (error) {
      console.error("Failed to mark comment resolved:", error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" });
  };

  const formatRelativeTime = (dateStr: string) => {
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
    return formatDate(dateStr);
  };

  const isDue = (dueStr: string) => new Date(dueStr) <= new Date();
  const openComments = cardComments.filter(c => c.status === "open");
  const completedComments = cardComments.filter(c => c.status === "completed");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">All Cards</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search cards..."
          className="flex-1 min-w-[200px] px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <select
          value={selectedDeck}
          onChange={(e) => { setSelectedDeck(e.target.value); setPage(1); }}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="">All Decks</option>
          {decks.map(deck => (
            <option key={deck.slug} value={deck.slug}>{deck.name}</option>
          ))}
        </select>
        <select
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [by, order] = e.target.value.split("-") as ["created" | "due" | "front", "asc" | "desc"];
            setSortBy(by);
            setSortOrder(order);
            setPage(1);
          }}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="created-desc">Newest first</option>
          <option value="created-asc">Oldest first</option>
          <option value="due-asc">Due soonest</option>
          <option value="due-desc">Due latest</option>
          <option value="front-asc">A-Z</option>
          <option value="front-desc">Z-A</option>
        </select>
      </div>

      {/* Results count */}
      <div className="text-sm text-slate-400">
        {loading ? "Loading..." : `${total} cards`}
        {search && ` matching "${search}"`}
        {selectedDeck && ` in ${decks.find(d => d.slug === selectedDeck)?.name || selectedDeck}`}
      </div>

      {/* Card list */}
      <div className="space-y-2">
        {cards.map(card => (
          <div
            key={card.id}
            className="bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-white truncate">{card.front}</div>
                <div className="text-sm text-slate-400 truncate">{card.back}</div>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                  <span className="bg-slate-700 px-2 py-0.5 rounded">{card.deck}</span>
                  <span className={isDue(card.due) ? "text-orange-400" : ""}>
                    Due: {formatDate(card.due)}
                  </span>
                  <span>{card.reps} reviews</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(card)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  title="Edit"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}

        {!loading && cards.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            No cards found
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          <span className="text-slate-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {editingCard && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h2 className="text-lg font-semibold">Edit Card</h2>
              <button
                onClick={closeEditModal}
                className="p-1 text-slate-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Front (read-only) */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">Front</label>
                <div className="px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white">
                  {editingCard.front}
                </div>
              </div>

              {/* Back */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">Back</label>
                <textarea
                  value={editBack}
                  onChange={(e) => setEditBack(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white resize-none focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">Notes</label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="e.g., verb, noun, etc."
                />
              </div>

              {/* Deck info */}
              <div className="text-sm text-slate-500">
                Deck: <span className="text-slate-300">{editingCard.deck}</span>
              </div>

              {/* Comments section */}
              {!loadingCard && (
                <div className="border-t border-slate-700 pt-4">
                  <h3 className="text-sm font-medium text-slate-300 mb-3">
                    Comments {openComments.length > 0 && (
                      <span className="ml-2 bg-amber-600 text-white px-2 py-0.5 rounded-full text-xs">
                        {openComments.length} open
                      </span>
                    )}
                  </h3>

                  {cardComments.length === 0 ? (
                    <div className="text-sm text-slate-500">No comments</div>
                  ) : (
                    <div className="space-y-2">
                      {/* Open comments */}
                      {openComments.map(comment => (
                        <div key={comment.id} className="bg-slate-700/50 rounded-lg p-3">
                          <p className="text-sm text-slate-200">{comment.content}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-slate-500">{formatRelativeTime(comment.created_at)}</span>
                            <button
                              onClick={() => handleMarkCommentResolved(comment.id)}
                              className="text-xs text-green-400 hover:text-green-300"
                            >
                              Mark resolved
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Completed comments (collapsed) */}
                      {completedComments.length > 0 && (
                        <details className="text-sm">
                          <summary className="text-slate-500 cursor-pointer hover:text-slate-400">
                            {completedComments.length} completed
                          </summary>
                          <div className="space-y-2 mt-2">
                            {completedComments.map(comment => (
                              <div key={comment.id} className="bg-slate-700/30 rounded-lg p-3 opacity-60">
                                <p className="text-sm text-slate-400 line-through">{comment.content}</p>
                                <span className="text-xs text-slate-500">{formatRelativeTime(comment.created_at)}</span>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Version History section */}
              <div className="border-t border-slate-700 pt-4">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200"
                >
                  <svg className={`w-4 h-4 transition-transform ${showHistory ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Version History ({cardVersions.length})
                </button>

                {showHistory && cardVersions.length > 0 && (
                  <div className="mt-3 space-y-3 pl-4 border-l-2 border-slate-700">
                    {cardVersions.map((version, idx) => (
                      <div key={version.id} className="relative">
                        <div className="absolute -left-[1.35rem] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-600" />
                        <div className="bg-slate-700/30 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium text-slate-300">
                              v{version.version_number}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              version.change_type === "initial" ? "bg-green-900 text-green-300" :
                              version.change_type === "claude_edit" ? "bg-purple-900 text-purple-300" :
                              "bg-blue-900 text-blue-300"
                            }`}>
                              {version.change_type.replace("_", " ")}
                            </span>
                            <span className="text-xs text-slate-500">{formatRelativeTime(version.created_at)}</span>
                          </div>

                          {version.comment_content && (
                            <div className="text-xs text-amber-400 mb-2 flex items-start gap-1">
                              <span>Resolving:</span>
                              <span className="text-amber-300/80">&quot;{version.comment_content}&quot;</span>
                            </div>
                          )}

                          <div className="text-sm">
                            <div className="text-slate-400">
                              <span className="text-slate-500">Front:</span> {version.front}
                            </div>
                            <div className="text-slate-300 mt-1">
                              <span className="text-slate-500">Back:</span> {version.back}
                            </div>
                            {version.notes && (
                              <div className="text-slate-400 mt-1 italic">
                                <span className="text-slate-500 not-italic">Notes:</span> {version.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {showHistory && cardVersions.length === 0 && (
                  <div className="mt-3 text-sm text-slate-500 pl-4">
                    No version history yet
                  </div>
                )}
              </div>

              {/* Delete section */}
              <div className="border-t border-slate-700 pt-4">
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-sm text-red-400 hover:text-red-300"
                  >
                    Delete this card...
                  </button>
                ) : (
                  <div className="bg-red-900/30 border border-red-800 rounded-lg p-4">
                    <p className="text-sm text-red-200 mb-3">
                      Are you sure? This will permanently delete this card and all its reviews.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-3 py-1 text-sm text-slate-300 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="px-3 py-1 text-sm bg-red-600 hover:bg-red-500 text-white rounded disabled:opacity-50"
                      >
                        {deleting ? "Deleting..." : "Delete Forever"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-4 border-t border-slate-700">
              <button
                onClick={closeEditModal}
                className="px-4 py-2 text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
