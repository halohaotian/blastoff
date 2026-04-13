"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const supabase = createSupabaseBrowserClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage({ text: "Check your email for the confirmation link!", type: "success" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = "/dashboard";
      }
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : "Authentication failed",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "github" | "google") => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setMessage({ text: error.message, type: "error" });
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] font-[var(--font-body)] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--coral)] to-[var(--cyan)] flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M12 2L4 10h5v8h6v-8h5L12 2z" />
              </svg>
            </div>
            <span className="font-[family-name:var(--font-d)] font-bold text-xl tracking-tight">
              Blastoff
            </span>
          </a>
          <h1 className="font-[family-name:var(--font-d)] font-bold text-2xl mt-6">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            {isSignUp ? "Sign up to start launching" : "Sign in to your dashboard"}
          </p>
        </div>

        {/* OAuth buttons */}
        <div className="space-y-3 mb-6">
          <button
            onClick={() => handleOAuth("github")}
            className="w-full px-4 py-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-sm font-medium hover:border-[var(--border-light)] transition-all cursor-pointer flex items-center justify-center gap-3"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Continue with GitHub
          </button>
          <button
            onClick={() => handleOAuth("google")}
            className="w-full px-4 py-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-sm font-medium hover:border-[var(--border-light)] transition-all cursor-pointer flex items-center justify-center gap-3"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-[var(--border)]" />
          <span className="text-[var(--text-dim)] text-xs">or</span>
          <div className="flex-1 h-px bg-[var(--border)]" />
        </div>

        {/* Email form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {message && (
            <div className={`px-4 py-3 rounded-xl text-sm ${
              message.type === "success"
                ? "bg-[var(--green)]/10 border border-[var(--green)]/20 text-[var(--green)]"
                : "bg-[var(--coral-dim)] border border-[var(--coral)]/20 text-[var(--coral)]"
            }`}>
              {message.text}
            </div>
          )}

          <div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-light)] text-[var(--text)] text-sm focus:outline-none focus:border-[var(--cyan)] transition-all placeholder:text-[var(--text-dim)]"
            />
          </div>
          <div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              minLength={6}
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-light)] text-[var(--text)] text-sm focus:outline-none focus:border-[var(--cyan)] transition-all placeholder:text-[var(--text-dim)]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 rounded-xl bg-[var(--cyan)] text-[var(--bg)] text-sm font-semibold hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? "Loading..." : isSignUp ? "Create Account" : "Sign In"}
          </button>
        </form>

        {/* Toggle */}
        <p className="text-center text-sm text-[var(--text-muted)] mt-6">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            onClick={() => { setIsSignUp(!isSignUp); setMessage(null); }}
            className="text-[var(--cyan)] font-semibold hover:underline cursor-pointer"
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
}
