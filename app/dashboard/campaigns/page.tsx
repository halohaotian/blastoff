"use client";

import { useState, useEffect, useCallback } from "react";

/* ─── Types ─── */
interface Product {
  id: string;
  name: string;
  tagline: string | null;
  description: string;
  website_url: string | null;
  pricing_model: string | null;
  categories: string[] | null;
  tags: string[] | null;
}

interface Channel {
  id: string;
  channel_type: string;
  account_name: string | null;
  auth_data: Record<string, string> | null;
  status: string;
}

interface Campaign {
  id: string;
  product_id: string;
  status: string;
  created_at: string;
  scheduled_at: string | null;
  products: { name: string; tagline: string | null; website_url: string | null } | null;
  publish_tasks: { id: string; channel_account_id: string; status: string; scheduled_at: string | null }[];
}

type WizardStep = "product" | "channels" | "generate" | "review";

/* ─── Channel icon helper ─── */
function channelIcon(type: string) {
  const icons: Record<string, string> = {
    discord: "⬡",
    reddit: "🔴",
    twitter: "𝕏",
    linkedin: "in",
    facebook: "f",
    producthunt: "🅿️",
    hackernews: "▲",
  };
  return icons[type] ?? "#";
}

function channelColor(type: string) {
  const colors: Record<string, string> = {
    discord: "#5865F2",
    reddit: "#FF4500",
    twitter: "#1DA1F2",
    linkedin: "#0A66C2",
    facebook: "#1877F2",
    producthunt: "#DA552F",
    hackernews: "#FF6600",
  };
  return colors[type] ?? "var(--cyan)";
}

/* ─── Status badge ─── */
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; text: string; label: string }> = {
    draft: { bg: "rgba(107,127,160,0.15)", text: "var(--text-muted)", label: "Draft" },
    generating: { bg: "rgba(139,92,246,0.15)", text: "var(--purple)", label: "Generating" },
    ready: { bg: "rgba(0,229,255,0.10)", text: "var(--cyan)", label: "Ready" },
    scheduled: { bg: "rgba(245,158,11,0.15)", text: "#F59E0B", label: "Scheduled" },
    launched: { bg: "rgba(16,185,129,0.15)", text: "var(--green)", label: "Launched" },
    failed: { bg: "rgba(255,92,58,0.15)", text: "var(--coral)", label: "Failed" },
    published: { bg: "rgba(16,185,129,0.15)", text: "var(--green)", label: "Published" },
  };
  const s = styles[status] ?? styles.draft;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: s.bg, color: s.text }}
    >
      {status === "generating" && (
        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: s.text }} />
      )}
      {s.label}
    </span>
  );
}

