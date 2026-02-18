// lib/utils/purchase-order-totals.ts — Separate totals calculation for Purchase Order documents
// Completely independent from invoice/cash-sale/receipt totals to avoid cross-contamination.
// PO arithmetic: subtotal + tax = total (NO discount).
// ALWAYS used server-side; never trust client-provided totals.

export interface PurchaseOrderLineItemInput {
  quantity: number;
  unitPrice: number;
}

export interface PurchaseOrderTotalsInput {
  items: PurchaseOrderLineItemInput[];
  taxRate: number; // Percentage, e.g., 16
}

export interface PurchaseOrderTotalsResult {
  subtotal: number;
  taxAmount: number;
  total: number;
  lineAmounts: number[]; // Individual line item amounts (quantity × unitPrice)
}

/**
 * Calculate purchase order totals from line items.
 * Order: subtotal → tax → total (NO discount)
 * All calculations use 2 decimal place rounding.
 */
export function calculatePurchaseOrderTotals(input: PurchaseOrderTotalsInput): PurchaseOrderTotalsResult {
  // Calculate each line item amount
  const lineAmounts = input.items.map((item) =>
    roundPOMoney(item.quantity * item.unitPrice)
  );

  // Subtotal = sum of all line amounts
  const subtotal = roundPOMoney(lineAmounts.reduce((sum, amt) => sum + amt, 0));

  // Tax amount (applied directly to subtotal — no discount to subtract)
  const taxAmount =
    input.taxRate > 0 ? roundPOMoney(subtotal * (input.taxRate / 100)) : 0;

  // Total = subtotal + tax
  const total = roundPOMoney(subtotal + taxAmount);

  return { subtotal, taxAmount, total, lineAmounts };
}

/**
 * Calculate a single line item amount.
 */
export function calculatePurchaseOrderLineAmount(quantity: number, unitPrice: number): number {
  return roundPOMoney(quantity * unitPrice);
}

/**
 * Round to 2 decimal places (banker's rounding).
 */
function roundPOMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
