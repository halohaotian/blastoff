"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

interface Product { id: string; name: string; tagline: string | null; description: string; website_url: string | null; pricing_model: string | null; categories: string[]; tags: string[]; created_at: string; }
interface Campaign { id: string; name: string; status: string; product_id: string; created_at: string; products?: { name: string } | null; }
interface Channel { id: string; channel_type: string; account_name: string | null; status: string; }

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/campaigns").then((r) => r.json()),
      fetch("/api/channels").then((r) => r.json()),
    ]).then(([p, c, ch]) => {
      setProducts(Array.isArray(p) ? p : []);
      setCampaigns(Array.isArray(c) ? c : []);
      setChannels(Array.isArray(ch) ? ch : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const stats = [
    { label: "Products", value: products.length, color: "var(--cyan)", icon: "📦" },
    { label: "Campaigns", value: campaigns.length, color: "var(--coral)", icon: "🚀" },
    { label: "Channels", value: channels.length, color: "var(--purple)", icon: "📡" },
    { label: "Published", value: campaigns.filter((c) => c.status === "published").length, color: "var(--green)", icon: "✅" },
  ];

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
            <Link href="/dashboard" className="text-[var(--cyan)] font-medium">Dashboard</Link>
            <Link href="/dashboard/products" className="text-[var(--text-muted)] hover:text-[var(--text)]">Products</Link>
            <Link href="/dashboard/campaigns" className="text-[var(--text-muted)] hover:text-[var(--text)]">Campaigns</Link>
            <Link href="/dashboard/channels" className="text-[var(--text-muted)] hover:text-[var(--text)]">Channels</Link>
          </div>
        </div>
        <Link href="/" className="text-xs text-[var(--text-dim)] hover:text-[var(--text-muted)]">← Landing Page</Link>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-[family-name:var(--font-d)] text-2xl font-bold">Dashboard</h1>
          <div className="flex gap-3">
            <Link href="/dashboard/products/new" className="px-4 py-2 rounded-lg bg-[var(--cyan)] text-[var(--bg)] text-sm font-semibold hover:opacity-90">+ Add Product</Link>
            <Link href="/dashboard/campaigns" className="px-4 py-2 rounded-lg bg-[var(--coral)] text-white text-sm font-semibold hover:opacity-90">New Campaign</Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {stats.map((s, i) => (
            <div key={i} className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-5">
              <p className="text-2xl mb-1">{s.icon}</p>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{loading ? "—" : s.value}</p>
              <p className="text-[var(--text-muted)] text-xs uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Products */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-[family-name:var(--font-d)] font-bold text-lg">Your Products</h2>
            <Link href="/dashboard/products" className="text-[var(--cyan)] text-sm hover:underline">View all →</Link>
          </div>
          {products.length === 0 ? (
            <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-10 text-center">
              <p className="text-[var(--text-muted)] mb-4">No products yet. Add your first product to get started.</p>
              <Link href="/dashboard/products/new" className="px-5 py-2.5 rounded-lg bg-[var(--cyan)] text-[var(--bg)] text-sm font-semibold">Add Product</Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.slice(0, 6).map((p) => (
                <div key={p.id} className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-5 hover:border-[var(--cyan)]/30 transition-all">
                  <h3 className="font-bold mb-1">{p.name}</h3>
                  <p className="text-[var(--text-muted)] text-sm mb-3 line-clamp-2">{p.tagline || p.description}</p>
                  <div className="flex items-center gap-2 text-xs text-[var(--text-dim)]">
                    {p.pricing_model && <span className="px-2 py-0.5 rounded bg-[var(--cyan-dim)] text-[var(--cyan)]">{p.pricing_model}</span>}
                    <span>{new Date(p.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Campaigns */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-[family-name:var(--font-d)] font-bold text-lg">Recent Campaigns</h2>
            <Link href="/dashboard/campaigns" className="text-[var(--coral)] text-sm hover:underline">View all →</Link>
          </div>
          {campaigns.length === 0 ? (
            <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-10 text-center">
              <p className="text-[var(--text-muted)] mb-4">No campaigns yet. Create your first launch campaign.</p>
              <Link href="/dashboard/campaigns" className="px-5 py-2.5 rounded-lg bg-[var(--coral)] text-white text-sm font-semibold">New Campaign</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.slice(0, 5).map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-4">
                  <div>
                    <h3 className="font-medium">{c.name}</h3>
                    <p className="text-[var(--text-muted)] text-sm">{c.products?.name || "Unknown product"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      c.status === "published" ? "bg-[var(--green)]/10 text-[var(--green)]" :
                      c.status === "scheduled" ? "bg-[var(--purple)]/10 text-[var(--purple)]" :
                      c.status === "draft" ? "bg-[var(--text-dim)]/20 text-[var(--text-muted)]" :
                      "bg-[var(--coral)]/10 text-[var(--coral)]"
                    }`}>{c.status}</span>
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
