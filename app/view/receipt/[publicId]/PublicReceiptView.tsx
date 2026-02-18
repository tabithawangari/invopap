// app/view/receipt/[publicId]/PublicReceiptView.tsx — Client-side public receipt viewer
"use client";

import { useState, useCallback } from "react";
import { formatDate, formatNumber, getCurrency } from "@/lib/utils/format";
import { PaymentModal } from "@/components/PaymentModal";

interface ReceiptData {
  id: string;
  publicId: string;
  receiptNumber: string;
  documentTitle: string;
  accentColor: string;
  fromName: string;
  fromEmail: string | null;
  fromPhone: string | null;
  fromAddress: string | null;
  fromCity: string | null;
  fromZipCode: string | null;
  fromBusinessNumber: string | null;
  toName: string;
  toEmail: string | null;
  toPhone: string | null;
  toAddress: string | null;
  toCity: string | null;
  toZipCode: string | null;
  toBusinessNumber: string | null;
  issueDate: string;
  currency: string;
  totalAmountOwed: number;
  amountReceived: number;
  outstandingBalance: number;
  amountInWords: string | null;
  beingPaymentOf: string | null;
  paymentMethod: string;
  transactionCode: string | null;
  notes: string | null;
  isPaid: boolean;
  logoDataUrl: string | null;
  signatureDataUrl: string | null;
  photos: Array<{ id: string; url: string }>;
}

