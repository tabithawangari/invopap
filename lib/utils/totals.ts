// lib/utils/totals.ts — Shared invoice totals calculation
// ALWAYS used server-side; never trust client-provided totals

export interface LineItemInput {
  quantity: number;
  rate: number;
}

export interface TotalsInput {
  items: LineItemInput[];
  taxRate: number; // Percentage, e.g., 16
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
}

export interface TotalsResult {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  lineAmounts: number[]; // Individual line item amounts (quantity × rate)
}

/**
 * Calculate invoice totals from line items.
 * Order: subtotal → discount → tax → total
 * All calculations use 2 decimal place rounding.
 */
export function calculateInvoiceTotals(input: TotalsInput): TotalsResult {
  // Calculate each line item amount
  const lineAmounts = input.items.map((item) =>
    roundMoney(item.quantity * item.rate)
  );

  // Subtotal = sum of all line amounts
  const subtotal = roundMoney(lineAmounts.reduce((sum, amt) => sum + amt, 0));

  // Calculate discount
  let discountAmount = 0;
  if (input.discountValue > 0) {
    if (input.discountType === "PERCENTAGE") {
      discountAmount = roundMoney(subtotal * (input.discountValue / 100));
    } else {
      discountAmount = roundMoney(Math.min(input.discountValue, subtotal));
    }
  }

  // Taxable amount = subtotal - discount
  const taxableAmount = roundMoney(subtotal - discountAmount);

  // Tax amount
  const taxAmount =
    input.taxRate > 0 ? roundMoney(taxableAmount * (input.taxRate / 100)) : 0;

  // Total
  const total = roundMoney(taxableAmount + taxAmount);

  return { subtotal, discountAmount, taxAmount, total, lineAmounts };
}

/**
 * Round to 2 decimal places (banker's rounding).
 */
function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
