export type OrderStatus =
  | 'placed'
  | 'packed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'returned'
  | 'processing'
  | 'dispatched';

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  emoji: string;
  variant?: string;
  brand: string;
}

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  shippingFee: number;
  total: number;
  createdAt: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  trackingNumber: string;
  shippingAddress: {
    fullName: string;
    line1: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  paymentMethod: string;
  deliverySpeed?: 'standard' | 'express';
  timeline?: {
    status: string;
    label: string;
    timestamp: string;
    description: string;
  }[];
}

export const SEEDED_ORDERS: Order[] = [
  // Past Order 1: Delivered
  {
    id: 'PRCL-7821-IN',
    userId: 'usr-demo',
    status: 'delivered',
    createdAt: '2026-01-14T10:30:00Z',
    deliveredAt: '2026-01-16T15:45:00Z',
    trackingNumber: 'INPOST-DEL-882194',
    items: [
      {
        productId: 'books-01',
        name: 'Hardcover Postal Journal (A5)',
        brand: 'Jaipur Indigo Press',
        price: 1850,
        quantity: 1,
        emoji: '📓',
        variant: 'Dot Grid',
      },
      {
        productId: 'books-05',
        name: 'Calligrapher Walnut Husk Ink (60ml)',
        brand: 'Deccan Mechanicals',
        price: 580,
        quantity: 1,
        emoji: '🖋️',
        variant: 'Sepia Walnut',
      },
    ],
    subtotal: 2430,
    discount: 243,
    couponCode: 'PARCEL10',
    shippingFee: 0,
    total: 2187,
    shippingAddress: {
      fullName: 'Aarav Mehta',
      line1: 'Flat 4B, Gulmohar Apartments, Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400050',
      phone: '9876543210',
    },
    paymentMethod: 'UPI (aarav@okaxis)',
  },

  // Past Order 2: Delivered
  {
    id: 'PRCL-8349-IN',
    userId: 'usr-demo',
    status: 'delivered',
    createdAt: '2026-01-22T14:15:00Z',
    deliveredAt: '2026-01-25T11:20:00Z',
    trackingNumber: 'INPOST-BOM-910245',
    items: [
      {
        productId: 'play-01',
        name: 'Solid Teak Chess & Draughts Board',
        brand: 'Oiled Oak Studio',
        price: 4800,
        quantity: 1,
        emoji: '♟️',
        variant: 'Teak & Maple',
      },
    ],
    subtotal: 4800,
    discount: 0,
    shippingFee: 0,
    total: 4800,
    shippingAddress: {
      fullName: 'Aarav Mehta',
      line1: 'Flat 4B, Gulmohar Apartments, Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400050',
      phone: '9876543210',
    },
    paymentMethod: 'CARD (•••• 4022)',
  },

  // Past Order 3: Cancelled
  {
    id: 'PRCL-9012-IN',
    userId: 'usr-demo',
    status: 'cancelled',
    createdAt: '2026-02-06T09:00:00Z',
    cancelledAt: '2026-02-06T11:30:00Z',
    cancellationReason: 'Duplicate order placed by mistake',
    trackingNumber: 'INPOST-CAN-001294',
    items: [
      {
        productId: 'tech-01',
        name: 'Valve-Drive Headphone Amp',
        brand: 'Deccan Tone',
        price: 4450,
        quantity: 1,
        emoji: '🎧',
        variant: 'Turned Brass',
      },
    ],
    subtotal: 4450,
    discount: 300,
    couponCode: 'PARCEL10',
    shippingFee: 0,
    total: 4150,
    shippingAddress: {
      fullName: 'Aarav Mehta',
      line1: 'Flat 4B, Gulmohar Apartments, Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400050',
      phone: '9876543210',
    },
    paymentMethod: 'UPI (aarav@okaxis)',
  },
];

export interface CustomerBehaviour {
  views: string[]; // product IDs
  cartAdds: string[];
  purchases: string[];
}

export const INITIAL_DEMO_BEHAVIOUR: CustomerBehaviour = {
  views: ['books-01', 'tech-01', 'home-01', 'style-03', 'play-01', 'beauty-01', 'tech-02'],
  cartAdds: ['books-01', 'home-01', 'tech-01'],
  purchases: ['books-01', 'books-05', 'play-01'],
};