export function PublicReceiptView({
  receipt: r,
}: {
  receipt: ReceiptData;
}) {
  const [showPayment, setShowPayment] = useState(false);
  const accent = r.accentColor || "#4c1d95";
  const currencyInfo = getCurrency(r.currency);

  const handleDownload = useCallback(() => {
    if (!r.isPaid) {
      setShowPayment(true);
      return;
    }
    window.location.href = `/api/documents/download-receipt/${r.publicId}`;
  }, [r.isPaid, r.publicId]);

  const handlePaymentSuccess = useCallback(() => {
    setShowPayment(false);
    window.location.href = `/api/documents/download-receipt/${r.publicId}`;
  }, [r.publicId]);

  return (
    <div className="min-h-screen bg-mist/30">
      {/* Top bar */}
      <header className="bg-white border-b border-mist">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-6 py-4">
          <span className="text-lg font-display font-bold text-lagoon">
            Invopap
          </span>
          <button
            onClick={handleDownload}
            className="rounded-lg bg-ember px-4 py-2 text-sm font-medium text-white hover:bg-ember/90 transition-colors flex items-center gap-2"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            {r.isPaid ? "Download PDF" : "Download PDF (KSh 10)"}
          </button>
        </div>
      </header>

      {/* Receipt */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="relative bg-white rounded-xl shadow-soft border border-mist overflow-hidden">
          {/* Watermark if unpaid */}
          {!r.isPaid && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 overflow-hidden">
              <div
                className="text-6xl sm:text-7xl font-bold text-ink/[0.04] whitespace-nowrap select-none"
                style={{ transform: "rotate(-30deg)" }}
              >
                PREVIEW
              </div>
            </div>
          )}

          <div className="relative z-0">
            {/* Title banner */}
            <div
              className="px-6 sm:px-8 py-1 text-center"
              style={{ backgroundColor: accent }}
            >
              <span className="text-xs font-bold text-white uppercase tracking-widest">
                {r.documentTitle || "Official Receipt"}
              </span>
            </div>

            {/* Company header */}
            <div
              className="px-6 sm:px-8 py-5 text-center text-white"
              style={{ backgroundColor: `${accent}dd` }}
            >
              <div className="flex items-center justify-center gap-4">
                {r.logoDataUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.logoDataUrl}
                    alt="Logo"
                    className="h-12 w-auto object-contain"
                  />
                )}
                <div>
                  <h1 className="text-xl sm:text-2xl font-display font-bold uppercase">
                    {r.fromName || "Business Name"}
                  </h1>
                  <div className="text-xs text-white/80 mt-1 space-x-2">
                    {r.fromPhone && <span>Tel: {r.fromPhone}</span>}
                    {r.fromEmail && <span>Email: {r.fromEmail}</span>}
                  </div>
                  {r.fromAddress && (
                    <p className="text-xs text-white/70 mt-0.5">
                      {r.fromAddress}
                      {r.fromCity && `, ${r.fromCity}`}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 sm:p-8 space-y-5">
              {/* Number + Date */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-ink/50 font-medium">No.</span>
                  <span className="text-lg font-bold text-ink ml-1">
                    {r.receiptNumber || "—"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm text-ink/50 font-medium">
                    Date:{" "}
                  </span>
                  <span className="text-sm font-medium text-ink">
                    {formatDate(r.issueDate)}
                  </span>
                </div>
              </div>

              {/* Receipt lines */}
              <div className="space-y-4">
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
                    {r.toName || ""}
                  </div>
                </div>

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
                    {r.amountInWords || "—"}
                  </div>
                </div>

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
                    {r.beingPaymentOf || "—"}
                  </div>
                </div>

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
                    {(r.outstandingBalance ?? 0) > 0 ? (
                      <span className="text-amber-700">
                        {currencyInfo.symbol}{" "}
                        {formatNumber(r.outstandingBalance)}
                      </span>
                    ) : (
                      <span className="text-green-700">Nil</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Amount box + Payment method + Signature */}
              <div className="flex items-end justify-between gap-4 pt-3">
                <div>
                  <div
                    className="inline-flex items-baseline gap-2 border-2 rounded-lg px-4 py-2"
                    style={{ borderColor: accent }}
                  >
                    <span
                      className="text-sm italic font-medium"
                      style={{ color: accent }}
                    >
                      {currencyInfo.symbol}
                    </span>
                    <span className="text-xl font-bold text-ink">
                      {formatNumber(r.amountReceived)}
                    </span>
                  </div>
                </div>

                {/* Payment method */}
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
                          r.paymentMethod === m
                            ? "font-bold"
                            : "text-ink/30 border-ink/10"
                        }`}
                        style={
                          r.paymentMethod === m
                            ? { borderColor: accent, color: accent }
                            : undefined
                        }
                      >
                        {r.paymentMethod === m ? "☑" : "☐"}{" "}
                        {m === "mpesa"
                          ? "M-Pesa"
                          : m.charAt(0).toUpperCase() + m.slice(1)}
                      </span>
                    ))}
                  </div>
                  {r.transactionCode &&
                    (r.paymentMethod === "mpesa" ||
                      r.paymentMethod === "bank") && (
                      <p className="text-[10px] text-ink/50 mt-1 font-mono">
                        Ref: {r.transactionCode}
                      </p>
                    )}
                </div>

                {/* Signature */}
                <div className="text-center">
                  {r.signatureDataUrl ? (
                    <div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={r.signatureDataUrl}
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
              {r.notes && (
                <div className="text-sm text-ink/60 border-t border-mist pt-4">
                  <p className="font-semibold text-ink/40 text-xs uppercase tracking-wider mb-1">
                    Notes
                  </p>
                  <p className="whitespace-pre-wrap">{r.notes}</p>
                </div>
              )}

              {/* Photos */}
              {r.photos.length > 0 && (
                <div className="space-y-2 border-t border-mist pt-4">
                  <p className="text-xs font-semibold text-ink/40 uppercase tracking-wider">
                    Attachments
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {r.photos.map((photo) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={photo.id}
                        src={photo.url}
                        alt="Attachment"
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

        {/* Footer */}
        <div className="text-center py-6">
          <p className="text-xs text-ink/30">
            Created with{" "}
            <a
              href="/"
              className="text-lagoon hover:underline"
              target="_blank"
            >
              Invopap
            </a>
          </p>
        </div>
      </div>

      {/* Payment modal */}
      {showPayment && (
        <PaymentModal
          publicId={r.publicId}
          onClose={() => setShowPayment(false)}
          onSuccess={handlePaymentSuccess}
          documentType="RECEIPT"
        />
      )}
    </div>
  );
}
