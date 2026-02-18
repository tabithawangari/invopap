// components/ReceiptPreview.tsx — Live read-only preview for official receipts
"use client";

import { useReceiptStore } from "@/lib/store/receiptStore";
import { formatDate, formatNumber } from "@/lib/utils/format";

export function ReceiptPreview() {
  const store = useReceiptStore();
  const accent = store.accentColor;
  const currencySymbol = store.currency.symbol;

  return (
    <div className="relative bg-white rounded-xl shadow-soft border border-mist overflow-hidden">
      {/* PREVIEW watermark overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 overflow-hidden">
        <div
          className="text-[80px] sm:text-[100px] font-bold text-ink/[0.04] whitespace-nowrap select-none tracking-widest"
          style={{ transform: "rotate(-30deg)" }}
        >
          PREVIEW
        </div>
      </div>

      {/* Content */}
      <div className="relative z-0">
        {/* ─── Header banner with accent color ─── */}
        <div
          className="px-6 sm:px-8 py-1 text-center"
          style={{ backgroundColor: accent }}
        >
          <span className="text-xs font-bold text-white uppercase tracking-widest">
            {store.documentTitle || "Official Receipt"}
          </span>
        </div>

        {/* ─── Company header ─── */}
        <div
          className="px-6 sm:px-8 py-5 text-center text-white"
          style={{ backgroundColor: `${accent}dd` }}
        >
          <div className="flex items-center justify-center gap-4">
            {store.logoDataUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={store.logoDataUrl}
                alt="Logo"
                className="h-12 w-auto object-contain"
              />
            )}
            <div>
              <h1 className="text-xl sm:text-2xl font-display font-bold uppercase">
                {store.from.name || "Your Business Name"}
              </h1>
              <div className="text-xs text-white/80 mt-1 space-x-2">
                {store.from.phone && <span>Tel: {store.from.phone}</span>}
                {store.from.email && <span>Email: {store.from.email}</span>}
              </div>
              {store.from.address && (
                <p className="text-xs text-white/70 mt-0.5">
                  {store.from.address}
                  {store.from.city && `, ${store.from.city}`}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ─── Receipt body ─── */}
        <div className="p-6 sm:p-8 space-y-5">
          {/* Number + Date row */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-ink/50 font-medium">No.</span>
              <span className="text-lg font-bold text-ink ml-1">
                {store.receiptNumber || "—"}
              </span>
            </div>
            <div className="text-right">
              <span className="text-sm text-ink/50 font-medium">Date: </span>
              <span className="text-sm font-medium text-ink">
                {formatDate(store.issueDate)}
              </span>
            </div>
          </div>

          {/* Divider lines with italicized labels — matching screenshot style */}
          <div className="space-y-4">
            {/* Received with thanks from */}
            <div className="flex items-baseline gap-2">
              <span
                className="text-sm italic font-medium shrink-0"
                style={{ color: accent }}
              >
                Received with thanks from
              </span>
              <div
                className="flex-1 border-b-2 pb-0.5 text-sm font-medium text-ink min-h-[1.5em]"
                style={{ borderColor: accent }}
              >
                {store.to.name || ""}
                {store.to.email && (
                  <span className="text-xs text-ink/40 ml-2">
                    ({store.to.email})
                  </span>
                )}
              </div>
            </div>

            {/* The sum of shillings */}
            <div className="flex items-baseline gap-2">
              <span
                className="text-sm italic font-medium shrink-0"
                style={{ color: accent }}
              >
                The sum of
              </span>
              <div
                className="flex-1 border-b-2 pb-0.5 text-sm italic text-ink/70 min-h-[1.5em]"
                style={{ borderColor: accent }}
              >
                {store.amountInWords || "—"}
              </div>
            </div>

            {/* Being payment of */}
            <div className="flex items-baseline gap-2">
              <span
                className="text-sm italic font-medium shrink-0"
                style={{ color: accent }}
              >
                Being payment of
              </span>
              <div
                className="flex-1 border-b-2 pb-0.5 text-sm text-ink/70 min-h-[1.5em]"
                style={{ borderColor: accent }}
              >
                {store.beingPaymentOf || "—"}
              </div>
            </div>

            {/* Outstanding balance */}
            <div className="flex items-baseline gap-2">
              <span
                className="text-sm italic font-medium shrink-0"
                style={{ color: accent }}
              >
                Outstanding balance
              </span>
              <div
                className="flex-1 border-b-2 pb-0.5 text-sm font-medium min-h-[1.5em]"
                style={{ borderColor: accent }}
              >
                {store.outstandingBalance > 0 ? (
                  <span className="text-amber-700">
                    {currencySymbol}{" "}
                    {formatNumber(store.outstandingBalance)}
                  </span>
                ) : (
                  <span className="text-green-700">Nil</span>
                )}
              </div>
            </div>
          </div>

          {/* Amount box + Payment method + Signature row */}
          <div className="flex items-end justify-between gap-4 pt-3">
            {/* Amount box */}
            <div>
              <div
                className="inline-flex items-baseline gap-2 border-2 rounded-lg px-4 py-2"
                style={{ borderColor: accent }}
              >
                <span
                  className="text-sm italic font-medium"
                  style={{ color: accent }}
                >
                  {currencySymbol}
                </span>
                <span className="text-xl font-bold text-ink">
                  {formatNumber(store.amountReceived)}
                </span>
              </div>
            </div>

            {/* Payment method indicator */}
            <div className="text-center">
              <p
                className="text-[10px] font-semibold uppercase tracking-wider mb-1"
                style={{ color: accent }}
              >
                Payment Method
              </p>
              <div className="flex gap-2 text-xs">
                {(["cash", "mpesa", "bank"] as const).map((m) => (
                  <span
                    key={m}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border ${
                      store.paymentMethod === m
                        ? "font-bold"
                        : "text-ink/30 border-ink/10"
                    }`}
                    style={
                      store.paymentMethod === m
                        ? { borderColor: accent, color: accent }
                        : undefined
                    }
                  >
                    {store.paymentMethod === m ? "☑" : "☐"}{" "}
                    {m === "mpesa" ? "M-Pesa" : m.charAt(0).toUpperCase() + m.slice(1)}
                  </span>
                ))}
              </div>
              {store.transactionCode && (store.paymentMethod === "mpesa" || store.paymentMethod === "bank") && (
                <p className="text-[10px] text-ink/50 mt-1 font-mono">
                  Ref: {store.transactionCode}
                </p>
              )}
            </div>

            {/* Signature */}
            <div className="text-center">
              {store.signatureDataUrl ? (
                <div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={store.signatureDataUrl}
                    alt="Signature"
                    className="h-12 w-auto object-contain mx-auto"
                  />
                  <div
                    className="border-t mt-1 pt-1 text-xs text-ink/40 w-24"
                    style={{ borderColor: accent }}
                  >
                    Sign.
                  </div>
                </div>
              ) : (
                <div>
                  <div
                    className="border-b w-24 mb-1"
                    style={{ borderColor: accent }}
                  >
                    &nbsp;
                  </div>
                  <p className="text-xs text-ink/30 italic">Sign.</p>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {store.notes && (
            <div className="text-sm text-ink/60 border-t border-mist pt-4">
              <p className="font-semibold text-ink/40 text-xs uppercase tracking-wider mb-1">
                Notes
              </p>
              <p className="whitespace-pre-wrap">{store.notes}</p>
            </div>
          )}

          {/* Photos */}
          {store.photoDataUrls.length > 0 && (
            <div className="space-y-2 border-t border-mist pt-4">
              <p className="text-xs font-semibold text-ink/40 uppercase tracking-wider">
                Attachments
              </p>
              <div className="flex flex-wrap gap-2">
                {store.photoDataUrls.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={url}
                    alt={`Attachment ${i + 1}`}
                    className="h-20 w-20 object-cover rounded-lg border border-mist"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Footer bar */}
          <div
            className="h-2 rounded-full mt-6"
            style={{ backgroundColor: accent }}
          />
        </div>
      </div>
    </div>
  );
}

