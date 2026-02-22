// app/view/dn/[publicId]/PublicDeliveryNoteView.tsx — Client-side public delivery note viewer
"use client";

import { useState, useCallback } from "react";
import { formatDate } from "@/lib/utils/format";
import { PaymentModal } from "@/components/PaymentModal";
import { ShareModal } from "@/components/ShareModal";

interface DeliveryNoteData {
  id: string;
  publicId: string;
  deliveryNoteNumber: string;
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
  orderNumber: string | null;
  referenceInvoiceNumber: string | null;
  acknowledgmentText: string | null;
  notes: string | null;
  isPaid: boolean;
  logoDataUrl: string | null;
  signatureDataUrl: string | null;
  lineItems: Array<{
    id: string;
    description: string;
    additionalDetails: string | null;
    quantity: number;
  }>;
  photos: Array<{ id: string; url: string }>;
  userId: string | null;
}

export function PublicDeliveryNoteView({
  deliveryNote: dn,
}: {
  deliveryNote: DeliveryNoteData;
}) {
  const [showPayment, setShowPayment] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const accent = dn.accentColor || "#14b8a6";
  const isGuest = !dn.userId;

  const handleDownload = useCallback(() => {
    if (!dn.isPaid) {
      setShowPayment(true);
      return;
    }
    // Paid — show share options
    setShowShare(true);
  }, [dn.isPaid]);

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
            {dn.isPaid ? "Download / Share" : "Download PDF (KSh 10)"}
          </button>
        </div>
      </header>

      {/* Delivery Note */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="relative bg-white rounded-xl shadow-soft border border-mist overflow-hidden">
          {/* Watermark if unpaid */}
          {!dn.isPaid && (
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
                {dn.logoDataUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={dn.logoDataUrl}
                    alt="Logo"
                    className="h-12 w-auto object-contain"
                  />
                )}
                <h1
                  className="text-2xl font-display font-bold"
                  style={{ color: accent }}
                >
                  {dn.documentTitle || "DELIVERY NOTE"}
                </h1>
              </div>
              <div className="text-right text-sm text-ink/60">
                <p className="font-medium text-ink">
                  {dn.deliveryNoteNumber || "—"}
                </p>
                <p>Date: {formatDate(dn.issueDate)}</p>
                {dn.orderNumber && <p>Order: {dn.orderNumber}</p>}
                {dn.referenceInvoiceNumber && (
                  <p>Invoice: {dn.referenceInvoiceNumber}</p>
                )}
              </div>
            </div>

            {/* From / Deliver To */}
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-wider mb-1"
                  style={{ color: accent }}
                >
                  From
                </p>
                <PartyBlock
                  name={dn.fromName}
                  email={dn.fromEmail}
                  phone={dn.fromPhone}
                  address={dn.fromAddress}
                  city={dn.fromCity}
                  zipCode={dn.fromZipCode}
                  businessNumber={dn.fromBusinessNumber}
                />
              </div>
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-wider mb-1"
                  style={{ color: accent }}
                >
                  Deliver To
                </p>
                <PartyBlock
                  name={dn.toName}
                  email={dn.toEmail}
                  phone={dn.toPhone}
                  address={dn.toAddress}
                  city={dn.toCity}
                  zipCode={dn.toZipCode}
                  businessNumber={dn.toBusinessNumber}
                />
              </div>
            </div>

            {/* Line items — 3 columns: #, Description, Qty */}
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
                    <th className="px-3 py-2 text-right text-white font-medium rounded-tr-lg w-20">
                      Qty
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dn.lineItems.map((item, i) => (
                    <tr
                      key={item.id}
                      className={i % 2 === 1 ? "bg-mist/30" : ""}
                    >
                      <td className="px-3 py-2 text-ink/40">{i + 1}</td>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Acknowledgment bar */}
            {dn.acknowledgmentText && (
              <div
                className="rounded-lg px-4 py-3 text-sm text-white font-medium text-center"
                style={{ backgroundColor: accent }}
              >
                {dn.acknowledgmentText}
              </div>
            )}

            {/* Notes */}
            {dn.notes && (
              <div className="text-sm text-ink/60 border-t border-mist pt-4">
                <p className="font-semibold text-ink/40 text-xs uppercase tracking-wider mb-1">
                  Notes
                </p>
                <p className="whitespace-pre-wrap">{dn.notes}</p>
              </div>
            )}

            {/* Signature */}
            {dn.signatureDataUrl && (
              <div className="flex justify-end pt-4">
                <div className="text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={dn.signatureDataUrl}
                    alt="Signature"
                    className="h-16 w-auto object-contain"
                  />
                  <div className="border-t border-ink/20 mt-1 pt-1">
                    <p className="text-xs text-ink/40">Received By</p>
                  </div>
                </div>
              </div>
            )}

            {/* Photos */}
            {dn.photos.length > 0 && (
              <div className="space-y-2 border-t border-mist pt-4">
                <p className="text-xs font-semibold text-ink/40 uppercase tracking-wider">
                  Attachments
                </p>
                <div className="flex flex-wrap gap-2">
                  {dn.photos.map((photo) => (
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
          publicId={dn.publicId}
          onClose={() => setShowPayment(false)}
          onSuccess={handlePaymentSuccess}
          documentType="DELIVERY_NOTE"
        />
      )}

      {/* Share modal */}
      {showShare && (
        <ShareModal
          publicId={dn.publicId}
          documentNumber={dn.deliveryNoteNumber}
          documentType="delivery-note"
          downloadUrl={`/api/documents/download-dn/${dn.publicId}`}
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
  address,
  city,
  zipCode,
  businessNumber,
}: {
  name: string;
  email: string | null;
  phone: string | null;
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
