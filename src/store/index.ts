import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Product,
  PRODUCTS,
  User,
  UserRole,
  USERS,
  Coupon,
  COUPONS,
  Order,
  SEEDED_ORDERS,
  Review,
  REVIEWS,
  INITIAL_DEMO_BEHAVIOUR,
} from '../data';
import { validateAddToCartQty, validateCoupon } from '../lib/validators';
import { formatOrderId, formatINR } from '../lib/format';

export interface CartItem {
  product: Product;
  quantity: number;
  variant?: string;
}

export interface ActivityEvent {
  id: string;
  type: 'order' | 'review' | 'user' | 'product' | 'coupon' | 'transit';
  title: string;
  description: string;
  timestamp: string; // ISO string
  icon: string;
}

export interface ParcelStoreState {
  // --- AUTH SLICE ---
  currentUser: User | null;
  allUsers: User[];
  setCurrentUser: (user: User | null) => void;
  switchUser: (userId: string) => void;
  login: (email: string, role?: UserRole) => { success: boolean; user?: User; error?: string };
  register: (data: {
    email: string;
    name: string;
    role: UserRole;
    shopName?: string;
  }) => { success: boolean; user?: User; error?: string };
  signOut: () => void;
  lastActiveTime: number;
  touchActivity: () => void;
  sessionWarningOpen: boolean;
  setSessionWarningOpen: (open: boolean) => void;
  resetSessionTimer: () => void;
  toggleUserBlock: (userId: string) => void;

  // --- PRODUCTS SLICE ---
  products: Product[];
  getProductById: (id: string) => Product | undefined;
  addProduct: (productData: Omit<Product, 'id' | 'createdAt' | 'rating' | 'ratingCount'> & { id?: string }) => { success: boolean; product: Product };
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => { success: boolean };
  toggleProductHidden: (id: string) => void;

  // --- CART SLICE ---
  cartItems: CartItem[];
  addToCart: (
    product: Product,
    qty?: number,
    variant?: string
  ) => { success: boolean; error?: string };
  updateQty: (
    productId: string,
    qty: number,
    variant?: string
  ) => { success: boolean; error?: string };
  removeFromCart: (productId: string, variant?: string) => void;
  saveForLater: (productId: string, variant?: string) => void;
  restoreCartItem: (item: CartItem) => void;
  clearCart: () => void;
  getCartSubtotal: () => number;
  getCartTotalItems: () => number;
  getCartTotalWeight: () => number;

  // --- COUPON SLICE ---
  coupons: Coupon[];
  appliedCoupon: Coupon | null;
  applyCoupon: (code: string) => { success: boolean; error?: string };
  removeCoupon: () => void;
  createCoupon: (coupon: Coupon) => { success: boolean; error?: string };
  toggleCouponEnabled: (code: string) => void;
  getDiscountAmount: () => number;
  getFinalTotal: () => number;

  // --- WISHLIST SLICE ---
  wishlist: string[]; // Product IDs
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;

  // --- ORDERS SLICE ---
  orders: Order[];
  placeOrder: (
    shippingAddress: Order['shippingAddress'],
    paymentMethod: string,
    deliverySpeed?: 'standard' | 'express',
    deliveryFeeOverride?: number,
    simulateFailure?: boolean
  ) => {
    success: boolean;
    orderId?: string;
    error?: string;
  };
  cancelOrder: (orderId: string, reason?: string) => { success: boolean; error?: string };
  returnOrder: (orderId: string, reason?: string, itemIds?: string[]) => { success: boolean; error?: string };
  advanceOrderStatus: (orderId: string) => void;
  autoAdvanceNewestOrder: () => void;
  reorder: (orderId: string) => { success: boolean; addedCount: number; error?: string };
  getOrderById: (orderId: string) => Order | undefined;

  // --- REVIEWS SLICE ---
  reviews: Review[];
  addReview: (review: Omit<Review, 'id' | 'date' | 'helpfulCount'>) => { success: boolean };
  markReviewHelpful: (reviewId: string) => void;
  getReviewsForProduct: (productId: string) => Review[];

  // --- BEHAVIOUR SLICE ---
  views: string[];
  cartAdds: string[];
  purchases: string[];
  recordView: (productId: string) => void;

  // --- ACTIVITY FEED SLICE ---
  activities: ActivityEvent[];
  addActivity: (activity: Omit<ActivityEvent, 'id' | 'timestamp'>) => void;

