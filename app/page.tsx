"use client";

import { useState, useEffect } from "react";

/* ─── Waitlist count hook ─── */
function useWaitlistCount() {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    fetch("/api/waitlist")
      .then((r) => r.json())
      .then((d) => setCount(d.total_count ?? 0))
      .catch(() => setCount(0));
  }, []);
  return count;
}

/* ─── Track CTA ─── */
function trackCTA(name: string, section: string) {
  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "cta", cta_name: name, section }),
  }).catch(() => {});
}

/* ─── Email form ─── */
function EmailForm({
  source,
  buttonText = "Get Early Access",
  className = "",
}: {
  source: string;
  buttonText?: string;
  className?: string;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [result, setResult] = useState<{ position?: number; referrer_code?: string; existing?: boolean } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    const ref = params.get("ref");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: name || undefined, source, ref }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setResult(data);
        trackCTA("waitlist_signup", source);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className={`${className} text-center`}>
        <div className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981]">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-semibold">{result?.existing ? "You're already on the list!" : "You're on the list!"}</span>
        </div>
        {result?.position && (
          <p className="mt-3 text-[var(--text-muted)] text-sm">
            Your position: <span className="text-[var(--cyan)] font-bold font-mono">#{result.position}</span>
          </p>
        )}
        {result?.referrer_code && (
          <p className="mt-2 text-[var(--text-muted)] text-sm">
            Share to jump the line: <span className="text-[var(--cyan)] font-mono text-xs break-all">
              {typeof window !== "undefined" ? `${window.location.origin}?ref=${result.referrer_code}` : ""}
            </span>
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`${className} flex flex-col gap-3 max-w-lg mx-auto`}>
      <input
        type="text" placeholder="Your name (optional)" value={name}
        onChange={(e) => setName(e.target.value)}
        className="px-4 py-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-light)] text-[var(--text)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--cyan)] transition-all text-sm"
      />
      <div className="flex gap-3">
        <input
          type="email" required placeholder="your@email.com" value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 px-4 py-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-light)] text-[var(--text)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--cyan)] transition-all text-sm"
        />
        <button
          type="submit" disabled={status === "loading"}
          className="px-6 py-3 rounded-xl bg-[var(--coral)] hover:bg-[var(--coral-hover)] text-white font-semibold text-sm transition-all hover:shadow-[0_0_30px_rgba(255,92,58,0.3)] active:scale-[0.98] disabled:opacity-60 whitespace-nowrap cursor-pointer"
        >
          {status === "loading" ? "Joining..." : buttonText}
        </button>
      </div>
      {status === "error" && <p className="text-[var(--coral)] text-xs">Something went wrong. Please try again.</p>}
    </form>
  );
}

/* ─── Platform Badge ─── */
function PlatformBadge({ name, color, children }: { name: string; color: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[color]/50 transition-all group cursor-default">
      <span style={{ color }} className="text-lg">{children}</span>
      <span className="text-sm text-[var(--text-muted)] group-hover:text-[var(--text)] transition-colors font-medium">{name}</span>
    </div>
  );
}

