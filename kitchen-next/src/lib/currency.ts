/**
 * Currency utilities for handling minor units (cents/kopeks)
 * 
 * All prices in the database are stored in minor units:
 * - USD: cents (1 dollar = 100 cents)
 * - UAH: kopeks (1 hryvnia = 100 kopeks)
 */

/**
 * Convert minor units to major units for display
 * @param minorUnits - Amount in minor units (cents/kopeks)
 * @returns Amount in major units (dollars/hryvnias)
 */
export function toMajorUnits(minorUnits: number): number {
  return minorUnits / 100;
}

/**
 * Convert major units to minor units for storage
 * @param majorUnits - Amount in major units (dollars/hryvnias)
 * @returns Amount in minor units (cents/kopeks)
 */
export function toMinorUnits(majorUnits: number): number {
  return Math.round(majorUnits * 100);
}

/**
 * Format price from minor units for display (whole numbers only)
 * @param minorUnits - Amount in minor units (cents/kopeks)
 * @returns Formatted string without decimal places
 */
export function formatPriceFromMinor(minorUnits: number): string {
  const majorUnits = toMajorUnits(minorUnits);
  return new Intl.NumberFormat("uk-UA", {
    maximumFractionDigits: 0,
  }).format(majorUnits);
}

/**
 * Format price from minor units with currency symbol
 * @param minorUnits - Amount in minor units (cents/kopeks)
 * @param currency - Currency code (USD, UAH)
 * @returns Formatted string with currency symbol
 */
export function formatPriceWithCurrency(minorUnits: number, currency: string = "USD"): string {
  const majorUnits = toMajorUnits(minorUnits);
  const symbol = currency === "UAH" ? "₴" : "$";
  return `${symbol}${new Intl.NumberFormat("uk-UA", {
    maximumFractionDigits: 0,
  }).format(majorUnits)}`;
}

