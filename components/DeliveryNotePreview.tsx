// components/DeliveryNotePreview.tsx — Live read-only preview for delivery notes (no monetary values)
"use client";

import { useDeliveryNoteStore } from "@/lib/store/deliveryNoteStore";
import { formatDate } from "@/lib/utils/format";
import type { InvoiceParty } from "@/lib/store/invoiceStore";

export function DeliveryNotePreview() {
  const store = useDeliveryNoteStore();
  const accent = store.accentColor;

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
      <div className="relative z-0 p-6 sm:p-8 space-y-6">
        {/* Header bar */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            {store.logoDataUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={store.logoDataUrl}
                alt="Logo"
                className="h-12 w-auto object-contain"
              />
            )}
            <h1
              className="text-2xl font-display font-bold"
              style={{ color: accent }}
            >
              {store.documentTitle || "DELIVERY NOTE"}
            </h1>
          </div>
          <div className="text-right text-sm text-ink/60">
            <p className="font-medium text-ink">
              {store.deliveryNoteNumber || "—"}
            </p>
            <p>Date: {formatDate(store.issueDate)}</p>
            {store.orderNumber && <p>Order: {store.orderNumber}</p>}
            {store.referenceInvoiceNumber && (
              <p>Invoice: {store.referenceInvoiceNumber}</p>
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
            <PartyBlock party={store.from} />
          </div>
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-1"
              style={{ color: accent }}
            >
              Deliver To
            </p>
            <PartyBlock party={store.to} />
          </div>
        </div>

        {/* Line items table — 3 columns only: #, Description, Qty */}
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
              {store.items.map((item, i) => (
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

        {/* NO totals section */}

        {/* Acknowledgment bar */}
        {store.acknowledgmentText && (
          <div
            className="rounded-lg px-4 py-3 text-sm text-white font-medium text-center"
            style={{ backgroundColor: accent }}
          >
            {store.acknowledgmentText}
          </div>
        )}

        {/* Notes */}
        {store.notes && (
          <div className="text-sm text-ink/60 border-t border-mist pt-4">
            <p className="font-semibold text-ink/40 text-xs uppercase tracking-wider mb-1">
              Notes
            </p>
            <p className="whitespace-pre-wrap">{store.notes}</p>
          </div>
        )}

        {/* Signature */}
        {store.signatureDataUrl && (
          <div className="flex justify-end pt-4">
            <div className="text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={store.signatureDataUrl}
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
  );
}

function PartyBlock({ party }: { party: InvoiceParty }) {
  const hasContent = party.name || party.email || party.phone || party.address;

  if (!hasContent) {
    return <p className="text-ink/30 italic">Not specified</p>;
  }

  return (
    <div className="space-y-0.5 text-ink/70">
      {party.name && <p className="font-medium text-ink">{party.name}</p>}
      {party.email && <p>{party.email}</p>}
      {party.phone && <p>{party.phone}</p>}
      {party.mobile && <p>{party.mobile}</p>}
      {party.fax && <p className="text-ink/50">Fax: {party.fax}</p>}
      {party.address && <p>{party.address}</p>}
      {(party.city || party.zipCode) && (
        <p>
          {party.city}
          {party.city && party.zipCode && ", "}
          {party.zipCode}
        </p>
      )}
      {party.businessNumber && (
        <p className="text-xs text-ink/40">PIN: {party.businessNumber}</p>
      )}
    </div>
  );
}
