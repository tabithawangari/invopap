// app/view/[publicId]/PublicInvoiceView.tsx — Client-side public invoice viewer
"use client";

import { useState, useCallback } from "react";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { PaymentModal } from "@/components/PaymentModal";
import { ShareModal } from "@/components/ShareModal";

interface InvoiceData {
  id: string;
  publicId: string;
  invoiceNumber: string;
  documentTitle: string;
  documentType: string;
  accentColor: string;
  currency: string;
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
  dueDate: string | null;
  notes: string | null;
  taxRate: number;
  discountType: string;
  discountValue: number;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  isPaid: boolean;
  logoDataUrl: string | null;
  signatureDataUrl: string | null;
  lineItems: Array<{
    id: string;
    description: string;
    additionalDetails: string | null;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  photos: Array<{ id: string; url: string }>;
  userId: string | null;
}

export function PublicInvoiceView({ invoice }: { invoice: InvoiceData }) {
  const [showPayment, setShowPayment] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const accent = invoice.accentColor || "#1f8ea3";
  const isGuest = !invoice.userId;

  const handleDownload = useCallback(() => {
    if (!invoice.isPaid) {
      setShowPayment(true);
      return;
    }
    // Paid — show share options
    setShowShare(true);
  }, [invoice.isPaid]);

  const handlePaymentSuccess = useCallback(() => {
    setShowPayment(false);
    // Show share modal after successful payment
    setShowShare(true);
  }, []);

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
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {invoice.isPaid ? "Download / Share" : "Download PDF (KSh 10)"}
          </button>
        </div>
      </header>

      {/* Invoice */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="relative bg-white rounded-xl shadow-soft border border-mist overflow-hidden">
          {/* Watermark if unpaid */}
          {!invoice.isPaid && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 overflow-hidden">
              <div
                className="text-6xl sm:text-7xl font-bold text-ink/[0.04] whitespace-nowrap select-none"
                style={{ transform: "rotate(-30deg)" }}
              >
                INVOPAP — PREVIEW
              </div>
            </div>
          )}

          <div className="relative z-0 p-6 sm:p-10 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                {invoice.logoDataUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={invoice.logoDataUrl}
                    alt="Logo"
                    className="h-14 w-auto object-contain"
                  />
                )}
                <h1
                  className="text-2xl font-display font-bold"
                  style={{ color: accent }}
                >
                  {invoice.documentTitle}
                </h1>
              </div>
              <div className="text-right text-sm text-ink/60">
                <p className="font-medium text-ink">{invoice.invoiceNumber}</p>
                <p>Issued: {formatDate(invoice.issueDate)}</p>
                <p>Due: {invoice.dueDate ? formatDate(invoice.dueDate) : "—"}</p>
              </div>
            </div>

            {/* From / To */}
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: accent }}>
                  From
                </p>
                <PartyBlock
                  name={invoice.fromName}
                  email={invoice.fromEmail}
                  phone={invoice.fromPhone}
                  address={invoice.fromAddress}
                  city={invoice.fromCity}
                  zipCode={invoice.fromZipCode}
                  businessNumber={invoice.fromBusinessNumber}
                />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: accent }}>
                  To
                </p>
                <PartyBlock
                  name={invoice.toName}
                  email={invoice.toEmail}
                  phone={invoice.toPhone}
                  address={invoice.toAddress}
                  city={invoice.toCity}
                  zipCode={invoice.toZipCode}
                  businessNumber={invoice.toBusinessNumber}
                />
              </div>
            </div>

            {/* Line items */}
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: accent }}>
                  <th className="px-3 py-2 text-left text-white font-medium rounded-tl-lg">Description</th>
                  <th className="px-3 py-2 text-right text-white font-medium">Qty</th>
                  <th className="px-3 py-2 text-right text-white font-medium">Rate</th>
                  <th className="px-3 py-2 text-right text-white font-medium rounded-tr-lg">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map((item, i) => (
                  <tr key={item.id} className={i % 2 === 1 ? "bg-mist/30" : ""}>
                    <td className="px-3 py-2">
                      <p className="text-ink">{item.description || "—"}</p>
                      {item.additionalDetails && (
                        <p className="text-ink/40 text-xs">{item.additionalDetails}</p>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right text-ink/70">{item.quantity}</td>
                    <td className="px-3 py-2 text-right text-ink/70">
                      {formatCurrency(item.rate, invoice.currency)}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-ink">
                      {formatCurrency(item.quantity * item.rate, invoice.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-1 text-sm">
                <div className="flex justify-between text-ink/60">
                  <span>Subtotal</span>
                  <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
                </div>
                {invoice.discountAmount > 0 && (
                  <div className="flex justify-between text-ink/60">
                    <span>Discount</span>
                    <span className="text-green-600">
                      -{formatCurrency(invoice.discountAmount, invoice.currency)}
                    </span>
                  </div>
                )}
                {invoice.taxAmount > 0 && (
                  <div className="flex justify-between text-ink/60">
                    <span>Tax ({invoice.taxRate}%)</span>
                    <span>{formatCurrency(invoice.taxAmount, invoice.currency)}</span>
                  </div>
                )}
                <div
                  className="flex justify-between pt-2 border-t font-bold text-base"
                  style={{ borderColor: accent, color: accent }}
                >
                  <span>Total</span>
                  <span>{formatCurrency(invoice.total, invoice.currency)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="text-sm text-ink/60 border-t border-mist pt-4">
                <p className="font-semibold text-ink/40 text-xs uppercase tracking-wider mb-1">Notes</p>
                <p className="whitespace-pre-wrap">{invoice.notes}</p>
              </div>
            )}

            {/* Signature */}
            {invoice.signatureDataUrl && (
              <div className="flex justify-end pt-4">
                <div className="text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={invoice.signatureDataUrl} alt="Signature" className="h-16 w-auto object-contain" />
                  <div className="border-t border-ink/20 mt-1 pt-1">
                    <p className="text-xs text-ink/40">Authorized Signature</p>
                  </div>
                </div>
              </div>
            )}

            {/* Photos */}
            {invoice.photos && invoice.photos.length > 0 && (
              <div className="border-t border-mist pt-4 space-y-2">
                <p className="text-xs font-semibold text-ink/40 uppercase tracking-wider">Attachments</p>
                <div className="flex flex-wrap gap-2">
                  {invoice.photos.map((photo, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={photo.id}
                      src={photo.url}
                      alt={`Attachment ${i + 1}`}
                      className="h-20 w-20 object-cover rounded-lg border border-mist"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Footer bar */}
            <div className="h-2 rounded-full mt-6" style={{ backgroundColor: accent }} />
          </div>
        </div>

        {/* Footer links */}
        <div className="text-center text-xs text-ink/30 py-6">
          Powered by{" "}
          <a href="/" className="text-lagoon hover:underline">
            Invopap
          </a>{" "}
          · <a href="/terms" className="hover:underline">Terms</a>{" "}
          · <a href="/privacy" className="hover:underline">Privacy</a>
        </div>
      </div>

      {/* Payment modal */}
      {showPayment && (
        <PaymentModal
          publicId={invoice.publicId}
          onClose={() => setShowPayment(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Share modal */}
      {showShare && (
        <ShareModal
          publicId={invoice.publicId}
          documentNumber={invoice.invoiceNumber}
          documentType="invoice"
          downloadUrl={`/api/documents/download/${invoice.publicId}`}
          onClose={() => setShowShare(false)}
          isGuest={isGuest}
        />
      )}
    </div>
  );
}

function PartyBlock({
  name, email, phone, address, city, zipCode, businessNumber,
}: {
  name: string; email: string | null; phone: string | null; address: string | null;
  city: string | null; zipCode: string | null; businessNumber: string | null;
}) {
  if (!name && !email && !phone && !address) {
    return <p className="text-ink/30 italic">Not specified</p>;
  }

  return (
    <div className="space-y-0.5 text-ink/70">
      {name && <p className="font-medium text-ink">{name}</p>}
      {email && <p>{email}</p>}
      {phone && <p>{phone}</p>}
      {address && <p>{address}</p>}
      {(city || zipCode) && (
        <p>{city}{city && zipCode && ", "}{zipCode}</p>
      )}
      {businessNumber && (
        <p className="text-xs text-ink/40">PIN: {businessNumber}</p>
      )}
    </div>
  );
}
