// app/admin/page.tsx — Admin dashboard page
"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils/format";

interface PlatformStats {
  totalInvoices: number;
  paidInvoices: number;
  totalRevenue: number;
  failedPayments: number;
  activeUsers: number;
  invoicesToday: number;
  paymentsToday: number;
}

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchStats = async (adminSecret: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${adminSecret}` },
      });
      if (!res.ok) {
        if (res.status === 401) {
          setError("Invalid admin secret");
          setAuthenticated(false);
          return;
        }
        throw new Error("Failed to fetch stats");
      }
      const data = await res.json();
      setStats(data);
      setAuthenticated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 30s when authenticated
  useEffect(() => {
    if (!authenticated || !secret) return;
    const interval = setInterval(() => fetchStats(secret), 30_000);
    return () => clearInterval(interval);
  }, [authenticated, secret]);

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-display font-bold text-white">
              Admin Dashboard
            </h1>
            <p className="text-sm text-white/40 mt-1">
              Enter your admin secret to continue
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchStats(secret);
            }}
            className="space-y-4"
          >
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Admin Secret"
              className="w-full rounded-lg bg-white/10 border border-white/10 px-4 py-3 text-white placeholder:text-white/30 focus:border-lagoon focus:outline-none focus:ring-1 focus:ring-lagoon/30"
              autoFocus
            />

            {error && (
              <p className="text-sm text-red-400 bg-red-900/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !secret}
              className="w-full rounded-lg bg-lagoon px-4 py-3 text-white font-medium hover:bg-lagoon/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Loading..." : "Access Dashboard"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen bg-ink text-white">
      <header className="border-b border-white/10">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-4">
          <h1 className="text-xl font-display font-bold text-lagoon">
            Invopap Admin
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => fetchStats(secret)}
              disabled={loading}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-white/60 hover:text-white hover:border-white/20 transition-colors"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
            <button
              onClick={() => {
                setAuthenticated(false);
                setSecret("");
                setStats(null);
              }}
              className="text-sm text-white/40 hover:text-white/60 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Today's highlights */}
        <div className="rounded-xl bg-lagoon/10 border border-lagoon/20 p-6">
          <h2 className="text-sm font-semibold text-lagoon uppercase tracking-wider mb-4">
            Today
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-3xl font-bold text-white">
                {stats.invoicesToday}
              </p>
              <p className="text-sm text-white/40">Documents created</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">
                {stats.paymentsToday}
              </p>
              <p className="text-sm text-white/40">Downloads paid</p>
            </div>
          </div>
        </div>

        {/* All-time stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatCard label="Total Documents" value={String(stats.totalInvoices)} />
          <StatCard label="Paid Downloads" value={String(stats.paidInvoices)} />
          <StatCard
            label="Total Revenue"
            value={formatCurrency(stats.totalRevenue, "KES")}
            accent="text-green-400"
          />
          <StatCard
            label="Failed Payments"
            value={String(stats.failedPayments)}
            accent={stats.failedPayments > 0 ? "text-red-400" : undefined}
          />
          <StatCard label="Active Users" value={String(stats.activeUsers)} />
          <StatCard
            label="Conversion Rate"
            value={
              stats.totalInvoices > 0
                ? `${((stats.paidInvoices / stats.totalInvoices) * 100).toFixed(1)}%`
                : "0%"
            }
          />
        </div>

        {/* Revenue breakdown */}
        <div className="rounded-xl bg-white/5 border border-white/10 p-6">
          <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4">
            Revenue Breakdown
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-white/60">Gross (paid downloads × KSh 10)</span>
              <span className="text-white font-medium">
                {formatCurrency(stats.totalRevenue, "KES")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">
                Potential (unpaid × KSh 10)
              </span>
              <span className="text-white/40">
                {formatCurrency(
                  (stats.totalInvoices - stats.paidInvoices) * 10,
                  "KES"
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-5">
      <p className="text-xs text-white/30 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${accent || "text-white"}`}>
        {value}
      </p>
    </div>
  );
}
