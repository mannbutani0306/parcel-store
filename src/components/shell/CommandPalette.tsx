import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useParcelStore } from '../../store';
import { CATEGORIES } from '../../data';
import { formatINR } from '../../lib/format';

interface PaletteItem {
  id: string;
  title: string;
  subtitle?: string;
  category: 'Pages' | 'Categories' | 'Wares';
  emoji: string;
  url: string;
  price?: number;
}

export const CommandPalette: React.FC = () => {
  const { paletteOpen, setPaletteOpen, products } = useParcelStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Listen for global ⌘K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(!paletteOpen);
      } else if (e.key === 'Escape' && paletteOpen) {
        e.preventDefault();
        setPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [paletteOpen, setPaletteOpen]);

  // Focus input when opened
  useEffect(() => {
    if (paletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [paletteOpen]);

  // Build searchable items list
  const pages: PaletteItem[] = [
    { id: 'page-home', title: 'Home Front', subtitle: 'Storefront & curated wares', category: 'Pages', emoji: '🏠', url: '/' },
    { id: 'page-shop', title: 'All Wares', subtitle: 'Browse the full 36-item catalog', category: 'Pages', emoji: '🛍️', url: '/shop' },
    { id: 'page-cart', title: 'Postal Bag', subtitle: 'Review packed parcels and checkout', category: 'Pages', emoji: '📦', url: '/cart' },
    { id: 'page-orders', title: 'Order Slips', subtitle: 'Past dispatches, manifests, and receipts', category: 'Pages', emoji: '📜', url: '/orders' },
    { id: 'page-wishlist', title: 'Saved Wares', subtitle: 'Your starred items', category: 'Pages', emoji: '❤️', url: '/wishlist' },
    { id: 'page-login', title: 'Switch User Account', subtitle: 'Toggle Admin, Seller, or Customer persona', category: 'Pages', emoji: '👤', url: '/login' },
    { id: 'page-seller', title: 'Seller Workbench', subtitle: 'Manage stock and shop wares', category: 'Pages', emoji: '🪵', url: '/seller' },
    { id: 'page-admin', title: 'Admin Registry', subtitle: 'Central dispatch manifest and order status', category: 'Pages', emoji: '🎩', url: '/admin' },
  ];

  const categoryItems: PaletteItem[] = CATEGORIES.map((cat) => ({
    id: `cat-${cat.id}`,
    title: cat.name,
    subtitle: cat.description,
    category: 'Categories',
    emoji: cat.emoji,
    url: `/shop?category=${cat.id}`,
  }));

  const productItems: PaletteItem[] = products.map((p) => ({
    id: `prod-${p.id}`,
    title: p.name,
    subtitle: `${p.brand} · ${p.shortDesc}`,
    category: 'Wares',
    emoji: p.emoji,
    url: `/product/${p.id}`,
    price: p.price,
  }));

  const allItems: PaletteItem[] = [...pages, ...categoryItems, ...productItems];

  const filteredItems = query.trim()
    ? allItems.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.subtitle?.toLowerCase().includes(query.toLowerCase()) ||
          item.category.toLowerCase().includes(query.toLowerCase())
      )
    : [
        ...pages.slice(0, 4),
        ...categoryItems.slice(0, 4),
        ...productItems.slice(0, 5),
      ];

  const handleSelect = (item: PaletteItem) => {
    setPaletteOpen(false);
    navigate(item.url);
  };

  const handleKeyDownNav = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev <= 0 ? filteredItems.length - 1 : prev - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleSelect(filteredItems[selectedIndex]);
      }
    }
  };

  return (
    <AnimatePresence>
      {paletteOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setPaletteOpen(false)}
            className="fixed inset-0 bg-[#14231C]/55 backdrop-blur-[2px]"
          />

          {/* Palette Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="relative w-full max-w-2xl bg-[#F3EBDD] border-[1.5px] border-[#14231C] rounded-[22px] shadow-[6px_6px_0_#14231C] overflow-hidden z-10"
          >
            {/* Search Input Header */}
            <div className="p-4 bg-[#EADFCB] border-b-[1.5px] border-[#14231C] flex items-center gap-3">
              <span className="text-lg select-none">🔎</span>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDownNav}
                placeholder="Search wares, categories, or order pages..."
                className="w-full bg-transparent border-none outline-none font-medium text-sm sm:text-base text-[#14231C] placeholder-[#14231C]/45"
              />
              <span className="font-label-mono text-[10px] px-1.5 py-0.5 rounded border border-[#14231C]/40 bg-[#F3EBDD] text-[#14231C]/60 shrink-0">
                ESC TO CLOSE
              </span>
            </div>

            {/* Results List */}
            <div className="max-h-[60vh] overflow-y-auto p-2 divide-y divide-[#14231C]/10">
              {filteredItems.length === 0 ? (
                <div className="py-12 text-center text-[#14231C]/60 space-y-1">
                  <p className="font-fraunces text-base font-semibold">No wares or records found</p>
                  <p className="font-label-mono text-[11px]">Try checking spelling or search a category</p>
                </div>
              ) : (
                filteredItems.map((item, idx) => {
                  const isSelected = idx === selectedIndex;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`
                        flex items-center justify-between gap-3 p-3 rounded-[10px] cursor-pointer transition-colors duration-100
                        ${
                          isSelected
                            ? 'bg-[#14231C] text-[#F3EBDD]'
                            : 'hover:bg-[#EADFCB] text-[#14231C]'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xl shrink-0">{item.emoji}</span>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate leading-snug">
                            {item.title}
                          </p>
                          {item.subtitle && (
                            <p
                              className={`text-xs truncate ${
                                isSelected ? 'text-[#F3EBDD]/70' : 'text-[#14231C]/60'
                              }`}
                            >
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.price !== undefined && (
                          <span
                            className={`font-mono font-semibold text-xs ${
                              isSelected ? 'text-[#F4B63F]' : 'text-[#E8502B]'
                            }`}
                          >
                            {formatINR(item.price)}
                          </span>
                        )}
                        <span
                          className={`
                            font-label-mono text-[9px] px-1.5 py-0.5 rounded border
                            ${
                              isSelected
                                ? 'border-[#F3EBDD]/30 text-[#F3EBDD]/80 bg-[#F3EBDD]/10'
                                : 'border-[#14231C]/20 text-[#14231C]/60 bg-[#EADFCB]'
                            }
                          `}
                        >
                          {item.category}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer keyboard hints */}
            <div className="px-4 py-2 bg-[#EADFCB] border-t-[1.5px] border-[#14231C] flex items-center justify-between text-[10px] font-label-mono text-[#14231C]/60">
              <span>↑↓ TO NAVIGATE</span>
              <span>ENTER TO SELECT</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
