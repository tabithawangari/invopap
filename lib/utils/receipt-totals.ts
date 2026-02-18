// lib/utils/receipt-totals.ts — Receipt balance calculation
// SEPARATE from invoice totals — receipts have their own arithmetic:
//   outstandingBalance = totalAmountOwed - amountReceived
// All calculations use 2 decimal place rounding.

export interface ReceiptTotalsInput {
  totalAmountOwed: number;
  amountReceived: number;
}

export interface ReceiptTotalsResult {
  totalAmountOwed: number;
  amountReceived: number;
  outstandingBalance: number;
}

/**
 * Calculate receipt balance.
 * outstandingBalance = max(0, totalAmountOwed - amountReceived)
 */
export function calculateReceiptBalance(
  input: ReceiptTotalsInput
): ReceiptTotalsResult {
  const totalAmountOwed = roundMoney(Math.max(0, input.totalAmountOwed));
  const amountReceived = roundMoney(Math.max(0, input.amountReceived));
  const outstandingBalance = roundMoney(
    Math.max(0, totalAmountOwed - amountReceived)
  );

  return { totalAmountOwed, amountReceived, outstandingBalance };
}

/**
 * Round to 2 decimal places.
 */
function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// =============================================================================
// Number to Words Converter
// =============================================================================

const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

const CURRENCY_WORDS: Record<string, { main: string; sub: string }> = {
  KES: { main: "Shillings", sub: "Cents" },
  USD: { main: "Dollars", sub: "Cents" },
  EUR: { main: "Euros", sub: "Cents" },
  GBP: { main: "Pounds", sub: "Pence" },
  TZS: { main: "Shillings", sub: "Cents" },
  UGX: { main: "Shillings", sub: "Cents" },
};

function convertHundreds(n: number): string {
  if (n === 0) return "";

  let result = "";

  if (n >= 100) {
    result += ONES[Math.floor(n / 100)] + " Hundred";
    n %= 100;
    if (n > 0) result += " and ";
  }

  if (n >= 20) {
    result += TENS[Math.floor(n / 10)];
    if (n % 10 > 0) result += "-" + ONES[n % 10];
  } else if (n > 0) {
    result += ONES[n];
  }

  return result;
}

function convertNumberToWords(n: number): string {
  if (n === 0) return "Zero";

  const parts: string[] = [];
  const scales = ["", "Thousand", "Million", "Billion"];

  let scaleIndex = 0;
  let remaining = Math.floor(Math.abs(n));

  while (remaining > 0) {
    const chunk = remaining % 1000;
    if (chunk > 0) {
      const chunkWords = convertHundreds(chunk);
      if (scales[scaleIndex]) {
        parts.unshift(chunkWords + " " + scales[scaleIndex]);
      } else {
        parts.unshift(chunkWords);
      }
    }
    remaining = Math.floor(remaining / 1000);
    scaleIndex++;
  }

  return parts.join(", ");
}

/**
 * Convert a monetary amount to words.
 * e.g., numberToWords(1500.50, "KES") → "One Thousand, Five Hundred Shillings and Fifty Cents"
 */
export function numberToWords(amount: number, currencyCode: string): string {
  const abs = Math.abs(amount);
  const wholePart = Math.floor(abs);
  const decimalPart = Math.round((abs - wholePart) * 100);

  const currencyInfo = CURRENCY_WORDS[currencyCode] || {
    main: currencyCode,
    sub: "Cents",
  };

  let result = convertNumberToWords(wholePart) + " " + currencyInfo.main;

  if (decimalPart > 0) {
    result += " and " + convertNumberToWords(decimalPart) + " " + currencyInfo.sub;
  }

  if (amount < 0) {
    result = "Negative " + result;
  }

  return result;
}
