"use client";

import { useState, useEffect } from "react";

interface DashboardStats {
  total_waitlist: number;
  total_visits: number;
  total_clicks: number;
  today_waitlist: number;
  today_visits: number;
  today_clicks: number;
  conversion_rate: number;
}

interface Signup {
  uid: string;
  uemail: string;
  uname: string | null;
  usource: string;
  uposition: number;
  ureferral_count: number;
  ucreated_at: string;
}

interface Trend {
  tdate: string;
  tvisits: number;
  tclicks: number;
  tsignups: number;
}

export default function AdminPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [signups, setSignups] = useState<Signup[]>([]);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats(data.stats);
        setSignups(data.recent_signups || []);
        setTrends(data.trends || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const refresh = () => {
    setLoading(true);
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats(data.stats);
        setSignups(data.recent_signups || []);
        setTrends(data.trends || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="text-[var(--text-muted)] font-[var(--font-body)]">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] font-[var(--font-body)]">
      {/* Header */}
      <div className="border-b border-[var(--border)] px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--coral)] to-[var(--cyan)] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2L4 10h5v8h6v-8h5L12 2z" /></svg>
          </div>
          <h1 className="font-[family-name:var(--font-d)] font-bold text-xl">Blastoff Admin</h1>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={refresh} className="px-4 py-2 rounded-lg border border-[var(--border-light)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--text-muted)] transition-all text-sm cursor-pointer">
            Refresh
          </button>
          <a href="/" className="px-4 py-2 rounded-lg bg-[var(--coral)] text-white text-sm font-semibold hover:bg-[var(--coral-hover)] transition-all">
            View Landing Page
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Waitlist", value: stats?.total_waitlist ?? 0, today: stats?.today_waitlist ?? 0, color: "var(--coral)" },
            { label: "Total Visits", value: stats?.total_visits ?? 0, today: stats?.today_visits ?? 0, color: "var(--cyan)" },
            { label: "CTA Clicks", value: stats?.total_clicks ?? 0, today: stats?.today_clicks ?? 0, color: "var(--purple)" },
            { label: "Conversion Rate", value: `${stats?.conversion_rate ?? 0}%`, today: null, color: "var(--green)" },
          ].map((card, i) => (
            <div key={i} className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-5">
              <p className="text-[var(--text-muted)] text-xs uppercase tracking-wider mb-2">{card.label}</p>
              <p className="text-2xl font-bold" style={{ color: card.color }}>{typeof card.value === "number" ? card.value.toLocaleString() : card.value}</p>
              {card.today !== null && <p className="text-xs text-[var(--text-dim)] mt-1">+{card.today} today</p>}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Trends Chart */}
          <div className="lg:col-span-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-6">
            <h2 className="font-[family-name:var(--font-d)] font-bold text-lg mb-4">Daily Trends (Last 14 Days)</h2>
            <div className="space-y-2">
              {trends.length === 0 ? (
                <p className="text-[var(--text-muted)] text-sm">No data yet. Data will appear as visitors arrive.</p>
              ) : (
                trends.slice().reverse().map((t) => {
                  const maxVisits = Math.max(...trends.map((x) => x.tvisits), 1);
                  const visitWidth = (t.tvisits / maxVisits) * 100;
                  const signupWidth = t.tsignups > 0 ? (t.tsignups / Math.max(...trends.map((x) => x.tsignups), 1)) * 100 : 0;
                  return (
                    <div key={t.tdate} className="flex items-center gap-3 text-sm">
                      <span className="text-[var(--text-dim)] w-20 shrink-0 font-mono text-xs">{t.tdate.slice(5)}</span>
                      <div className="flex-1 flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <div className="h-2 rounded-full bg-[var(--cyan)]" style={{ width: `${Math.max(visitWidth, 2)}%` }} />
                          <span className="text-[var(--text-muted)] text-xs w-8">{t.tvisits}</span>
                        </div>
                        {t.tsignups > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="h-2 rounded-full bg-[var(--coral)]" style={{ width: `${Math.max(signupWidth, 4)}%` }} />
                            <span className="text-[var(--coral)] text-xs w-8">{t.tsignups}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-[var(--text-dim)] text-xs w-16 text-right">{t.tclicks} clicks</span>
                    </div>
                  );
                })
              )}
            </div>
            <div className="flex items-center gap-6 mt-4 text-xs text-[var(--text-dim)]">
              <span className="flex items-center gap-1"><span className="w-3 h-1 rounded-full bg-[var(--cyan)] inline-block" /> Visits</span>
              <span className="flex items-center gap-1"><span className="w-3 h-1 rounded-full bg-[var(--coral)] inline-block" /> Signups</span>
            </div>
          </div>

          {/* Recent Signups */}
          <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-6">
            <h2 className="font-[family-name:var(--font-d)] font-bold text-lg mb-4">Recent Signups</h2>
            {signups.length === 0 ? (
              <p className="text-[var(--text-muted)] text-sm">No signups yet.</p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {signups.map((s) => (
                  <div key={s.uid} className="flex items-start gap-3 p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                    <div className="w-8 h-8 rounded-full bg-[var(--coral-dim)] flex items-center justify-center text-[var(--coral)] text-xs font-bold shrink-0">
                      #{s.uposition}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{s.uemail}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-dim)]">
                        <span>{s.usource}</span>
                        {s.ureferral_count > 0 && <span className="text-[var(--cyan)]">{s.ureferral_count} referrals</span>}
                        <span>{new Date(s.ucreated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
