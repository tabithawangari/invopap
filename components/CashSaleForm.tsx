// components/CashSaleForm.tsx — Editable cash sale form (with financial fields)
"use client";

import { useCashSaleStore, PAYMENT_METHOD_LABELS, type CashSalePaymentMethod } from "@/lib/store/cashSaleStore";
import { CashSaleLineItemsEditor } from "@/components/CashSaleLineItemsEditor";
import { calculateCashSaleTotals } from "@/lib/utils/cash-sale-totals";
import { formatCurrency } from "@/lib/utils/format";
import { useCallback, useRef, useState, ChangeEvent } from "react";

export function CashSaleForm() {
  const store = useCashSaleStore();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const sigInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(
    (callback: (dataUrl: string) => void, maxSizeKB = 500) =>
      (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > maxSizeKB * 1024) {
          alert(`File too large. Max ${maxSizeKB}KB`);
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          callback(reader.result as string);
        };
        reader.readAsDataURL(file);
        e.target.value = "";
      },
    []
  );

  // Compute totals using SEPARATE cash sale totals function
  const totals = calculateCashSaleTotals({
    items: store.items.map((item) => ({
      quantity: item.quantity,
      rate: item.rate,
    })),
    taxRate: store.taxRate,
    discountType: store.discountType === "percentage" ? "PERCENTAGE" : "FIXED",
    discountValue: store.discountValue,
  });

  const showTransactionCode = store.paymentMethod === "mpesa" || store.paymentMethod === "bank";

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ─── Top row: Document title + Logo ─── */}
      <div className="flex items-start justify-between gap-3 sm:gap-6">
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={store.documentTitle}
            onChange={(e) => store.setField("documentTitle", e.target.value)}
            className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-ink border-0 bg-transparent p-0 focus:outline-none focus:ring-0 w-full placeholder:text-ink/20"
            placeholder="CASH SALE"
          />
        </div>
        <div className="shrink-0">
          {store.logoDataUrl ? (
            <div className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={store.logoDataUrl}
                alt="Logo"
                className="h-12 sm:h-16 w-auto max-w-[120px] sm:max-w-[160px] object-contain rounded"
              />
              <button
                onClick={() => store.setLogo(null)}
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center shadow-sm"
              >
                ×
              </button>
            </div>
          ) : (
            <button
              onClick={() => logoInputRef.current?.click()}
              className="rounded-lg border-2 border-dashed border-ink/15 px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm text-ink/35 hover:border-lagoon hover:text-lagoon transition-colors flex items-center gap-2"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              + Logo
            </button>
          )}
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload(store.setLogo)}
          />
        </div>
      </div>

      {/* ─── From / Sold To — side by side ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
        <PartySection title="From" prefix="from" />
        <PartySection title="Sold To" prefix="to" />
      </div>

      {/* ─── Document meta row ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div>
          <label className="label">Number</label>
          <input
            type="text"
            value={store.cashSaleNumber}
            onChange={(e) => store.setField("cashSaleNumber", e.target.value)}
            placeholder="Auto-generated"
            className="input"
          />
        </div>
        <div>
          <label className="label">Date</label>
          <input
            type="date"
            value={store.issueDate}
            onChange={(e) => store.setField("issueDate", e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="label">Order No.</label>
          <input
            type="text"
            value={store.orderNumber}
            onChange={(e) => store.setField("orderNumber", e.target.value)}
            placeholder="Optional"
            className="input"
          />
        </div>
        <div>
          <label className="label">Invoice No.</label>
          <input
            type="text"
            value={store.referenceInvoiceNumber}
            onChange={(e) => store.setField("referenceInvoiceNumber", e.target.value)}
            placeholder="Optional"
            className="input"
          />
        </div>
      </div>

      {/* ─── Line Items ─── */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-ink/50 uppercase tracking-wider">
          Items / Services
        </h2>
        <CashSaleLineItemsEditor />
      </section>

      {/* ─── Inline Totals ─── */}
      <div className="flex justify-end">
        <div className="w-full sm:w-auto sm:min-w-[280px] max-w-sm space-y-2 text-sm">
          <div className="flex justify-between text-ink/60">
            <span>Subtotal</span>
            <span>{formatCurrency(totals.subtotal, store.currency.code)}</span>
          </div>

          {totals.discountAmount > 0 && (
            <div className="flex justify-between text-ink/60">
              <span>
                Discount
                {store.discountType === "percentage" ? ` (${store.discountValue}%)` : ""}
              </span>
              <span className="text-green-600">
                -{formatCurrency(totals.discountAmount, store.currency.code)}
              </span>
            </div>
          )}

          {totals.taxAmount > 0 && (
            <div className="flex justify-between text-ink/60">
              <span>Tax ({store.taxRate}%)</span>
              <span>{formatCurrency(totals.taxAmount, store.currency.code)}</span>
            </div>
          )}

          <div
            className="flex justify-between pt-2 border-t-2 font-bold text-base"
            style={{ borderColor: store.accentColor, color: store.accentColor }}
          >
            <span>Total</span>
            <span>{formatCurrency(totals.total, store.currency.code)}</span>
          </div>
        </div>
      </div>

      {/* ─── Payment Method ─── */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-ink/50 uppercase tracking-wider">
          Payment Method
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {(Object.entries(PAYMENT_METHOD_LABELS) as [CashSalePaymentMethod, string][]).map(
            ([value, label]) => (
              <button
                key={value}
                onClick={() => {
                  store.setField("paymentMethod", value);
                  // Clear transaction code when switching to cash/card
                  if (value === "cash" || value === "card") {
                    store.setField("transactionCode", "");
                  }
                }}
                className={`rounded-lg border-2 px-3 sm:px-4 py-3 text-sm font-medium transition-all touch-target ${
                  store.paymentMethod === value
                    ? "border-current text-white"
                    : "border-mist text-ink/60 hover:border-ink/20"
                }`}
                style={
                  store.paymentMethod === value
                    ? { backgroundColor: store.accentColor, borderColor: store.accentColor }
                    : undefined
                }
              >
                {label}
              </button>
            )
          )}
        </div>
        {showTransactionCode && (
          <div className="mt-3">
            <label className="label">
              {store.paymentMethod === "mpesa" ? "M-Pesa Transaction Code" : "Bank Transaction Code"}
            </label>
            <input
              type="text"
              value={store.transactionCode}
              onChange={(e) => store.setField("transactionCode", e.target.value.toUpperCase())}
              placeholder={store.paymentMethod === "mpesa" ? "e.g. QKJ3ABCDEF" : "e.g. FT26045XXXX"}
              className="input"
              maxLength={100}
            />
            <p className="text-xs text-ink/30 mt-1">
              Enter the transaction reference code for verification
            </p>
          </div>
        )}
      </section>

      {/* ─── Notes ─── */}
      <section className="space-y-2">
        <label className="label">Notes</label>
        <textarea
          value={store.notes}
          onChange={(e) => store.setField("notes", e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Notes — any relevant information, payment details..."
          className="input resize-none"
        />
        <p className="text-xs text-ink/30 text-right">{store.notes.length}/2000</p>
      </section>

      {/* ─── Signature ─── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-ink/50 uppercase tracking-wider">
            Signature
          </h2>
        </div>
        {store.signatureDataUrl ? (
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={store.signatureDataUrl}
              alt="Signature"
              className="h-14 sm:h-16 w-auto object-contain rounded border border-mist p-2"
            />
            <button
              onClick={() => store.setSignature(null)}
              className="text-xs text-red-500 hover:underline py-2"
            >
              Remove
            </button>
          </div>
        ) : (
          <button
            onClick={() => sigInputRef.current?.click()}
            className="rounded-lg border-2 border-dashed border-ink/15 px-4 py-3 text-sm text-ink/35 hover:border-lagoon hover:text-lagoon transition-colors touch-target"
          >
            + Add Signature
          </button>
        )}
        <input
          ref={sigInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload(store.setSignature)}
        />
      </section>

      {/* ─── Photos ─── */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-ink/50 uppercase tracking-wider">
          Photos
        </h2>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {store.photoDataUrls.map((url, i) => (
            <div key={i} className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Attachment ${i + 1}`}
                className="h-16 w-16 sm:h-20 sm:w-20 object-cover rounded-lg border border-mist"
              />
              <button
                onClick={() => store.removePhoto(i)}
                className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center shadow-sm"
              >
                ×
              </button>
            </div>
          ))}
          {store.photoDataUrls.length < 5 && (
            <button
              onClick={() => photoInputRef.current?.click()}
              className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-lg border-2 border-dashed border-ink/15 text-ink/30 hover:border-lagoon hover:text-lagoon transition-colors"
            >
              <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </div>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload((url) => store.addPhoto(url))}
        />
      </section>
    </div>
  );
}

// ─── Party sub-form with expandable "More Details" ──────────

function PartySection({
  title,
  prefix,
}: {
  title: string;
  prefix: "from" | "to";
}) {
  const setField = useCashSaleStore((s) => s.setField);
  const party = useCashSaleStore((s) => s[prefix]);
  const [showMore, setShowMore] = useState(false);

  const hasMoreValues = !!(party.mobile || party.fax);

  const field = (
    name: string,
    label: string,
    placeholder: string,
    type = "text"
  ) => (
    <div>
      <label className="label">{label}</label>
      <input
        type={type}
        value={(party as unknown as Record<string, string>)[name] || ""}
        onChange={(e) => setField(`${prefix}.${name}`, e.target.value)}
        placeholder={placeholder}
        className="input"
      />
    </div>
  );

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-ink/50 uppercase tracking-wider">
        {title}
      </h2>
      <div className="space-y-3">
        {field("name", "Name", prefix === "from" ? "Your Business Name" : "Customer Name")}
        {field("email", "Email", "email@example.com", "email")}
        {field("address", "Address", "Street")}
        <div className="grid grid-cols-2 gap-3">
          {field("city", "City", "Nairobi")}
          {field("zipCode", "Zip Code", "00100")}
        </div>
        {field("phone", "Phone", "+254 700 000000")}

        {(showMore || hasMoreValues) ? (
          <div className="space-y-3 pt-1">
            {field("mobile", "Mobile", "+254 700 000000")}
            {field("fax", "Fax", "+254 20 000000")}
            {field("businessNumber", "Business Number", "P000000000A")}
            {!hasMoreValues && (
              <button
                onClick={() => setShowMore(false)}
                className="text-xs text-ink/40 hover:text-ink/60 transition-colors"
              >
                − Hide additional fields
              </button>
            )}
          </div>
        ) : (
          <>
            {field("businessNumber", "Business Number", "P000000000A")}
            <button
              onClick={() => setShowMore(true)}
              className="text-xs text-lagoon hover:text-lagoon/80 transition-colors font-medium"
            >
              + More details (Mobile, Fax)
            </button>
          </>
        )}
      </div>
    </section>
  );
}
