import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { BrandWordmark, HandHeart, Stamp } from '../ui';
import { useParcelStore } from '../../store';
import { useToastStore } from '../../store/toastStore';

export const TopNav: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const {
    currentUser,
    wishlist,
    getCartTotalItems,
    setPaletteOpen,
    toggleDrawer,
    signOut,
  } = useParcelStore();

  const { addToast } = useToastStore();
  const navigate = useNavigate();

  const totalCartCount = getCartTotalItems();
  const wishlistCount = wishlist.length;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close account menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    if (accountMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [accountMenuOpen]);

  const handleSignOut = () => {
    setAccountMenuOpen(false);
    signOut();
    addToast({
      title: 'Signed Out',
      message: 'Your parcel bag remains safely packed.',
      variant: 'stamp',
    });
    navigate('/');
  };

  return (
    <header
      className={`
        sticky top-0 z-40 transition-all duration-200 border-b-[1.5px] border-[#14231C]
        ${
          isScrolled
            ? 'py-2.5 bg-[#F3EBDD] shadow-[0_3px_0_#14231C]'
            : 'py-4 bg-[#F3EBDD]'
        }
      `}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left: Brand Wordmark */}
        <div className="flex items-center gap-6 shrink-0">
          <Link
            to="/"
            className="inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14231C] rounded-md"
          >
            <BrandWordmark size={isScrolled ? 'sm' : 'md'} />
          </Link>

          {/* Clean nav link for desktop */}
          <nav className="hidden lg:flex items-center gap-5 text-xs font-label-mono text-[#14231C]/80">
            <Link to="/shop" className="hover:text-[#14231C] hover:underline underline-offset-4">
              SHOP ALL
            </Link>
            <Link to="/orders" className="hover:text-[#14231C] hover:underline underline-offset-4">
              ORDERS
            </Link>
          </nav>
        </div>

        {/* Centre: Search Pill opening ⌘K Command Palette */}
        <div className="flex-1 max-w-md mx-2 sm:mx-6">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="w-full flex items-center justify-between gap-2 px-3.5 py-1.5 rounded-full border-[1.5px] border-[#14231C] bg-[#EADFCB] hover:bg-[#EADFCB]/80 text-[#14231C]/75 text-xs font-medium cursor-pointer shadow-[2px_2px_0_#14231C] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14231C]"
            aria-label="Open search command palette"
          >
            <div className="flex items-center gap-2 truncate">
              <span className="text-sm">🔎</span>
              <span className="truncate text-xs text-[#14231C]/70">
                Search 36 wares, folios, stamps...
              </span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 font-label-mono text-[10px] px-1.5 py-0.2 rounded border border-[#14231C]/30 bg-[#F3EBDD] text-[#14231C]/65">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right side: Wishlist, Account Sticker, Cart Button */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
          {/* Wishlist Heart */}
          <Link
            to="/wishlist"
            className="relative p-1.5 rounded-full hover:bg-[#14231C]/8 text-[#14231C] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14231C]"
            aria-label={`View wishlist with ${wishlistCount} items`}
          >
            <HandHeart
              size={20}
              filled={wishlistCount > 0}
              className={wishlistCount > 0 ? 'text-[#E8502B]' : ''}
            />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-[#E8502B] text-[#F3EBDD] text-[9px] font-mono font-bold leading-none border-[1px] border-[#14231C]">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Account Sticker with Popover Menu */}
          <div className="relative" ref={menuRef}>
            {currentUser ? (
              <button
                type="button"
                onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                className="group flex items-center gap-1.5 p-1 rounded-full border-[1.5px] border-[#14231C] bg-[#EADFCB] hover:bg-[#14231C] hover:text-[#F3EBDD] transition-colors cursor-pointer shadow-[2px_2px_0_#14231C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14231C]"
                title={`Account: ${currentUser.name} (${currentUser.role})`}
                aria-label="User account menu"
                aria-expanded={accountMenuOpen}
              >
                <span className="text-sm sm:text-base leading-none select-none px-0.5">
                  {currentUser.avatar}
                </span>
                <span className="hidden md:inline font-label-mono text-[10px] pr-1 group-hover:text-[#F3EBDD]">
                  {currentUser.name.split(' ')[0]}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="font-label-mono text-xs px-2.5 py-1 rounded-[6px] border-[1.5px] border-[#14231C] bg-[#EADFCB] hover:bg-[#14231C] hover:text-[#F3EBDD] transition-colors shadow-[2px_2px_0_#14231C] cursor-pointer"
              >
                SIGN IN
              </button>
            )}

            {/* Account Popover Menu */}
            <AnimatePresence>
              {accountMenuOpen && currentUser && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                  className="absolute right-0 top-full mt-2 w-64 bg-[#F3EBDD] border-[1.5px] border-[#14231C] rounded-[16px] shadow-[4px_4px_0_#14231C] p-3.5 z-50 space-y-3"
                >
                  {/* User profile card */}
                  <div className="flex items-center gap-2.5 pb-2.5 border-b border-[#14231C]/15">
                    <span className="w-10 h-10 rounded-full border-[1.5px] border-[#14231C] bg-[#EADFCB] flex items-center justify-center text-xl shrink-0 shadow-[1px_1px_0_#14231C]">
                      {currentUser.avatar}
                    </span>
                    <div className="min-w-0">
                      <p className="font-fraunces font-semibold text-sm text-[#14231C] truncate leading-tight">
                        {currentUser.name}
                      </p>
                      <p className="font-mono text-[10px] text-[#14231C]/60 truncate">
                        {currentUser.email}
                      </p>
                      <div className="mt-1">
                        <Stamp
                          text={currentUser.role.toUpperCase()}
                          size="sm"
                          variant={
                            currentUser.role === 'admin'
                              ? 'tomato'
                              : currentUser.role === 'seller'
                                ? 'saffron'
                                : 'mint'
                          }
                          rotation={0}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Nav Links */}
                  <div className="space-y-1 text-xs font-mono">
                    <Link
                      to="/orders"
                      onClick={() => setAccountMenuOpen(false)}
                      className="flex items-center justify-between p-2 rounded-[6px] hover:bg-[#EADFCB] text-[#14231C] transition-colors"
                    >
                      <span>Order Slips</span>
                      <span className="font-label-mono text-[10px] text-[#14231C]/50">📜</span>
                    </Link>

                    <Link
                      to="/wishlist"
                      onClick={() => setAccountMenuOpen(false)}
                      className="flex items-center justify-between p-2 rounded-[6px] hover:bg-[#EADFCB] text-[#14231C] transition-colors"
                    >
                      <span>Saved Wares</span>
                      <span className="font-label-mono text-[10px] text-[#14231C]/50">❤️</span>
                    </Link>

                    {currentUser.role === 'seller' && (
                      <Link
                        to="/seller"
                        onClick={() => setAccountMenuOpen(false)}
                        className="flex items-center justify-between p-2 rounded-[6px] hover:bg-[#EADFCB] text-[#14231C] transition-colors font-semibold"
                      >
                        <span>Seller Workbench</span>
                        <span className="font-label-mono text-[10px]">🪵</span>
                      </Link>
                    )}

                    {currentUser.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setAccountMenuOpen(false)}
                        className="flex items-center justify-between p-2 rounded-[6px] hover:bg-[#EADFCB] text-[#14231C] transition-colors font-semibold"
                      >
                        <span>Superintendent Registry</span>
                        <span className="font-label-mono text-[10px]">🎩</span>
                      </Link>
                    )}

                    <Link
                      to="/login"
                      onClick={() => setAccountMenuOpen(false)}
                      className="flex items-center justify-between p-2 rounded-[6px] hover:bg-[#EADFCB] text-[#14231C] transition-colors"
                    >
                      <span>Switch Persona</span>
                      <span className="font-label-mono text-[10px] text-[#14231C]/50">🔄</span>
                    </Link>
                  </div>

                  {/* Sign Out Action */}
                  <div className="pt-2 border-t border-[#14231C]/15">
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full text-left p-2 rounded-[6px] hover:bg-[#E8502B]/10 text-xs font-mono font-semibold text-[#E8502B] transition-colors cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Cart Button with Bouncing Count Badge */}
          <button
            type="button"
            onClick={toggleDrawer}
            className="relative flex items-center gap-2 px-3 py-1.5 rounded-[8px] border-[1.5px] border-[#14231C] bg-[#14231C] text-[#F3EBDD] shadow-[3px_3px_0_#E8502B] hover:shadow-[4px_4px_0_#E8502B] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer select-none font-medium text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8502B]"
            aria-label="Open cart bag"
          >
            <span className="text-sm">📦</span>
            <span className="hidden sm:inline">Bag</span>

            {/* Bouncing badge */}
            <motion.span
              key={totalCartCount}
              initial={{ scale: 0.7, y: -4 }}
              animate={{ scale: [1, 1.25, 1], y: [0, -3, 0] }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className={`
                px-1.5 py-0.2 rounded-full font-mono text-[10px] font-bold leading-none
                ${
                  totalCartCount > 0
                    ? 'bg-[#E8502B] text-[#F3EBDD]'
                    : 'bg-[#F3EBDD]/20 text-[#F3EBDD]'
                }
              `}
            >
              {totalCartCount}
            </motion.span>
          </button>
        </div>
      </div>
    </header>
  );
};
