/**
 * Validation rules and typed error handlers
 */

export interface ValidationResult<T = void> {
  valid: boolean;
  error?: string;
  data?: T;
}

/**
 * addToCart accepts qty 1-10 only.
 * Reject 0, negatives, >10, and non-integers with typed error.
 */
export function validateAddToCartQty(qty: unknown): ValidationResult<number> {
  if (typeof qty !== 'number' || isNaN(qty)) {
    return { valid: false, error: 'Quantity must be a valid number' };
  }
  if (!Number.isInteger(qty)) {
    return { valid: false, error: 'Quantity must be a whole number' };
  }
  if (qty <= 0) {
    return { valid: false, error: 'Quantity must be at least 1' };
  }
  if (qty > 10) {
    return { valid: false, error: 'Maximum 10 units per parcel' };
  }
  return { valid: true, data: qty };
}

/**
 * Indian PIN code: exactly 6 digits, first digit non-zero (1-9)
 */
export function isValidPinCode(pin: string): boolean {
  return /^[1-9][0-9]{5}$/.test(pin.trim());
}

/**
 * Indian mobile number: 10 digits starting with 6, 7, 8, or 9
 */
export function isValidIndianPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-+]/g, '');
  const tenDigit = cleaned.length === 12 && cleaned.startsWith('91') ? cleaned.slice(2) : cleaned;
  return /^[6-9]\d{9}$/.test(tenDigit);
}

/**
 * Standard email validation
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Luhn algorithm check for credit/debit card numbers
 */
export function isValidCardLuhn(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

/**
 * Coupon validation interface
 */
export interface CouponRule {
  code: string;
  type: 'percent' | 'flat' | 'shipping';
  value: number; // e.g. 10 for 10% or 100 for ₹100
  minOrder?: number;
  maxDiscount?: number;
  expiryDate?: string; // YYYY-MM-DD
}

export function validateCoupon(
  code: string,
  subtotal: number,
  coupon?: CouponRule
): ValidationResult<{ discount: number; freeShipping: boolean }> {
  if (!coupon) {
    return { valid: false, error: 'Invalid coupon stamp' };
  }

  if (coupon.expiryDate) {
    const expiry = new Date(coupon.expiryDate);
    if (new Date() > expiry) {
      return { valid: false, error: 'This coupon stamp has expired' };
    }
  }

  if (coupon.minOrder && subtotal < coupon.minOrder) {
    return {
      valid: false,
      error: `Requires minimum parcel value of ₹${coupon.minOrder}`,
    };
  }

  let discount = 0;
  let freeShipping = false;

  if (coupon.type === 'percent') {
    discount = Math.round((subtotal * coupon.value) / 100);
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
  } else if (coupon.type === 'flat') {
    discount = Math.min(coupon.value, subtotal);
  } else if (coupon.type === 'shipping') {
    freeShipping = true;
  }

  return {
    valid: true,
    data: { discount, freeShipping },
  };
}

export function isNotEmpty(value: string, minLength = 2): boolean {
  return value.trim().length >= minLength;
}
