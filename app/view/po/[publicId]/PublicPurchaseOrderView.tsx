// app/view/po/[publicId]/PublicPurchaseOrderView.tsx — Client-side public purchase order viewer
"use client";

import { useState, useCallback } from "react";
import { formatDate, formatCurrency } from "@/lib/utils/format";
import { PaymentModal } from "@/components/PaymentModal";
import { ShareModal } from "@/components/ShareModal";

interface PurchaseOrderData {
  id: string;
  publicId: string;
  purchaseOrderNumber: string;
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
  fromWebsite: string | null;
  toName: string;
  toEmail: string | null;
  toPhone: string | null;
  toMobile: string | null;
  toFax: string | null;
  toAddress: string | null;
  toCity: string | null;
  toZipCode: string | null;
  toBusinessNumber: string | null;
  shipToEnabled: boolean;
  shipToName: string | null;
  shipToCompanyName: string | null;
  shipToAddress: string | null;
  shipToCity: string | null;
  shipToZipCode: string | null;
  shipToPhone: string | null;
  authorizedByName: string | null;
  authorizedByDesignation: string | null;
  issueDate: string;
  expectedDeliveryDate: string | null;
  paymentTerms: string | null;
  orderNumber: string | null;
  currency: string;
  taxRate: number;
  subtotal: number;
  taxAmount: number;
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
    unitPrice: number;
    amount: number;
  }>;
  photos: Array<{ id: string; url: string }>;
  userId: string | null;
}

