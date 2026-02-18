// components/PurchaseOrderPreview.tsx — Live read-only purchase order preview with PREVIEW watermark
"use client";

import { usePurchaseOrderStore } from "@/lib/store/purchaseOrderStore";
import type { InvoiceParty } from "@/lib/store/invoiceStore";
import type { PurchaseOrderShipTo } from "@/lib/store/purchaseOrderStore";
import { calculatePurchaseOrderTotals } from "@/lib/utils/purchase-order-totals";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export function PurchaseOrderPreview() {
  const store = usePurchaseOrderStore();

  const totals = calculatePurchaseOrderTotals({
    items: store.items.map((item) => ({
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
    taxRate: store.taxRate,
  });

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
        {/* Title bar */}
        <div
          className="rounded-lg px-5 py-3 text-center"
          style={{ backgroundColor: accent }}
        >
          <h1 className="text-xl sm:text-2xl font-display font-bold text-white tracking-wider uppercase">
            {store.documentTitle || "PURCHASE ORDER"}
          </h1>
        </div>

        {/* Company header + Logo */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            {store.from.name && (
              <p className="text-base font-bold text-ink">{store.from.name}</p>
            )}
            <PartyBlock party={store.from} compact />
          </div>
          <div className="text-right space-y-1">
            {store.logoDataUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={store.logoDataUrl}
                alt="Logo"
                className="h-16 w-auto object-contain ml-auto"
              />
            )}
            <div className="text-sm text-ink/60 mt-2">
              <p>
                <span className="text-ink/40 text-xs">PO #:</span>{" "}
                <span className="font-medium text-ink">
                  {store.purchaseOrderNumber || "—"}
                </span>
              </p>
              <p>
                <span className="text-ink/40 text-xs">Date:</span>{" "}
                {formatDate(store.issueDate)}
              </p>
              {store.expectedDeliveryDate && (
                <p>
                  <span className="text-ink/40 text-xs">Delivery:</span>{" "}
                  {formatDate(store.expectedDeliveryDate)}
                </p>
              )}
              {store.orderNumber && (
                <p>
                  <span className="text-ink/40 text-xs">Order:</span>{" "}
                  {store.orderNumber}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Vendor (To) section */}
        <div
          className="rounded-lg p-4"
          style={{ backgroundColor: `${accent}08`, borderLeft: `3px solid ${accent}` }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: accent }}
          >
            Vendor / Supplier
          </p>
          <PartyBlock party={store.to} />
        </div>

        {/* Ship To section (if enabled) */}
        {store.shipToEnabled && (
          <div
            className="rounded-lg p-4 border border-mist"
          >
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: accent }}
            >
              Ship To
            </p>
            <ShipToBlock shipTo={store.shipTo} />
          </div>
        )}

        {/* Payment Terms */}
        {store.paymentTerms && (
          <div className="text-sm text-ink/60">
            <span className="font-semibold text-ink/40 text-xs uppercase tracking-wider">
              Payment Terms:
            </span>{" "}
            {store.paymentTerms}
          </div>
        )}

        {/* Line items table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: accent }}>
                <th className="px-3 py-2 text-left text-white font-medium rounded-tl-lg">
                  Description
                </th>
                <th className="px-3 py-2 text-center text-white font-medium">
                  Qty
                </th>
                <th className="px-3 py-2 text-right text-white font-medium">
                  Unit Price
                </th>
                <th className="px-3 py-2 text-right text-white font-medium rounded-tr-lg">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {store.items.map((item, i) => (
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
                  <td className="px-3 py-2 text-center text-ink/70">
                    {item.quantity}
                  </td>
                  <td className="px-3 py-2 text-right text-ink/70">
                    {formatCurrency(item.unitPrice, store.currency.code)}
                  </td>
                  <td className="px-3 py-2 text-right font-medium text-ink">
                    {formatCurrency(
                      item.quantity * item.unitPrice,
                      store.currency.code
                    )}
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
              <span>{formatCurrency(totals.subtotal, store.currency.code)}</span>
            </div>

            {totals.taxAmount > 0 && (
              <div className="flex justify-between text-ink/60">
                <span>Tax ({store.taxRate}%)</span>
                <span>
                  {formatCurrency(totals.taxAmount, store.currency.code)}
                </span>
              </div>
            )}

            <div
              className="flex justify-between pt-2 border-t font-bold text-base"
              style={{ borderColor: accent, color: accent }}
            >
              <span>Total</span>
              <span>
                {formatCurrency(totals.total, store.currency.code)}
              </span>
            </div>
          </div>
        </div>

        {/* Authorized By */}
        {(store.authorizedByName || store.authorizedByDesignation) && (
          <div className="border-t border-mist pt-4">
            <p className="font-semibold text-ink/40 text-xs uppercase tracking-wider mb-2">
              Authorized By
            </p>
            <div className="text-sm text-ink/70">
              {store.authorizedByName && (
                <p className="font-medium text-ink">{store.authorizedByName}</p>
              )}
              {store.authorizedByDesignation && (
                <p className="text-ink/50">{store.authorizedByDesignation}</p>
              )}
            </div>
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
                <p className="text-xs text-ink/40">Authorized Signature</p>
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

function PartyBlock({
  party,
  compact,
}: {
  party: InvoiceParty;
  compact?: boolean;
}) {
  const hasContent = party.name || party.email || party.phone || party.address;

  if (!hasContent) {
    return <p className="text-ink/30 italic text-sm">Not specified</p>;
  }

  return (
    <div className="space-y-0.5 text-sm text-ink/70">
      {!compact && party.name && (
        <p className="font-medium text-ink">{party.name}</p>
      )}
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

function ShipToBlock({ shipTo }: { shipTo: PurchaseOrderShipTo }) {
  const hasContent =
    shipTo.name || shipTo.companyName || shipTo.address || shipTo.phone;

  if (!hasContent) {
    return <p className="text-ink/30 italic text-sm">Not specified</p>;
  }

  return (
    <div className="space-y-0.5 text-sm text-ink/70">
      {shipTo.name && <p className="font-medium text-ink">{shipTo.name}</p>}
      {shipTo.companyName && <p>{shipTo.companyName}</p>}
      {shipTo.address && <p>{shipTo.address}</p>}
      {(shipTo.city || shipTo.zipCode) && (
        <p>
          {shipTo.city}
          {shipTo.city && shipTo.zipCode && ", "}
          {shipTo.zipCode}
        </p>
      )}
      {shipTo.phone && <p>{shipTo.phone}</p>}
    </div>
  );
}