/* ═══════ MAIN PAGE ═══════ */
export default function CampaignsPage() {
  /* ─── Data state ─── */
  const [products, setProducts] = useState<Product[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  /* ─── Wizard state ─── */
  const [step, setStep] = useState<WizardStep>("product");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>([]);
  const [generatedContent, setGeneratedContent] = useState<Record<string, string>>({});
  const [editedContent, setEditedContent] = useState<Record<string, string>>({});
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  /* ─── UI state ─── */
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState(false);

  /* ─── Fetch data ─── */
  const fetchProducts = useCallback(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setProducts(d); })
      .catch(() => {});
  }, []);

  const fetchChannels = useCallback(() => {
    fetch("/api/channels")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setChannels(d); })
      .catch(() => {});
  }, []);

  const fetchCampaigns = useCallback(() => {
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setCampaigns(d); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    Promise.all([fetchProducts(), fetchChannels(), fetchCampaigns()]).finally(() => setLoading(false));
  }, [fetchProducts, fetchChannels, fetchCampaigns]);

  /* ─── Selected channels (full objects) ─── */
  const selectedChannels = channels.filter((c) => selectedChannelIds.includes(c.id));

  /* ─── Wizard: generate AI content ─── */
  const handleGenerate = async () => {
    if (!selectedProduct || selectedChannels.length === 0) return;
    setGenerating(true);
    setError(null);
    setStep("generate");

    try {
      const channelTypes = selectedChannels.map((c) => c.channel_type);
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: selectedProduct,
          channels: channelTypes,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setStep("channels");
      } else {
        setGeneratedContent(data);
        setEditedContent(data);
        setStep("review");
      }
    } catch {
      setError("Failed to generate content. Please try again.");
      setStep("channels");
    } finally {
      setGenerating(false);
    }
  };

  /* ─── Launch Now ─── */
  const handleLaunch = async () => {
    if (!selectedProduct || selectedChannels.length === 0) return;
    setLaunching(true);
    setError(null);

    try {
      // 1. Create campaign
      const campaignRes = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: selectedProduct.id,
          status: "launched",
        }),
      });
      const campaign = await campaignRes.json();
      if (campaign.error) throw new Error(campaign.error);

      // 2. Publish to each channel
      const publishPromises = selectedChannels.map((ch) =>
        fetch("/api/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskId: null,
            campaignId: campaign.id,
            channelType: ch.channel_type,
            authData: ch.auth_data ?? {},
            content: {
              title: selectedProduct.name,
              body: editedContent[ch.channel_type] ?? "",
            },
          }),
        })
      );
      await Promise.all(publishPromises);

      // 3. Reset wizard and refresh
      resetWizard();
      fetchCampaigns();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Launch failed. Please try again.");
    } finally {
      setLaunching(false);
    }
  };

  /* ─── Schedule ─── */
  const handleSchedule = async () => {
    if (!selectedProduct || selectedChannels.length === 0 || !scheduleDate) return;
    setLaunching(true);
    setError(null);

    try {
      const scheduledAt = new Date(`${scheduleDate}T${scheduleTime || "12:00"}`).toISOString();

      // 1. Create campaign
      const campaignRes = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: selectedProduct.id,
          status: "scheduled",
          scheduled_at: scheduledAt,
        }),
      });
      const campaign = await campaignRes.json();
      if (campaign.error) throw new Error(campaign.error);

      // 2. Schedule each channel publish task
      const schedulePromises = selectedChannels.map((ch) =>
        fetch("/api/publish", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            campaignId: campaign.id,
            channelId: ch.id,
            content: {
              title: selectedProduct.name,
              body: editedContent[ch.channel_type] ?? "",
            },
            scheduledAt,
          }),
        })
      );
      await Promise.all(schedulePromises);

      resetWizard();
      fetchCampaigns();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scheduling failed. Please try again.");
    } finally {
      setLaunching(false);
    }
  };

  /* ─── Reset wizard ─── */
  const resetWizard = () => {
    setStep("product");
    setSelectedProduct(null);
    setSelectedChannelIds([]);
    setGeneratedContent({});
    setEditedContent({});
    setScheduleDate("");
    setScheduleTime("");
    setError(null);
    setShowWizard(false);
  };

  /* ─── Loading ─── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="text-[var(--text-muted)] font-[var(--font-body)]">Loading campaigns...</div>
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
          <a href="/dashboard/campaigns" className="text-sm text-[var(--cyan)] font-semibold">Campaigns</a>
          <a href="/dashboard/channels" className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">Channels</a>
          <a href="/dashboard/products/new" className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">Add Product</a>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* ─── PAGE HEADER ─── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-[family-name:var(--font-d)] font-bold text-2xl md:text-3xl">Campaigns</h1>
            <p className="text-[var(--text-muted)] text-sm mt-1">Create AI-powered launch campaigns and distribute across all your channels.</p>
          </div>
          {!showWizard && (
            <button
              onClick={() => setShowWizard(true)}
              className="px-5 py-2.5 rounded-xl bg-[var(--coral)] hover:bg-[var(--coral-hover)] text-white text-sm font-semibold transition-all hover:shadow-[0_0_30px_rgba(255,92,58,0.3)] active:scale-[0.98] cursor-pointer flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
              New Campaign
            </button>
          )}
        </div>

        {/* ═══════ CAMPAIGN WIZARD ═══════ */}
        {showWizard && (
          <div className="mb-10 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden">
            {/* Step indicator */}
            <div className="flex items-center border-b border-[var(--border)] px-6 py-4">
              {(["product", "channels", "generate", "review"] as WizardStep[]).map((s, i) => {
                const stepLabels = ["Product", "Channels", "Generate", "Review"];
                const isActive = step === s;
                const isDone =
                  (s === "product" && selectedProduct) ||
                  (s === "channels" && selectedChannelIds.length > 0 && step !== "product") ||
                  (s === "generate" && Object.keys(generatedContent).length > 0 && step === "review");
                return (
                  <div key={s} className="flex items-center">
                    {i > 0 && <div className="w-8 h-px bg-[var(--border)] mx-3" />}
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          isActive
                            ? "bg-[var(--cyan)] text-[var(--bg)]"
                            : isDone
                            ? "bg-[var(--green)] text-white"
                            : "bg-[var(--surface)] text-[var(--text-dim)]"
                        }`}
                      >
                        {isDone && !isActive ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7" /></svg>
                        ) : (
                          i + 1
                        )}
                      </div>
                      <span className={`text-xs font-semibold ${isActive ? "text-[var(--text)]" : "text-[var(--text-dim)]"}`}>
                        {stepLabels[i]}
                      </span>
                    </div>
                  </div>
                );
              })}
              <button onClick={resetWizard} className="ml-auto text-[var(--text-dim)] hover:text-[var(--text)] transition-colors cursor-pointer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6">
              {error && (
                <div className="mb-6 px-4 py-3 rounded-xl bg-[var(--coral-dim)] border border-[var(--coral)]/20 text-[var(--coral)] text-sm">
                  {error}
                </div>
              )}

              {/* ─── STEP 1: SELECT PRODUCT ─── */}
              {step === "product" && (
                <div>
                  <h2 className="font-[family-name:var(--font-d)] font-bold text-lg mb-1">Select a Product</h2>
                  <p className="text-[var(--text-muted)] text-sm mb-6">Choose the product you want to launch.</p>

                  {products.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-[var(--text-muted)] mb-4">No products found. Add one first.</p>
                      <a
                        href="/dashboard/products/new"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--cyan-dim)] border border-[var(--cyan)]/30 text-[var(--cyan)] text-sm font-semibold hover:bg-[var(--cyan-mid)] transition-all"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                        Add Product
                      </a>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {products.map((p) => {
                        const isSelected = selectedProduct?.id === p.id;
                        return (
                          <button
                            key={p.id}
                            onClick={() => setSelectedProduct(p)}
                            className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? "bg-[var(--cyan-dim)] border-[var(--cyan)]/40 shadow-[0_0_20px_rgba(0,229,255,0.1)]"
                                : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-light)]"
                            }`}
                          >
                            <h3 className="font-semibold text-sm mb-1">{p.name}</h3>
                            {p.tagline && <p className="text-[var(--text-muted)] text-xs leading-relaxed">{p.tagline}</p>}
                            {p.website_url && (
                              <p className="text-[var(--text-dim)] text-xs mt-2 truncate">{p.website_url}</p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {selectedProduct && (
                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={() => setStep("channels")}
                        className="px-6 py-2.5 rounded-xl bg-[var(--cyan)] text-[var(--bg)] text-sm font-semibold hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all cursor-pointer"
                      >
                        Next: Select Channels
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ─── STEP 2: SELECT CHANNELS ─── */}
              {step === "channels" && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="font-[family-name:var(--font-d)] font-bold text-lg">Select Channels</h2>
                    <span className="text-xs text-[var(--text-dim)]">
                      {selectedChannelIds.length} selected
                    </span>
                  </div>
                  <p className="text-[var(--text-muted)] text-sm mb-6">
                    Choose which channels to distribute your content to.
                  </p>

                  {channels.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-[var(--text-muted)] mb-4">No channels connected yet.</p>
                      <a
                        href="/dashboard/channels"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--cyan-dim)] border border-[var(--cyan)]/30 text-[var(--cyan)] text-sm font-semibold hover:bg-[var(--cyan-mid)] transition-all"
                      >
                        Connect a Channel
                      </a>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-3">
                      {channels.map((ch) => {
                        const isSelected = selectedChannelIds.includes(ch.id);
                        const color = channelColor(ch.channel_type);
                        return (
                          <button
                            key={ch.id}
                            onClick={() =>
                              setSelectedChannelIds((prev) =>
                                isSelected ? prev.filter((id) => id !== ch.id) : [...prev, ch.id]
                              )
                            }
                            className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer text-left ${
                              isSelected
                                ? "bg-[var(--cyan-dim)] border-[var(--cyan)]/40"
                                : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-light)]"
                            }`}
                          >
                            {/* Custom checkbox */}
                            <div
                              className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-all ${
                                isSelected ? "bg-[var(--cyan)]" : "border border-[var(--border-light)]"
                              }`}
                            >
                              {isSelected && (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--bg)" strokeWidth="3">
                                  <path d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            {/* Icon */}
                            <div
                              className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                              style={{ background: `${color}20`, color }}
                            >
                              {channelIcon(ch.channel_type)}
                            </div>
                            {/* Info */}
                            <div className="min-w-0">
                              <p className="font-semibold text-sm capitalize">{ch.channel_type}</p>
                              {ch.account_name && (
                                <p className="text-[var(--text-dim)] text-xs truncate">{ch.account_name}</p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="mt-6 flex items-center justify-between">
                    <button
                      onClick={() => setStep("product")}
                      className="px-5 py-2.5 rounded-xl border border-[var(--border-light)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--text-muted)] transition-all text-sm cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleGenerate}
                      disabled={selectedChannelIds.length === 0 || generating}
                      className="px-6 py-2.5 rounded-xl bg-[var(--purple)] text-white text-sm font-semibold hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2a5 5 0 015 5c0 2.76-5 8-5 8s-5-5.24-5-8a5 5 0 015-5z" />
                        <path d="M9 9a3 3 0 016 0" opacity="0.5" />
                      </svg>
                      Generate AI Content
                    </button>
                  </div>
                </div>
              )}

              {/* ─── STEP 3: GENERATING ─── */}
              {step === "generate" && generating && (
                <div className="py-16 text-center">
                  <div className="relative w-16 h-16 mx-auto mb-6">
                    <div className="absolute inset-0 rounded-full border-2 border-[var(--purple)]/20" />
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--purple)] animate-spin" />
                  </div>
                  <h2 className="font-[family-name:var(--font-d)] font-bold text-lg mb-2">Generating Content...</h2>
                  <p className="text-[var(--text-muted)] text-sm">
                    AI is crafting platform-perfect content for {selectedChannels.length} channel{selectedChannels.length !== 1 ? "s" : ""}.
                  </p>
                </div>
              )}

              {/* ─── STEP 4: REVIEW & EDIT ─── */}
              {step === "review" && !generating && (
                <div>
                  <h2 className="font-[family-name:var(--font-d)] font-bold text-lg mb-1">Review Generated Content</h2>
                  <p className="text-[var(--text-muted)] text-sm mb-6">
                    Edit the AI-generated content for each channel below, then launch or schedule.
                  </p>

                  <div className="space-y-4">
                    {selectedChannels.map((ch) => (
                      <div key={ch.id} className="rounded-xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
                          <div
                            className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold"
                            style={{ background: `${channelColor(ch.channel_type)}20`, color: channelColor(ch.channel_type) }}
                          >
                            {channelIcon(ch.channel_type)}
                          </div>
                          <span className="font-semibold text-sm capitalize">{ch.channel_type}</span>
                          {ch.account_name && (
                            <span className="text-[var(--text-dim)] text-xs">({ch.account_name})</span>
                          )}
                        </div>
                        <textarea
                          value={editedContent[ch.channel_type] ?? ""}
                          onChange={(e) =>
                            setEditedContent((prev) => ({ ...prev, [ch.channel_type]: e.target.value }))
                          }
                          rows={6}
                          className="w-full px-4 py-3 bg-transparent text-[var(--text)] text-sm leading-relaxed resize-y focus:outline-none placeholder:text-[var(--text-dim)] font-[var(--font-mono)]"
                          placeholder={`No content generated for ${ch.channel_type}`}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Schedule inputs */}
                  <div className="mt-6 p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                    <p className="text-xs text-[var(--text-dim)] uppercase tracking-wider mb-3 font-semibold">Schedule (optional)</p>
                    <div className="flex items-center gap-3">
                      <input
                        type="date"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-light)] text-[var(--text)] text-sm focus:outline-none focus:border-[var(--cyan)] transition-all"
                      />
                      <input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-light)] text-[var(--text)] text-sm focus:outline-none focus:border-[var(--cyan)] transition-all"
                      />
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="mt-6 flex items-center justify-between">
                    <button
                      onClick={() => setStep("channels")}
                      className="px-5 py-2.5 rounded-xl border border-[var(--border-light)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--text-muted)] transition-all text-sm cursor-pointer"
                    >
                      Back
                    </button>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleSchedule}
                        disabled={launching || !scheduleDate}
                        className="px-5 py-2.5 rounded-xl border border-[var(--purple)]/40 text-[var(--purple)] text-sm font-semibold hover:bg-[var(--purple)]/10 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                        </svg>
                        {launching ? "Scheduling..." : "Schedule"}
                      </button>
                      <button
                        onClick={handleLaunch}
                        disabled={launching}
                        className="px-6 py-2.5 rounded-xl bg-[var(--coral)] text-white text-sm font-semibold hover:bg-[var(--coral-hover)] hover:shadow-[0_0_30px_rgba(255,92,58,0.3)] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2L4 10h5v8h6v-8h5L12 2z" /></svg>
                        {launching ? "Launching..." : "Launch Now"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════ EXISTING CAMPAIGNS ═══════ */}
        <div>
          <h2 className="font-[family-name:var(--font-d)] font-bold text-lg mb-4">
            Previous Campaigns
            {campaigns.length > 0 && (
              <span className="text-[var(--text-dim)] text-sm font-normal ml-2">({campaigns.length})</span>
            )}
          </h2>

          {campaigns.length === 0 ? (
            <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="1.5">
                  <path d="M12 2L4 10h5v8h6v-8h5L12 2z" /><path d="M4 22h16" opacity="0.4" />
                </svg>
              </div>
              <p className="text-[var(--text-muted)] text-sm mb-1">No campaigns yet</p>
              <p className="text-[var(--text-dim)] text-xs">Create your first campaign to start launching.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-5 hover:border-[var(--border-light)] transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-sm truncate">
                          {c.products?.name ?? "Unknown Product"}
                        </h3>
                        <StatusBadge status={c.status} />
                      </div>
                      {c.products?.tagline && (
                        <p className="text-[var(--text-muted)] text-xs mb-2 truncate">{c.products.tagline}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-[var(--text-dim)]">
                        <span>Created {new Date(c.created_at).toLocaleDateString()}</span>
                        {c.scheduled_at && (
                          <span className="text-[var(--purple)]">
                            Scheduled {new Date(c.scheduled_at).toLocaleString()}
                          </span>
                        )}
                        {c.publish_tasks && c.publish_tasks.length > 0 && (
                          <span>{c.publish_tasks.length} task{c.publish_tasks.length !== 1 ? "s" : ""}</span>
                        )}
                      </div>
                    </div>
                    {/* Channel icons */}
                    {c.publish_tasks && c.publish_tasks.length > 0 && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {c.publish_tasks.map((t, i) => (
                          <div
                            key={t.id || i}
                            className="w-7 h-7 rounded-md bg-[var(--surface)] flex items-center justify-center text-xs"
                            title={t.status}
                          >
                            {t.status === "published" ? (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5">
                                <path d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                              </svg>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