export function PublicPurchaseOrderView({
  purchaseOrder: po,
}: {
  purchaseOrder: PurchaseOrderData;
}) {
  const [showPayment, setShowPayment] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const accent = po.accentColor || "#d97706";
  const isGuest = !po.userId;

  const handleDownload = useCallback(() => {
    if (!po.isPaid) {
      setShowPayment(true);
      return;
    }
    // Paid — show share options
    setShowShare(true);
  }, [po.isPaid]);

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
            {po.isPaid ? "Download / Share" : "Download PDF (KSh 10)"}
          </button>
        </div>
      </header>

      {/* Purchase Order */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="relative bg-white rounded-xl shadow-soft border border-mist overflow-hidden">
          {/* Watermark if unpaid */}
          {!po.isPaid && (
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
                {po.logoDataUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={po.logoDataUrl}
                    alt="Logo"
                    className="h-12 w-auto object-contain"
                  />
                )}
                <h1
                  className="text-2xl font-display font-bold"
                  style={{ color: accent }}
                >
                  {po.documentTitle || "PURCHASE ORDER"}
                </h1>
              </div>
              <div className="text-right text-sm text-ink/60">
                <p className="font-medium text-ink">
                  {po.purchaseOrderNumber || "—"}
                </p>
                <p>Date: {formatDate(po.issueDate)}</p>
                {po.expectedDeliveryDate && (
                  <p>Delivery: {formatDate(po.expectedDeliveryDate)}</p>
                )}
                {po.orderNumber && <p>Order: {po.orderNumber}</p>}
                {po.paymentTerms && <p>Terms: {po.paymentTerms}</p>}
              </div>
            </div>

            {/* From / Vendor / Ship To */}
            <div
              className={`grid gap-6 text-sm ${
                po.shipToEnabled ? "grid-cols-3" : "grid-cols-2"
              }`}
            >
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-wider mb-1"
                  style={{ color: accent }}
                >
                  From
                </p>
                <PartyBlock
                  name={po.fromName}
                  email={po.fromEmail}
                  phone={po.fromPhone}
                  mobile={po.fromMobile}
                  fax={po.fromFax}
                  address={po.fromAddress}
                  city={po.fromCity}
                  zipCode={po.fromZipCode}
                  businessNumber={po.fromBusinessNumber}
                />
                {po.fromWebsite && (
                  <p className="text-xs text-ink/40 mt-1">{po.fromWebsite}</p>
                )}
              </div>
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-wider mb-1"
                  style={{ color: accent }}
                >
                  Vendor
                </p>
                <PartyBlock
                  name={po.toName}
                  email={po.toEmail}
                  phone={po.toPhone}
                  mobile={po.toMobile}
                  fax={po.toFax}
                  address={po.toAddress}
                  city={po.toCity}
                  zipCode={po.toZipCode}
                  businessNumber={po.toBusinessNumber}
                />
              </div>
              {po.shipToEnabled && (
                <div>
                  <p
                    className="text-xs font-semibold uppercase tracking-wider mb-1"
                    style={{ color: accent }}
                  >
                    Ship To
                  </p>
                  <div className="space-y-0.5 text-ink/70">
                    {po.shipToName && (
                      <p className="font-medium text-ink">{po.shipToName}</p>
                    )}
                    {po.shipToCompanyName && <p>{po.shipToCompanyName}</p>}
                    {po.shipToAddress && <p>{po.shipToAddress}</p>}
                    {(po.shipToCity || po.shipToZipCode) && (
                      <p>
                        {po.shipToCity}
                        {po.shipToCity && po.shipToZipCode && ", "}
                        {po.shipToZipCode}
                      </p>
                    )}
                    {po.shipToPhone && <p>{po.shipToPhone}</p>}
                  </div>
                </div>
              )}
            </div>

            {/* Line items */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: accent }}>
                    <th className="px-3 py-2 text-left text-white font-medium rounded-tl-lg w-12">
                      #
                    </th>
                    <th className="px-3 py-2 text-left text-white font-medium">
                      Description
                    </th>
                    <th className="px-3 py-2 text-right text-white font-medium w-16">
                      Qty
                    </th>
                    <th className="px-3 py-2 text-right text-white font-medium w-28">
                      Unit Price
                    </th>
                    <th className="px-3 py-2 text-right text-white font-medium rounded-tr-lg w-28">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {po.lineItems.map((item, i) => (
                    <tr
                      key={item.id}
                      className={i % 2 === 1 ? "bg-mist/30" : ""}
                    >
                      <td className="px-3 py-2 text-ink/40">{i + 1}</td>
                      <td className="px-3 py-2">
                        <p className="text-ink">{item.description || "—"}</p>
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
                        {formatCurrency(item.unitPrice, po.currency)}
                      </td>
                      <td className="px-3 py-2 text-right font-medium">
                        {formatCurrency(item.amount, po.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink/50">Subtotal</span>
                  <span>{formatCurrency(po.subtotal, po.currency)}</span>
                </div>
                {po.taxRate > 0 && (
                  <div className="flex justify-between">
                    <span className="text-ink/50">Tax ({po.taxRate}%)</span>
                    <span>{formatCurrency(po.taxAmount, po.currency)}</span>
                  </div>
                )}
                <div
                  className="flex justify-between font-bold text-base pt-2 border-t border-mist"
                  style={{ color: accent }}
                >
                  <span>Total</span>
                  <span>{formatCurrency(po.total, po.currency)}</span>
                </div>
              </div>
            </div>

            {/* Authorized by */}
            {(po.authorizedByName || po.signatureDataUrl) && (
              <div className="flex justify-end pt-4 border-t border-mist">
                <div className="text-center">
                  {po.signatureDataUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={po.signatureDataUrl}
                      alt="Signature"
                      className="h-16 w-auto object-contain"
                    />
                  )}
                  <div className="border-t border-ink/20 mt-1 pt-1">
                    {po.authorizedByName && (
                      <p className="text-sm font-medium text-ink">
                        {po.authorizedByName}
                      </p>
                    )}
                    {po.authorizedByDesignation && (
                      <p className="text-xs text-ink/40">
                        {po.authorizedByDesignation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {po.notes && (
              <div className="text-sm text-ink/60 border-t border-mist pt-4">
                <p className="font-semibold text-ink/40 text-xs uppercase tracking-wider mb-1">
                  Notes
                </p>
                <p className="whitespace-pre-wrap">{po.notes}</p>
              </div>
            )}

            {/* Photos */}
            {po.photos.length > 0 && (
              <div className="space-y-2 border-t border-mist pt-4">
                <p className="text-xs font-semibold text-ink/40 uppercase tracking-wider">
                  Attachments
                </p>
                <div className="flex flex-wrap gap-2">
                  {po.photos.map((photo) => (
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
            <a href="/" className="text-lagoon hover:underline" target="_blank">
              Invopap
            </a>
          </p>
        </div>
      </div>

      {/* Payment modal */}
      {showPayment && (
        <PaymentModal
          publicId={po.publicId}
          onClose={() => setShowPayment(false)}
          onSuccess={handlePaymentSuccess}
          documentType="PURCHASE_ORDER"
        />
      )}

      {/* Share modal */}
      {showShare && (
        <ShareModal
          publicId={po.publicId}
          documentNumber={po.purchaseOrderNumber}
          documentType="purchase-order"
          downloadUrl={`/api/documents/download-po/${po.publicId}`}
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
      {fax && <p className="text-xs text-ink/40">Fax: {fax}</p>}
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
