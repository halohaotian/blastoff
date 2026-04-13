"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface Product {
  id: string;
  name: string;
  tagline: string | null;
  description: string;
  website_url: string | null;
  video_url: string | null;
  pricing_model: string | null;
  categories: string[];
  tags: string[];
}

type FormData = {
  name: string;
  tagline: string;
  description: string;
  website_url: string;
  video_url: string;
  pricing_model: string;
  categories: string;
  tags: string;
};

const PRICING_OPTIONS = ["Free", "Freemium", "Paid", "Open Source"] as const;

const INITIAL_FORM: FormData = {
  name: "",
  tagline: "",
  description: "",
  website_url: "",
  video_url: "",
  pricing_model: "",
  categories: "",
  tags: "",
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
function NewProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(!!editId);
  const [error, setError] = useState("");

  /* ---- Load existing product for editing -------------------------- */
  useEffect(() => {
    if (!editId) return;
    fetch(`/api/products`)
      .then((r) => r.json())
      .then((data) => {
        const p = Array.isArray(data)
          ? (data as Product[]).find((x) => x.id === editId)
          : null;
        if (p) {
          setForm({
            name: p.name || "",
            tagline: p.tagline || "",
            description: p.description || "",
            website_url: p.website_url || "",
            video_url: p.video_url || "",
            pricing_model: p.pricing_model || "",
            categories: Array.isArray(p.categories)
              ? p.categories.join(", ")
              : "",
            tags: Array.isArray(p.tags) ? p.tags.join(", ") : "",
          });
        } else {
          setError("Product not found.");
        }
      })
      .catch(() => setError("Failed to load product."))
      .finally(() => setPageLoading(false));
  }, [editId]);

  /* ---- Submit handler --------------------------------------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const payload = {
      ...form,
      categories: form.categories
        ? form.categories
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      tags: form.tags
        ? form.tags
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    };

    try {
      const url = "/api/products";
      const res = await fetch(url, {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editId ? { id: editId, ...payload } : payload),
      });

      if (res.ok) {
        router.push("/dashboard/products");
      } else {
        const err = await res.json();
        setError(err.error || "Failed to save product.");
        setLoading(false);
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  /* ---- Field updater ---------------------------------------------- */
  const update = (key: keyof FormData, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  /* ================================================================= */
  /*  Render                                                            */
  /* ================================================================= */
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] font-[var(--font-body)]">
      {/* ---- Nav ---- */}
      <nav className="border-b border-[var(--border)] px-6 py-4 flex items-center justify-between sticky top-0 z-30 bg-[var(--bg)]/80 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[var(--coral)] to-[var(--cyan)] flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <path d="M12 2L4 10h5v8h6v-8h5L12 2z" />
              </svg>
            </div>
            <span className="font-[family-name:var(--font-d)] font-bold">
              Blastoff
            </span>
          </Link>
          <div className="hidden sm:flex items-center gap-5 text-sm">
            <Link
              href="/dashboard"
              className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/products"
              className="text-[var(--cyan)] font-medium"
            >
              Products
            </Link>
            <Link
              href="/dashboard/campaigns"
              className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              Campaigns
            </Link>
            <Link
              href="/dashboard/channels"
              className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              Channels
            </Link>
          </div>
        </div>
      </nav>

      {/* ---- Content ---- */}
      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Back link */}
        <Link
          href="/dashboard/products"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-dim)] hover:text-[var(--text-muted)] transition-colors mb-6"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Products
        </Link>

        {/* Page heading */}
        <div className="mb-8">
          <h1 className="font-[family-name:var(--font-d)] text-2xl font-bold">
            {editId ? "Edit Product" : "Add New Product"}
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            {editId
              ? "Update your product details below."
              : "Fill in the details to add a new product to your catalog."}
          </p>
        </div>

        {/* Loading state */}
        {pageLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[var(--cyan)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          /* ---- Form ---- */
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error banner */}
            {error && (
              <div className="rounded-xl bg-[var(--coral-dim)] border border-[var(--coral)]/20 px-5 py-3 text-sm text-[var(--coral)]">
                {error}
              </div>
            )}

            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Product Name <span className="text-[var(--coral)]">*</span>
              </label>
              <input
                required
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-light)] text-[var(--text)] focus:outline-none focus:border-[var(--cyan)] focus:ring-1 focus:ring-[var(--cyan)]/30 text-sm transition-all placeholder:text-[var(--text-dim)]"
                placeholder="e.g. My Awesome SaaS"
              />
            </div>

            {/* Tagline */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Tagline
              </label>
              <input
                value={form.tagline}
                onChange={(e) => update("tagline", e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-light)] text-[var(--text)] focus:outline-none focus:border-[var(--cyan)] focus:ring-1 focus:ring-[var(--cyan)]/30 text-sm transition-all placeholder:text-[var(--text-dim)]"
                placeholder="One-line description of your product"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Description <span className="text-[var(--coral)]">*</span>
              </label>
              <textarea
                required
                rows={6}
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-light)] text-[var(--text)] focus:outline-none focus:border-[var(--cyan)] focus:ring-1 focus:ring-[var(--cyan)]/30 text-sm resize-y transition-all placeholder:text-[var(--text-dim)]"
                placeholder="Detailed product description. What problem does it solve? Who is it for?"
              />
            </div>

            {/* Website URL + Video URL */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Website URL
                </label>
                <input
                  value={form.website_url}
                  onChange={(e) => update("website_url", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-light)] text-[var(--text)] focus:outline-none focus:border-[var(--cyan)] focus:ring-1 focus:ring-[var(--cyan)]/30 text-sm transition-all placeholder:text-[var(--text-dim)]"
                  placeholder="https://yourproduct.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Video URL
                </label>
                <input
                  value={form.video_url}
                  onChange={(e) => update("video_url", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-light)] text-[var(--text)] focus:outline-none focus:border-[var(--cyan)] focus:ring-1 focus:ring-[var(--cyan)]/30 text-sm transition-all placeholder:text-[var(--text-dim)]"
                  placeholder="https://youtube.com/..."
                />
              </div>
            </div>

            {/* Pricing Model */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Pricing Model
              </label>
              <select
                value={form.pricing_model}
                onChange={(e) => update("pricing_model", e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-light)] text-[var(--text)] focus:outline-none focus:border-[var(--cyan)] focus:ring-1 focus:ring-[var(--cyan)]/30 text-sm cursor-pointer transition-all appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7FA0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 16px center",
                }}
              >
                <option value="">Select pricing model...</option>
                {PRICING_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Categories */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Categories
              </label>
              <input
                value={form.categories}
                onChange={(e) => update("categories", e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-light)] text-[var(--text)] focus:outline-none focus:border-[var(--cyan)] focus:ring-1 focus:ring-[var(--cyan)]/30 text-sm transition-all placeholder:text-[var(--text-dim)]"
                placeholder="SaaS, Developer Tools, AI (comma-separated)"
              />
              <p className="text-[var(--text-dim)] text-xs mt-1.5">
                Separate multiple categories with commas
              </p>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium mb-2">Tags</label>
              <input
                value={form.tags}
                onChange={(e) => update("tags", e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-light)] text-[var(--text)] focus:outline-none focus:border-[var(--cyan)] focus:ring-1 focus:ring-[var(--cyan)]/30 text-sm transition-all placeholder:text-[var(--text-dim)]"
                placeholder="productivity, automation, marketing (comma-separated)"
              />
              <p className="text-[var(--text-dim)] text-xs mt-1.5">
                Separate multiple tags with commas
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-6 border-t border-[var(--border)]">
              <button
                type="submit"
                disabled={loading}
                className="px-7 py-3 rounded-xl bg-[var(--cyan)] text-[var(--bg)] font-semibold text-sm hover:opacity-90 disabled:opacity-60 transition-opacity cursor-pointer"
              >
                {loading
                  ? "Saving..."
                  : editId
                    ? "Update Product"
                    : "Create Product"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/dashboard/products")}
                className="px-7 py-3 rounded-xl border border-[var(--border-light)] text-[var(--text-muted)] text-sm hover:text-[var(--text)] hover:border-[var(--border)] transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function NewProductPageWrapped() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg)] flex items-center justify-center text-[var(--text-muted)]">Loading...</div>}>
      <NewProductPage />
    </Suspense>
  );
}
