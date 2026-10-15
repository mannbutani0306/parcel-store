/**
 * Backward compatibility wrapper for cartStore
 */
import { useParcelStore } from './index';

export const useCartStore = () => {
  const store = useParcelStore();

  return {
    items: store.cartItems,
    isDrawerOpen: store.drawerOpen,
    addItem: (product: any, quantity = 1, variant?: string) =>
      store.addToCart(product, quantity, variant),
    removeItem: (productId: string, variant?: string) =>
      store.removeFromCart(productId, variant),
    updateQuantity: (productId: string, quantity: number, variant?: string) =>
      store.updateQty(productId, quantity, variant),
    clearCart: store.clearCart,
    openDrawer: () => store.setDrawerOpen(true),
    closeDrawer: () => store.setDrawerOpen(false),
    toggleDrawer: store.toggleDrawer,
    getTotalItems: store.getCartTotalItems,
    getSubtotal: store.getCartSubtotal,
    getTotalWeight: store.getCartTotalWeight,
  };
};
