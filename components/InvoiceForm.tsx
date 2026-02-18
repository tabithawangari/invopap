// components/InvoiceForm.tsx — Editable invoice form (document-style layout)
"use client";

import { useState, useCallback, useRef, ChangeEvent } from "react";
import { useInvoiceStore, PAYMENT_TERMS_LABELS } from "@/lib/store/invoiceStore";
import { LineItemsEditor } from "@/components/LineItemsEditor";
import { calculateInvoiceTotals } from "@/lib/utils/totals";
import { formatCurrency } from "@/lib/utils/format";

export function InvoiceForm() {
  const store = useInvoiceStore();
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
        reader.onload = () => callback(reader.result as string);
        reader.readAsDataURL(file);
        e.target.value = "";
      },
    []
  );

  // Inline totals
  const totals = calculateInvoiceTotals({
    items: store.items.map((i) => ({ quantity: i.quantity, rate: i.rate })),
    taxRate: store.taxRate,
    discountType: store.discountType === "percentage" ? "PERCENTAGE" : "FIXED",
    discountValue: store.discountValue,
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ─── Title row + Logo ─── */}
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={store.documentTitle}
            onChange={(e) => store.setField("documentTitle", e.target.value)}
            className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-ink bg-transparent border-none outline-none w-full placeholder:text-ink/20"
            placeholder="INVOICE"
          />
        </div>
        <div className="shrink-0">
          {store.logoDataUrl ? (
            <div className="group relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={store.logoDataUrl}
                alt="Logo"
                className="h-10 sm:h-14 w-auto object-contain rounded"
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
              className="rounded-lg border-2 border-dashed border-ink/15 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-ink/35 hover:border-lagoon hover:text-lagoon transition-colors whitespace-nowrap"
            >
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

      {/* ─── Parties: From / Bill To ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
        <PartySection
          title="From"
          prefix="from"
          namePlaceholder="Your Business Name"
        />
        <PartySection
          title="Bill To"
          prefix="to"
          namePlaceholder="Client Name"
        />
      </div>

      {/* ─── Document meta row ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="label">Number</label>
          <input
            type="text"
            value={store.invoiceNumber}
            onChange={(e) => store.setField("invoiceNumber", e.target.value)}
            placeholder="Auto"
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
          <label className="label">Due Date</label>
          <input
            type="date"
            value={store.dueDate}
            onChange={(e) => store.setField("dueDate", e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="label">Payment Terms</label>
          <select
            value={store.paymentTerms}
            onChange={(e) => store.setField("paymentTerms", e.target.value)}
            className="input"
          >
            {Object.entries(PAYMENT_TERMS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ─── Line Items ─── */}
      <section>
        <LineItemsEditor />
      </section>

      {/* ─── Inline Totals ─── */}
      <div className="flex justify-end">
        <div className="w-full sm:w-auto sm:min-w-[280px] max-w-sm space-y-1.5 text-sm">
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
                −{formatCurrency(totals.discountAmount, store.currency.code)}
              </span>
            </div>
          )}
          {totals.taxAmount > 0 && (
            <div className="flex justify-between text-ink/60">
              <span>Tax ({store.taxRate}%)</span>
              <span>{formatCurrency(totals.taxAmount, store.currency.code)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-ink/10 font-bold text-base text-ink">
            <span>Balance Due</span>
            <span>{formatCurrency(totals.total, store.currency.code)}</span>
          </div>
        </div>
      </div>

      {/* ─── Notes ─── */}
      <section className="space-y-1.5">
        <label className="label">Notes / Terms</label>
        <div className="relative">
          <textarea
            value={store.notes}
            onChange={(e) => {
              if (e.target.value.length <= 2000) {
                store.setField("notes", e.target.value);
              }
            }}
            rows={3}
            placeholder="Payment instructions, thank you note, terms..."
            className="input resize-none pr-16"
          />
          <span className="absolute bottom-2 right-3 text-[11px] text-ink/25">
            {store.notes.length}/2000
          </span>
        </div>
      </section>

      {/* ─── Signature ─── */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-ink/50 uppercase tracking-wider">
          Signature
        </h2>
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
          Photos / Attachments
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

// ─── Party sub-form with "More Details" toggle ───────────────

function PartySection({
  title,
  prefix,
  namePlaceholder,
}: {
  title: string;
  prefix: "from" | "to";
  namePlaceholder: string;
}) {
  const setField = useInvoiceStore((s) => s.setField);
  const party = useInvoiceStore((s) => s[prefix]);
  const [showMore, setShowMore] = useState(false);

  const val = (name: string) =>
    (party as unknown as Record<string, string>)[name] || "";

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
        value={val(name)}
        onChange={(e) => setField(`${prefix}.${name}`, e.target.value)}
        placeholder={placeholder}
        className="input"
      />
    </div>
  );

  // Check if more-details fields have values
  const hasMoreValues = !!(val("mobile") || val("fax"));

  return (
    <div className="space-y-2.5">
      <h2 className="text-sm font-semibold text-ink/50 uppercase tracking-wider">
        {title}
      </h2>
      <div className="space-y-2.5">
        {field("name", "Name / Business", namePlaceholder)}
        {field("email", "Email", "email@example.com", "email")}
        {field("phone", "Phone", "+254 700 000000")}
        {field("address", "Address", "123 Street")}
        <div className="grid grid-cols-2 gap-2">
          {field("city", "City", "Nairobi")}
          {field("zipCode", "Postal Code", "00100")}
        </div>
        {field("businessNumber", "Business / KRA PIN", "P000000000A")}

        {/* More Details toggle */}
        {(showMore || hasMoreValues) ? (
          <div className="space-y-2.5 pt-1">
            {field("mobile", "Mobile", "+254 700 000000")}
            {field("fax", "Fax", "+254 20 000000")}
            {!hasMoreValues && (
              <button
                onClick={() => setShowMore(false)}
                className="text-xs text-ink/35 hover:text-ink/60 transition-colors"
              >
                − Hide details
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={() => setShowMore(true)}
            className="text-xs text-lagoon/70 hover:text-lagoon transition-colors"
          >
            + More Details
          </button>
        )}
      </div>
    </div>
  );
}
