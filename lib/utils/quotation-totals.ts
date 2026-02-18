// lib/utils/quotation-totals.ts — Separate totals calculation for Quotation documents
// Completely independent from invoice/cash-sale/purchase-order totals.
// NO TAX — Quotation arithmetic: subtotal → discount → total
// ALWAYS used server-side; never trust client-provided totals.

export interface QuotationLineItemInput {
  quantity: number;
  rate: number;
}

export interface QuotationTotalsInput {
  items: QuotationLineItemInput[];
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
}

export interface QuotationTotalsResult {
  subtotal: number;
  discountAmount: number;
  total: number;
  lineAmounts: number[]; // Individual line item amounts (quantity × rate)
}

/**
 * Calculate quotation totals from line items.
 * Order: subtotal → discount → total (NO TAX)
 * All calculations use 2 decimal place rounding.
 */
export function calculateQuotationTotals(input: QuotationTotalsInput): QuotationTotalsResult {
  // Calculate each line item amount
  const lineAmounts = input.items.map((item) =>
    roundQuotationMoney(item.quantity * item.rate)
  );

  // Subtotal = sum of all line amounts
  const subtotal = roundQuotationMoney(lineAmounts.reduce((sum, amt) => sum + amt, 0));

  // Calculate discount
  let discountAmount = 0;
  if (input.discountValue > 0) {
    if (input.discountType === "PERCENTAGE") {
      discountAmount = roundQuotationMoney(subtotal * (input.discountValue / 100));
    } else {
      discountAmount = roundQuotationMoney(Math.min(input.discountValue, subtotal));
    }
  }

  // Total = subtotal - discount (NO tax step)
  const total = roundQuotationMoney(subtotal - discountAmount);

  return { subtotal, discountAmount, total, lineAmounts };
}

/**
 * Round to 2 decimal places.
 */
function roundQuotationMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
