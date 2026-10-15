import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Chip,
  Button,
  Sticker,
  Tag,
  Stamp,
  RatingStars,
  Skeleton,
  Modal,
  Stepper,
  Sheet,
  HandHeart,
  HandArrow,
  ScribbleUnderline,
  FlyingArcSticker,
  FlyingItem,
} from '../components/ui';
import { CATEGORIES, Product } from '../data';
import { useParcelStore } from '../store';
import { useToastStore } from '../store/toastStore';
import { formatINR } from '../lib/format';
import {
  fuzzyMatch,
  getHighlightedChunks,
  getRecentSearches,
  saveRecentSearch,
  clearRecentSearches,
} from '../lib/search';

/**
 * Text component with highlight on matched search substrings
 */
const HighlightedText: React.FC<{
  text: string;
  query: string;
  className?: string;
}> = ({ text, query, className = '' }) => {
  const chunks = useMemo(() => getHighlightedChunks(text, query), [text, query]);

  return (
    <span className={className}>
      {chunks.map((c, i) =>
        c.isMatch ? (
          <mark
            key={i}
            className="bg-[#F4B63F]/60 text-[#14231C] px-0.5 rounded-[2px] font-bold"
          >
            {c.text}
          </mark>
        ) : (
          <span key={i}>{c.text}</span>
        )
      )}
    </span>
  );
};

