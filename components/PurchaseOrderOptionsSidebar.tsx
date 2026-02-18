// components/PurchaseOrderOptionsSidebar.tsx — Right sidebar for PO: type, accent color, currency, tax
"use client";

import { usePurchaseOrderStore } from "@/lib/store/purchaseOrderStore";
import { ACCENT_COLORS } from "@/lib/store/invoiceStore";
import { CURRENCIES } from "@/lib/utils/format";

export interface PurchaseOrderOptionsSidebarProps {
  onDownload: () => void;
  onNew: () => void;
  saving: boolean;
}

export function PurchaseOrderOptionsSidebar({
  onDownload,
  onNew,
  saving,
}: PurchaseOrderOptionsSidebarProps) {
  const { accentColor, currency, taxRate, setField, setCurrency, setAccentColor } =
    usePurchaseOrderStore();

  return (
    <div className="space-y-5 p-4 bg-white rounded-xl border border-mist">
      {/* ─── Actions ─── */}
      <div className="flex flex-col gap-2">
        <button
          onClick={onDownload}
          disabled={saving}
          className="rounded-lg bg-ember px-4 py-3 text-sm font-medium text-white hover:bg-ember/90 transition-colors flex items-center justify-center gap-2 touch-target"
        >
          {saving ? (
            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
          Download PDF
        </button>

        <button
          onClick={onNew}
          className="rounded-lg border border-mist px-4 py-2.5 text-sm text-ink/50 hover:bg-mist/50 transition-colors touch-target"
        >
          + New Document
        </button>
      </div>

      <hr className="border-mist" />

      {/* ─── Accent Color ─── */}
      <Section title="Template">
        <div className="flex flex-wrap gap-2">
          {ACCENT_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => setAccentColor(color)}
              className={`h-8 w-8 sm:h-7 sm:w-7 rounded-full border-2 transition-all touch-target flex items-center justify-center ${
                accentColor === color
                  ? "border-ink scale-110 ring-2 ring-offset-2 ring-ink/10"
                  : "border-transparent hover:scale-105"
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </Section>

      {/* ─── Currency ─── */}
      <Section title="Currency">
        <select
          value={currency.code}
          onChange={(e) => {
            const c = CURRENCIES.find((c) => c.code === e.target.value);
            if (c) setCurrency(c);
          }}
          className="sidebar-select w-full"
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.code} ({c.symbol})
            </option>
          ))}
        </select>
      </Section>

      {/* ─── Tax Rate ─── */}
      <Section title="Tax Rate (%)">
        <input
          type="number"
          min={0}
          max={100}
          step="0.01"
          value={taxRate || ""}
          onChange={(e) =>
            setField("taxRate", parseFloat(e.target.value) || 0)
          }
          placeholder="0"
          className="sidebar-input w-full"
        />
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-ink/40">
        {title}
      </h3>
      {children}
    </div>
  );
}
