// lib/utils/format.ts — Currency formatting helpers

export interface CurrencyInfo {
  code: string;
  symbol: string;
  flag: string;
}

// Alias for backward compatibility
export type Currency = CurrencyInfo;

export const CURRENCIES: CurrencyInfo[] = [
  { code: "KES", symbol: "KSh", flag: "🇰🇪" },
  { code: "USD", symbol: "$", flag: "🇺🇸" },
  { code: "EUR", symbol: "€", flag: "🇪🇺" },
  { code: "GBP", symbol: "£", flag: "🇬🇧" },
  { code: "TZS", symbol: "TSh", flag: "🇹🇿" },
  { code: "UGX", symbol: "USh", flag: "🇺🇬" },
];

/**
 * Format a number as currency using the appropriate locale and symbol.
 */
export function formatCurrency(
  amount: number,
  currencyCode: string = "KES"
): string {
  const currency = CURRENCIES.find((c) => c.code === currencyCode);

  try {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Fallback for unsupported currency codes
    const symbol = currency?.symbol || currencyCode;
    return `${symbol} ${amount.toFixed(2)}`;
  }
}

/**
 * Format a number with commas (no currency symbol).
 */
export function formatNumber(amount: number, decimals: number = 2): string {
  return new Intl.NumberFormat("en-KE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/**
 * Format a date for display.
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

/**
 * Format a date for input fields (YYYY-MM-DD).
 */
export function formatDateInput(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().split("T")[0];
}

/**
 * Get currency info by code.
 */
export function getCurrency(code: string): CurrencyInfo {
  return (
    CURRENCIES.find((c) => c.code === code) || {
      code,
      symbol: code,
      flag: "🏳️",
    }
  );
}