export const ShopPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { products, addToCart, recordView, wishlist, toggleWishlist } = useParcelStore();
  const { addToast } = useToastStore();

  // --- URL QUERY PARAMS AS SOURCE OF TRUTH ---
  const categoryParam = searchParams.get('category') || 'all';
  const queryParam = searchParams.get('q') || '';
  const sortParam = (searchParams.get('sort') || 'relevance') as
    | 'relevance'
    | 'price-asc'
    | 'price-desc'
    | 'rating'
    | 'newest';
  const viewParam = (searchParams.get('view') || 'grid') as 'grid' | 'list';
  const minPriceParam = Number(searchParams.get('minPrice')) || 0;
  const maxPriceParam = Number(searchParams.get('maxPrice')) || 6000;
  const ratingParam = Number(searchParams.get('rating')) || 0;
  const inStockParam = searchParams.get('inStock') === '1';
  const onSaleParam = searchParams.get('onSale') === '1';
  const brandsParam = useMemo(() => {
    const raw = searchParams.get('brands');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

  // --- LOCAL UI STATES ---
  const [searchInput, setSearchInput] = useState(queryParam);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Quick look modal state
  const [quickLookProduct, setQuickLookProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [quickLookQty, setQuickLookQty] = useState(1);

  // Flying stickers animation state
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);

  // 600-900ms skeleton shimmer on filter change
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const filterTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load recent searches
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Sync search input with URL
  useEffect(() => {
    setSearchInput(queryParam);
  }, [queryParam]);

  // Debounced search query sync to URL
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== queryParam) {
        updateFilterParams({ q: searchInput.trim() || undefined });
        if (searchInput.trim().length >= 2) {
          const updated = saveRecentSearch(searchInput.trim());
          setRecentSearches(updated);
        }
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Helper to trigger 700ms skeleton shimmer
  const triggerFilterShimmer = () => {
    setIsFilterLoading(true);
    if (filterTimerRef.current) clearTimeout(filterTimerRef.current);
    filterTimerRef.current = setTimeout(() => {
      setIsFilterLoading(false);
    }, 720);
  };

  // Generic param updater
  const updateFilterParams = (updates: Record<string, string | number | boolean | undefined>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, val]) => {
      if (val === undefined || val === '' || val === 'all' || val === 0 || val === false) {
        next.delete(key);
      } else {
        next.set(key, String(val));
      }
    });
    setSearchParams(next, { replace: true });
    triggerFilterShimmer();
  };

  // Derive unique brands and product counts
  const availableBrands = useMemo(() => {
    const brandCounts: Record<string, number> = {};
    products.forEach((p) => {
      brandCounts[p.brand] = (brandCounts[p.brand] || 0) + 1;
    });
    return Object.keys(brandCounts)
      .sort()
      .map((brand) => ({
        name: brand,
        count: brandCounts[brand],
      }));
  }, [products]);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => !p.hidden);

    // 1. Category
    if (categoryParam !== 'all') {
      result = result.filter((p) => p.category === categoryParam);
    }

    // 2. Search query (fuzzy with typo-tolerance)
    if (queryParam.trim()) {
      const q = queryParam.trim();
      result = result
        .map((p) => {
          const nameScore = fuzzyMatch(p.name, q);
          const brandScore = fuzzyMatch(p.brand, q);
          const catScore = fuzzyMatch(p.category, q);
          const tagScores = p.tags.map((t) => fuzzyMatch(t, q));
          const maxTagScore = tagScores.length ? Math.max(...tagScores.map((s) => s.score)) : 0;
          const descScore = fuzzyMatch(p.shortDesc, q);

          const totalScore = Math.max(
            nameScore.score * 1.5,
            brandScore.score * 1.2,
            catScore.score,
            maxTagScore,
            descScore.score * 0.8
          );
          const matches =
            nameScore.matches ||
            brandScore.matches ||
            catScore.matches ||
            tagScores.some((t) => t.matches) ||
            descScore.matches;

          return { product: p, matches, score: totalScore };
        })
        .filter((item) => item.matches)
        .sort((a, b) => b.score - a.score)
        .map((item) => item.product);
    }

    // 3. Price range
    result = result.filter((p) => p.price >= minPriceParam && p.price <= maxPriceParam);

    // 4. Minimum rating
    if (ratingParam > 0) {
      result = result.filter((p) => p.rating >= ratingParam);
    }

    // 5. Brands
    if (brandsParam.length > 0) {
      result = result.filter((p) => brandsParam.includes(p.brand));
    }

    // 6. In stock only
    if (inStockParam) {
      result = result.filter((p) => p.stock > 0);
    }

    // 7. On sale only
    if (onSaleParam) {
      result = result.filter((p) => p.mrp > p.price);
    }

    // 8. Sorting
    if (sortParam === 'price-asc') {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sortParam === 'price-desc') {
      result = [...result].sort((a, b) => b.price - a.price);
    } else if (sortParam === 'rating') {
      result = [...result].sort((a, b) => b.rating - a.rating);
    } else if (sortParam === 'newest') {
      result = [...result].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return result;
  }, [
    products,
    categoryParam,
    queryParam,
    minPriceParam,
    maxPriceParam,
    ratingParam,
    brandsParam,
    inStockParam,
    onSaleParam,
    sortParam,
  ]);

  // Active filter count for mobile badge
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (categoryParam !== 'all') count++;
    if (queryParam) count++;
    if (minPriceParam > 0 || maxPriceParam < 6000) count++;
    if (ratingParam > 0) count++;
    if (brandsParam.length > 0) count += brandsParam.length;
    if (inStockParam) count++;
    if (onSaleParam) count++;
    return count;
  }, [
    categoryParam,
    queryParam,
    minPriceParam,
    maxPriceParam,
    ratingParam,
    brandsParam,
    inStockParam,
    onSaleParam,
  ]);

  // Handle Quick Add with Flying Arc Sticker animation
  const handleQuickAdd = (product: Product, e: React.MouseEvent, variant?: string, qty = 1) => {
    e.stopPropagation();

    // Spawn flying sticker arc
    const rect = e.currentTarget.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;

    setFlyingItems((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        emoji: product.emoji,
        startX,
        startY,
      },
    ]);

    const res = addToCart(product, qty, variant);
    if (res.success) {
      addToast({
        title: 'Packed in Bag',
        message: `${product.name} packed into your parcel`,
        variant: 'tomato',
      });
    } else {
      addToast({
        title: 'Notice',
        message: res.error || 'Could not pack ware',
        variant: 'stamp',
      });
    }
  };

  // Open Quick Look Modal
  const handleOpenQuickLook = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    setQuickLookProduct(product);
    setSelectedVariant(product.variants?.[0]?.options[0] || '');
    setQuickLookQty(1);
  };

  // Toggle wishlist with toast & heart pop
  const handleToggleWishlist = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isSaved = wishlist.includes(productId);
    toggleWishlist(productId);
    addToast({
      title: isSaved ? 'Removed from Wishlist' : 'Saved to Wishlist',
      message: isSaved ? 'Removed from your saved wares' : 'Added to your dispatch wishlist',
      variant: isSaved ? 'stamp' : 'wax',
    });
  };

  const handleClearAllFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true });
    setSearchInput('');
    triggerFilterShimmer();
  };

  const handleBrandToggle = (brand: string) => {
    const nextBrands = brandsParam.includes(brand)
      ? brandsParam.filter((b) => b !== brand)
      : [...brandsParam, brand];
    updateFilterParams({ brands: nextBrands.length ? nextBrands.join(',') : undefined });
  };

  // Category name title
  const currentCategoryObj = CATEGORIES.find((c) => c.id === categoryParam);
  const categoryTitle = currentCategoryObj ? `${currentCategoryObj.name} Wares` : 'All Wares';

  // Search auto-suggestions
  const searchSuggestions = useMemo(() => {
    if (!searchInput.trim()) return [];
    return products
      .filter((p) => p.name.toLowerCase().includes(searchInput.toLowerCase()))
      .slice(0, 4);
  }, [products, searchInput]);

  // Filter Rail Content Component (shared between desktop rail & mobile sheet)
  const FilterRailContent = (
    <div className="space-y-6 text-sm">
      {/* 1. Category Filter */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-label-mono text-xs font-bold text-[#14231C]">DEPARTMENT</span>
          {categoryParam !== 'all' && (
            <button
              type="button"
              onClick={() => updateFilterParams({ category: undefined })}
              className="font-label-mono text-[10px] text-[#E8502B] hover:underline"
            >
              RESET
            </button>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => updateFilterParams({ category: undefined })}
            className={`flex items-center justify-between px-3 py-1.5 rounded-[8px] text-xs font-medium border-[1.5px] transition-all cursor-pointer ${
              categoryParam === 'all'
                ? 'bg-[#14231C] text-[#F3EBDD] border-[#14231C] shadow-[2px_2px_0_#E8502B]'
                : 'bg-[#F3EBDD] text-[#14231C] border-[#14231C]/30 hover:border-[#14231C]'
            }`}
          >
            <span>All Wares</span>
            <span className="font-mono text-[10px] opacity-75">{products.length}</span>
          </button>
          {CATEGORIES.map((cat) => {
            const count = products.filter((p) => p.category === cat.id).length;
            const isSelected = categoryParam === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => updateFilterParams({ category: cat.id })}
                className={`flex items-center justify-between px-3 py-1.5 rounded-[8px] text-xs font-medium border-[1.5px] transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#14231C] text-[#F3EBDD] border-[#14231C] shadow-[2px_2px_0_#E8502B]'
                    : 'bg-[#F3EBDD] text-[#14231C] border-[#14231C]/30 hover:border-[#14231C]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>{cat.emoji}</span>
                  <span>{cat.name}</span>
                </span>
                <span className="font-mono text-[10px] opacity-75">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Dual-handle Price Slider with live labels */}
      <div className="space-y-3 pt-3 border-t-[1.5px] border-[#14231C]/20">
        <div className="flex items-center justify-between">
          <span className="font-label-mono text-xs font-bold text-[#14231C]">PRICE RANGE</span>
          <span className="font-mono text-xs font-bold text-[#E8502B]">
            {formatINR(minPriceParam)} – {formatINR(maxPriceParam)}
          </span>
        </div>

        <div className="space-y-2">
          {/* Dual Range Track */}
          <div className="relative h-6 flex items-center">
            <div className="absolute w-full h-2 rounded-full bg-[#14231C]/15 border border-[#14231C]/20" />
            <div
              className="absolute h-2 rounded-full bg-[#E8502B]"
              style={{
                left: `${(minPriceParam / 6000) * 100}%`,
                right: `${Math.max(0, 100 - (maxPriceParam / 6000) * 100)}%`,
              }}
            />
            {/* Min Slider */}
            <input
              type="range"
              min={0}
              max={6000}
              step={100}
              value={minPriceParam}
              onChange={(e) => {
                const val = Math.min(Number(e.target.value), maxPriceParam - 200);
                updateFilterParams({ minPrice: val });
              }}
              className="absolute w-full appearance-none bg-transparent pointer-events-auto cursor-pointer accent-[#14231C]"
              aria-label="Minimum price"
            />
            {/* Max Slider */}
            <input
              type="range"
              min={0}
              max={6000}
              step={100}
              value={maxPriceParam}
              onChange={(e) => {
                const val = Math.max(Number(e.target.value), minPriceParam + 200);
                updateFilterParams({ maxPrice: val });
              }}
              className="absolute w-full appearance-none bg-transparent pointer-events-auto cursor-pointer accent-[#E8502B]"
              aria-label="Maximum price"
            />
          </div>

          {/* Price Presets */}
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => updateFilterParams({ minPrice: 0, maxPrice: 1500 })}
              className="text-[10px] font-label-mono py-1 rounded border border-[#14231C]/30 bg-[#F3EBDD] hover:bg-[#14231C] hover:text-[#F3EBDD] transition-colors"
            >
              &lt; ₹1.5K
            </button>
            <button
              type="button"
              onClick={() => updateFilterParams({ minPrice: 1500, maxPrice: 3500 })}
              className="text-[10px] font-label-mono py-1 rounded border border-[#14231C]/30 bg-[#F3EBDD] hover:bg-[#14231C] hover:text-[#F3EBDD] transition-colors"
            >
              ₹1.5K-₹3.5K
            </button>
            <button
              type="button"
              onClick={() => updateFilterParams({ minPrice: 3500, maxPrice: 6000 })}
              className="text-[10px] font-label-mono py-1 rounded border border-[#14231C]/30 bg-[#F3EBDD] hover:bg-[#14231C] hover:text-[#F3EBDD] transition-colors"
            >
              &gt; ₹3.5K
            </button>
          </div>
        </div>
      </div>

      {/* 3. Minimum Rating (clickable stars) */}
      <div className="space-y-2 pt-3 border-t-[1.5px] border-[#14231C]/20">
        <div className="flex items-center justify-between">
          <span className="font-label-mono text-xs font-bold text-[#14231C]">MINIMUM RATING</span>
          {ratingParam > 0 && (
            <button
              type="button"
              onClick={() => updateFilterParams({ rating: undefined })}
              className="font-label-mono text-[10px] text-[#E8502B] hover:underline"
            >
              ANY
            </button>
          )}
        </div>

        <div className="space-y-1.5">
          {[4.5, 4.0, 3.5].map((starVal) => (
            <button
              key={starVal}
              type="button"
              onClick={() =>
                updateFilterParams({ rating: ratingParam === starVal ? undefined : starVal })
              }
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-[8px] text-xs font-medium border-[1.5px] transition-all cursor-pointer ${
                ratingParam === starVal
                  ? 'bg-[#14231C] text-[#F3EBDD] border-[#14231C] shadow-[2px_2px_0_#E8502B]'
                  : 'bg-[#F3EBDD] text-[#14231C] border-[#14231C]/30 hover:border-[#14231C]'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <RatingStars rating={starVal} size={14} />
                <span className="font-mono text-xs">&amp; up</span>
              </div>
              <span className="font-label-mono text-[9px] opacity-70">
                ({products.filter((p) => p.rating >= starVal).length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Brands (derived checkboxes) */}
      <div className="space-y-2.5 pt-3 border-t-[1.5px] border-[#14231C]/20">
        <div className="flex items-center justify-between">
          <span className="font-label-mono text-xs font-bold text-[#14231C]">ARTISAN BRAND</span>
          {brandsParam.length > 0 && (
            <button
              type="button"
              onClick={() => updateFilterParams({ brands: undefined })}
              className="font-label-mono text-[10px] text-[#E8502B] hover:underline"
            >
              CLEAR ({brandsParam.length})
            </button>
          )}
        </div>

        <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
          {availableBrands.map((b) => {
            const isChecked = brandsParam.includes(b.name);
            return (
              <label
                key={b.name}
                className="flex items-center justify-between text-xs font-sans text-[#14231C] cursor-pointer select-none p-1 rounded hover:bg-[#14231C]/5"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleBrandToggle(b.name)}
                    className="accent-[#14231C] rounded w-4 h-4 cursor-pointer"
                  />
                  <span className={isChecked ? 'font-semibold text-[#14231C]' : 'text-[#14231C]/80'}>
                    {b.name}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-[#14231C]/50">({b.count})</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 5. Quick Toggles: In stock only & On sale */}
      <div className="space-y-2 pt-3 border-t-[1.5px] border-[#14231C]/20">
        <span className="font-label-mono text-xs font-bold text-[#14231C]">DISPATCH AVAILABILITY</span>

        <div className="space-y-2">
          <label className="flex items-center justify-between p-2 rounded-[8px] border-[1.5px] border-[#14231C]/30 bg-[#F3EBDD] cursor-pointer select-none hover:border-[#14231C]">
            <span className="text-xs font-label-mono font-medium text-[#14231C]">IN STOCK ONLY</span>
            <input
              type="checkbox"
              checked={inStockParam}
              onChange={(e) => updateFilterParams({ inStock: e.target.checked ? '1' : undefined })}
              className="accent-[#14231C] w-4 h-4 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-2 rounded-[8px] border-[1.5px] border-[#14231C]/30 bg-[#F3EBDD] cursor-pointer select-none hover:border-[#14231C]">
            <span className="text-xs font-label-mono font-medium text-[#14231C] flex items-center gap-1.5">
              <span>SPECIAL RATE</span>
              <span className="text-[10px] text-[#E8502B]">★</span>
            </span>
            <input
              type="checkbox"
              checked={onSaleParam}
              onChange={(e) => updateFilterParams({ onSale: e.target.checked ? '1' : undefined })}
              className="accent-[#E8502B] w-4 h-4 cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* 6. Clear All Button */}
      {activeFiltersCount > 0 && (
        <div className="pt-2">
          <Button variant="secondary" size="sm" onClick={handleClearAllFilters} className="w-full">
            Clear All Filters ({activeFiltersCount})
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
      {/* Flying Arc Sticker Particles Container */}
      <FlyingArcSticker
        items={flyingItems}
        onComplete={(id) => setFlyingItems((prev) => prev.filter((i) => i.id !== id))}
      />

      {/* 4A. HEADER: Category title in Fraunces, animated count, grid/list toggle, sort dropdown */}
      <header className="space-y-4 border-b-[1.5px] border-[#14231C] pb-6">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="font-label-mono px-2 py-0.5 rounded-[4px] border-[1px] border-[#14231C] bg-[#EADFCB] text-[10px]">
              PARCEL CATALOGUE
            </span>
            <span className="font-label-mono text-xs text-[#14231C]/65">
              ALL 36 VERIFIED DISPATCHES
            </span>
          </div>

          {/* Mobile Filter Button */}
          <button
            type="button"
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border-[1.5px] border-[#14231C] bg-[#EADFCB] text-xs font-label-mono font-bold shadow-[2px_2px_0_#14231C] cursor-pointer"
          >
            <span>FILTERS</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#E8502B] text-[#F3EBDD] text-[10px] flex items-center justify-center font-mono">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
          <div>
            <div className="flex items-baseline gap-3">
              <h1 className="font-fraunces text-3xl sm:text-4xl font-semibold tracking-tight text-[#14231C]">
                {categoryTitle}
              </h1>

              {/* Animated result count */}
              <motion.span
                key={filteredProducts.length}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="font-mono text-base sm:text-lg font-bold text-[#E8502B]"
              >
                ({filteredProducts.length})
              </motion.span>
            </div>
            <div className="w-36 text-[#E8502B] mt-1">
              <ScribbleUnderline />
            </div>
          </div>

          {/* 4C. SEARCH INPUT with debounce, fuzzy matching, suggestions, & recent searches */}
          <div className="relative w-full md:w-80">
            <div className="relative flex items-center">
              <span className="absolute left-3 text-sm pointer-events-none text-[#14231C]/60">🔍</span>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                placeholder="Search name, brand, tag, folio..."
                className="w-full pl-9 pr-8 py-2 rounded-[10px] border-[1.5px] border-[#14231C] bg-[#EADFCB] text-xs font-medium text-[#14231C] placeholder-[#14231C]/50 outline-none focus:bg-[#F3EBDD] focus:shadow-[2px_2px_0_#14231C] transition-all"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    updateFilterParams({ q: undefined });
                  }}
                  className="absolute right-2.5 text-xs text-[#14231C]/60 hover:text-[#14231C]"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Suggestions & Recent Searches Dropdown */}
            <AnimatePresence>
              {isSearchFocused && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="absolute left-0 right-0 top-full mt-1.5 bg-[#F3EBDD] border-[1.5px] border-[#14231C] rounded-[12px] shadow-[4px_4px_0_#14231C] p-3 z-30 space-y-3"
                >
                  {/* Backdrop click to dismiss */}
                  <div
                    className="fixed inset-0 z-[-1]"
                    onClick={() => setIsSearchFocused(false)}
                  />

                  {/* Instant suggestions */}
                  {searchSuggestions.length > 0 && (
                    <div className="space-y-1">
                      <p className="font-label-mono text-[9px] text-[#14231C]/60">SUGGESTIONS</p>
                      {searchSuggestions.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSearchInput(p.name);
                            setIsSearchFocused(false);
                            updateFilterParams({ q: p.name });
                          }}
                          className="flex items-center justify-between p-1.5 rounded hover:bg-[#EADFCB] cursor-pointer text-xs font-sans text-[#14231C]"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span>{p.emoji}</span>
                            <HighlightedText text={p.name} query={searchInput} />
                          </div>
                          <span className="font-mono text-[10px] text-[#14231C]/60">
                            {formatINR(p.price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <div className="space-y-1 pt-1 border-t border-[#14231C]/15">
                      <div className="flex items-center justify-between">
                        <p className="font-label-mono text-[9px] text-[#14231C]/60">RECENT SEARCHES</p>
                        <button
                          type="button"
                          onClick={() => {
                            clearRecentSearches();
                            setRecentSearches([]);
                          }}
                          className="font-label-mono text-[9px] text-[#E8502B] hover:underline"
                        >
                          CLEAR
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {recentSearches.map((term) => (
                          <button
                            key={term}
                            type="button"
                            onClick={() => {
                              setSearchInput(term);
                              setIsSearchFocused(false);
                              updateFilterParams({ q: term });
                            }}
                            className="px-2 py-0.5 rounded-[4px] border border-[#14231C]/30 bg-[#EADFCB] text-[11px] font-sans hover:bg-[#14231C] hover:text-[#F3EBDD] transition-colors"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Toolbar: Result view toggles & Sort dropdown */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          {/* View Toggle */}
          <div className="flex items-center gap-1.5 p-1 rounded-[8px] border-[1.5px] border-[#14231C] bg-[#EADFCB] shadow-[2px_2px_0_#14231C]">
            <button
              type="button"
              onClick={() => updateFilterParams({ view: 'grid' })}
              className={`px-3 py-1 rounded-[5px] text-xs font-label-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewParam === 'grid'
                  ? 'bg-[#14231C] text-[#F3EBDD]'
                  : 'text-[#14231C]/70 hover:text-[#14231C]'
              }`}
            >
              <span>⊞</span>
              <span>GRID</span>
            </button>
            <button
              type="button"
              onClick={() => updateFilterParams({ view: 'list' })}
              className={`px-3 py-1 rounded-[5px] text-xs font-label-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewParam === 'list'
                  ? 'bg-[#14231C] text-[#F3EBDD]'
                  : 'text-[#14231C]/70 hover:text-[#14231C]'
              }`}
            >
              <span>☰</span>
              <span>LIST</span>
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 text-xs font-label-mono">
            <span className="text-[#14231C]/70 font-bold">SORT BY:</span>
            <select
              value={sortParam}
              onChange={(e) => updateFilterParams({ sort: e.target.value })}
              className="bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[8px] px-3 py-1.5 text-xs font-mono font-semibold text-[#14231C] outline-none shadow-[2px_2px_0_#14231C] cursor-pointer"
            >
              <option value="relevance">Relevance &amp; Match</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Rating: Highest First</option>
              <option value="newest">Newest Arrivals</option>
            </select>
          </div>
        </div>

        {/* 4B. ACTIVE FILTERS REMOVABLE CHIPS with exit animation */}
        <AnimatePresence>
          {activeFiltersCount > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap items-center gap-2 pt-2"
            >
              <span className="font-label-mono text-[10px] text-[#14231C]/60 uppercase">
                ACTIVE FILTERS:
              </span>

              {categoryParam !== 'all' && (
                <motion.button
                  layout
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  onClick={() => updateFilterParams({ category: undefined })}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border-[1.5px] border-[#14231C] bg-[#EADFCB] text-xs font-medium shadow-[1px_1px_0_#14231C] hover:bg-[#E8502B] hover:text-[#F3EBDD] transition-colors cursor-pointer"
                >
                  <span>{currentCategoryObj?.emoji} {currentCategoryObj?.name}</span>
                  <span className="font-bold text-[10px]">✕</span>
                </motion.button>
              )}

              {queryParam && (
                <motion.button
                  layout
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  onClick={() => {
                    setSearchInput('');
                    updateFilterParams({ q: undefined });
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border-[1.5px] border-[#14231C] bg-[#EADFCB] text-xs font-medium shadow-[1px_1px_0_#14231C] hover:bg-[#E8502B] hover:text-[#F3EBDD] transition-colors cursor-pointer"
                >
                  <span>"{queryParam}"</span>
                  <span className="font-bold text-[10px]">✕</span>
                </motion.button>
              )}

              {(minPriceParam > 0 || maxPriceParam < 6000) && (
                <motion.button
                  layout
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  onClick={() => updateFilterParams({ minPrice: undefined, maxPrice: undefined })}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border-[1.5px] border-[#14231C] bg-[#EADFCB] text-xs font-medium shadow-[1px_1px_0_#14231C] hover:bg-[#E8502B] hover:text-[#F3EBDD] transition-colors cursor-pointer"
                >
                  <span>₹{minPriceParam} - ₹{maxPriceParam}</span>
                  <span className="font-bold text-[10px]">✕</span>
                </motion.button>
              )}

              {ratingParam > 0 && (
                <motion.button
                  layout
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  onClick={() => updateFilterParams({ rating: undefined })}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border-[1.5px] border-[#14231C] bg-[#EADFCB] text-xs font-medium shadow-[1px_1px_0_#14231C] hover:bg-[#E8502B] hover:text-[#F3EBDD] transition-colors cursor-pointer"
                >
                  <span>★ {ratingParam}+</span>
                  <span className="font-bold text-[10px]">✕</span>
                </motion.button>
              )}

              {brandsParam.map((b) => (
                <motion.button
                  key={b}
                  layout
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  onClick={() => handleBrandToggle(b)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border-[1.5px] border-[#14231C] bg-[#EADFCB] text-xs font-medium shadow-[1px_1px_0_#14231C] hover:bg-[#E8502B] hover:text-[#F3EBDD] transition-colors cursor-pointer"
                >
                  <span>{b}</span>
                  <span className="font-bold text-[10px]">✕</span>
                </motion.button>
              ))}

              {inStockParam && (
                <motion.button
                  layout
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  onClick={() => updateFilterParams({ inStock: undefined })}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border-[1.5px] border-[#14231C] bg-[#EADFCB] text-xs font-medium shadow-[1px_1px_0_#14231C] hover:bg-[#E8502B] hover:text-[#F3EBDD] transition-colors cursor-pointer"
                >
                  <span>In Stock</span>
                  <span className="font-bold text-[10px]">✕</span>
                </motion.button>
              )}

              {onSaleParam && (
                <motion.button
                  layout
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  onClick={() => updateFilterParams({ onSale: undefined })}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border-[1.5px] border-[#14231C] bg-[#EADFCB] text-xs font-medium shadow-[1px_1px_0_#14231C] hover:bg-[#E8502B] hover:text-[#F3EBDD] transition-colors cursor-pointer"
                >
                  <span>Special Rate</span>
                  <span className="font-bold text-[10px]">✕</span>
                </motion.button>
              )}

              <button
                type="button"
                onClick={handleClearAllFilters}
                className="font-label-mono text-xs text-[#E8502B] font-bold hover:underline ml-2"
              >
                Clear all
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* MAIN CONTENT AREA: Left Shelf Filter Rail + Right Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Sticky Shelf Filter Rail (Desktop) */}
        <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 sticky top-24 space-y-4">
          <div className="bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[18px] p-5 shadow-[3px_3px_0_#14231C] space-y-6">
            <div className="flex items-center justify-between border-b-[1.5px] border-[#14231C] pb-3">
              <span className="font-fraunces font-semibold text-lg text-[#14231C]">
                Postal <span className="font-fraunces-italic font-normal">Filters</span>
              </span>
              <Stamp text="SHELF 01" size="sm" variant="ink" rotation={2} />
            </div>

            {FilterRailContent}
          </div>
        </aside>

        {/* Right Products Results Area */}
        <main className="lg:col-span-8 xl:col-span-9 space-y-6">
          {/* 4E. Skeleton Shimmer for 600-900ms on every filter change */}
          {isFilterLoading ? (
            <div
              className={
                viewParam === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-4'
              }
            >
              {Array.from({ length: 6 }).map((_, i) =>
                viewParam === 'grid' ? (
                  <div
                    key={i}
                    className="bg-[#EADFCB] border-[1.5px] border-[#14231C]/20 rounded-[18px] p-5 space-y-4"
                  >
                    <Skeleton height={160} rounded="tag" />
                    <Skeleton height={20} width="70%" rounded="tag" />
                    <Skeleton height={14} width="90%" rounded="tag" />
                    <div className="flex justify-between pt-2">
                      <Skeleton height={24} width={70} rounded="tag" />
                      <Skeleton height={32} width={90} rounded="tag" />
                    </div>
                  </div>
                ) : (
                  <div
                    key={i}
                    className="bg-[#EADFCB] border-[1.5px] border-[#14231C]/20 rounded-[18px] p-5 flex gap-5"
                  >
                    <Skeleton height={110} width={110} rounded="tag" />
                    <div className="flex-1 space-y-3">
                      <Skeleton height={24} width="50%" rounded="tag" />
                      <Skeleton height={14} width="80%" rounded="tag" />
                      <Skeleton height={28} width={120} rounded="tag" />
                    </div>
                  </div>
                )
              )}
            </div>
          ) : filteredProducts.length === 0 ? (
            /* 4E. Illustrated Empty State (🫥 "Nothing here yet") with reset button */
            <div className="py-20 text-center space-y-5 bg-[#EADFCB] rounded-[22px] border-[1.5px] border-[#14231C] p-8 shadow-[4px_4px_0_#14231C]">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-[#14231C] bg-[#F3EBDD] flex items-center justify-center mx-auto text-4xl shadow-[2px_2px_0_#14231C]">
                🫥
              </div>

              <div className="space-y-2">
                <Stamp text="NO WARES FOUND" size="md" variant="tomato" rotation={-4} />
                <h3 className="font-fraunces text-2xl font-semibold text-[#14231C]">
                  Nothing here yet
                </h3>
                <p className="text-xs text-[#14231C]/75 font-sans max-w-sm mx-auto leading-relaxed">
                  We inspected every postbox, shelf, and drawer, but couldn't locate any wares
                  matching this combination of filters.
                </p>
              </div>

              <div className="pt-2">
                <Button variant="primary" size="md" onClick={handleClearAllFilters}>
                  Reset All Filters
                </Button>
              </div>
            </div>
          ) : viewParam === 'grid' ? (
            /* 4D. GRID VIEW PRODUCT CARDS */
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7"
            >
              <AnimatePresence>
                {filteredProducts.map((product) => {
                  const isWish = wishlist.includes(product.id);
                  const isOutOfStock = product.stock === 0;
                  const isLowStock = product.stock > 0 && product.stock <= 3;
                  const discountPct =
                    product.mrp > product.price
                      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
                      : 0;

                  return (
                    <motion.article
                      key={product.id}
                      layout
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      whileHover={{
                        y: -6,
                        rotate: -1,
                        transition: { duration: 0.2 },
                      }}
                      onClick={() => {
                        recordView(product.id);
                        navigate(`/product/${product.id}`);
                      }}
                      className="bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[18px] p-5 shadow-[3px_3px_0_#14231C] hover:shadow-[5px_5px_0_#14231C] flex flex-col justify-between group transition-all duration-200 cursor-pointer relative"
                    >
                      {/* Top Header: Brand, Wishlist Heart & Stock Stamp */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex flex-col">
                          <span className="font-label-mono text-[9px] text-[#14231C]/60 uppercase">
                            <HighlightedText text={product.brand} query={queryParam} />
                          </span>
                          <span className="font-label-mono text-[8px] text-[#14231C]/40 uppercase">
                            {product.category}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isOutOfStock ? (
                            <Stamp text="SOLD OUT" size="sm" variant="tomato" rotation={-3} />
                          ) : isLowStock ? (
                            <Stamp
                              text={`ONLY ${product.stock} LEFT`}
                              size="sm"
                              variant="saffron"
                              rotation={2}
                            />
                          ) : discountPct > 0 ? (
                            <Stamp text={`-${discountPct}%`} size="sm" variant="mint" rotation={-2} />
                          ) : null}

                          {/* Wishlist Heart with Pop */}
                          <motion.button
                            type="button"
                            whileTap={{ scale: 1.35 }}
                            onClick={(e) => handleToggleWishlist(product.id, e)}
                            className="p-1.5 rounded-full border-[1.5px] border-[#14231C] bg-[#F3EBDD] hover:bg-[#E8502B]/10 transition-colors cursor-pointer shadow-[1px_1px_0_#14231C]"
                            aria-label={isWish ? 'Remove from wishlist' : 'Add to wishlist'}
                          >
                            <HandHeart
                              size={15}
                              filled={isWish}
                              className={isWish ? 'text-[#E8502B]' : 'text-[#14231C]'}
                            />
                          </motion.button>
                        </div>
                      </div>

                      {/* Visual Backdrop with Emoji Sticker & Tag */}
                      <div
                        className="relative w-full h-44 rounded-[12px] border-[1.5px] border-[#14231C] flex items-center justify-center overflow-hidden p-4 group-hover:brightness-95 transition-all"
                        style={{ backgroundColor: product.bgHex }}
                      >
                        {/* Pattern overlay */}
                        <div
                          className="absolute inset-0 opacity-15 pointer-events-none"
                          style={{
                            backgroundImage:
                              product.pattern === 'dots'
                                ? 'radial-gradient(#14231C 1.5px, transparent 1.5px)'
                                : product.pattern === 'stripes'
                                  ? 'repeating-linear-gradient(45deg, #14231C, #14231C 2px, transparent 2px, transparent 12px)'
                                  : 'radial-gradient(#14231C 1px, transparent 1px)',
                            backgroundSize: product.pattern === 'dots' ? '14px 14px' : undefined,
                          }}
                        />

                        <Sticker
                          emoji={product.emoji}
                          color={product.backdropColor}
                          size="xl"
                          rotation={-2}
                        />

                        <div className="absolute bottom-2.5 right-2.5">
                          <Tag
                            price={product.price}
                            size="sm"
                            withString={false}
                            variant={product.backdropColor === 'kraft' ? 'paper' : 'kraft'}
                          />
                        </div>

                        {/* Quick Look overlay button */}
                        <button
                          type="button"
                          onClick={(e) => handleOpenQuickLook(product, e)}
                          className="absolute top-2.5 left-2.5 px-2 py-1 rounded-[6px] border-[1px] border-[#14231C] bg-[#F3EBDD]/90 text-[10px] font-label-mono font-bold text-[#14231C] opacity-0 group-hover:opacity-100 transition-opacity shadow-[1px_1px_0_#14231C] hover:bg-[#14231C] hover:text-[#F3EBDD]"
                        >
                          👁 QUICK LOOK
                        </button>
                      </div>

                      {/* Product Details */}
                      <div className="mt-4 space-y-1.5 flex-1">
                        <h3 className="font-fraunces text-base sm:text-lg font-semibold text-[#14231C] group-hover:text-[#E8502B] transition-colors leading-snug">
                          <HighlightedText text={product.name} query={queryParam} />
                        </h3>

                        <p className="text-xs text-[#14231C]/75 line-clamp-2">
                          {product.shortDesc}
                        </p>

                        <div className="pt-1">
                          <RatingStars
                            rating={product.rating}
                            reviewCount={product.ratingCount}
                            size={13}
                            showValue
                          />
                        </div>
                      </div>

                      {/* Footer Actions: Price + Quick Add */}
                      <div className="mt-4 pt-3 border-t-[1.5px] border-[#14231C]/20 flex items-center justify-between gap-2">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-mono font-bold text-base text-[#14231C]">
                            {formatINR(product.price)}
                          </span>
                          {product.mrp > product.price && (
                            <span className="font-mono text-xs text-[#14231C]/40 line-through">
                              {formatINR(product.mrp)}
                            </span>
                          )}
                        </div>

                        <Button
                          variant="primary"
                          size="sm"
                          disabled={isOutOfStock}
                          onClick={(e) => handleQuickAdd(product, e)}
                        >
                          {isOutOfStock ? 'Sold Out' : 'Add to Bag'}
                        </Button>
                      </div>
                    </motion.article>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          ) : (
            /* 4D. LIST VIEW PRODUCT CARDS */
            <motion.div layout className="space-y-4">
              <AnimatePresence>
                {filteredProducts.map((product) => {
                  const isWish = wishlist.includes(product.id);
                  const isOutOfStock = product.stock === 0;
                  const discountPct =
                    product.mrp > product.price
                      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
                      : 0;

                  return (
                    <motion.article
                      key={product.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      whileHover={{ x: 4, transition: { duration: 0.15 } }}
                      onClick={() => {
                        recordView(product.id);
                        navigate(`/product/${product.id}`);
                      }}
                      className="bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[18px] p-5 shadow-[3px_3px_0_#14231C] hover:shadow-[4px_4px_0_#14231C] flex flex-col sm:flex-row items-center justify-between gap-5 group cursor-pointer"
                    >
                      {/* Left Visual */}
                      <div
                        className="w-full sm:w-44 h-36 rounded-[12px] border-[1.5px] border-[#14231C] flex items-center justify-center shrink-0 relative overflow-hidden"
                        style={{ backgroundColor: product.bgHex }}
                      >
                        <Sticker emoji={product.emoji} size="lg" rotation={-2} />
                        {discountPct > 0 && (
                          <div className="absolute top-2 left-2">
                            <Stamp text={`-${discountPct}%`} size="sm" variant="mint" rotation={-4} />
                          </div>
                        )}
                      </div>

                      {/* Middle Details */}
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-label-mono text-[9px] text-[#14231C]/60 uppercase">
                            <HighlightedText text={product.brand} query={queryParam} />
                          </span>
                          <span className="font-label-mono text-[9px] text-[#14231C]/40 uppercase">
                            · {product.category}
                          </span>
                        </div>

                        <h3 className="font-fraunces text-lg sm:text-xl font-semibold text-[#14231C] group-hover:text-[#E8502B] transition-colors leading-tight">
                          <HighlightedText text={product.name} query={queryParam} />
                        </h3>

                        <p className="text-xs text-[#14231C]/75 line-clamp-2 max-w-xl">
                          {product.shortDesc}
                        </p>

                        <div className="flex items-center gap-4 pt-1">
                          <RatingStars
                            rating={product.rating}
                            reviewCount={product.ratingCount}
                            size={13}
                            showValue
                          />
                          <button
                            type="button"
                            onClick={(e) => handleOpenQuickLook(product, e)}
                            className="font-label-mono text-[10px] text-[#14231C]/75 hover:text-[#E8502B] hover:underline"
                          >
                            👁 Quick Look
                          </button>
                        </div>
                      </div>

                      {/* Right Price & CTAs */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-[#14231C]/15">
                        <div className="flex sm:flex-col items-baseline sm:items-end gap-1.5">
                          <span className="font-mono font-bold text-lg text-[#14231C]">
                            {formatINR(product.price)}
                          </span>
                          {product.mrp > product.price && (
                            <span className="font-mono text-xs text-[#14231C]/40 line-through">
                              {formatINR(product.mrp)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <motion.button
                            type="button"
                            whileTap={{ scale: 1.35 }}
                            onClick={(e) => handleToggleWishlist(product.id, e)}
                            className="p-2 rounded-[8px] border-[1.5px] border-[#14231C] bg-[#F3EBDD] hover:bg-[#E8502B]/10 cursor-pointer shadow-[1px_1px_0_#14231C]"
                            aria-label={isWish ? 'Remove from wishlist' : 'Add to wishlist'}
                          >
                            <HandHeart
                              size={16}
                              filled={isWish}
                              className={isWish ? 'text-[#E8502B]' : 'text-[#14231C]'}
                            />
                          </motion.button>

                          <Button
                            variant="primary"
                            size="sm"
                            disabled={isOutOfStock}
                            onClick={(e) => handleQuickAdd(product, e)}
                          >
                            {isOutOfStock ? 'Sold Out' : 'Add to Bag'}
                          </Button>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </main>
      </div>

      {/* MOBILE FILTER SLIDE-OVER SHEET */}
      <Sheet
        isOpen={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        title="Postal Filters"
        subtitle="REFINE CATALOG DISPATCH"
        side="right"
      >
        <div className="py-2">{FilterRailContent}</div>
      </Sheet>

      {/* 4D. QUICK LOOK MODAL (variant, qty, price, and add button) */}
      <Modal
        isOpen={Boolean(quickLookProduct)}
        onClose={() => setQuickLookProduct(null)}
        title="Ware Quick Look"
        subtitle="SPECIFICATION DOSSIER"
      >
        {quickLookProduct && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
              {/* Product Visual Backdrop */}
              <div
                className="sm:col-span-5 h-48 rounded-[14px] border-[1.5px] border-[#14231C] flex items-center justify-center p-4 relative overflow-hidden"
                style={{ backgroundColor: quickLookProduct.bgHex }}
              >
                <Sticker
                  emoji={quickLookProduct.emoji}
                  color={quickLookProduct.backdropColor}
                  size="xl"
                  rotation={-3}
                />
                <div className="absolute bottom-2.5 right-2.5">
                  <Tag price={quickLookProduct.price} size="sm" withString={false} variant="kraft" />
                </div>
              </div>

              {/* Product Info */}
              <div className="sm:col-span-7 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-label-mono text-[9px] px-2 py-0.5 rounded border border-[#14231C] bg-[#EADFCB]">
                    {quickLookProduct.brand}
                  </span>
                  <span className="font-label-mono text-[9px] text-[#14231C]/60 uppercase">
                    {quickLookProduct.category}
                  </span>
                </div>

                <h3 className="font-fraunces text-xl font-semibold text-[#14231C]">
                  {quickLookProduct.name}
                </h3>

                <p className="text-xs text-[#14231C]/80 leading-relaxed">
                  {quickLookProduct.shortDesc}
                </p>

                <div className="flex items-center gap-3">
                  <span className="font-mono text-xl font-bold text-[#14231C]">
                    {formatINR(quickLookProduct.price)}
                  </span>
                  {quickLookProduct.mrp > quickLookProduct.price && (
                    <span className="font-mono text-xs text-[#14231C]/40 line-through">
                      {formatINR(quickLookProduct.mrp)}
                    </span>
                  )}
                  {quickLookProduct.stock <= 3 && quickLookProduct.stock > 0 && (
                    <Stamp text={`ONLY ${quickLookProduct.stock} LEFT`} size="sm" variant="saffron" />
                  )}
                </div>

                <RatingStars
                  rating={quickLookProduct.rating}
                  reviewCount={quickLookProduct.ratingCount}
                  size={14}
                  showValue
                />
              </div>
            </div>

            {/* Variant Selector (if any) */}
            {quickLookProduct.variants && quickLookProduct.variants.length > 0 && (
              <div className="space-y-2 pt-2 border-t-[1.5px] border-[#14231C]/15">
                <span className="font-label-mono text-xs text-[#14231C]/70">
                  SELECT {quickLookProduct.variants[0].name.toUpperCase()}:
                </span>
                <div className="flex flex-wrap gap-2">
                  {quickLookProduct.variants[0].options.map((opt) => (
                    <Chip
                      key={opt}
                      label={opt}
                      active={selectedVariant === opt}
                      onClick={() => setSelectedVariant(opt)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Stepper & Pack CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t-[1.5px] border-[#14231C]/15">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <span className="font-label-mono text-xs text-[#14231C]/70">QTY:</span>
                <Stepper
                  value={quickLookQty}
                  onChange={setQuickLookQty}
                  min={1}
                  max={Math.min(10, quickLookProduct.stock)}
                  disabled={quickLookProduct.stock === 0}
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <Link
                  to={`/product/${quickLookProduct.id}`}
                  onClick={() => setQuickLookProduct(null)}
                  className="font-label-mono text-xs text-[#14231C]/75 hover:text-[#E8502B] hover:underline"
                >
                  FULL DOSSIER →
                </Link>

                <Button
                  variant="primary"
                  size="md"
                  disabled={quickLookProduct.stock === 0}
                  onClick={(e) => {
                    handleQuickAdd(
                      quickLookProduct,
                      e,
                      selectedVariant || undefined,
                      quickLookQty
                    );
                    setQuickLookProduct(null);
                  }}
                >
                  {quickLookProduct.stock === 0 ? 'Out of Stock' : 'Pack into Parcel'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