/* ─── FAQ Item ─── */
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[var(--border)]">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-5 text-left cursor-pointer">
        <span className="font-medium text-[var(--text)] pr-4">{q}</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? "max-h-60 pb-5" : "max-h-0"}`}>
        <p className="text-[var(--text-muted)] leading-relaxed text-sm">{a}</p>
      </div>
    </div>
  );
}

/* ═══════ MAIN PAGE ═══════ */
export default function HomePage() {
  const waitlistCount = useWaitlistCount();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); }); },
      { threshold: 0.1 }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    fetch("/api/track", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "pageview", path: typeof window !== "undefined" ? window.location.pathname : "/", referrer: typeof document !== "undefined" ? document.referrer : "" }),
    }).catch(() => {});
  }, []);

  return (
    <div className="relative">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 md:px-10 bg-[var(--bg)]/80 backdrop-blur-xl border-b border-[var(--border)]">
        <a href="#" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--coral)] to-[var(--cyan)] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2L4 10h5v8h6v-8h5L12 2z" /></svg>
          </div>
          <span className="font-[family-name:var(--font-d)] font-bold text-lg tracking-tight">Blastoff</span>
        </a>
        <div className="hidden md:flex items-center gap-8 text-sm">
          <a href="#how-it-works" className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">How It Works</a>
          <a href="#features" className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">Features</a>
          <a href="#pricing" className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">Pricing</a>
          <a href="#faq" className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">FAQ</a>
        </div>
        <a href="#join" className="px-5 py-2 rounded-lg bg-[var(--coral)] hover:bg-[var(--coral-hover)] text-white text-sm font-semibold transition-all hover:shadow-[0_0_20px_rgba(255,92,58,0.25)]" onClick={() => trackCTA("nav_cta", "nav")}>
          Join Waitlist
        </a>
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        <div className="hero-orb w-[500px] h-[500px] bg-[var(--cyan)] opacity-[0.07] top-[10%] left-[-10%]" />
        <div className="hero-orb w-[400px] h-[400px] bg-[var(--coral)] opacity-[0.06] bottom-[10%] right-[-5%]" style={{ animationDelay: "3s" }} />
        <div className="hero-orb w-[300px] h-[300px] bg-[var(--purple)] opacity-[0.05] top-[50%] left-[50%]" style={{ animationDelay: "5s" }} />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center py-20">
          <div className="reveal inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--coral-dim)] border border-[var(--coral)]/20 text-[var(--coral)] text-xs font-semibold mb-8">
            <span className="pulse-dot w-2 h-2 rounded-full bg-[var(--coral)] inline-block" />
            PRE-LAUNCH — Limited Spots Available
          </div>

          <h1 className="reveal reveal-d1 font-[family-name:var(--font-d)] text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight mb-6">
            Launch Your Product
            <br />
            <span className="bg-gradient-to-r from-[var(--cyan)] via-[var(--purple)] to-[var(--coral)] bg-clip-text text-transparent">Everywhere in 5 Minutes</span>
          </h1>

          <p className="reveal reveal-d2 text-lg md:text-xl text-[var(--text-muted)] max-w-2xl mx-auto mb-8 leading-relaxed">
            You built something amazing. Now let the world know.
            <br className="hidden sm:block" />
            <strong className="text-[var(--text)]">One product description</strong> →{" "}
            <strong className="text-[var(--cyan)]">AI generates content</strong> →{" "}
            <strong className="text-[var(--coral)]">Distribute to 12+ platforms</strong>.
          </p>

          <div className="reveal reveal-d3 flex items-center justify-center gap-3 mb-8">
            <div className="flex -space-x-2">
              {["bg-[var(--cyan)]", "bg-[var(--coral)]", "bg-[var(--purple)]", "bg-[var(--green)]", "bg-[#F59E0B]"].map((c, i) => (
                <div key={i} className={`w-8 h-8 rounded-full ${c} border-2 border-[var(--bg)] flex items-center justify-center text-white text-xs font-bold`}>
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              <span className="text-[var(--text)] font-semibold">{waitlistCount !== null ? waitlistCount.toLocaleString() : "---"}</span> developers on the waitlist
            </p>
          </div>

          <div id="join" className="reveal reveal-d4 scroll-mt-24">
            <EmailForm source="hero" buttonText="Get Early Access — It's Free" />
          </div>

          <div className="reveal reveal-d5 flex items-center justify-center gap-6 mt-6 text-xs text-[var(--text-dim)]">
            <span className="flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              No credit card required
            </span>
            <span className="flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
              Cancel anytime
            </span>
            <span className="flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
              12+ platforms
            </span>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="relative py-24 md:py-32">
        <div className="max-w-5xl mx-auto px-6">
          <div className="reveal text-center mb-16">
            <p className="text-[var(--coral)] font-semibold text-sm tracking-wider uppercase mb-4">The Problem</p>
            <h2 className="font-[family-name:var(--font-d)] text-3xl md:text-4xl font-bold leading-tight mb-6">
              You Built Something Great.<br />
              <span className="text-[var(--text-muted)]">Now Comes the Painful Part.</span>
            </h2>
            <p className="text-[var(--text-muted)] max-w-2xl mx-auto text-lg">
              Launch day should be exciting. Instead, you spend <strong className="text-[var(--coral)]">6+ hours</strong> copy-pasting your product description to Reddit, Twitter, Product Hunt, Hacker News... each needing a different format, tone, and style.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="reveal reveal-d1 rounded-2xl bg-[var(--bg-card)] border border-[var(--coral)]/20 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[var(--coral-dim)] flex items-center justify-center text-[var(--coral)]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </div>
                <h3 className="font-[family-name:var(--font-d)] font-bold text-lg text-[var(--coral)]">Without Blastoff</h3>
              </div>
              <ul className="space-y-3 text-sm text-[var(--text-muted)]">
                <li className="flex items-start gap-2"><span className="text-[var(--coral)] mt-0.5">✗</span>Write 12 different posts manually for each platform</li>
                <li className="flex items-start gap-2"><span className="text-[var(--coral)] mt-0.5">✗</span>Spend hours learning each community's rules</li>
                <li className="flex items-start gap-2"><span className="text-[var(--coral)] mt-0.5">✗</span>Get banned from Reddit for self-promotion mistakes</li>
                <li className="flex items-start gap-2"><span className="text-[var(--coral)] mt-0.5">✗</span>Miss the best posting time on Product Hunt</li>
                <li className="flex items-start gap-2"><span className="text-[var(--coral)] mt-0.5">✗</span>No tracking — you don't know what worked</li>
                <li className="flex items-start gap-2"><span className="text-[var(--coral)] mt-0.5">✗</span>Burn out before your 3rd launch</li>
              </ul>
            </div>

            <div className="reveal reveal-d2 rounded-2xl bg-[var(--bg-card)] border border-[var(--cyan)]/20 p-8 glow-cyan">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[var(--cyan-dim)] flex items-center justify-center text-[var(--cyan)]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                </div>
                <h3 className="font-[family-name:var(--font-d)] font-bold text-lg text-[var(--cyan)]">With Blastoff</h3>
              </div>
              <ul className="space-y-3 text-sm text-[var(--text-muted)]">
                <li className="flex items-start gap-2"><span className="text-[var(--cyan)] mt-0.5">✓</span>Describe your product once — AI creates platform-perfect content</li>
                <li className="flex items-start gap-2"><span className="text-[var(--cyan)] mt-0.5">✓</span>Content tailored to each community's culture and rules</li>
                <li className="flex items-start gap-2"><span className="text-[var(--cyan)] mt-0.5">✓</span>Built-in compliance checks prevent bans</li>
                <li className="flex items-start gap-2"><span className="text-[var(--cyan)] mt-0.5">✓</span>Optimal posting times calculated automatically</li>
                <li className="flex items-start gap-2"><span className="text-[var(--cyan)] mt-0.5">✓</span>Track performance across all platforms in one dashboard</li>
                <li className="flex items-start gap-2"><span className="text-[var(--cyan)] mt-0.5">✓</span>Launch your 2nd, 3rd, 10th product in 5 minutes each</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="relative py-24 md:py-32 scroll-mt-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="reveal text-center mb-20">
            <p className="text-[var(--cyan)] font-semibold text-sm tracking-wider uppercase mb-4">How It Works</p>
            <h2 className="font-[family-name:var(--font-d)] text-3xl md:text-4xl font-bold">Three Steps. Five Minutes. <span className="text-[var(--text-muted)]">Done.</span></h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-4 relative">
            <div className="hidden md:block absolute top-16 left-[33%] right-[33%]"><div className="step-line w-full" /></div>

            {[
              { num: "1", color: "var(--cyan)", title: "Describe Your Product", desc: "Enter your product name, tagline, description, screenshots, and URL. Takes 2 minutes.", icon: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18M3 9h18" /><path d="M9 9h6M9 13h4" opacity="0.5" /></> },
              { num: "2", color: "var(--purple)", title: "AI Generates Content", desc: "Our AI crafts unique content for each platform — Reddit posts, tweets, PH listings, HN submissions, and more.", icon: <><path d="M12 2a5 5 0 015 5c0 2.76-5 8-5 8s-5-5.24-5-8a5 5 0 015-5z" /><path d="M9 9a3 3 0 016 0" opacity="0.5" /></> },
              { num: "3", color: "var(--coral)", title: "Launch Everywhere", desc: "Review, edit if needed, then hit launch. Your product appears on 12+ platforms simultaneously.", icon: <><path d="M12 2L4 10h5v8h6v-8h5L12 2z" /><path d="M4 22h16" opacity="0.4" /></> },
            ].map((step, i) => (
              <div key={i} className={`reveal reveal-d${i + 1} text-center`}>
                <div className="relative mx-auto w-32 h-32 mb-8">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br border border-[color:var(--border)] flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${step.color}20, transparent)`, borderColor: `${step.color}50` }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={step.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{step.icon}</svg>
                  </div>
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center font-[family-name:var(--font-d)] font-bold text-sm" style={{ background: step.color, color: step.color === "var(--cyan)" ? "var(--bg)" : "white" }}>{step.num}</div>
                </div>
                <h3 className="font-[family-name:var(--font-d)] font-bold text-lg mb-3">{step.title}</h3>
                <p className="text-[var(--text-muted)] text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="relative py-24 md:py-32 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="reveal text-center mb-16">
            <p className="text-[var(--cyan)] font-semibold text-sm tracking-wider uppercase mb-4">What Blastoff Does</p>
            <h2 className="font-[family-name:var(--font-d)] text-3xl md:text-4xl font-bold mb-4">Everything You Need to Ship & Promote</h2>
            <p className="text-[var(--text-muted)] max-w-2xl mx-auto">Not another social media scheduler. A purpose-built launch platform for software products.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { color: "var(--cyan)", title: "AI Content Engine", desc: "A specialized engine trained on successful product launches. Generates unique, platform-native content that resonates with each community.", icon: <path d="M12 2a5 5 0 015 5c0 2.76-5 8-5 8s-5-5.24-5-8a5 5 0 015-5z" /> },
              { color: "var(--coral)", title: "12+ Platform Distribution", desc: "Product Hunt, Reddit, Twitter/X, Hacker News, Discord, LinkedIn, YouTube, Facebook, TikTok, AlternativeTo, BetaList, Indie Hackers.", icon: <><path d="M4 4h16v16H4z" /><path d="M4 12h16M12 4v16" opacity="0.4" /></> },
              { color: "var(--green)", title: "Compliance Guard", desc: "Knows each subreddit's self-promotion policy, PH's posting guidelines, and HN's community norms. Avoid bans automatically.", icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /> },
              { color: "var(--purple)", title: "Smart Scheduling", desc: "AI calculates the optimal posting time for each platform based on audience activity patterns. No more guessing.", icon: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></> },
              { color: "var(--cyan)", title: "One-Click Launch", desc: "Review all generated content, make edits, then hit one button. Your product goes live across all platforms in seconds.", icon: <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><path d="M17 8l-5-5-5 5M12 3v12" /></> },
              { color: "var(--coral)", title: "Analytics Dashboard", desc: "Track upvotes, comments, clicks, and conversions across every platform in one unified view. Know what's working.", icon: <><path d="M18 20V10M12 20V4M6 20v-6" /></> },
            ].map((feat, i) => (
              <div key={i} className={`reveal reveal-d${Math.min(i + 1, 5)} gradient-border p-7`}>
                <div className="w-11 h-11 rounded-xl mb-5 flex items-center justify-center" style={{ backgroundColor: `${feat.color}15`, color: feat.color }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{feat.icon}</svg>
                </div>
                <h3 className="font-[family-name:var(--font-d)] font-bold text-base mb-2">{feat.title}</h3>
                <p className="text-[var(--text-muted)] text-sm leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLATFORMS */}
      <section className="relative py-24 md:py-32 bg-[var(--bg-card)]/50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="reveal text-center mb-12">
            <p className="text-[var(--cyan)] font-semibold text-sm tracking-wider uppercase mb-4">Supported Platforms</p>
            <h2 className="font-[family-name:var(--font-d)] text-3xl md:text-4xl font-bold">Your Product, <span className="bg-gradient-to-r from-[var(--cyan)] to-[var(--coral)] bg-clip-text text-transparent">Everywhere</span></h2>
          </div>
          <div className="reveal reveal-d1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            <PlatformBadge name="Product Hunt" color="#DA552F">🅿️</PlatformBadge>
            <PlatformBadge name="Reddit" color="#FF4500">🔴</PlatformBadge>
            <PlatformBadge name="Twitter / X" color="#1DA1F2">𝕏</PlatformBadge>
            <PlatformBadge name="Hacker News" color="#FF6600">▲</PlatformBadge>
            <PlatformBadge name="Discord" color="#5865F2">⬡</PlatformBadge>
            <PlatformBadge name="LinkedIn" color="#0A66C2">in</PlatformBadge>
            <PlatformBadge name="YouTube" color="#FF0000">▶</PlatformBadge>
            <PlatformBadge name="TikTok" color="#00F2EA">♪</PlatformBadge>
            <PlatformBadge name="Facebook" color="#1877F2">f</PlatformBadge>
            <PlatformBadge name="BetaList" color="#10B981">β</PlatformBadge>
            <PlatformBadge name="Indie Hackers" color="#F59E0B">IH</PlatformBadge>
            <PlatformBadge name="AlternativeTo" color="#6366F1">⚡</PlatformBadge>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="relative py-24 md:py-32 scroll-mt-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="reveal text-center mb-16">
            <p className="text-[var(--coral)] font-semibold text-sm tracking-wider uppercase mb-4">Pre-Sale Pricing</p>
            <h2 className="font-[family-name:var(--font-d)] text-3xl md:text-4xl font-bold mb-4">Lock In <span className="text-[var(--coral)]">50% Off Forever</span></h2>
            <p className="text-[var(--text-muted)] max-w-lg mx-auto">Early supporters get lifetime discount. Prices go up when we launch publicly.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Free */}
            <div className="reveal reveal-d1 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-8">
              <h3 className="font-[family-name:var(--font-d)] font-bold text-lg mb-1">Explorer</h3>
              <p className="text-[var(--text-muted)] text-sm mb-6">Try it out for free</p>
              <div className="mb-6"><span className="font-[family-name:var(--font-d)] text-4xl font-black">$0</span><span className="text-[var(--text-muted)] text-sm">/month</span></div>
              <ul className="space-y-3 mb-8 text-sm text-[var(--text-muted)]">
                <li className="flex items-center gap-2"><span className="text-[var(--green)]">✓</span>2 launches per month</li>
                <li className="flex items-center gap-2"><span className="text-[var(--green)]">✓</span>4 platforms</li>
                <li className="flex items-center gap-2"><span className="text-[var(--green)]">✓</span>Basic AI content</li>
                <li className="flex items-center gap-2"><span className="text-[var(--green)]">✓</span>Community support</li>
              </ul>
              <a href="#join" className="block text-center py-3 rounded-xl border border-[var(--border-light)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--text-muted)] transition-all text-sm font-semibold" onClick={() => trackCTA("pricing_free", "pricing")}>Get Started Free</a>
            </div>

            {/* Launch */}
            <div className="reveal reveal-d2 rounded-2xl bg-[var(--bg-card)] border border-[var(--coral)]/30 p-8 relative glow-coral">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[var(--coral)] text-white text-xs font-bold">MOST POPULAR — PRE-SALE</div>
              <h3 className="font-[family-name:var(--font-d)] font-bold text-lg mb-1 mt-2">Launch</h3>
              <p className="text-[var(--text-muted)] text-sm mb-6">For serious indie hackers</p>
              <div className="mb-6">
                <span className="text-[var(--text-muted)] text-sm line-through mr-2">$19</span>
                <span className="font-[family-name:var(--font-d)] text-4xl font-black text-[var(--coral)]">$9</span>
                <span className="text-[var(--text-muted)] text-sm">/month</span>
              </div>
              <ul className="space-y-3 mb-8 text-sm text-[var(--text-muted)]">
                <li className="flex items-center gap-2"><span className="text-[var(--green)]">✓</span>Unlimited launches</li>
                <li className="flex items-center gap-2"><span className="text-[var(--green)]">✓</span>All 12+ platforms</li>
                <li className="flex items-center gap-2"><span className="text-[var(--green)]">✓</span>Advanced AI engine</li>
                <li className="flex items-center gap-2"><span className="text-[var(--green)]">✓</span>Smart scheduling</li>
                <li className="flex items-center gap-2"><span className="text-[var(--green)]">✓</span>Analytics dashboard</li>
                <li className="flex items-center gap-2"><span className="text-[var(--coral)] font-semibold">✓</span><span className="text-[var(--coral)]">Lifetime 50% discount</span></li>
              </ul>
              <a href="#join" className="block text-center py-3 rounded-xl bg-[var(--coral)] hover:bg-[var(--coral-hover)] text-white font-semibold transition-all hover:shadow-[0_0_30px_rgba(255,92,58,0.3)] text-sm" onClick={() => trackCTA("pricing_launch", "pricing")}>Join Pre-Sale — $9/mo</a>
            </div>

            {/* Growth */}
            <div className="reveal reveal-d3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-8">
              <h3 className="font-[family-name:var(--font-d)] font-bold text-lg mb-1">Growth</h3>
              <p className="text-[var(--text-muted)] text-sm mb-6">For teams & agencies</p>
              <div className="mb-6">
                <span className="text-[var(--text-muted)] text-sm line-through mr-2">$49</span>
                <span className="font-[family-name:var(--font-d)] text-4xl font-black text-[var(--purple)]">$24</span>
                <span className="text-[var(--text-muted)] text-sm">/month</span>
              </div>
              <ul className="space-y-3 mb-8 text-sm text-[var(--text-muted)]">
                <li className="flex items-center gap-2"><span className="text-[var(--green)]">✓</span>Everything in Launch</li>
                <li className="flex items-center gap-2"><span className="text-[var(--green)]">✓</span>Team collaboration (5 seats)</li>
                <li className="flex items-center gap-2"><span className="text-[var(--green)]">✓</span>Priority support</li>
                <li className="flex items-center gap-2"><span className="text-[var(--green)]">✓</span>API access</li>
                <li className="flex items-center gap-2"><span className="text-[var(--green)]">✓</span>Custom branding</li>
                <li className="flex items-center gap-2"><span className="text-[var(--purple)] font-semibold">✓</span><span className="text-[var(--purple)]">Lifetime 50% discount</span></li>
              </ul>
              <a href="#join" className="block text-center py-3 rounded-xl border border-[var(--purple)]/40 text-[var(--purple)] hover:bg-[var(--purple)]/10 transition-all text-sm font-semibold" onClick={() => trackCTA("pricing_growth", "pricing")}>Join Pre-Sale — $24/mo</a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative py-24 md:py-32 scroll-mt-16">
        <div className="max-w-2xl mx-auto px-6">
          <div className="reveal text-center mb-12">
            <h2 className="font-[family-name:var(--font-d)] text-3xl font-bold">Frequently Asked Questions</h2>
          </div>
          <div className="reveal reveal-d1">
            <FAQItem q="What exactly does Blastoff do?" a="Blastoff is a product launch platform built for indie developers and small teams. You describe your software product once, our AI generates unique, platform-optimized content for each channel (Reddit posts, tweets, Product Hunt listings, etc.), and you launch to 12+ platforms with one click." />
            <FAQItem q="How is this different from Buffer or Hootsuite?" a="Buffer and Hootsuite are social media schedulers for marketing teams managing daily posts. Blastoff is built specifically for software product launches. We cover developer communities like Product Hunt, Hacker News, and Reddit — platforms those tools don't support. Plus, our AI doesn't just schedule content — it creates it." />
            <FAQItem q="Will I get banned from Reddit or other platforms?" a="Our Compliance Guard checks each platform's rules and community norms before posting. For Reddit, we track each subreddit's self-promotion rules and karma requirements. We'll warn you before posting if there's a risk." />
            <FAQItem q="When does Blastoff launch?" a="We're currently in pre-launch. By joining the waitlist, you get priority access when we launch, plus a lifetime 50% discount. We're targeting a public launch in the coming weeks." />
            <FAQItem q="What's the pre-sale deal?" a="The first 500 users to join the waitlist lock in 50% off their subscription forever. Launch plan drops from $19/mo to $9/mo, Growth from $49/mo to $24/mo. This discount never expires." />
            <FAQItem q="Do I need to connect all my accounts?" a="No. You choose which platforms to distribute to. Start with just Discord (zero auth needed — just a webhook URL) and expand as you're comfortable." />
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--coral)]/5 to-transparent" />
        <div className="hero-orb w-[600px] h-[600px] bg-[var(--coral)] opacity-[0.08] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <div className="reveal">
            <h2 className="font-[family-name:var(--font-d)] text-3xl md:text-5xl font-black mb-6 leading-tight">
              Ready to<span className="bg-gradient-to-r from-[var(--coral)] to-[var(--cyan)] bg-clip-text text-transparent"> Launch?</span>
            </h2>
            <p className="text-[var(--text-muted)] text-lg mb-10">
              Join <strong className="text-[var(--text)]">{waitlistCount !== null ? waitlistCount.toLocaleString() : "---"}</strong> developers who are ready to ship faster. Priority access + lifetime 50% discount.
            </p>
          </div>
          <div className="reveal reveal-d1"><EmailForm source="final_cta" buttonText="Join the Waitlist" /></div>
          <div className="reveal reveal-d2 mt-10 flex flex-wrap justify-center gap-4">
            <a href="#join" className="px-5 py-2.5 rounded-xl bg-[var(--coral)]/10 border border-[var(--coral)]/30 text-[var(--coral)] text-sm font-semibold hover:bg-[var(--coral)]/20 transition-all" onClick={() => trackCTA("register_cta", "final")}>Register for Free</a>
            <a href="#join" className="px-5 py-2.5 rounded-xl bg-[var(--cyan-dim)] border border-[var(--cyan)]/30 text-[var(--cyan)] text-sm font-semibold hover:bg-[var(--cyan-mid)] transition-all" onClick={() => trackCTA("presale_cta", "final")}>Join Pre-Sale — $9/mo</a>
            <a href="#join" className="px-5 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-light)] text-[var(--text-muted)] text-sm font-semibold hover:border-[var(--text-muted)] transition-all" onClick={() => trackCTA("waitlist_cta", "final")}>Waitlist Only</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[var(--border)] py-12">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[var(--coral)] to-[var(--cyan)] flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2L4 10h5v8h6v-8h5L12 2z" /></svg>
            </div>
            <span className="font-[family-name:var(--font-d)] font-bold text-sm">Blastoff</span>
            <span className="text-[var(--text-dim)] text-xs ml-2">© 2026</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-[var(--text-muted)]">
            <a href="#" className="hover:text-[var(--text)] transition-colors">Docs</a>
            <a href="#" className="hover:text-[var(--text)] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[var(--text)] transition-colors">Terms</a>
            <a href="#" className="hover:text-[var(--text)] transition-colors">Twitter</a>
            <a href="#" className="hover:text-[var(--text)] transition-colors">GitHub</a>
            <a href="/admin" className="hover:text-[var(--text)] transition-colors">Admin</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
