"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

interface Channel { id: string; channel_type: string; account_name: string | null; channel_metadata: Record<string, unknown>; created_at: string; }

const CHANNEL_INFO: Record<string, { name: string; icon: string; color: string; fields: { key: string; label: string; placeholder: string }[] }> = {
  discord: { name: "Discord", icon: "⬡", color: "#5865F2", fields: [{ key: "webhook_url", label: "Webhook URL", placeholder: "https://discord.com/api/webhooks/..." }] },
  reddit: { name: "Reddit", icon: "🔴", color: "#FF4500", fields: [{ key: "webhook_url", label: "Webhook URL (placeholder)", placeholder: "Coming soon" }] },
  twitter: { name: "Twitter / X", icon: "𝕏", color: "#1DA1F2", fields: [{ key: "webhook_url", label: "Webhook URL (placeholder)", placeholder: "Coming soon" }] },
  linkedin: { name: "LinkedIn", icon: "in", color: "#0A66C2", fields: [{ key: "webhook_url", label: "Webhook URL (placeholder)", placeholder: "Coming soon" }] },
  facebook: { name: "Facebook", icon: "f", color: "#1877F2", fields: [{ key: "webhook_url", label: "Webhook URL (placeholder)", placeholder: "Coming soon" }] },
};

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [channelType, setChannelType] = useState("discord");
  const [accountName, setAccountName] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const load = () => {
    fetch("/api/channels").then((r) => r.json()).then((d) => { setChannels(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(load, []);

  const handleConnect = async () => {
    setSaving(true);
    const info = CHANNEL_INFO[channelType];
    const authData: Record<string, string> = {};
    info.fields.forEach((f) => { if (fields[f.key]) authData[f.key] = fields[f.key]; });

    const res = await fetch("/api/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel_type: channelType, account_name: accountName || info.name, auth_data: authData }),
    });

    if (res.ok) {
      setShowModal(false);
      setFields({});
      setAccountName("");
      load();
    } else {
      alert("Failed to connect channel");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this channel?")) return;
    await fetch(`/api/channels?id=${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] font-[var(--font-body)]">
      <nav className="border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[var(--coral)] to-[var(--cyan)] flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2L4 10h5v8h6v-8h5L12 2z" /></svg>
            </div>
            <span className="font-[family-name:var(--font-d)] font-bold">Blastoff</span>
          </Link>
          <div className="hidden sm:flex items-center gap-5 text-sm">
            <Link href="/dashboard" className="text-[var(--text-muted)] hover:text-[var(--text)]">Dashboard</Link>
            <Link href="/dashboard/products" className="text-[var(--text-muted)] hover:text-[var(--text)]">Products</Link>
            <Link href="/dashboard/campaigns" className="text-[var(--text-muted)] hover:text-[var(--text)]">Campaigns</Link>
            <Link href="/dashboard/channels" className="text-[var(--purple)] font-medium">Channels</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-[family-name:var(--font-d)] text-2xl font-bold">Channels</h1>
          <button onClick={() => setShowModal(true)} className="px-4 py-2 rounded-lg bg-[var(--purple)] text-white text-sm font-semibold cursor-pointer">+ Connect Channel</button>
        </div>

        {loading ? <p className="text-[var(--text-muted)]">Loading...</p> : channels.length === 0 ? (
          <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-16 text-center">
            <p className="text-4xl mb-4">📡</p>
            <h2 className="font-[family-name:var(--font-d)] text-xl font-bold mb-2">No channels connected</h2>
            <p className="text-[var(--text-muted)] mb-6">Connect Discord via webhook to start publishing instantly.</p>
            <button onClick={() => setShowModal(true)} className="px-5 py-2.5 rounded-lg bg-[var(--purple)] text-white text-sm font-semibold cursor-pointer">Connect Discord</button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {channels.map((ch) => {
              const info = CHANNEL_INFO[ch.channel_type] || { name: ch.channel_type, icon: "?", color: "#666" };
              return (
                <div key={ch.id} className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl" style={{ color: info.color }}>{info.icon}</span>
                      <span className="font-bold">{info.name}</span>
                    </div>
                    <button onClick={() => handleDelete(ch.id)} className="text-[var(--text-dim)] hover:text-[var(--coral)] text-xs cursor-pointer">Remove</button>
                  </div>
                  <p className="text-[var(--text-muted)] text-sm">{ch.account_name || "Unnamed"}</p>
                  <p className="text-[var(--text-dim)] text-xs mt-2">Connected {new Date(ch.created_at).toLocaleDateString()}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md mx-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-6">
              <h2 className="font-[family-name:var(--font-d)] font-bold text-lg mb-5">Connect Channel</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Channel Type</label>
                  <select value={channelType} onChange={(e) => setChannelType(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg)] border border-[var(--border-light)] text-[var(--text)] text-sm cursor-pointer">
                    {Object.entries(CHANNEL_INFO).map(([k, v]) => (
                      <option key={k} value={k}>{v.icon} {v.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Account Name</label>
                  <input value={accountName} onChange={(e) => setAccountName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg)] border border-[var(--border-light)] text-[var(--text)] text-sm" placeholder="My Server" />
                </div>
                {CHANNEL_INFO[channelType].fields.map((f) => (
                  <div key={f.key}>
                    <label className="block text-sm font-medium mb-1.5">{f.label}</label>
                    <input value={fields[f.key] || ""} onChange={(e) => setFields({ ...fields, [f.key]: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-[var(--bg)] border border-[var(--border-light)] text-[var(--text)] text-sm" placeholder={f.placeholder} />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={handleConnect} disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-[var(--purple)] text-white font-semibold text-sm cursor-pointer disabled:opacity-60">
                  {saving ? "Connecting..." : "Connect"}
                </button>
                <button onClick={() => setShowModal(false)}
                  className="px-5 py-3 rounded-xl border border-[var(--border-light)] text-[var(--text-muted)] text-sm cursor-pointer">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
