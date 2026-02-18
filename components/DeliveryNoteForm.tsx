// components/DeliveryNoteForm.tsx — Editable delivery note form (no financial fields)
"use client";

import { useDeliveryNoteStore } from "@/lib/store/deliveryNoteStore";
import { DeliveryNoteLineItemsEditor } from "@/components/DeliveryNoteLineItemsEditor";
import { useCallback, useRef, useState, ChangeEvent } from "react";

export function DeliveryNoteForm() {
  const store = useDeliveryNoteStore();
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

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ─── Top row: Document title + Logo ─── */}
      <div className="flex items-start justify-between gap-4 sm:gap-6">
        <div className="flex-1">
          <input
            type="text"
            value={store.documentTitle}
            onChange={(e) => store.setField("documentTitle", e.target.value)}
            className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-ink bg-transparent border-none outline-none w-full placeholder:text-ink/20"
            placeholder="DELIVERY NOTE"
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

      {/* ─── From / Deliver To — side by side ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <PartySection title="From" prefix="from" />
        <PartySection title="Deliver To" prefix="to" />
      </div>

      {/* ─── Reference meta row: Date, Number, Order No., Invoice No. ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div>
          <label className="label">Number</label>
          <input
            type="text"
            value={store.deliveryNoteNumber}
            onChange={(e) => store.setField("deliveryNoteNumber", e.target.value)}
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

      {/* ─── Line Items — QTY + Description only ─── */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-ink/50 uppercase tracking-wider">
          Items
        </h2>
        <DeliveryNoteLineItemsEditor />
      </section>

      {/* NO totals section — delivery notes have no monetary values */}

      {/* ─── Acknowledgment ─── */}
      <section className="space-y-2">
        <label className="label">Acknowledgment Text</label>
        <input
          type="text"
          value={store.acknowledgmentText}
          onChange={(e) => store.setField("acknowledgmentText", e.target.value)}
          maxLength={500}
          placeholder="Goods received in good order"
          className="input"
        />
        <p className="text-xs text-ink/30">
          Displayed as a colored bar at the bottom of the document
        </p>
      </section>

      {/* ─── Notes ─── */}
      <section className="space-y-2">
        <label className="label">Notes</label>
        <textarea
          value={store.notes}
          onChange={(e) => store.setField("notes", e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Notes — any relevant information, delivery instructions..."
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
              className="h-16 w-auto object-contain rounded border border-mist p-2"
            />
            <button
              onClick={() => store.setSignature(null)}
              className="text-xs text-red-500 hover:underline"
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
        <div className="flex flex-wrap gap-3">
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
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center shadow-sm"
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
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
  const setField = useDeliveryNoteStore((s) => s.setField);
  const party = useDeliveryNoteStore((s) => s[prefix]);
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
        {field("name", "Name", prefix === "from" ? "Your Business Name" : "Client / Recipient")}
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
