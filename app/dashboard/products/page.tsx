"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface Product {
  id: string;
  name: string;
  tagline: string | null;
  description: string;
  website_url: string | null;
  pricing_model: string | null;
  categories: string[];
  tags: string[];
  created_at: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* ---- fetch products --------------------------------------------- */
  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => {
        setProducts(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  /* ---- delete handler --------------------------------------------- */
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/products?id=${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      }
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  /* ---- quick-add (modal) handler ---------------------------------- */
  const [addForm, setAddForm] = useState({
    name: "",
    tagline: "",
    description: "",
    website_url: "",
  });
  const [adding, setAdding] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      if (res.ok) {
        const created = await res.json();
        setProducts((prev) => [created, ...prev]);
        setShowAddModal(false);
        setAddForm({ name: "", tagline: "", description: "", website_url: "" });
      }
    } finally {
      setAdding(false);
    }
  };

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
        <Link
          href="/dashboard"
          className="text-xs text-[var(--text-dim)] hover:text-[var(--text-muted)] transition-colors"
        >
          &larr; Dashboard
        </Link>
      </nav>

      {/* ---- Content ---- */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-[family-name:var(--font-d)] text-2xl font-bold">
              Products
            </h1>
            <p className="text-[var(--text-muted)] text-sm mt-1">
              {products.length} product{products.length !== 1 ? "s" : ""} in
              your catalog
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 rounded-xl bg-[var(--cyan)] text-[var(--bg)] text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer"
          >
            + Add Product
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[var(--cyan)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && products.length === 0 && (
          <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--cyan-dim)] flex items-center justify-center">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--cyan)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <h2 className="font-[family-name:var(--font-d)] text-xl font-bold mb-2">
              No products yet
            </h2>
            <p className="text-[var(--text-muted)] mb-6 max-w-md mx-auto">
              Add your first product to start creating launch campaigns across
              multiple channels.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-2.5 rounded-xl bg-[var(--cyan)] text-[var(--bg)] text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer"
            >
              Add Your First Product
            </button>
          </div>
        )}

        {/* Product cards grid */}
        {!loading && products.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((p) => (
              <div
                key={p.id}
                className="group relative rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-6 hover:border-[var(--cyan)]/25 transition-all duration-300 flex flex-col"
              >
                {/* Name + pricing badge */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-lg leading-tight">{p.name}</h3>
                  {p.pricing_model && (
                    <span className="shrink-0 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-[var(--cyan-dim)] text-[var(--cyan)] whitespace-nowrap">
                      {p.pricing_model}
                    </span>
                  )}
                </div>

                {/* Tagline */}
                <p className="text-[var(--text-muted)] text-sm mb-4 line-clamp-2 flex-1">
                  {p.tagline || p.description.slice(0, 120)}
                </p>

                {/* Website */}
                {p.website_url && (
                  <a
                    href={p.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[var(--cyan)] text-xs hover:underline mb-4 truncate max-w-full"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                    {p.website_url.replace(/^https?:\/\//, "")}
                  </a>
                )}

                {/* Categories */}
                {p.categories && p.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {p.categories.map((cat, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[var(--purple)]/10 text-[var(--purple)] uppercase tracking-wider"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer: date + actions */}
                <div className="flex items-center justify-between pt-4 border-t border-[var(--border)] mt-auto">
                  <span className="text-[var(--text-dim)] text-xs">
                    {new Date(p.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        router.push(`/dashboard/products/new?edit=${p.id}`)
                      }
                      className="px-3 py-1.5 rounded-lg text-xs text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--border)] transition-all cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget(p)}
                      className="px-3 py-1.5 rounded-lg text-xs text-[var(--coral)]/70 hover:text-[var(--coral)] hover:bg-[var(--coral-dim)] transition-all cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================================================================ */}
      {/*  Add Product Modal                                                */}
      {/* ================================================================ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          />
          {/* Modal */}
          <div className="relative w-full max-w-lg rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-[family-name:var(--font-d)] text-lg font-bold">
                Quick Add Product
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[var(--text-dim)] hover:text-[var(--text)] transition-colors cursor-pointer"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Product Name <span className="text-[var(--coral)]">*</span>
                </label>
                <input
                  required
                  value={addForm.name}
                  onChange={(e) =>
                    setAddForm({ ...addForm, name: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg)] border border-[var(--border-light)] text-[var(--text)] focus:outline-none focus:border-[var(--cyan)] text-sm transition-colors"
                  placeholder="e.g. My Awesome SaaS"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Tagline
                </label>
                <input
                  value={addForm.tagline}
                  onChange={(e) =>
                    setAddForm({ ...addForm, tagline: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg)] border border-[var(--border-light)] text-[var(--text)] focus:outline-none focus:border-[var(--cyan)] text-sm transition-colors"
                  placeholder="One-line description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Description <span className="text-[var(--coral)]">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={addForm.description}
                  onChange={(e) =>
                    setAddForm({ ...addForm, description: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg)] border border-[var(--border-light)] text-[var(--text)] focus:outline-none focus:border-[var(--cyan)] text-sm resize-y transition-colors"
                  placeholder="What does your product do?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Website URL
                </label>
                <input
                  value={addForm.website_url}
                  onChange={(e) =>
                    setAddForm({ ...addForm, website_url: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg)] border border-[var(--border-light)] text-[var(--text)] focus:outline-none focus:border-[var(--cyan)] text-sm transition-colors"
                  placeholder="https://yourproduct.com"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  disabled={adding}
                  className="px-6 py-2.5 rounded-xl bg-[var(--cyan)] text-[var(--bg)] font-semibold text-sm hover:opacity-90 disabled:opacity-60 transition-opacity cursor-pointer"
                >
                  {adding ? "Creating..." : "Create Product"}
                </button>
                <Link
                  href="/dashboard/products/new"
                  className="px-6 py-2.5 rounded-xl border border-[var(--border-light)] text-[var(--text-muted)] text-sm hover:text-[var(--text)] transition-colors text-center"
                >
                  Full Form &rarr;
                </Link>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/*  Delete Confirmation Modal                                        */}
      {/* ================================================================ */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !deleting && setDeleteTarget(null)}
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-8 shadow-2xl text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[var(--coral-dim)] flex items-center justify-center">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--coral)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </div>
            <h3 className="font-[family-name:var(--font-d)] text-lg font-bold mb-2">
              Delete Product
            </h3>
            <p className="text-[var(--text-muted)] text-sm mb-6">
              Are you sure you want to delete{" "}
              <span className="text-[var(--text)] font-medium">
                {deleteTarget.name}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-5 py-2.5 rounded-xl border border-[var(--border-light)] text-[var(--text-muted)] text-sm hover:text-[var(--text)] transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-5 py-2.5 rounded-xl bg-[var(--coral)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity cursor-pointer"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
