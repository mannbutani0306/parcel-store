import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Button,
  Sticker,
  Tag,
  Stamp,
  RatingStars,
  Skeleton,
  HandArrow,
  HandHeart,
  HandTick,
  PostalWavyLines,
  MatchRing,
} from '../components/ui';
import { CATEGORIES, Product, PRODUCTS } from '../data';
import { useParcelStore } from '../store';
import { useToastStore } from '../store/toastStore';
import { recommendScored } from '../lib/recommend';
import { formatINR } from '../lib/format';

/**
 * Self-drawing scribble underline that animates path stroke
 */
const SelfDrawingUnderline: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 160 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`w-full block overflow-visible ${className}`}
    preserveAspectRatio="none"
  >
    <motion.path
      d="M2 11c24-4.5 58-5.8 82-2.8 28 3.5 48 3.2 74-2.2M8 14c32-2.5 64-1.8 98-4.5 18-1.4 34-1.2 50 .5"
      stroke="currentColor"
      strokeWidth="3.2"
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.9, delay: 0.3, ease: 'easeOut' }}
    />
  </svg>
);

/**
 * Semi-translucent kraft tape strip for hero corners
 */
const WashiTape: React.FC<{ className?: string; rotation?: number }> = ({
  className = '',
  rotation = 0,
}) => (
  <div
    style={{ transform: `rotate(${rotation}deg)` }}
    className={`absolute h-6 w-20 bg-[#C99A67]/80 backdrop-blur-[0.5px] border-t border-b border-[#14231C]/30 shadow-sm pointer-events-none z-20 ${className}`}
    aria-hidden="true"
  >
    {/* Serrated tape edge ends */}
    <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#EADFCB] opacity-60 [clip-path:polygon(0_0,100%_25%,0_50%,100%_75%,0_100%)]" />
    <div className="absolute right-0 top-0 bottom-0 w-2 bg-[#EADFCB] opacity-60 [clip-path:polygon(100%_0,0_25%,100%_50%,0_75%,100%_100%)]" />
  </div>
);

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    products,
    addToCart,
    recordView,
    wishlist,
    toggleWishlist,
    currentUser,
    views,
    cartAdds,
    purchases,
    orders,
    recommenderEngine,
  } = useParcelStore();
  const { addToast } = useToastStore();

  // First paint skeleton state (< 1 second)
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Parallax state for hero floating cluster
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);

  // Live midnight countdown timer
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Simulated rapid first paint load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 420);
    return () => clearTimeout(timer);
  }, []);

  // Midnight countdown interval
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(23, 59, 59, 999);
      const diff = Math.max(0, midnight.getTime() - now.getTime());
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle mouse move for hero parallax
  const handleHeroMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMouseOffset({ x, y });
  };

  const handleHeroMouseLeave = () => {
    setMouseOffset({ x: 0, y: 0 });
  };

  // Quick Add helper
  const handleQuickAdd = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    const res = addToCart(product, 1);
    if (res.success) {
      addToast({
        title: 'Packed in Bag',
        message: `${product.name} added to parcel`,
        variant: 'tomato',
      });
    } else {
      addToast({
        title: 'Notice',
        message: res.error || 'Could not add item',
        variant: 'stamp',
      });
    }
  };

  // Wishlist helper
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

  const handleNavigateProduct = (product: Product) => {
    recordView(product.id);
    navigate(`/product/${product.id}`);
  };

  // 3D. Picked For You wares with hybrid scoring & swappable engine
  const scoredPickedProducts = useMemo(() => {
    return recommendScored(
      {
        userId: currentUser?.id,
        behaviour: { views, cartAdds, purchases, wishlist },
        orders,
        allProducts: products,
        limit: 4,
        contextType: 'home-picked',
      },
      recommenderEngine
    );
  }, [currentUser?.id, views, cartAdds, purchases, wishlist, orders, products, recommenderEngine]);

  // 3E. Just Landed wares (asymmetric newest products)
  const justLandedProducts = useMemo(() => {
    const sorted = [...products].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return sorted.slice(0, 5);
  }, [products]);

  // 3F. Discounted wares for Deal Strip
  const dealProducts = useMemo(() => {
    const discounted = products
      .filter((p) => p.mrp > p.price && p.stock > 0)
      .sort((a, b) => (b.mrp - b.price) / b.mrp - (a.mrp - a.price) / a.mrp);
    return discounted.slice(0, 3);
  }, [products]);

  // If first paint skeleton is showing
  if (isInitialLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-12">
        {/* Skeleton Top Ribbon */}
        <Skeleton height={36} rounded="tag" className="w-full" />

        {/* Skeleton Hero */}
        <div className="bg-[#EADFCB] border-[1.5px] border-[#14231C]/20 rounded-[22px] p-6 sm:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-4">
            <Skeleton height={24} width={140} rounded="tag" />
            <Skeleton height={64} width="90%" rounded="tag" />
            <Skeleton height={48} width="70%" rounded="tag" />
            <div className="flex gap-4 pt-4">
              <Skeleton height={44} width={150} rounded="tag" />
              <Skeleton height={44} width={140} rounded="tag" />
            </div>
          </div>
          <div className="lg:col-span-5 flex items-center justify-center">
            <Skeleton height={260} width={260} rounded="pill" />
          </div>
        </div>

        {/* Skeleton Marquee */}
        <Skeleton height={44} rounded="tag" className="w-full" />

        {/* Skeleton Categories */}
        <div className="space-y-4">
          <Skeleton height={28} width={220} rounded="tag" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} height={160} rounded="tag" />
            ))}
          </div>
        </div>

        {/* Skeleton Picked Row */}
        <div className="space-y-4">
          <Skeleton height={28} width={260} rounded="tag" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} height={320} rounded="sheet" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-16">
      {/* 3A. HERO SECTION */}
      <motion.section
        ref={heroRef}
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={handleHeroMouseLeave}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[22px] p-6 sm:p-10 lg:p-14 shadow-[4px_4px_0_#14231C] overflow-hidden"
      >
        {/* Taped corner details */}
        <WashiTape className="-top-2 left-6" rotation={-4} />
        <WashiTape className="-top-2 right-8" rotation={5} />
        <WashiTape className="-bottom-2 right-12 hidden sm:block" rotation={-3} />

        {/* Subtle postal watermarked wavy lines in background */}
        <div className="absolute top-4 right-1/3 opacity-20 pointer-events-none hidden md:block">
          <PostalWavyLines className="w-32 text-[#14231C]" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2">
              <span className="font-label-mono px-2 py-0.5 rounded-[4px] border-[1px] border-[#14231C] bg-[#F3EBDD] text-[10px]">
                SERIES 2026 · G.P.O.
              </span>
              <span className="font-label-mono text-xs text-[#14231C]/65">
                POSTAL &amp; PAPER GOODS
              </span>
            </div>

            {/* Oversized Fraunces headline: "good things, *delivered.*" */}
            <div className="space-y-2">
              <h1 className="font-fraunces text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-[#14231C] leading-[1.04]">
                good things,{' '}
                <span className="relative inline-block text-[#E8502B] font-fraunces-italic font-normal">
                  delivered.
                  <span className="absolute left-0 -bottom-2 sm:-bottom-3 w-full">
                    <SelfDrawingUnderline className="text-[#E8502B]" />
                  </span>
                </span>
              </h1>
            </div>

            <p className="text-base sm:text-lg text-[#14231C]/80 leading-relaxed font-sans max-w-xl">
              Smyth-sewn journals, turned brass instruments, cold-pressed botanicals, and vulcanized rubber stamps. Wrapped in unbleached kraft and tied by hand.
            </p>

            {/* Two buttons: "Start shopping" and text link "See what's new" */}
            <div className="flex flex-wrap items-center gap-5 pt-3">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/shop')}
                iconRight={<HandArrow size={18} />}
              >
                Start shopping
              </Button>

              <a
                href="#just-landed"
                className="font-fraunces text-base font-semibold text-[#14231C] hover:text-[#E8502B] transition-colors inline-flex items-center gap-1.5 group underline decoration-[#14231C]/30 hover:decoration-[#E8502B] underline-offset-4"
              >
                <span>See what's new</span>
                <span className="transform group-hover:translate-x-1 transition-transform">→</span>
              </a>
            </div>
          </div>

          {/* Right Side: Cluster of 4-5 tilted product stickers/tags reacting to mouse parallax */}
          <div className="lg:col-span-5 relative h-72 sm:h-88 flex items-center justify-center">
            {/* Circular rotating stamp "FREE SHIPPING ₹999+" */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 22, ease: 'linear' }}
              className="absolute -top-3 -right-2 sm:right-2 z-30 pointer-events-none select-none"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-dashed border-[#E8502B] flex items-center justify-center p-1 bg-[#F3EBDD]/90 shadow-[2px_2px_0_#14231C]">
                <div className="w-full h-full rounded-full border-[1.5px] border-solid border-[#E8502B] flex flex-col items-center justify-center text-center p-1 text-[#E8502B]">
                  <span className="font-label-mono font-bold text-[8px] sm:text-[9px] leading-tight">
                    FREE SHIP
                  </span>
                  <span className="font-label-mono text-[7px] font-semibold mt-0.5">
                    ₹999+
                  </span>
                  <span className="text-[9px] leading-none mt-0.5">★</span>
                </div>
              </div>
            </motion.div>

            {/* Parallax Layer 1: Headphone/Tech Sticker */}
            <motion.div
              style={{
                x: mouseOffset.x * 24,
                y: mouseOffset.y * 24,
              }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={() => navigate('/product/tech-01')}
              className="absolute top-4 left-6 sm:left-10 z-20 cursor-pointer"
            >
              <Sticker emoji="🎧" color="stamp-blue" size="lg" rotation={-7} interactive />
            </motion.div>

            {/* Parallax Layer 2: Smyth-Sewn Journal + Price Tag */}
            <motion.div
              style={{
                x: mouseOffset.x * -20,
                y: mouseOffset.y * -20,
              }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={() => navigate('/product/books-01')}
              className="absolute top-12 right-12 sm:right-16 z-10 cursor-pointer flex flex-col items-center"
            >
              <Sticker emoji="📚" color="kraft" size="lg" rotation={8} interactive />
              <div className="-mt-3">
                <Tag price={1850} label="JOURNAL" variant="kraft" size="sm" withString={false} />
              </div>
            </motion.div>

            {/* Parallax Layer 3: Terracotta Planter */}
            <motion.div
              style={{
                x: mouseOffset.x * 32,
                y: mouseOffset.y * 32,
              }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={() => navigate('/product/home-03')}
              className="absolute bottom-6 left-12 sm:left-16 z-20 cursor-pointer flex items-center gap-1"
            >
              <Sticker emoji="🪴" color="mint" size="md" rotation={-4} interactive />
              <Tag price={1280} variant="mint" size="sm" withString />
            </motion.div>

            {/* Parallax Layer 4: Vulcanized Sneaker */}
            <motion.div
              style={{
                x: mouseOffset.x * -28,
                y: mouseOffset.y * -28,
              }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={() => navigate('/product/style-01')}
              className="absolute bottom-4 right-8 sm:right-12 z-20 cursor-pointer"
            >
              <Sticker emoji="👟" color="saffron" size="md" rotation={6} interactive />
            </motion.div>

            {/* Parallax Layer 5: Handcrafted Toy Tile */}
            <motion.div
              style={{
                x: mouseOffset.x * 16,
                y: mouseOffset.y * -16,
              }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={() => navigate('/product/play-01')}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 opacity-85"
            >
              <div className="w-24 h-24 rounded-full border-[2px] border-dashed border-[#14231C]/30 flex items-center justify-center bg-[#F3EBDD]/60 shadow-[2px_2px_0_#14231C]">
                <span className="text-3xl filter drop-shadow">🎮</span>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* 3B. MARQUEE (Infinite ticker pausing on hover) */}
      <section
        aria-label="Postal Departments Marquee"
        className="w-full overflow-hidden border-y-[1.5px] border-[#14231C] bg-[#EADFCB] py-2.5 shadow-[2px_2px_0_#14231C] group"
      >
        <div className="animate-postal-marquee flex items-center gap-8 select-none">
          {/* Loop twice for seamless scrolling */}
          {[0, 1].map((copyIndex) => (
            <div key={copyIndex} className="flex items-center gap-8 shrink-0">
              {CATEGORIES.map((cat, idx) => (
                <React.Fragment key={`${copyIndex}-${cat.id}`}>
                  <Link
                    to={`/shop?category=${cat.id}`}
                    className="inline-flex items-center gap-2.5 font-fraunces text-base font-semibold text-[#14231C] hover:text-[#E8502B] transition-colors"
                  >
                    <span className="text-xl leading-none">{cat.emoji}</span>
                    <span>{cat.name}</span>
                    <span className="font-label-mono text-[9px] text-[#14231C]/60 uppercase ml-0.5">
                      (0{idx + 1})
                    </span>
                  </Link>

                  {/* Stamp separator */}
                  <div className="shrink-0">
                    <Stamp
                      text={
                        idx === 0
                          ? 'DISPATCH'
                          : idx === 1
                            ? 'VERIFIED'
                            : idx === 2
                              ? 'AIRMAIL'
                              : idx === 3
                                ? 'BOTANIC'
                                : idx === 4
                                  ? 'ARCHIVAL'
                                  : 'HANDMADE'
                      }
                      size="sm"
                      variant={idx % 2 === 0 ? 'tomato' : 'ink'}
                      rotation={idx % 2 === 0 ? -2 : 2}
                    />
                  </div>
                </React.Fragment>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* 3C. CATEGORIES (Horizontally scrollable luggage tag cards with swing hover) */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.45 }}
        className="space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b-[1.5px] border-[#14231C] pb-3">
          <div>
            <p className="font-label-mono text-xs text-[#14231C]/65">SIX DEPARTMENTS</p>
            <h2 className="font-fraunces text-2xl sm:text-3xl font-semibold text-[#14231C]">
              Luggage Tag <span className="font-fraunces-italic font-normal">Categories</span>
            </h2>
          </div>
          <Link
            to="/shop"
            className="font-label-mono text-xs hover:text-[#E8502B] hover:underline flex items-center gap-1.5"
          >
            <span>VIEW ALL 36 WARES</span>
            <HandArrow size={14} />
          </Link>
        </div>

        {/* Scrollable Luggage Tag Track */}
        <div className="w-full overflow-x-auto pb-4 pt-2 -mx-4 px-4 sm:mx-0 sm:px-0 flex gap-5 scrollbar-thin">
          {CATEGORIES.map((cat) => (
            <motion.div
              key={cat.id}
              whileHover={{
                rotate: [-4, 4, -2, 2, 0],
                y: -3,
                transition: { duration: 0.55, ease: 'easeInOut' },
              }}
              style={{ transformOrigin: 'top center' }}
              onClick={() => navigate(`/shop?category=${cat.id}`)}
              className="relative cursor-pointer group shrink-0 w-38 sm:w-44 pt-5 select-none"
            >
              {/* Hanging string loop */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-6 flex justify-center pointer-events-none z-10">
                <div className="w-[1.5px] h-full bg-[#14231C]" />
                <div className="absolute -top-1 w-2.5 h-2.5 rounded-full border-[1.5px] border-[#14231C] bg-transparent" />
              </div>

              {/* Tag Body with Clipped Manila Corners */}
              <div
                className="relative border-[1.5px] border-[#14231C] rounded-b-[12px] p-4 pt-6 shadow-[3px_3px_0_#14231C] group-hover:shadow-[4px_4px_0_#14231C] transition-all flex flex-col items-center text-center gap-2"
                style={{
                  backgroundColor: cat.bgHex,
                  clipPath:
                    'polygon(14px 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 0 100%, 0 14px)',
                }}
              >
                {/* Punched brass eyelet */}
                <div className="w-3.5 h-3.5 rounded-full border-[1.5px] border-[#14231C] bg-[#F3EBDD] flex items-center justify-center shadow-inner -mt-3 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#14231C]/30" />
                </div>

                {/* Emoji Sticker Circle */}
                <div className="w-13 h-13 rounded-full border-[1.5px] border-[#14231C] bg-[#F3EBDD] flex items-center justify-center text-2xl shadow-[1px_1px_0_#14231C] group-hover:scale-105 transition-transform">
                  {cat.emoji}
                </div>

                <div>
                  <h3 className="font-fraunces font-semibold text-base text-[#14231C] group-hover:text-[#E8502B] transition-colors">
                    {cat.name}
                  </h3>
                  <span className="font-label-mono text-[9px] text-[#14231C]/70 font-bold block mt-0.5">
                    6 WARES
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* 3D. PICKED FOR YOU (Row of product cards with circular match % ring) */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.45 }}
        className="space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b-[1.5px] border-[#14231C] pb-3">
          <div>
            <p className="font-label-mono text-xs text-[#14231C]/65">CURATED DISPATCH</p>
            <h2 className="font-fraunces text-2xl sm:text-3xl font-semibold text-[#14231C]">
              Picked for <span className="font-fraunces-italic font-normal">You</span>
            </h2>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-label-mono text-xs text-[#14231C]/70">
              BASED ON YOUR ARCHIVAL TASTE
            </span>
            <span className="font-label-mono text-[9px] text-[#286345] bg-[#286345]/10 px-2 py-0.5 rounded border border-[#286345]/30 font-bold uppercase tracking-wider">
              {recommenderEngine === 'smart' ? 'Smart Hybrid Engine' : 'Popularity Engine'}
            </span>
          </div>
        </div>

        {/* 4 Picked Product Cards with Circular Match Ring & Reshuffling Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {scoredPickedProducts.map((scored) => {
            const product = scored.product;
            const isWish = wishlist.includes(product.id);

            return (
              <motion.article
                layout
                key={product.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                whileHover={{ y: -6, rotate: -1, transition: { duration: 0.2 } }}
                onClick={() => handleNavigateProduct(product)}
                className="bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[18px] p-4.5 shadow-[3px_3px_0_#14231C] hover:shadow-[5px_5px_0_#14231C] cursor-pointer flex flex-col justify-between group transition-all"
              >
                {/* Top Bar with Match % Ring & Wishlist Heart */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <MatchRing percentage={scored.matchPercentage} />

                  <button
                    type="button"
                    onClick={(e) => handleToggleWishlist(product.id, e)}
                    className="p-1.5 rounded-full border-[1.5px] border-[#14231C] bg-[#F3EBDD] hover:bg-[#E8502B]/10 transition-colors cursor-pointer shadow-[1px_1px_0_#14231C]"
                    aria-label={isWish ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <HandHeart
                      size={16}
                      filled={isWish}
                      className={isWish ? 'text-[#E8502B]' : 'text-[#14231C]'}
                    />
                  </button>
                </div>

                {/* Visual Backdrop */}
                <div
                  className="relative w-full h-38 rounded-[12px] border-[1.5px] border-[#14231C] flex items-center justify-center overflow-hidden p-3"
                  style={{ backgroundColor: product.bgHex }}
                >
                  <Sticker
                    emoji={product.emoji}
                    color={product.backdropColor}
                    size="lg"
                    rotation={-3}
                  />

                  <div className="absolute bottom-2 right-2">
                    <Tag price={product.price} size="sm" withString={false} variant="kraft" />
                  </div>
                </div>

                {/* Details */}
                <div className="mt-4 space-y-1.5 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-label-mono text-[9px] text-[#14231C]/60 uppercase">
                      {product.brand}
                    </span>
                    <RatingStars rating={product.rating} size={12} />
                  </div>

                  <h3 className="font-fraunces text-base font-semibold text-[#14231C] group-hover:text-[#E8502B] transition-colors leading-snug">
                    {product.name}
                  </h3>

                  {/* Tiny Reason Line in Mono Type */}
                  <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#14231C]/75 pt-0.5 truncate">
                    <span className="text-[#E8502B] font-bold text-[9px]">✦</span>
                    <span className="truncate">{scored.reason}</span>
                  </div>

                  <p className="text-xs text-[#14231C]/70 line-clamp-2 pt-0.5">
                    {product.shortDesc}
                  </p>
                </div>

                {/* Bottom Quick Add */}
                <div className="mt-4 pt-3 border-t-[1.5px] border-[#14231C]/15 flex items-center justify-between gap-2">
                  <div className="font-mono font-bold text-sm text-[#14231C]">
                    {formatINR(product.price)}
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    disabled={product.stock === 0}
                    onClick={(e) => handleQuickAdd(product, e)}
                  >
                    {product.stock === 0 ? 'Sold Out' : 'Quick Add'}
                  </Button>
                </div>
              </motion.article>
            );
          })}
        </div>
      </motion.section>

      {/* 3E. JUST LANDED (Asymmetric Bento Grid with "NEW" stamp) */}
      <motion.section
        id="just-landed"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.45 }}
        className="space-y-6 scroll-mt-20"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b-[1.5px] border-[#14231C] pb-3">
          <div>
            <p className="font-label-mono text-xs text-[#14231C]/65">FRESH DISPATCHES</p>
            <h2 className="font-fraunces text-2xl sm:text-3xl font-semibold text-[#14231C]">
              Just <span className="font-fraunces-italic font-normal">Landed</span>
            </h2>
          </div>
          <span className="font-label-mono text-xs text-[#14231C]/70">
            ASYMMETRIC ARCHIVE SELECTIONS
          </span>
        </div>

        {/* Asymmetric Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-5">
          {/* Tile 1: LARGE FEATURE TILE (2 cols x 2 rows) with "NEW" stamp */}
          {justLandedProducts[0] && (
            <motion.div
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              onClick={() => handleNavigateProduct(justLandedProducts[0])}
              className="md:col-span-2 md:row-span-2 bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[22px] p-6 sm:p-8 shadow-[4px_4px_0_#14231C] hover:shadow-[6px_6px_0_#14231C] cursor-pointer flex flex-col justify-between group transition-all relative overflow-hidden"
            >
              {/* Rubber Stamp "NEW" */}
              <div className="absolute top-5 right-5 z-20">
                <Stamp text="NEW" subtext="SERIES 2026" variant="tomato" size="md" rotation={-6} />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="font-label-mono text-[10px] px-2 py-0.5 rounded-[4px] border-[1px] border-[#14231C] bg-[#F3EBDD]">
                    FEATURE DISPATCH
                  </span>
                  <span className="font-label-mono text-xs text-[#14231C]/60 uppercase">
                    {justLandedProducts[0].brand} · {justLandedProducts[0].category}
                  </span>
                </div>

                <h3 className="font-fraunces text-2xl sm:text-3xl font-semibold text-[#14231C] group-hover:text-[#E8502B] transition-colors leading-tight">
                  {justLandedProducts[0].name}
                </h3>

                <p className="text-sm text-[#14231C]/80 leading-relaxed font-sans max-w-md">
                  {justLandedProducts[0].shortDesc}
                </p>
              </div>

              {/* Large backdrop visual */}
              <div
                className="my-6 relative w-full h-48 sm:h-56 rounded-[14px] border-[1.5px] border-[#14231C] flex items-center justify-center overflow-hidden p-6"
                style={{ backgroundColor: justLandedProducts[0].bgHex }}
              >
                <Sticker
                  emoji={justLandedProducts[0].emoji}
                  color={justLandedProducts[0].backdropColor}
                  size="xl"
                  rotation={-4}
                />
              </div>

              {/* Action row */}
              <div className="flex items-center justify-between gap-4 pt-2 border-t-[1.5px] border-[#14231C]/15">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-xl font-bold text-[#14231C]">
                    {formatINR(justLandedProducts[0].price)}
                  </span>
                  {justLandedProducts[0].mrp > justLandedProducts[0].price && (
                    <span className="font-mono text-xs text-[#14231C]/40 line-through">
                      {formatINR(justLandedProducts[0].mrp)}
                    </span>
                  )}
                </div>

                <Button
                  variant="primary"
                  size="md"
                  onClick={(e) => handleQuickAdd(justLandedProducts[0], e)}
                >
                  Pack into Bag
                </Button>
              </div>
            </motion.div>
          )}

          {/* Tile 2: WIDE TILE (2 cols x 1 row) */}
          {justLandedProducts[1] && (
            <motion.div
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              onClick={() => handleNavigateProduct(justLandedProducts[1])}
              className="md:col-span-2 md:row-span-1 bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[18px] p-5 shadow-[3px_3px_0_#14231C] hover:shadow-[4px_4px_0_#14231C] cursor-pointer flex flex-col sm:flex-row items-center justify-between gap-4 group transition-all"
            >
              <div
                className="w-full sm:w-36 h-28 sm:h-full rounded-[12px] border-[1.5px] border-[#14231C] flex items-center justify-center shrink-0"
                style={{ backgroundColor: justLandedProducts[1].bgHex }}
              >
                <Sticker emoji={justLandedProducts[1].emoji} size="md" rotation={4} />
              </div>

              <div className="space-y-1.5 flex-1">
                <span className="font-label-mono text-[9px] text-[#14231C]/60 uppercase">
                  {justLandedProducts[1].brand}
                </span>
                <h4 className="font-fraunces text-base sm:text-lg font-semibold text-[#14231C] group-hover:text-[#E8502B] transition-colors leading-snug">
                  {justLandedProducts[1].name}
                </h4>
                <div className="font-mono font-bold text-sm text-[#14231C]">
                  {formatINR(justLandedProducts[1].price)}
                </div>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={(e) => handleQuickAdd(justLandedProducts[1], e)}
              >
                Add
              </Button>
            </motion.div>
          )}

          {/* Tile 3: COMPACT TILE (1 col x 1 row) */}
          {justLandedProducts[2] && (
            <motion.div
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              onClick={() => handleNavigateProduct(justLandedProducts[2])}
              className="md:col-span-1 md:row-span-1 bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[18px] p-4 shadow-[3px_3px_0_#14231C] hover:shadow-[4px_4px_0_#14231C] cursor-pointer flex flex-col justify-between group transition-all"
            >
              <div
                className="w-full h-24 rounded-[10px] border-[1.5px] border-[#14231C] flex items-center justify-center mb-2"
                style={{ backgroundColor: justLandedProducts[2].bgHex }}
              >
                <Sticker emoji={justLandedProducts[2].emoji} size="sm" rotation={-3} />
              </div>
              <div>
                <h4 className="font-fraunces text-sm font-semibold text-[#14231C] group-hover:text-[#E8502B] truncate">
                  {justLandedProducts[2].name}
                </h4>
                <div className="font-mono font-bold text-xs text-[#14231C] mt-1">
                  {formatINR(justLandedProducts[2].price)}
                </div>
              </div>
            </motion.div>
          )}

          {/* Tile 4: COMPACT TILE (1 col x 1 row) */}
          {justLandedProducts[3] && (
            <motion.div
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              onClick={() => handleNavigateProduct(justLandedProducts[3])}
              className="md:col-span-1 md:row-span-1 bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[18px] p-4 shadow-[3px_3px_0_#14231C] hover:shadow-[4px_4px_0_#14231C] cursor-pointer flex flex-col justify-between group transition-all"
            >
              <div
                className="w-full h-24 rounded-[10px] border-[1.5px] border-[#14231C] flex items-center justify-center mb-2"
                style={{ backgroundColor: justLandedProducts[3].bgHex }}
              >
                <Sticker emoji={justLandedProducts[3].emoji} size="sm" rotation={5} />
              </div>
              <div>
                <h4 className="font-fraunces text-sm font-semibold text-[#14231C] group-hover:text-[#E8502B] truncate">
                  {justLandedProducts[3].name}
                </h4>
                <div className="font-mono font-bold text-xs text-[#14231C] mt-1">
                  {formatINR(justLandedProducts[3].price)}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.section>

      {/* 3F. DEAL STRIP (Full-width kraft band with live midnight countdown & hanging tags) */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.45 }}
        className="w-full bg-[#C99A67] border-[1.5px] border-[#14231C] rounded-[22px] p-6 sm:p-10 shadow-[4px_4px_0_#14231C] space-y-8"
      >
        {/* Deal Header with Live Midnight Countdown */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-[1.5px] border-[#14231C]/30 pb-5">
          <div className="space-y-1">
            <span className="font-label-mono text-xs text-[#14231C]/75 font-bold">
              LIMITED TIME POSTAL RUN
            </span>
            <h2 className="font-fraunces text-2xl sm:text-3xl font-semibold text-[#14231C]">
              Midnight Dispatch <span className="font-fraunces-italic font-normal">Specials</span>
            </h2>
          </div>

          {/* Live countdown display */}
          <div className="flex items-center gap-2 bg-[#F3EBDD] border-[1.5px] border-[#14231C] rounded-[10px] px-4 py-2 shadow-[2px_2px_0_#14231C] self-start md:self-auto">
            <span className="font-label-mono text-xs text-[#14231C]/70">VAN DEPARTS IN</span>
            <div className="font-mono font-bold text-base text-[#E8502B] tracking-wider flex items-center gap-1">
              <span>{String(timeLeft.hours).padStart(2, '0')}</span>:
              <span>{String(timeLeft.minutes).padStart(2, '0')}</span>:
              <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
            </div>
          </div>
        </div>

        {/* Hanging String Graphic + 3 Price Tags */}
        <div className="relative pt-6">
          {/* Taut Horizontal String */}
          <div className="w-full border-t-2 border-dashed border-[#14231C] relative mb-8">
            <div className="absolute left-1/6 -top-1 w-2.5 h-2.5 rounded-full bg-[#14231C]" />
            <div className="absolute left-1/2 -translate-x-1/2 -top-1 w-2.5 h-2.5 rounded-full bg-[#14231C]" />
            <div className="absolute right-1/6 -top-1 w-2.5 h-2.5 rounded-full bg-[#14231C]" />
          </div>

          {/* 3 Hanging Tags */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {dealProducts.map((product, idx) => {
              const discountPct = Math.round(
                ((product.mrp - product.price) / product.mrp) * 100
              );

              return (
                <div key={product.id} className="relative flex flex-col items-center">
                  {/* Vertical twine suspension line */}
                  <div className="w-[1.5px] h-8 bg-[#14231C] -mt-8 mb-0" />

                  {/* Physical Tag Card */}
                  <motion.div
                    whileHover={{ y: -4, rotate: idx % 2 === 0 ? -1 : 1 }}
                    onClick={() => handleNavigateProduct(product)}
                    className="w-full bg-[#F3EBDD] border-[1.5px] border-[#14231C] rounded-[14px] p-5 shadow-[3px_3px_0_#14231C] hover:shadow-[4px_4px_0_#14231C] cursor-pointer flex flex-col justify-between group transition-all"
                  >
                    {/* Brass Eyelet */}
                    <div className="w-4 h-4 rounded-full border-[1.5px] border-[#14231C] bg-[#EADFCB] flex items-center justify-center mx-auto -mt-2 mb-3 shadow-inner">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#14231C]/30" />
                    </div>

                    <div className="flex items-center gap-3">
                      <div
                        className="w-14 h-14 rounded-[10px] border-[1.5px] border-[#14231C] flex items-center justify-center shrink-0 shadow-[1px_1px_0_#14231C]"
                        style={{ backgroundColor: product.bgHex }}
                      >
                        <span className="text-2xl">{product.emoji}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <span className="font-label-mono text-[9px] text-[#14231C]/60 uppercase">
                          {product.category}
                        </span>
                        <h4 className="font-fraunces font-semibold text-base text-[#14231C] group-hover:text-[#E8502B] truncate">
                          {product.name}
                        </h4>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="font-mono font-bold text-sm text-[#E8502B]">
                            {formatINR(product.price)}
                          </span>
                          <span className="font-mono text-xs text-[#14231C]/40 line-through">
                            {formatINR(product.mrp)}
                          </span>
                          <span className="font-label-mono text-[9px] px-1.5 py-0.5 rounded bg-[#E8502B] text-[#F3EBDD] font-bold">
                            -{discountPct}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t-[1.5px] border-[#14231C]/15 flex justify-end">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={(e) => handleQuickAdd(product, e)}
                      >
                        Pack Deal
                      </Button>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* 3G. TRUST ROW (Four small stamps in one line with emoji, no paragraphs) */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-20px' }}
        transition={{ duration: 0.4 }}
        className="w-full bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[16px] p-4 sm:p-5 shadow-[3px_3px_0_#14231C]"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="flex items-center justify-center gap-2 px-3 py-2 border-[1.5px] border-[#14231C] rounded-[8px] bg-[#F3EBDD] text-center select-none shadow-[1px_1px_0_#14231C]">
            <span className="text-lg">🔒</span>
            <span className="font-label-mono text-[11px] font-bold text-[#14231C]">
              SECURE CHECKOUT
            </span>
          </div>

          <div className="flex items-center justify-center gap-2 px-3 py-2 border-[1.5px] border-[#14231C] rounded-[8px] bg-[#F3EBDD] text-center select-none shadow-[1px_1px_0_#14231C]">
            <span className="text-lg">↩️</span>
            <span className="font-label-mono text-[11px] font-bold text-[#14231C]">
              EASY RETURNS
            </span>
          </div>

          <div className="flex items-center justify-center gap-2 px-3 py-2 border-[1.5px] border-[#14231C] rounded-[8px] bg-[#F3EBDD] text-center select-none shadow-[1px_1px_0_#14231C]">
            <span className="text-lg">⚡</span>
            <span className="font-label-mono text-[11px] font-bold text-[#14231C]">
              FAST DELIVERY
            </span>
          </div>

          <div className="flex items-center justify-center gap-2 px-3 py-2 border-[1.5px] border-[#14231C] rounded-[8px] bg-[#F3EBDD] text-center select-none shadow-[1px_1px_0_#14231C]">
            <span className="text-lg">🏷️</span>
            <span className="font-label-mono text-[11px] font-bold text-[#14231C]">
              GENUINE SELLERS
            </span>
          </div>
        </div>
      </motion.section>
    </div>
  );
};
