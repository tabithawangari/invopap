// components/ReceiptForm.tsx — Editable receipt form (no line items, receipt-specific fields)
"use client";

import { useReceiptStore } from "@/lib/store/receiptStore";
import type { PaymentMethod } from "@/lib/store/receiptStore";
import { CURRENCIES } from "@/lib/utils/format";
import { useCallback, useRef, useState, ChangeEvent } from "react";

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] =
  [
    { value: "cash", label: "Cash", icon: "💵" },
    { value: "mpesa", label: "M-Pesa", icon: "📱" },
    { value: "bank", label: "Bank", icon: "🏦" },
  ];

export function ReceiptForm() {
  const store = useReceiptStore();
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

  const currencySymbol =
    CURRENCIES.find((c) => c.code === store.currency.code)?.symbol ||
    store.currency.code;

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
            placeholder="OFFICIAL RECEIPT"
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

      {/* ─── From / Received From — side by side ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <PartySection title="From" prefix="from" />
        <PartySection title="Received With Thanks From" prefix="to" />
      </div>

      {/* ─── Receipt meta row: Number + Date ─── */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Receipt No.</label>
          <input
            type="text"
            value={store.receiptNumber}
            onChange={(e) => store.setField("receiptNumber", e.target.value)}
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
      </div>

      {/* ─── Financial Section ─── */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-ink/50 uppercase tracking-wider">
          Payment Details
        </h2>

        {/* Currency selector */}
        <div>
          <label className="label">Currency</label>
          <select
            value={store.currency.code}
            onChange={(e) => {
              const c = CURRENCIES.find((c) => c.code === e.target.value);
              if (c) store.setCurrency(c);
            }}
            className="input"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.code} ({c.symbol})
              </option>
            ))}
          </select>
        </div>

        {/* Total Amount Owed */}
        <div>
          <label className="label">Total Amount Owed</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink/40 font-medium">
              {currencySymbol}
            </span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={store.totalAmountOwed || ""}
              onChange={(e) =>
                store.setField(
                  "totalAmountOwed",
                  parseFloat(e.target.value) || 0
                )
              }
              placeholder="0.00"
              className="input pl-12"
            />
          </div>
        </div>

        {/* Amount Received */}
        <div>
          <label className="label">Amount Received</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink/40 font-medium">
              {currencySymbol}
            </span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={store.amountReceived || ""}
              onChange={(e) =>
                store.setField(
                  "amountReceived",
                  parseFloat(e.target.value) || 0
                )
              }
              placeholder="0.00"
              className="input pl-12"
            />
          </div>
        </div>

        {/* The sum of (amount in words) */}
        <div>
          <label className="label">The Sum Of</label>
          <input
            type="text"
            value={store.amountInWords}
            onChange={(e) => store.setField("amountInWords", e.target.value)}
            placeholder="Auto-generated from amount received"
            className="input text-sm italic"
          />
          <p className="text-xs text-ink/30 mt-1">
            Auto-generated. You can edit to override.
          </p>
        </div>

        {/* Outstanding Balance (read-only) */}
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
          <label className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
            Outstanding Balance
          </label>
          <p className="text-2xl font-bold text-amber-700 mt-1">
            {currencySymbol}{" "}
            {store.outstandingBalance.toLocaleString("en-KE", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
      </section>

      {/* ─── Being Payment Of ─── */}
      <section className="space-y-2">
        <label className="label">Being Payment Of</label>
        <textarea
          value={store.beingPaymentOf}
          onChange={(e) => store.setField("beingPaymentOf", e.target.value)}
          rows={2}
          maxLength={1000}
          placeholder="e.g., School fees Term 1, Rent for January 2026, etc."
          className="input resize-none"
        />
      </section>

      {/* ─── Payment Method ─── */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-ink/50 uppercase tracking-wider">
          Payment Method
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {PAYMENT_METHODS.map((method) => (
            <label
              key={method.value}
              className={`flex items-center justify-center gap-2 rounded-lg border-2 px-3 sm:px-4 py-3 cursor-pointer transition-all touch-target ${
                store.paymentMethod === method.value
                  ? "border-lagoon bg-lagoon/5 text-lagoon"
                  : "border-mist hover:border-ink/20 text-ink/50"
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={method.value}
                checked={store.paymentMethod === method.value}
                onChange={(e) =>
                  store.setField(
                    "paymentMethod",
                    e.target.value as PaymentMethod
                  )
                }
                className="sr-only"
              />
              <span className="text-lg">{method.icon}</span>
              <span className="text-sm font-medium">{method.label}</span>
              {store.paymentMethod === method.value && (
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </label>
          ))}
        </div>

        {/* Transaction code — shown for M-Pesa and Bank */}
        {(store.paymentMethod === "mpesa" ||
          store.paymentMethod === "bank") && (
          <div className="animate-fadeUp">
            <label className="label">
              {store.paymentMethod === "mpesa"
                ? "M-Pesa Transaction Code"
                : "Bank Transaction Code"}
            </label>
            <input
              type="text"
              value={store.transactionCode}
              onChange={(e) =>
                store.setField("transactionCode", e.target.value.toUpperCase())
              }
              placeholder={
                store.paymentMethod === "mpesa"
                  ? "e.g., QJK3L7M9NP"
                  : "e.g., FT241234567"
              }
              className="input font-mono uppercase tracking-wider"
              maxLength={100}
            />
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
          placeholder="Notes — any relevant information..."
          className="input resize-none"
        />
        <p className="text-xs text-ink/30 text-right">
          {store.notes.length}/2000
        </p>
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
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
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
  const setField = useReceiptStore((s) => s.setField);
  const party = useReceiptStore((s) => s[prefix]);
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
        {field(
          "name",
          "Name",
          prefix === "from" ? "Your Business Name" : "Client / Recipient"
        )}
        {field("email", "Email", "email@example.com", "email")}
        {field("address", "Address", "Street")}
        <div className="grid grid-cols-2 gap-3">
          {field("city", "City", "Nairobi")}
          {field("zipCode", "Zip Code", "00100")}
        </div>
        {field("phone", "Phone", "+254 700 000000")}

        {showMore || hasMoreValues ? (
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