  // --- UI SLICE ---
  drawerOpen: boolean;
  paletteOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  setPaletteOpen: (open: boolean) => void;
  toggleDrawer: () => void;
  togglePalette: () => void;

  // --- RECOMMENDATION ENGINE SLICE ---
  recommenderEngine: 'smart' | 'popular';
  setRecommenderEngine: (engine: 'smart' | 'popular') => void;

  // --- RESET ALL DATA ---
  resetAllData: () => void;
}

const INITIAL_ACTIVITIES: ActivityEvent[] = [
  {
    id: 'act-1',
    type: 'order',
    title: 'Order Placed',
    description: 'Manifest ORD-7402 booked by Aarav Mehta (₹3,200)',
    timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    icon: '📦',
  },
  {
    id: 'act-2',
    type: 'review',
    title: 'Review Stamped',
    description: '5★ review submitted for Valve-Drive Headphone Amp',
    timestamp: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
    icon: '⭐',
  },
  {
    id: 'act-3',
    type: 'user',
    title: 'New Recipient Registered',
    description: 'Sunita Deshmukh joined the postal registry',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    icon: '👤',
  },
  {
    id: 'act-4',
    type: 'transit',
    title: 'Consignment Dispatched',
    description: 'Manifest ORD-6129 departed sorting bay on National Rail',
    timestamp: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString(),
    icon: '🚂',
  },
  {
    id: 'act-5',
    type: 'coupon',
    title: 'Postal Seal Issued',
    description: 'Coupon FIRST100 enabled for all new recipients',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    icon: '🎟️',
  },
];

