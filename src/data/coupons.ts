import { CouponRule } from '../lib/validators';

export interface Coupon extends CouponRule {
  description: string;
  badge: string;
  disabled?: boolean;
}

export const COUPONS: Coupon[] = [
  {
    code: 'PARCEL10',
    type: 'percent',
    value: 10,
    maxDiscount: 300,
    minOrder: 500,
    description: '10% off any postal order up to ₹300 discount.',
    badge: '10% OFF',
  },
  {
    code: 'FIRST100',
    type: 'flat',
    value: 100,
    minOrder: 499,
    description: 'Flat ₹100 discount on your first order above ₹499.',
    badge: '₹100 OFF',
  },
  {
    code: 'FREESHIP',
    type: 'shipping',
    value: 0,
    description: 'Complimentary postal dispatch on your entire order.',
    badge: 'FREE DELIVERY',
  },
  {
    code: 'MONSOON25',
    type: 'percent',
    value: 25,
    maxDiscount: 500,
    minOrder: 1200,
    expiryDate: '2024-09-30', // expired
    description: 'Seasonal monsoon postal discount (expired).',
    badge: 'EXPIRED',
  },
];
