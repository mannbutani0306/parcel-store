import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { TopNav } from './TopNav';
import { BottomTabBar } from './BottomTabBar';
import { Footer } from './Footer';
import { CommandPalette } from './CommandPalette';
import { CartDrawer } from './CartDrawer';
import { SessionSafetyModal } from './SessionSafetyModal';
import { ScrollToTop } from './ScrollToTop';
import { Grain, ToastContainer } from '../ui';
import { useParcelStore } from '../../store';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  // 8B. Auto-advance the newest active order one step every ~15 seconds live
  useEffect(() => {
    const timer = setInterval(() => {
      useParcelStore.getState().autoAdvanceNewestOrder();
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // 10E. Dynamic document.title per page
  useEffect(() => {
    const path = location.pathname;
    let pageTitle = 'Postal & Paper Goods';
    if (path === '/') pageTitle = 'Postal & Paper Goods';
    else if (path.startsWith('/shop')) pageTitle = 'All Wares · Catalog';
    else if (path.startsWith('/product/')) pageTitle = 'Dispatch Folio · Ware Details';
    else if (path.startsWith('/cart')) pageTitle = 'Waybill Receipt · Cart';
    else if (path.startsWith('/checkout')) pageTitle = 'Dispatch Manifest · Checkout';
    else if (path === '/orders') pageTitle = 'Postal Waybills · Orders';
    else if (path.startsWith('/orders/')) pageTitle = 'Real-time Route Tracking';
    else if (path.startsWith('/wishlist')) pageTitle = 'Desired Wares · Wishlist';
    else if (path.startsWith('/kit')) pageTitle = 'Design System & Seals';
    else if (path.startsWith('/login')) pageTitle = 'Registry Sign In';
    else if (path.startsWith('/admin')) pageTitle = 'Superintendent Command';
    else if (path.startsWith('/seller')) pageTitle = 'Artisan Workbench';
    else pageTitle = 'Unclaimed Folio';

    document.title = `PARCEL — ${pageTitle}`;
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#F3EBDD] text-[#14231C] selection:bg-[#E8502B] selection:text-[#F3EBDD] flex flex-col font-sans pb-16 md:pb-0">
      <ScrollToTop />
      <Grain />
      <ToastContainer />
      <CommandPalette />
      <CartDrawer />
      <SessionSafetyModal />

      <TopNav />

      <main className="flex-1 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="w-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer />
      <BottomTabBar />
    </div>
  );
};
