"use client";

import { useState, useEffect, useCallback } from "react";

/* ─── Types ─── */
interface Channel {
  id: string;
  channel_type: string;
  account_name: string | null;
  status: string;
  auth_data: Record<string, string> | null;
  created_at: string;
}

/* ─── Channel config ─── */
const CHANNEL_TYPES = [
  { value: "discord", label: "Discord", icon: "⬡", color: "#5865F2" },
  { value: "reddit", label: "Reddit", icon: "🔴", color: "#FF4500" },
  { value: "twitter", label: "Twitter / X", icon: "𝕏", color: "#1DA1F2" },
  { value: "linkedin", label: "LinkedIn", icon: "in", color: "#0A66C2" },
  { value: "facebook", label: "Facebook", icon: "f", color: "#1877F2" },
] as const;

function getChannelConfig(type: string) {
  return CHANNEL_TYPES.find((c) => c.value === type);
}

/* ═══════ MAIN PAGE ═══════ */
export default function ChannelsPage() {
  /* ─── Data state ─── */
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  /* ─── Modal state ─── */
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<string>("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [accountName, setAccountName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  /* ─── Delete state ─── */
  const [deletingId, setDeletingId] = useState<string | null>(null);

  /* ─── Toast state ─── */
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  /* ─── Fetch channels ─── */
  const fetchChannels = useCallback(() => {
    fetch("/api/channels")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setChannels(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  /* ─── Toast helper ─── */
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  /* ─── Reset modal ─── */
  const resetModal = () => {
    setShowModal(false);
    setModalType("");
    setWebhookUrl("");
    setAccountName("");
    setSubmitting(false);
    setModalError(null);
  };

  /* ─── Submit new channel ─── */
  const handleSubmit = async () => {
    if (!modalType) return;
    setSubmitting(true);
    setModalError(null);

    // Build auth_data based on channel type
    const authData: Record<string, string> = {};
    if (modalType === "discord") {
      if (!webhookUrl.trim()) {
        setModalError("Webhook URL is required for Discord.");
        setSubmitting(false);
        return;
      }
      authData.webhook_url = webhookUrl.trim();
    }

    try {
      const res = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel_type: modalType,
          account_name: accountName.trim() || null,
          auth_data: authData,
          status: "active",
        }),
      });

      const data = await res.json();
      if (data.error) {
        setModalError(data.error);
      } else {
        showToast(`${getChannelConfig(modalType)?.label ?? modalType} channel connected successfully!`);
        resetModal();
        fetchChannels();
      }
    } catch {
      setModalError("Failed to connect channel. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── Delete channel ─── */
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/channels?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) {
        showToast(data.error, "error");
      } else {
        showToast("Channel removed.");
        setChannels((prev) => prev.filter((c) => c.id !== id));
      }
    } catch {
      showToast("Failed to remove channel.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  /* ─── Selected channel config for modal ─── */
  const selectedConfig = getChannelConfig(modalType);

  /* ─── Loading ─── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="text-[var(--text-muted)] font-[var(--font-body)]">Loading channels...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] font-[var(--font-body)]">
      {/* ─── NAV HEADER ─── */}
      <nav className="sticky top-0 z-50 h-16 flex items-center justify-between px-6 md:px-10 bg-[var(--bg)]/80 backdrop-blur-xl border-b border-[var(--border)]">
        <a href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--coral)] to-[var(--cyan)] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2L4 10h5v8h6v-8h5L12 2z" /></svg>
          </div>
          <span className="font-[family-name:var(--font-d)] font-bold text-lg tracking-tight">Blastoff</span>
        </a>
        <div className="flex items-center gap-4">
          <a href="/dashboard/campaigns" className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">Campaigns</a>
          <a href="/dashboard/channels" className="text-sm text-[var(--cyan)] font-semibold">Channels</a>
          <a href="/dashboard/products/new" className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">Add Product</a>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* ─── PAGE HEADER ─── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-[family-name:var(--font-d)] font-bold text-2xl md:text-3xl">Channels</h1>
            <p className="text-[var(--text-muted)] text-sm mt-1">Manage your connected distribution channels.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 rounded-xl bg-[var(--cyan)] text-[var(--bg)] text-sm font-semibold hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all active:scale-[0.98] cursor-pointer flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Connect Channel
          </button>
        </div>

        {/* ─── CHANNEL LIST ─── */}
        {channels.length === 0 ? (
          <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="1.5">
                <path d="M4 4h16v16H4z" /><path d="M4 12h16M12 4v16" opacity="0.4" />
              </svg>
            </div>
            <p className="text-[var(--text-muted)] text-sm mb-1">No channels connected</p>
            <p className="text-[var(--text-dim)] text-xs mb-4">Connect your first channel to start distributing content.</p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--cyan-dim)] border border-[var(--cyan)]/30 text-[var(--cyan)] text-sm font-semibold hover:bg-[var(--cyan-mid)] transition-all cursor-pointer"
            >
              Connect a Channel
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {channels.map((ch) => {
              const config = getChannelConfig(ch.channel_type);
              const color = config?.color ?? "var(--cyan)";
              const icon = config?.icon ?? "#";
              const label = config?.label ?? ch.channel_type;
              const isDeleting = deletingId === ch.id;

              return (
                <div
                  key={ch.id}
                  className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-5 hover:border-[var(--border-light)] transition-all"
                >
                  <div className="flex items-center gap-4">
                    {/* Channel icon */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0"
                      style={{ background: `${color}18`, color }}
                    >
                      {icon}
                    </div>

                    {/* Channel info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5 mb-0.5">
                        <h3 className="font-semibold text-sm">{label}</h3>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[rgba(16,185,129,0.12)] text-[var(--green)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)] pulse-dot" />
                          Connected
                        </span>
                      </div>
                      {ch.account_name && (
                        <p className="text-[var(--text-muted)] text-xs">{ch.account_name}</p>
                      )}
                      <p className="text-[var(--text-dim)] text-xs mt-0.5">
                        Added {new Date(ch.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(ch.id)}
                      disabled={isDeleting}
                      className="shrink-0 w-9 h-9 rounded-lg border border-[var(--border)] flex items-center justify-center text-[var(--text-dim)] hover:text-[var(--coral)] hover:border-[var(--coral)]/30 hover:bg-[var(--coral-dim)] transition-all cursor-pointer disabled:opacity-50"
                      title="Remove channel"
                    >
                      {isDeleting ? (
                        <div className="w-4 h-4 border-2 border-[var(--text-dim)] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══════ CONNECT CHANNEL MODAL ═══════ */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={resetModal} />

          {/* Modal */}
          <div className="relative w-full max-w-md rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)]">
              <h2 className="font-[family-name:var(--font-d)] font-bold text-lg">Connect Channel</h2>
              <button
                onClick={resetModal}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-all cursor-pointer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {modalError && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-[var(--coral-dim)] border border-[var(--coral)]/20 text-[var(--coral)] text-sm">
                  {modalError}
                </div>
              )}

              {/* Channel type selector */}
              <div className="mb-5">
                <label className="block text-xs text-[var(--text-dim)] uppercase tracking-wider mb-2 font-semibold">
                  Channel Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CHANNEL_TYPES.map((ct) => (
                    <button
                      key={ct.value}
                      onClick={() => setModalType(ct.value)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all cursor-pointer text-left ${
                        modalType === ct.value
                          ? "bg-[var(--cyan-dim)] border-[var(--cyan)]/40"
                          : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-light)]"
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                        style={{ background: `${ct.color}20`, color: ct.color }}
                      >
                        {ct.icon}
                      </div>
                      <span className="text-sm font-medium">{ct.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic fields based on channel type */}
              {modalType === "discord" && (
                <div className="mb-5">
                  <label className="block text-xs text-[var(--text-dim)] uppercase tracking-wider mb-2 font-semibold">
                    Webhook URL
                  </label>
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://discord.com/api/webhooks/..."
                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-light)] text-[var(--text)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--cyan)] transition-all text-sm font-[var(--font-mono)]"
                  />
                  <p className="text-[var(--text-dim)] text-xs mt-2">
                    Create a webhook in your Discord server: Server Settings &rarr; Integrations &rarr; Webhooks
                  </p>
                </div>
              )}

              {modalType && modalType !== "discord" && (
                <div className="mb-5 p-6 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-center">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 text-lg font-bold"
                    style={{ background: `${selectedConfig?.color}20`, color: selectedConfig?.color }}
                  >
                    {selectedConfig?.icon}
                  </div>
                  <p className="text-[var(--text-muted)] text-sm font-semibold mb-1">Coming Soon</p>
                  <p className="text-[var(--text-dim)] text-xs">
                    {selectedConfig?.label} integration is coming soon. Join the waitlist to be notified.
                  </p>
                </div>
              )}

              {/* Account name (optional) */}
              {modalType && (
                <div className="mb-6">
                  <label className="block text-xs text-[var(--text-dim)] uppercase tracking-wider mb-2 font-semibold">
                    Account Name <span className="normal-case text-[var(--text-dim)]">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="e.g., My Discord Server"
                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-light)] text-[var(--text)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--cyan)] transition-all text-sm"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={resetModal}
                  className="px-5 py-2.5 rounded-xl border border-[var(--border-light)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--text-muted)] transition-all text-sm cursor-pointer"
                >
                  Cancel
                </button>
                {modalType === "discord" && (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !webhookUrl.trim()}
                    className="px-6 py-2.5 rounded-xl bg-[var(--cyan)] text-[var(--bg)] text-sm font-semibold hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-[var(--bg)] border-t-transparent rounded-full animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                        Connect
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ TOAST ═══════ */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[110]">
          <div
            className={`px-5 py-3 rounded-xl border text-sm font-semibold flex items-center gap-2 shadow-lg ${
              toast.type === "success"
                ? "bg-[var(--bg-card)] border-[var(--green)]/30 text-[var(--green)]"
                : "bg-[var(--bg-card)] border-[var(--coral)]/30 text-[var(--coral)]"
            }`}
          >
            {toast.type === "success" ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" />
              </svg>
            )}
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
