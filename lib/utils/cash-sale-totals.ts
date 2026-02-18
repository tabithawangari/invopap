// lib/utils/cash-sale-totals.ts — Separate totals calculation for Cash Sale documents
// Completely independent from invoice totals to avoid cross-contamination.
// ALWAYS used server-side; never trust client-provided totals.

export interface CashSaleLineItemInput {
  quantity: number;
  rate: number;
}

export interface CashSaleTotalsInput {
  items: CashSaleLineItemInput[];
  taxRate: number; // Percentage, e.g., 16
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
}

export interface CashSaleTotalsResult {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  lineAmounts: number[]; // Individual line item amounts (quantity × rate)
}

/**
 * Calculate cash sale totals from line items.
 * Order: subtotal → discount → tax → total
 * All calculations use 2 decimal place rounding.
 */
export function calculateCashSaleTotals(input: CashSaleTotalsInput): CashSaleTotalsResult {
  // Calculate each line item amount
  const lineAmounts = input.items.map((item) =>
    roundCashSaleMoney(item.quantity * item.rate)
  );

  // Subtotal = sum of all line amounts
  const subtotal = roundCashSaleMoney(lineAmounts.reduce((sum, amt) => sum + amt, 0));

  // Calculate discount
  let discountAmount = 0;
  if (input.discountValue > 0) {
    if (input.discountType === "PERCENTAGE") {
      discountAmount = roundCashSaleMoney(subtotal * (input.discountValue / 100));
    } else {
      discountAmount = roundCashSaleMoney(Math.min(input.discountValue, subtotal));
    }
  }

  // Taxable amount = subtotal - discount
  const taxableAmount = roundCashSaleMoney(subtotal - discountAmount);

  // Tax amount
  const taxAmount =
    input.taxRate > 0 ? roundCashSaleMoney(taxableAmount * (input.taxRate / 100)) : 0;

  // Total
  const total = roundCashSaleMoney(taxableAmount + taxAmount);

  return { subtotal, discountAmount, taxAmount, total, lineAmounts };
}

/**
 * Round to 2 decimal places (banker's rounding).
 */
function roundCashSaleMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
