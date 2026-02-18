// components/CashSaleLineItemsEditor.tsx — Editable line items table for Cash Sales
"use client";

import { useCashSaleStore, type CashSaleLineItem } from "@/lib/store/cashSaleStore";
import { formatCurrency } from "@/lib/utils/format";

export function CashSaleLineItemsEditor() {
  const items = useCashSaleStore((s) => s.items);
  const currency = useCashSaleStore((s) => s.currency);
  const addItem = useCashSaleStore((s) => s.addItem);
  const updateItem = useCashSaleStore((s) => s.updateItem);
  const removeItem = useCashSaleStore((s) => s.removeItem);

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="hidden md:grid grid-cols-12 gap-2 text-xs font-medium text-ink/50 uppercase tracking-wider px-1">
        <div className="col-span-5">Description</div>
        <div className="col-span-2 text-right">Qty</div>
        <div className="col-span-2 text-right">Rate</div>
        <div className="col-span-2 text-right">Amount</div>
        <div className="col-span-1" />
      </div>

      {/* Item rows */}
      {items.map((item, index) => (
        <CashSaleLineItemRow
          key={item.id}
          item={item}
          index={index}
          currencyCode={currency.code}
          onUpdate={updateItem}
          onRemove={removeItem}
          canRemove={items.length > 1}
        />
      ))}

      {/* Add row button */}
      <button
        onClick={addItem}
        className="flex items-center gap-2 rounded-lg border border-dashed border-ink/20 px-4 py-3 text-sm text-ink/50 hover:border-lagoon hover:text-lagoon transition-colors w-full justify-center touch-target"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Line Item
      </button>
    </div>
  );
}

function CashSaleLineItemRow({
  item,
  index,
  currencyCode,
  onUpdate,
  onRemove,
  canRemove,
}: {
  item: CashSaleLineItem;
  index: number;
  currencyCode: string;
  onUpdate: (id: string, field: string, value: string | number) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}) {
  const amount = item.quantity * item.rate;

  return (
    <div className="group rounded-lg border border-mist p-3 md:p-0 md:border-0">
      <div className="grid grid-cols-12 gap-2 items-start">
        {/* Description */}
        <div className="col-span-11 md:col-span-5 space-y-1">
          <label className="text-xs text-ink/40 md:hidden">Description</label>
          <input
            type="text"
            value={item.description}
            onChange={(e) => onUpdate(item.id, "description", e.target.value)}
            placeholder={`Item ${index + 1}`}
            className="w-full rounded-lg border border-mist px-3 py-2.5 md:py-2 text-base md:text-sm text-ink placeholder:text-ink/30 focus:border-lagoon focus:outline-none focus:ring-1 focus:ring-lagoon/30"
          />
          <input
            type="text"
            value={item.additionalDetails}
            onChange={(e) => onUpdate(item.id, "additionalDetails", e.target.value)}
            placeholder="Additional details (optional)"
            className="w-full rounded-lg border border-mist/50 px-3 py-2 md:py-1.5 text-sm md:text-xs text-ink/60 placeholder:text-ink/20 focus:border-lagoon focus:outline-none focus:ring-1 focus:ring-lagoon/30"
          />
        </div>

        {/* Delete — mobile */}
        <div className="col-span-1 md:hidden flex items-start justify-end pt-1">
          {canRemove && (
            <button
              onClick={() => onRemove(item.id)}
              className="rounded p-1.5 text-ink/30 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Remove item"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>

        {/* Quantity */}
        <div className="col-span-4 md:col-span-2">
          <label className="text-xs text-ink/40 md:hidden">Qty</label>
          <input
            type="number"
            min={0}
            step="any"
            value={item.quantity || ""}
            onChange={(e) =>
              onUpdate(item.id, "quantity", parseFloat(e.target.value) || 0)
            }
            className="w-full rounded-lg border border-mist px-3 py-2.5 md:py-2 text-base md:text-sm text-right text-ink focus:border-lagoon focus:outline-none focus:ring-1 focus:ring-lagoon/30"
          />
        </div>

        {/* Rate */}
        <div className="col-span-4 md:col-span-2">
          <label className="text-xs text-ink/40 md:hidden">Rate</label>
          <input
            type="number"
            min={0}
            step="any"
            value={item.rate || ""}
            onChange={(e) =>
              onUpdate(item.id, "rate", parseFloat(e.target.value) || 0)
            }
            className="w-full rounded-lg border border-mist px-3 py-2.5 md:py-2 text-base md:text-sm text-right text-ink focus:border-lagoon focus:outline-none focus:ring-1 focus:ring-lagoon/30"
          />
        </div>

        {/* Amount (computed) */}
        <div className="col-span-4 md:col-span-2 flex items-center justify-end py-2.5 md:py-2">
          <div className="md:hidden text-xs text-ink/40 mr-auto">Amount</div>
          <span className="text-sm font-medium text-ink">
            {formatCurrency(amount, currencyCode)}
          </span>
        </div>

        {/* Delete — desktop */}
        <div className="hidden md:flex col-span-1 items-center justify-center py-2">
          {canRemove && (
            <button
              onClick={() => onRemove(item.id)}
              className="rounded p-1 text-ink/20 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
              title="Remove item"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
