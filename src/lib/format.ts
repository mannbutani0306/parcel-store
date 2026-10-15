/**
 * Indian Rupee and Postal Formatter utilities
 */

/**
 * Format currency with Indian numbering system (e.g., ₹1,24,999 or ₹2,499)
 */
export function formatINR(amount: number): string {
  const rounded = Math.round(amount);
  const isNegative = rounded < 0;
  const absVal = Math.abs(rounded).toString();

  if (absVal.length <= 3) {
    return `${isNegative ? '-' : ''}₹${absVal}`;
  }

  // Last 3 digits
  const lastThree = absVal.substring(absVal.length - 3);
  const otherDigits = absVal.substring(0, absVal.length - 3);

  // Group by 2 digits from right to left
  const withCommas = otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ',');

  return `${isNegative ? '-' : ''}₹${withCommas},${lastThree}`;
}

/**
 * Generate or format a postal parcel order ID (DM Mono style)
 */
export function formatOrderId(id?: number | string): string {
  if (typeof id === 'string' && id.startsWith('PRCL-')) return id;
  const num = id !== undefined ? Math.abs(Number(id)) : Math.floor(1000 + Math.random() * 9000);
  return `PRCL-${num}-IN`;
}

/**
 * Format postal tracking date (e.g., "14 Oct 2026")
 */
export function formatDate(date: Date | string | number = new Date()): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format parcel weight in grams or kilograms
 */
export function formatWeight(grams: number): string {
  if (grams >= 1000) {
    return `${(grams / 1000).toFixed(1)} kg`;
  }
  return `${grams} g`;
}