export const useParcelStore = create<ParcelStoreState>()(
  persist(
    (set, get) => ({
      // --- AUTH INITIAL STATE ---
      allUsers: USERS,
      currentUser: USERS.find((u) => u.id === 'usr-demo') || USERS[4],
      lastActiveTime: Date.now(),
      sessionWarningOpen: false,

      setCurrentUser: (user) => set({ currentUser: user, lastActiveTime: Date.now() }),

      switchUser: (userId) => {
        const found = get().allUsers.find((u) => u.id === userId);
        if (found) {
          set({ currentUser: found, lastActiveTime: Date.now(), sessionWarningOpen: false });
        }
      },

      login: (email, role) => {
        const users = get().allUsers;
        let matched = users.find(
          (u) =>
            u.email.toLowerCase() === email.toLowerCase().trim() &&
            (!role || u.role === role)
        );

        if (!matched && role) {
          matched = users.find((u) => u.role === role);
        }

        if (!matched) {
          // If no match found, create or select sensible fallback
          matched = {
            id: `usr-${Date.now()}`,
            name: email.split('@')[0],
            email: email.trim(),
            role: role || 'customer',
            avatar: role === 'admin' ? '🎩' : role === 'seller' ? '🪵' : '📦',
          };
          set({ allUsers: [...users, matched] });
        }

        set({ currentUser: matched, lastActiveTime: Date.now(), sessionWarningOpen: false });
        return { success: true, user: matched };
      },

      register: ({ email, name, role, shopName }) => {
        const newUser: User = {
          id: `usr-${Date.now()}`,
          name: name.trim() || email.split('@')[0],
          email: email.trim().toLowerCase(),
          role,
          avatar: role === 'admin' ? '🎩' : role === 'seller' ? '🪵' : '🧔🏽',
          sellerShopName: shopName?.trim() || (role === 'seller' ? `${name}'s Workshop` : undefined),
        };

        set((state) => ({
          allUsers: [...state.allUsers, newUser],
          currentUser: newUser,
          lastActiveTime: Date.now(),
          sessionWarningOpen: false,
        }));

        return { success: true, user: newUser };
      },

      signOut: () => {
        set({ currentUser: null, sessionWarningOpen: false });
      },

      touchActivity: () => {
        set({ lastActiveTime: Date.now() });
      },

      setSessionWarningOpen: (open) => {
        set({ sessionWarningOpen: open });
      },

      resetSessionTimer: () => {
        set({ lastActiveTime: Date.now(), sessionWarningOpen: false });
      },

      toggleUserBlock: (userId) => {
        set((state) => ({
          allUsers: state.allUsers.map((u) =>
            u.id === userId ? { ...u, blocked: !u.blocked } : u
          ),
          currentUser:
            state.currentUser?.id === userId
              ? { ...state.currentUser, blocked: !state.currentUser.blocked }
              : state.currentUser,
        }));
      },

      // --- PRODUCTS INITIAL STATE ---
      products: PRODUCTS,

      getProductById: (id) => {
        return get().products.find((p) => p.id === id);
      },

      addProduct: (productData) => {
        const id = productData.id || `ware-${Date.now()}`;
        const newProduct: Product = {
          ...productData,
          id,
          createdAt: new Date().toISOString().split('T')[0],
          rating: 4.8,
          ratingCount: 1,
        };
        set((state) => ({
          products: [newProduct, ...state.products],
        }));
        get().addActivity({
          type: 'product',
          title: 'New Ware Stamped',
          description: `${newProduct.name} added to catalog by ${newProduct.brand}`,
          icon: '🏷️',
        });
        return { success: true, product: newProduct };
      },

      updateProduct: (id, updates) => {
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        }));
      },

      deleteProduct: (id) => {
        const target = get().products.find((p) => p.id === id);
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        }));
        if (target) {
          get().addActivity({
            type: 'product',
            title: 'Ware Retired',
            description: `${target.name} removed from active catalog`,
            icon: '🗑️',
          });
        }
        return { success: true };
      },

      toggleProductHidden: (id) => {
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, hidden: !p.hidden } : p
          ),
        }));
      },

      // --- CART INITIAL STATE (seed with 1 nice item) ---
      cartItems: [
        {
          product: PRODUCTS.find((p) => p.id === 'books-01') || PRODUCTS[0],
          quantity: 1,
          variant: 'Dot Grid',
        },
      ],

      addToCart: (product, qty = 1, variant) => {
        // Validation 1: Qty must be 1-10 integer
        const qtyValidation = validateAddToCartQty(qty);
        if (!qtyValidation.valid) {
          return { success: false, error: qtyValidation.error };
        }

        // Validation 2: Out of stock check
        if (product.stock <= 0) {
          return { success: false, error: 'Item is currently out of stock' };
        }

        const currentItems = get().cartItems;
        const existingIndex = currentItems.findIndex(
          (item) => item.product.id === product.id && item.variant === variant
        );

        if (existingIndex > -1) {
          const newQty = currentItems[existingIndex].quantity + qty;
          const recheck = validateAddToCartQty(newQty);
          if (!recheck.valid) {
            return {
              success: false,
              error: `Cannot add ${qty} more. Maximum 10 units per parcel.`,
            };
          }
          if (newQty > product.stock) {
            return {
              success: false,
              error: `Only ${product.stock} units available in stock.`,
            };
          }

          const updated = [...currentItems];
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: newQty,
          };
          set({ cartItems: updated, drawerOpen: true });
        } else {
          if (qty > product.stock) {
            return {
              success: false,
              error: `Only ${product.stock} units available in stock.`,
            };
          }

          set({
            cartItems: [...currentItems, { product, quantity: qty, variant }],
            drawerOpen: true,
          });
        }

        // Record behaviour
        const currentAdds = get().cartAdds;
        if (!currentAdds.includes(product.id)) {
          set({ cartAdds: [product.id, ...currentAdds.slice(0, 20)] });
        }

        return { success: true };
      },

      updateQty: (productId, qty, variant) => {
        if (qty <= 0) {
          get().removeFromCart(productId, variant);
          return { success: true };
        }

        const qtyValidation = validateAddToCartQty(qty);
        if (!qtyValidation.valid) {
          return { success: false, error: qtyValidation.error };
        }

        const currentItems = get().cartItems;
        const target = currentItems.find(
          (item) => item.product.id === productId && item.variant === variant
        );
        if (target && qty > target.product.stock) {
          return {
            success: false,
            error: `Only ${target.product.stock} units in stock`,
          };
        }

        set({
          cartItems: currentItems.map((item) =>
            item.product.id === productId && item.variant === variant
              ? { ...item, quantity: qty }
              : item
          ),
        });

        return { success: true };
      },

      removeFromCart: (productId, variant) => {
        set((state) => ({
          cartItems: state.cartItems.filter(
            (item) => !(item.product.id === productId && item.variant === variant)
          ),
        }));
      },

      saveForLater: (productId, variant) => {
        const item = get().cartItems.find(
          (i) => i.product.id === productId && i.variant === variant
        );
        if (!item) return;
        if (!get().wishlist.includes(productId)) {
          set((state) => ({ wishlist: [productId, ...state.wishlist] }));
        }
        get().removeFromCart(productId, variant);
      },

      restoreCartItem: (item) => {
        set((state) => ({
          cartItems: [item, ...state.cartItems],
        }));
      },

      clearCart: () => set({ cartItems: [], appliedCoupon: null }),

      getCartSubtotal: () => {
        return get().cartItems.reduce(
          (acc, item) => acc + item.product.price * item.quantity,
          0
        );
      },

      getCartTotalItems: () => {
        return get().cartItems.reduce((acc, item) => acc + item.quantity, 0);
      },

      getCartTotalWeight: () => {
        return get().cartItems.reduce(
          (acc, item) => acc + (item.product.price > 0 ? 250 : 100) * item.quantity,
          0
        );
      },

      // --- COUPON SLICE ---
      coupons: COUPONS,
      appliedCoupon: null,

      applyCoupon: (code) => {
        const normalized = code.trim().toUpperCase();
        const found = get().coupons.find((c) => c.code === normalized);
        if (!found) {
          return { success: false, error: 'Unrecognized coupon stamp' };
        }
        if (found.disabled) {
          return { success: false, error: 'This postal coupon is currently disabled' };
        }

        const subtotal = get().getCartSubtotal();
        const valRes = validateCoupon(normalized, subtotal, found);

        if (!valRes.valid) {
          return { success: false, error: valRes.error };
        }

        set({ appliedCoupon: found });
        return { success: true };
      },

      removeCoupon: () => set({ appliedCoupon: null }),

      createCoupon: (couponData) => {
        const normalizedCode = couponData.code.trim().toUpperCase();
        if (get().coupons.some((c) => c.code === normalizedCode)) {
          return { success: false, error: 'Coupon code already exists in registry' };
        }
        const newCoupon: Coupon = {
          ...couponData,
          code: normalizedCode,
        };
        set((state) => ({
          coupons: [newCoupon, ...state.coupons],
        }));
        get().addActivity({
          type: 'coupon',
          title: 'Postal Coupon Issued',
          description: `Coupon ${newCoupon.code} created (${newCoupon.badge})`,
          icon: '🎟️',
        });
        return { success: true };
      },

      toggleCouponEnabled: (code) => {
        set((state) => ({
          coupons: state.coupons.map((c) =>
            c.code === code ? { ...c, disabled: !c.disabled } : c
          ),
        }));
      },

      getDiscountAmount: () => {
        const coupon = get().appliedCoupon;
        const subtotal = get().getCartSubtotal();
        if (!coupon) return 0;
        const valRes = validateCoupon(coupon.code, subtotal, coupon);
        return valRes.valid && valRes.data ? valRes.data.discount : 0;
      },

      getFinalTotal: () => {
        const subtotal = get().getCartSubtotal();
        const discount = get().getDiscountAmount();
        const coupon = get().appliedCoupon;
        const isFreeShip = coupon?.type === 'shipping' || subtotal >= 999;
        const shippingFee = isFreeShip || subtotal === 0 ? 0 : 80;
        return Math.max(0, subtotal - discount + shippingFee);
      },

      // --- WISHLIST SLICE ---
      wishlist: ['play-01', 'home-03', 'tech-04'],

      toggleWishlist: (productId) => {
        set((state) => {
          const exists = state.wishlist.includes(productId);
          return {
            wishlist: exists
              ? state.wishlist.filter((id) => id !== productId)
              : [productId, ...state.wishlist],
          };
        });
      },

      isWishlisted: (productId) => {
        return get().wishlist.includes(productId);
      },

      // --- ORDERS SLICE ---
      orders: SEEDED_ORDERS,

      placeOrder: (shippingAddress, paymentMethod, deliverySpeed = 'standard', deliveryFeeOverride, simulateFailure = false) => {
        const items = get().cartItems;
        if (items.length === 0) {
          return { success: false, error: 'Cannot dispatch an empty parcel' };
        }

        const subtotal = get().getCartSubtotal();
        const discount = get().getDiscountAmount();
        const coupon = get().appliedCoupon;
        const isFreeShip = coupon?.type === 'shipping' || subtotal >= 999;
        const standardShippingFee = isFreeShip ? 0 : 80;
        const expressShippingFee = 160;
        const shippingFee =
          deliveryFeeOverride !== undefined
            ? deliveryFeeOverride
            : deliverySpeed === 'express'
              ? expressShippingFee
              : standardShippingFee;
        const total = Math.max(0, subtotal - discount + shippingFee);

        const newOrderId = formatOrderId(Math.floor(1000 + Math.random() * 9000));

        // Format payment method display so only last 4 is exposed anywhere
        let sanitizedPayment = paymentMethod;
        if (paymentMethod.toLowerCase().includes('card')) {
          const digits = paymentMethod.replace(/\D/g, '');
          const last4 = digits.length >= 4 ? digits.slice(-4) : '4242';
          sanitizedPayment = `Card (•••• ${last4})`;
        }

        if (simulateFailure) {
          // FAILURE simulation: order created as cancelled, stock NOT decremented, cart KEPT
          const failedOrder: Order = {
            id: newOrderId,
            userId: get().currentUser?.id || 'usr-demo',
            status: 'cancelled',
            deliverySpeed,
            items: items.map((i) => ({
              productId: i.product.id,
              name: i.product.name,
              brand: i.product.brand,
              price: i.product.price,
              quantity: i.quantity,
              emoji: i.product.emoji,
              variant: i.variant,
            })),
            subtotal,
            discount,
            couponCode: coupon?.code,
            shippingFee,
            total,
            createdAt: new Date().toISOString(),
            cancelledAt: new Date().toISOString(),
            cancellationReason: 'Payment authorization declined (simulated 0000 card test)',
            trackingNumber: `INPOST-TRK-${Math.floor(100000 + Math.random() * 900000)}`,
            shippingAddress,
            paymentMethod: sanitizedPayment,
            timeline: [
              {
                status: 'placed',
                label: 'Order Initiated',
                timestamp: new Date().toISOString(),
                description: 'Payment dispatch requested at counter.',
              },
              {
                status: 'cancelled',
                label: 'Payment Failed',
                timestamp: new Date().toISOString(),
                description: 'Gateway error (0000 simulated test failure). Cart inventory preserved.',
              },
            ],
          };

          set((state) => ({
            orders: [failedOrder, ...state.orders],
          }));

          return {
            success: false,
            orderId: newOrderId,
            error: 'Payment declined (simulated card ending 0000). Stock preserved in bag.',
          };
        }

        // SUCCESS FLOW: Stock is really decremented in the store
        const updatedProducts = get().products.map((p) => {
          const match = items.find((i) => i.product.id === p.id);
          if (match) {
            return { ...p, stock: Math.max(0, p.stock - match.quantity) };
          }
          return p;
        });

        const newOrder: Order = {
          id: newOrderId,
          userId: get().currentUser?.id || 'usr-demo',
          status: 'processing',
          deliverySpeed,
          items: items.map((i) => ({
            productId: i.product.id,
            name: i.product.name,
            brand: i.product.brand,
            price: i.product.price,
            quantity: i.quantity,
            emoji: i.product.emoji,
            variant: i.variant,
          })),
          subtotal,
          discount,
          couponCode: coupon?.code,
          shippingFee,
          total,
          createdAt: new Date().toISOString(),
          trackingNumber: `INPOST-TRK-${Math.floor(100000 + Math.random() * 900000)}`,
          shippingAddress,
          paymentMethod: sanitizedPayment,
          timeline: [
            {
              status: 'placed',
              label: 'Order Placed & Stamped',
              timestamp: new Date().toISOString(),
              description: 'Manifest officially stamped and registered in Central Postal System.',
            },
            {
              status: 'processing',
              label: 'Stock Updated & Packing',
              timestamp: new Date().toISOString(),
              description: 'Inventory decremented. Courier notified for pickup at sorting bay.',
            },
          ],
        };

        // Update purchases in behaviour
        const itemIds = items.map((i) => i.product.id);
        const prevPurchases = get().purchases;

        set((state) => ({
          products: updatedProducts,
          orders: [newOrder, ...state.orders],
          cartItems: [],
          appliedCoupon: null,
          drawerOpen: false,
          purchases: Array.from(new Set([...itemIds, ...prevPurchases])),
        }));

        get().addActivity({
          type: 'order',
          title: 'New Order Placed',
          description: `Manifest ${newOrderId} booked (${formatINR(total)})`,
          icon: '📦',
        });

        return { success: true, orderId: newOrderId };
      },

      cancelOrder: (orderId, reason = 'Customer requested cancellation') => {
        const target = get().orders.find((o) => o.id === orderId);
        if (!target) return { success: false, error: 'Order not found' };
        if (target.status === 'delivered') {
          return { success: false, error: 'Delivered orders cannot be cancelled' };
        }
        if (target.status === 'cancelled') {
          return { success: false, error: 'Order is already cancelled' };
        }

        // Restore stock when order is cancelled
        const restoredProducts = get().products.map((p) => {
          const match = target.items.find((i) => i.productId === p.id);
          if (match) {
            return { ...p, stock: p.stock + match.quantity };
          }
          return p;
        });

        set((state) => ({
          products: restoredProducts,
          orders: state.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: 'cancelled',
                  cancelledAt: new Date().toISOString(),
                  cancellationReason: reason,
                  timeline: [
                    ...(o.timeline || []),
                    {
                      status: 'cancelled',
                      label: 'Order Cancelled',
                      timestamp: new Date().toISOString(),
                      description: `Manifest cancelled. Stock restored to active inventory. (${reason})`,
                    },
                  ],
                }
              : o
          ),
        }));

        return { success: true };
      },

      returnOrder: (orderId, reason = 'Customer requested return slip', itemIds) => {
        const target = get().orders.find((o) => o.id === orderId);
        if (!target) return { success: false, error: 'Order not found' };
        if (target.status !== 'delivered') {
          return { success: false, error: 'Only delivered orders can be returned' };
        }

        // Restore stock for returned items
        const restoredProducts = get().products.map((p) => {
          const match = target.items.find(
            (i) => (!itemIds || itemIds.includes(i.productId)) && i.productId === p.id
          );
          if (match) {
            return { ...p, stock: p.stock + match.quantity };
          }
          return p;
        });

        const newTimelineEvent = {
          status: 'returned',
          label: 'Return Requested & Approved',
          timestamp: new Date().toISOString(),
          description: `Return manifest created for ${
            itemIds ? `${itemIds.length} wares` : 'all parcel items'
          }. Reason: ${reason}. Postal reverse pickup scheduled.`,
        };

        set((state) => ({
          products: restoredProducts,
          orders: state.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: 'returned',
                  cancellationReason: reason,
                  timeline: [...(o.timeline || []), newTimelineEvent],
                }
              : o
          ),
        }));

        return { success: true };
      },

      advanceOrderStatus: (orderId) => {
        set((state) => ({
          orders: state.orders.map((o) => {
            if (o.id !== orderId) return o;

            let nextStatus = o.status;
            let label = '';
            let desc = '';

            if (o.status === 'placed') {
              nextStatus = 'packed';
              label = 'Packed at Sorting Desk';
              desc = 'Wares wrapped in parchment and wax-sealed in burlap parcel.';
            } else if (o.status === 'packed' || o.status === 'processing') {
              nextStatus = 'shipped';
              label = 'Dispatched on National Rail';
              desc = 'Consignment transferred to Speed Post railway transit network.';
            } else if (o.status === 'shipped' || o.status === 'dispatched') {
              nextStatus = 'out_for_delivery';
              label = 'Out for Local Delivery';
              desc = 'Postal delivery courier assigned with receipt book.';
            } else if (o.status === 'out_for_delivery') {
              nextStatus = 'delivered';
              label = 'Delivered & Signed';
              desc = 'Postal packet hand-delivered to recipient at destination.';
            }

            if (nextStatus !== o.status) {
              const newTimelineEvent = {
                status: nextStatus,
                label,
                timestamp: new Date().toISOString(),
                description: desc,
              };
              return {
                ...o,
                status: nextStatus,
                deliveredAt: nextStatus === 'delivered' ? new Date().toISOString() : o.deliveredAt,
                timeline: [...(o.timeline || []), newTimelineEvent],
              };
            }
            return o;
          }),
        }));
      },

      autoAdvanceNewestOrder: () => {
        const activeOrders = get().orders.filter(
          (o) =>
            o.status !== 'delivered' &&
            o.status !== 'cancelled' &&
            o.status !== 'returned'
        );
        if (activeOrders.length === 0) return;
        // The newest active order is advanced
        const newest = activeOrders[0];
        get().advanceOrderStatus(newest.id);
      },

      reorder: (orderId) => {
        const target = get().orders.find((o) => o.id === orderId);
        if (!target) return { success: false, addedCount: 0, error: 'Order not found' };

        let count = 0;
        target.items.forEach((item) => {
          const product = get().products.find((p) => p.id === item.productId);
          if (product && product.stock > 0) {
            const qtyToAdd = Math.min(item.quantity, product.stock, 10);
            const res = get().addToCart(product, qtyToAdd, item.variant);
            if (res.success) count += 1;
          }
        });

        if (count > 0) {
          set({ drawerOpen: true });
          return { success: true, addedCount: count };
        } else {
          return {
            success: false,
            addedCount: 0,
            error: 'All items from this order are currently out of stock',
          };
        }
      },

      getOrderById: (orderId) => {
        return get().orders.find((o) => o.id === orderId);
      },

      // --- REVIEWS SLICE ---
      reviews: REVIEWS,

      addReview: (reviewData) => {
        const newReview: Review = {
          ...reviewData,
          id: `rev-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          helpfulCount: 0,
        };

        const currentReviews = [newReview, ...get().reviews];
        const productReviews = currentReviews.filter((r) => r.productId === reviewData.productId);
        const avg = Number(
          (productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length).toFixed(1)
        );

        set((state) => ({
          reviews: currentReviews,
          products: state.products.map((p) =>
            p.id === reviewData.productId
              ? { ...p, rating: avg, ratingCount: productReviews.length }
              : p
          ),
        }));

        get().addActivity({
          type: 'review',
          title: 'Review Stamped',
          description: `${reviewData.rating}★ rating added by ${reviewData.userName}`,
          icon: '⭐',
        });

        return { success: true };
      },

      markReviewHelpful: (reviewId) => {
        set((state) => ({
          reviews: state.reviews.map((r) =>
            r.id === reviewId ? { ...r, helpfulCount: r.helpfulCount + 1 } : r
          ),
        }));
      },

      getReviewsForProduct: (productId) => {
        return get().reviews.filter((r) => r.productId === productId);
      },

      // --- BEHAVIOUR SLICE ---
      views: INITIAL_DEMO_BEHAVIOUR.views,
      cartAdds: INITIAL_DEMO_BEHAVIOUR.cartAdds,
      purchases: INITIAL_DEMO_BEHAVIOUR.purchases,

      recordView: (productId) => {
        set((state) => ({
          views: [productId, ...state.views.filter((id) => id !== productId)].slice(
            0,
            20
          ),
        }));
      },

      // --- ACTIVITY FEED SLICE ---
      activities: INITIAL_ACTIVITIES,

      addActivity: (activity) => {
        const newEvent: ActivityEvent = {
          ...activity,
          id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          timestamp: new Date().toISOString(),
        };
        set((state) => ({
          activities: [newEvent, ...state.activities].slice(0, 50),
        }));
      },

      // --- UI SLICE ---
      drawerOpen: false,
      paletteOpen: false,
      setDrawerOpen: (open) => set({ drawerOpen: open }),
      setPaletteOpen: (open) => set({ paletteOpen: open }),
      toggleDrawer: () => set((state) => ({ drawerOpen: !state.drawerOpen })),
      togglePalette: () => set((state) => ({ paletteOpen: !state.paletteOpen })),
      // --- RECOMMENDATION ENGINE SLICE ---
      recommenderEngine: 'smart',
      setRecommenderEngine: (engine) => set({ recommenderEngine: engine }),

      // --- RESET ALL DATA ---
      resetAllData: () => {
        try {
          localStorage.removeItem('parcel-master-store');
          localStorage.removeItem('parcel-storage');
        } catch {
          // ignore
        }
        set({
          currentUser: USERS[0],
          allUsers: USERS,
          products: PRODUCTS,
          cartItems: [],
          appliedCoupon: null,
          orders: SEEDED_ORDERS,
          wishlist: ['play-01', 'home-03', 'tech-04'],
          views: [],
          cartAdds: [],
          purchases: [],
          reviews: REVIEWS,
          coupons: COUPONS,
          activities: INITIAL_ACTIVITIES,
          recommenderEngine: 'smart',
          drawerOpen: false,
          paletteOpen: false,
        });
      },
    }),
    {
      name: 'parcel-master-store',
      partialize: (state) => ({
        cartItems: state.cartItems,
        appliedCoupon: state.appliedCoupon,
        wishlist: state.wishlist,
        orders: state.orders,
        reviews: state.reviews,
        currentUser: state.currentUser,
        allUsers: state.allUsers,
        products: state.products,
        coupons: state.coupons,
        activities: state.activities,
        views: state.views,
        cartAdds: state.cartAdds,
        purchases: state.purchases,
        recommenderEngine: state.recommenderEngine,
      }),
    }
  )
);
