// app/view/quotation/[publicId]/PublicQuotationView.tsx — Client-side public quotation viewer
"use client";

import { useState, useCallback } from "react";
import { formatDate, formatCurrency, getCurrency } from "@/lib/utils/format";
import { PaymentModal } from "@/components/PaymentModal";
import { ShareModal } from "@/components/ShareModal";

interface QuotationData {
  id: string;
  publicId: string;
  quotationNumber: string;
  documentTitle: string;
  accentColor: string;
  fromName: string;
  fromEmail: string | null;
  fromPhone: string | null;
  fromMobile: string | null;
  fromFax: string | null;
  fromAddress: string | null;
  fromCity: string | null;
  fromZipCode: string | null;
  fromBusinessNumber: string | null;
  toName: string;
  toEmail: string | null;
  toPhone: string | null;
  toMobile: string | null;
  toFax: string | null;
  toAddress: string | null;
  toCity: string | null;
  toZipCode: string | null;
  toBusinessNumber: string | null;
  quotationDate: string;
  validUntil: string | null;
  currency: string;
  discountType: string;
  discountValue: number;
  subtotal: number;
  discountAmount: number;
  total: number;
  termsAndConditions: string | null;
  notes: string | null;
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

export function PublicQuotationView({
  quotation: q,
}: {
  quotation: QuotationData;
}) {
  const [showPayment, setShowPayment] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const accent = q.accentColor || "#f97316";
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const currencyInfo = getCurrency(q.currency);
  const isGuest = !q.userId;

  const handleDownload = useCallback(() => {
    if (!q.isPaid) {
      setShowPayment(true);
      return;
    }
    // Paid — show share options
    setShowShare(true);
  }, [q.isPaid]);

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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {q.isPaid ? "Download / Share" : "Download PDF (KSh 10)"}
          </button>
        </div>
      </header>

      {/* Quotation */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="relative bg-white rounded-xl shadow-soft border border-mist overflow-hidden">
          {/* Watermark if unpaid */}
          {!q.isPaid && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 overflow-hidden">
              <div className="text-6xl sm:text-7xl font-bold text-ink/[0.04] whitespace-nowrap select-none"
                style={{ transform: "rotate(-30deg)" }}>
                PREVIEW
              </div>
            </div>
          )}

          <div className="relative z-0 p-6 sm:p-8 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                {q.logoDataUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={q.logoDataUrl} alt="Logo" className="h-12 w-auto object-contain" />
                )}
                <h1 className="text-2xl font-display font-bold" style={{ color: accent }}>
                  {q.documentTitle || "QUOTATION"}
                </h1>
              </div>
              <div className="text-right text-sm text-ink/60">
                <p className="font-medium text-ink">{q.quotationNumber || "—"}</p>
                <p>Date: {formatDate(q.quotationDate)}</p>
                {q.validUntil && <p>Valid Until: {formatDate(q.validUntil)}</p>}
              </div>
            </div>

            {/* Quotation by / Quotation to */}
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: accent }}>Quotation by</p>
                <PartyBlock name={q.fromName} email={q.fromEmail} phone={q.fromPhone}
                  mobile={q.fromMobile} fax={q.fromFax} address={q.fromAddress}
                  city={q.fromCity} zipCode={q.fromZipCode} businessNumber={q.fromBusinessNumber} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: accent }}>Quotation to</p>
                <PartyBlock name={q.toName} email={q.toEmail} phone={q.toPhone}
                  mobile={q.toMobile} fax={q.toFax} address={q.toAddress}
                  city={q.toCity} zipCode={q.toZipCode} businessNumber={q.toBusinessNumber} />
              </div>
            </div>

            {/* Line items table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: accent }}>
                    <th className="px-3 py-2 text-left text-white font-medium rounded-tl-lg">Item description</th>
                    <th className="px-3 py-2 text-right text-white font-medium">Qty</th>
                    <th className="px-3 py-2 text-right text-white font-medium">Rate</th>
                    <th className="px-3 py-2 text-right text-white font-medium rounded-tr-lg">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {q.lineItems.map((item, i) => (
                    <tr key={item.id} className={i % 2 === 1 ? "bg-mist/30" : ""}>
                      <td className="px-3 py-2">
                        <p className="text-ink">{item.description || "—"}</p>
                        {item.additionalDetails && (
                          <p className="text-ink/40 text-xs">{item.additionalDetails}</p>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right text-ink/70">{item.quantity}</td>
                      <td className="px-3 py-2 text-right text-ink/70">{formatCurrency(item.rate, q.currency)}</td>
                      <td className="px-3 py-2 text-right font-medium text-ink">{formatCurrency(item.amount, q.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals — NO TAX */}
            <div className="flex justify-end">
              <div className="w-64 space-y-1 text-sm">
                <div className="flex justify-between text-ink/60">
                  <span>Sub Total</span>
                  <span>{formatCurrency(q.subtotal, q.currency)}</span>
                </div>
                {q.discountAmount > 0 && (
                  <div className="flex justify-between text-ink/60">
                    <span>Discount{q.discountType === "PERCENTAGE" ? ` (${q.discountValue}%)` : ""}</span>
                    <span className="text-green-600">-{formatCurrency(q.discountAmount, q.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t font-bold text-base"
                  style={{ borderColor: accent, color: accent }}>
                  <span>Total</span>
                  <span>{formatCurrency(q.total, q.currency)}</span>
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            {q.termsAndConditions && (
              <div className="text-sm text-ink/60 border-t border-mist pt-4">
                <p className="font-semibold text-ink/40 text-xs uppercase tracking-wider mb-1">Terms and Conditions</p>
                <p className="whitespace-pre-wrap">{q.termsAndConditions}</p>
              </div>
            )}

            {/* Additional Notes */}
            {q.notes && (
              <div className="text-sm text-ink/60 border-t border-mist pt-4">
                <p className="font-semibold text-ink/40 text-xs uppercase tracking-wider mb-1">Additional Notes</p>
                <p className="whitespace-pre-wrap">{q.notes}</p>
              </div>
            )}

            {/* Signature */}
            {q.signatureDataUrl && (
              <div className="flex justify-end pt-4">
                <div className="text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={q.signatureDataUrl} alt="Signature" className="h-16 w-auto object-contain" />
                  <div className="border-t border-ink/20 mt-1 pt-1">
                    <p className="text-xs text-ink/40">Authorized Signature</p>
                  </div>
                </div>
              </div>
            )}

            {/* Photos */}
            {q.photos.length > 0 && (
              <div className="space-y-2 border-t border-mist pt-4">
                <p className="text-xs font-semibold text-ink/40 uppercase tracking-wider">Attachments</p>
                <div className="flex flex-wrap gap-2">
                  {q.photos.map((photo) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={photo.id} src={photo.url} alt="Attachment"
                      className="h-20 w-20 object-cover rounded-lg border border-mist" />
                  ))}
                </div>
              </div>
            )}

            {/* Footer bar */}
            <div className="h-2 rounded-full mt-6" style={{ backgroundColor: accent }} />
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-6">
          <p className="text-xs text-ink/30">
            Created with{" "}
            <a href="/" className="text-lagoon hover:underline" target="_blank">Invopap</a>
          </p>
        </div>
      </div>

      {/* Payment modal */}
      {showPayment && (
        <PaymentModal
          publicId={q.publicId}
          onClose={() => setShowPayment(false)}
          onSuccess={handlePaymentSuccess}
          documentType="QUOTATION"
        />
      )}

      {/* Share modal */}
      {showShare && (
        <ShareModal
          publicId={q.publicId}
          documentNumber={q.quotationNumber}
          documentType="quotation"
          downloadUrl={`/api/documents/download-quotation/${q.publicId}`}
          onClose={() => setShowShare(false)}
          isGuest={isGuest}
        />
      )}
    </div>
  );
}

function PartyBlock({
  name, email, phone, mobile, fax, address, city, zipCode, businessNumber,
}: {
  name: string; email: string | null; phone: string | null;
  mobile?: string | null; fax?: string | null;
  address: string | null; city: string | null;
  zipCode: string | null; businessNumber: string | null;
}) {
  const hasContent = name || email || phone || address;
  if (!hasContent) return <p className="text-ink/30 italic">Not specified</p>;

  return (
    <div className="space-y-0.5 text-ink/70">
      {name && <p className="font-medium text-ink">{name}</p>}
      {email && <p>{email}</p>}
      {phone && <p>{phone}</p>}
      {mobile && <p>{mobile}</p>}
      {fax && <p className="text-ink/50">Fax: {fax}</p>}
      {address && <p>{address}</p>}
      {(city || zipCode) && (
        <p>{city}{city && zipCode && ", "}{zipCode}</p>
      )}
      {businessNumber && <p className="text-xs text-ink/40">PIN: {businessNumber}</p>}
    </div>
  );
}
