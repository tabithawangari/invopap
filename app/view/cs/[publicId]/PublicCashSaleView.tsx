// app/view/cs/[publicId]/PublicCashSaleView.tsx — Client-side public cash sale viewer
"use client";

import { useState, useCallback } from "react";
import { formatDate, formatCurrency } from "@/lib/utils/format";
import { PaymentModal } from "@/components/PaymentModal";
import { ShareModal } from "@/components/ShareModal";

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  mpesa: "M-Pesa",
  bank: "Bank Transfer",
  card: "Card",
};

interface CashSaleData {
  id: string;
  publicId: string;
  cashSaleNumber: string;
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
  issueDate: string;
  orderNumber: string | null;
  referenceInvoiceNumber: string | null;
  paymentMethod: string;
  transactionCode: string | null;
  currency: string;
  taxRate: number;
  discountType: string;
  discountValue: number;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
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

export function PublicCashSaleView({
  cashSale: cs,
}: {
  cashSale: CashSaleData;
}) {
  const [showPayment, setShowPayment] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const accent = cs.accentColor || "#22c55e";
  const isGuest = !cs.userId;

  const handleDownload = useCallback(() => {
    if (!cs.isPaid) {
      setShowPayment(true);
      return;
    }
    // Paid — show share options
    setShowShare(true);
  }, [cs.isPaid]);

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
            {cs.isPaid ? "Download / Share" : "Download PDF (KSh 10)"}
          </button>
        </div>
      </header>

      {/* Cash Sale */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="relative bg-white rounded-xl shadow-soft border border-mist overflow-hidden">
          {/* Watermark if unpaid */}
          {!cs.isPaid && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 overflow-hidden">
              <div
                className="text-6xl sm:text-7xl font-bold text-ink/[0.04] whitespace-nowrap select-none"
                style={{ transform: "rotate(-30deg)" }}
              >
                PREVIEW
              </div>
            </div>
          )}

          <div className="relative z-0 p-6 sm:p-8 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                {cs.logoDataUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cs.logoDataUrl}
                    alt="Logo"
                    className="h-12 w-auto object-contain"
                  />
                )}
                <h1
                  className="text-2xl font-display font-bold"
                  style={{ color: accent }}
                >
                  {cs.documentTitle || "CASH SALE"}
                </h1>
              </div>
              <div className="text-right text-sm text-ink/60">
                <p className="font-medium text-ink">
                  {cs.cashSaleNumber || "—"}
                </p>
                <p>Date: {formatDate(cs.issueDate)}</p>
                {cs.orderNumber && <p>Order: {cs.orderNumber}</p>}
                {cs.referenceInvoiceNumber && (
                  <p>Invoice: {cs.referenceInvoiceNumber}</p>
                )}
              </div>
            </div>

            {/* From / Sold To */}
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-wider mb-1"
                  style={{ color: accent }}
                >
                  From
                </p>
                <PartyBlock
                  name={cs.fromName}
                  email={cs.fromEmail}
                  phone={cs.fromPhone}
                  mobile={cs.fromMobile}
                  fax={cs.fromFax}
                  address={cs.fromAddress}
                  city={cs.fromCity}
                  zipCode={cs.fromZipCode}
                  businessNumber={cs.fromBusinessNumber}
                />
              </div>
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-wider mb-1"
                  style={{ color: accent }}
                >
                  Sold To
                </p>
                <PartyBlock
                  name={cs.toName}
                  email={cs.toEmail}
                  phone={cs.toPhone}
                  mobile={cs.toMobile}
                  fax={cs.toFax}
                  address={cs.toAddress}
                  city={cs.toCity}
                  zipCode={cs.toZipCode}
                  businessNumber={cs.toBusinessNumber}
                />
              </div>
            </div>

            {/* Line items table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: accent }}>
                    <th className="px-3 py-2 text-left text-white font-medium rounded-tl-lg">
                      Description
                    </th>
                    <th className="px-3 py-2 text-right text-white font-medium">
                      Qty
                    </th>
                    <th className="px-3 py-2 text-right text-white font-medium">
                      Rate
                    </th>
                    <th className="px-3 py-2 text-right text-white font-medium rounded-tr-lg">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cs.lineItems.map((item, i) => (
                    <tr
                      key={item.id}
                      className={i % 2 === 1 ? "bg-mist/30" : ""}
                    >
                      <td className="px-3 py-2">
                        <p className="text-ink">
                          {item.description || "—"}
                        </p>
                        {item.additionalDetails && (
                          <p className="text-ink/40 text-xs">
                            {item.additionalDetails}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right text-ink/70">
                        {item.quantity}
                      </td>
                      <td className="px-3 py-2 text-right text-ink/70">
                        {formatCurrency(item.rate, cs.currency)}
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-ink">
                        {formatCurrency(item.amount, cs.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-1 text-sm">
                <div className="flex justify-between text-ink/60">
                  <span>Subtotal</span>
                  <span>{formatCurrency(cs.subtotal, cs.currency)}</span>
                </div>

                {cs.discountAmount > 0 && (
                  <div className="flex justify-between text-ink/60">
                    <span>
                      Discount
                      {cs.discountType === "PERCENTAGE"
                        ? ` (${cs.discountValue}%)`
                        : ""}
                    </span>
                    <span className="text-green-600">
                      -{formatCurrency(cs.discountAmount, cs.currency)}
                    </span>
                  </div>
                )}

                {cs.taxAmount > 0 && (
                  <div className="flex justify-between text-ink/60">
                    <span>Tax ({cs.taxRate}%)</span>
                    <span>
                      {formatCurrency(cs.taxAmount, cs.currency)}
                    </span>
                  </div>
                )}

                <div
                  className="flex justify-between pt-2 border-t font-bold text-base"
                  style={{ borderColor: accent, color: accent }}
                >
                  <span>Total</span>
                  <span>
                    {formatCurrency(cs.total, cs.currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div
              className="rounded-lg px-4 py-3 text-sm font-medium flex items-center justify-between"
              style={{
                backgroundColor: `${accent}15`,
                borderLeft: `4px solid ${accent}`,
              }}
            >
              <span className="text-ink/70">Payment Method</span>
              <span style={{ color: accent }} className="font-bold">
                {PAYMENT_METHOD_LABELS[cs.paymentMethod] || cs.paymentMethod}
                {cs.transactionCode && (
                  <span className="ml-2 text-ink/50 font-normal text-xs">
                    Ref: {cs.transactionCode}
                  </span>
                )}
              </span>
            </div>

            {/* Notes */}
            {cs.notes && (
              <div className="text-sm text-ink/60 border-t border-mist pt-4">
                <p className="font-semibold text-ink/40 text-xs uppercase tracking-wider mb-1">
                  Notes
                </p>
                <p className="whitespace-pre-wrap">{cs.notes}</p>
              </div>
            )}

            {/* Signature */}
            {cs.signatureDataUrl && (
              <div className="flex justify-end pt-4">
                <div className="text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cs.signatureDataUrl}
                    alt="Signature"
                    className="h-16 w-auto object-contain"
                  />
                  <div className="border-t border-ink/20 mt-1 pt-1">
                    <p className="text-xs text-ink/40">Authorized Signature</p>
                  </div>
                </div>
              </div>
            )}

            {/* Photos */}
            {cs.photos.length > 0 && (
              <div className="space-y-2 border-t border-mist pt-4">
                <p className="text-xs font-semibold text-ink/40 uppercase tracking-wider">
                  Attachments
                </p>
                <div className="flex flex-wrap gap-2">
                  {cs.photos.map((photo) => (
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
          publicId={cs.publicId}
          onClose={() => setShowPayment(false)}
          onSuccess={handlePaymentSuccess}
          documentType="CASH_SALE"
        />
      )}

      {/* Share modal */}
      {showShare && (
        <ShareModal
          publicId={cs.publicId}
          documentNumber={cs.cashSaleNumber}
          documentType="cash-sale"
          downloadUrl={`/api/documents/download-cs/${cs.publicId}`}
          onClose={() => setShowShare(false)}
          isGuest={isGuest}
        />
      )}
    </div>
  );
}

function PartyBlock({
  name,
  email,
  phone,
  mobile,
  fax,
  address,
  city,
  zipCode,
  businessNumber,
}: {
  name: string;
  email: string | null;
  phone: string | null;
  mobile?: string | null;
  fax?: string | null;
  address: string | null;
  city: string | null;
  zipCode: string | null;
  businessNumber: string | null;
}) {
  const hasContent = name || email || phone || address;

  if (!hasContent) {
    return <p className="text-ink/30 italic">Not specified</p>;
  }

  return (
    <div className="space-y-0.5 text-ink/70">
      {name && <p className="font-medium text-ink">{name}</p>}
      {email && <p>{email}</p>}
      {phone && <p>{phone}</p>}
      {mobile && <p>{mobile}</p>}
      {fax && <p className="text-ink/50">Fax: {fax}</p>}
      {address && <p>{address}</p>}
      {(city || zipCode) && (
        <p>
          {city}
          {city && zipCode && ", "}
          {zipCode}
        </p>
      )}
      {businessNumber && (
        <p className="text-xs text-ink/40">PIN: {businessNumber}</p>
      )}
    </div>
  );
}
