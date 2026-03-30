/**
 * Format a number as Israeli New Shekel (NIS) currency.
 * Prices are stored in agorot (cents) internally.
 */
export function formatCurrency(agorot: number): string {
  const shekels = agorot / 100;
  return `₪${shekels.toLocaleString("he-IL", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function formatCurrencyRange(minAgorot: number, maxAgorot: number): string {
  return `${formatCurrency(minAgorot)} - ${formatCurrency(maxAgorot)}`;
}

/**
 * Convert shekels to agorot for storage.
 */
export function shekelToAgorot(shekels: number): number {
  return Math.round(shekels * 100);
}

/**
 * Convert agorot to shekels for display.
 */
export function agorotToShekel(agorot: number): number {
  return agorot / 100;
}
