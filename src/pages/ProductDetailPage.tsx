import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Button,
  Tag,
  Stamp,
  RatingStars,
  Stepper,
  Modal,
  Input,
  HandHeart,
  HandArrow,
  HandTick,
  Sticker,
  ScribbleUnderline,
  FlyingArcSticker,
  FlyingItem,
  MatchRing,
} from '../components/ui';
import { useParcelStore } from '../store';
import { useToastStore } from '../store/toastStore';
import { formatINR } from '../lib/format';
import { recommendScored } from '../lib/recommend';
import { validateAddToCartQty, isValidPinCode } from '../lib/validators';
import { ProductColorToken, ProductPattern } from '../data/products';

// Dynamic specifications by category
function getProductSpecs(category: string, name: string) {
  switch (category) {
    case 'tech':
      return [
        { label: 'MATERIALS & FINISH', value: 'Turned C36000 Brass, Oiled Walnut & Gold-plated RCA' },
        { label: 'CIRCUITRY & POWER', value: 'Class-A Vacuum Triode, 24V Linear Low-Noise Supply' },
        { label: 'WORKSHOP GUILD', value: 'Deccan Precision Mechanicals · Batch #88, Bengaluru' },
      ];
    case 'home':
      return [
        { label: 'MATERIALS & FINISH', value: 'Slip-cast High-Fire Stoneware, Matte Iron Oxide Slip' },
        { label: 'DIMENSIONS & WEIGHT', value: 'Ø 160 mm × H 145 mm · Capacity 1.4 L · 820g' },
        { label: 'WORKSHOP GUILD', value: 'Oiled Oak Studio & Potteries · Kiln #14, Chandigarh' },
      ];
    case 'style':
      return [
        { label: 'MATERIALS & FABRIC', value: '14oz Washed Selvedge Duck Canvas, Vegetable-Tanned Hide' },
        { label: 'HARDWARE & TRIM', value: 'Antiqued Solid Brass Buckles & Copper Hand-Hammered Rivets' },
        { label: 'WORKSHOP GUILD', value: 'Jaipur Indigo Press & Leather Guild · Batch #19, Jaipur' },
      ];
    case 'beauty':
      return [
        { label: 'COMPOSITION & ESSENCE', value: 'Cold-pressed Jojoba, Bergamot Rind, Vetiver Roots' },
        { label: 'VESSEL & DISPENSER', value: '60ml Amber Apothecary Glass, Bakelite Dropper Seal' },
        { label: 'WORKSHOP GUILD', value: 'Deccan Botanical Atelier · Formulation #26, Mysuru' },
      ];
    case 'books':
      return [
        { label: 'PAPER & BINDING', value: '120gsm Acid-Free Cotton Rag Paper, Smyth-Sewn Layflat' },
        { label: 'DIMENSIONS & FOLIO', value: 'A5 (148 × 210 mm) · 192 Numbered Pages · Postal Bookmark' },
        { label: 'WORKSHOP GUILD', value: 'Jaipur Indigo Press & Bindery · Guild Registry #42' },
      ];
    case 'play':
    default:
      return [
        { label: 'TIMBER & JOINERY', value: 'FSC Seasoned Teak & Hard Maple, Weighted Brass Bases' },
        { label: 'DIMENSIONS & WEIGHT', value: '380 × 380 mm Field · 85 mm King · Total Weight 1.6 kg' },
        { label: 'WORKSHOP GUILD', value: 'Oiled Oak Studio, Sector 8 · Guild Craft #08' },
      ];
  }
}

// Visual color shift map for variants
const VARIANT_COLOR_SHIFT: Record<string, { bgHex: string; backdropColor: ProductColorToken }> = {
  'Dot Grid': { bgHex: '#EAE1D3', backdropColor: 'paper-2' },
  'Lined': { bgHex: '#DCE5E0', backdropColor: 'mint' },
  'Blank': { bgHex: '#E4D6C6', backdropColor: 'kraft' },
  'Turned Brass': { bgHex: '#E8DEC4', backdropColor: 'saffron' },
  'Matte Black': { bgHex: '#252B28', backdropColor: 'stamp-blue' },
  'Brushed Steel': { bgHex: '#D6DEE2', backdropColor: 'stamp-blue' },
  'Olive Canvas': { bgHex: '#DCE5E0', backdropColor: 'mint' },
  'Kraft Tan': { bgHex: '#E4D6C6', backdropColor: 'kraft' },
  'Indigo': { bgHex: '#CAD6E2', backdropColor: 'stamp-blue' },
  'Terracotta': { bgHex: '#EADFCB', backdropColor: 'blush' },
  'Small (A6)': { bgHex: '#F3EBDD', backdropColor: 'paper-2' },
  'Medium (A5)': { bgHex: '#EAE1D3', backdropColor: 'kraft' },
  'Large (A4)': { bgHex: '#E0D8C8', backdropColor: 'kraft' },
  '50ml': { bgHex: '#EADFCB', backdropColor: 'kraft' },
  '100ml': { bgHex: '#E5DCD0', backdropColor: 'blush' },
};

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    getProductById,
    addToCart,
    wishlist,
    toggleWishlist,
    getReviewsForProduct,
    addReview,
    markReviewHelpful,
    recordView,
    currentUser,
    allUsers,
    orders,
    advanceOrderStatus,
    views,
    cartAdds,
    purchases,
    recommenderEngine,
    products,
  } = useParcelStore();
  const { addToast } = useToastStore();

  const product = getProductById(id || '');

  // Main UI states
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [activeAngle, setActiveAngle] = useState(0); // 0, 1, 2, 3
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);
  const [showStickyBar, setShowStickyBar] = useState(false);

  // Parallax state on stage
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0, rotX: 0, rotY: 0 });
  const stageRef = useRef<HTMLDivElement>(null);
  const buyButtonRef = useRef<HTMLButtonElement>(null);

  // Pincode validation state
  const [pincodeInput, setPincodeInput] = useState('');
  const [pincodeResult, setPincodeResult] = useState<{
    checked: boolean;
    valid: boolean;
    estimateDate?: string;
    message?: string;
  } | null>(null);

  // Reviews filtering and sorting
  const [selectedStarFilter, setSelectedStarFilter] = useState<number | 'all'>('all');
  const [reviewSort, setReviewSort] = useState<'newest' | 'helpful'>('newest');
  const [searchParams] = useSearchParams();
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');

  // Auto-open review modal when deep-linked from delivered order
  useEffect(() => {
    if (searchParams.get('review') === 'true') {
      setIsReviewModalOpen(true);
    }
  }, [searchParams]);

  // Record view on mount & reset state
  useEffect(() => {
    if (product) {
      recordView(product.id);
      if (product.variants && product.variants.length > 0) {
        setSelectedVariant(product.variants[0].options[0]);
      } else {
        setSelectedVariant('');
      }
      setQuantity(1);
      setActiveAngle(0);
      setPincodeResult(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [product?.id, recordView]);

  // Keyboard navigation for gallery angles (ArrowLeft / ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside input, textarea, or modal
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        isReviewModalOpen
      ) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setActiveAngle((prev) => (prev - 1 + 4) % 4);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setActiveAngle((prev) => (prev + 1) % 4);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isReviewModalOpen]);

  // Monitor scroll for mobile sticky bottom bar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 480) {
        setShowStickyBar(true);
      } else {
        setShowStickyBar(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!product) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center space-y-4">
        <span className="text-4xl block">📮</span>
        <h2 className="font-fraunces text-2xl font-semibold">Ware not found in postal manifest</h2>
        <p className="text-xs text-[#14231C]/70">This item may have been dispatched or moved to archives.</p>
        <Button variant="primary" size="sm" onClick={() => navigate('/shop')}>
          Return to Catalog
        </Button>
      </div>
    );
  }

  // Active color shift from variant selection
  const variantColor = selectedVariant ? VARIANT_COLOR_SHIFT[selectedVariant] : undefined;
  const currentBgHex = variantColor ? variantColor.bgHex : product.bgHex;
  const currentBackdropColor = variantColor ? variantColor.backdropColor : product.backdropColor;

  // Seller details lookup
  const seller = allUsers.find((u) => u.id === product.sellerId) || {
    id: product.sellerId,
    name: 'Guild Master Craftsman',
    avatar: '🪵',
    role: 'seller',
    sellerShopName: 'Independent Artisan Collective',
    address: { city: 'Bengaluru', state: 'Karnataka' },
  };

  const reviews = getReviewsForProduct(product.id);
  const isWish = wishlist.includes(product.id);
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 3;

  // Check if current user has a delivered order for this product
  const hasDeliveredOrder =
    Boolean(currentUser) &&
    orders.some(
      (order) =>
        order.userId === currentUser?.id &&
        order.status === 'delivered' &&
        order.items.some((item) => item.productId === product.id)
    );

  // Recommendations: 5E & Phase 6
  const goesWellWith = useMemo(() => {
    return recommendScored(
      {
        userId: currentUser?.id,
        currentProductId: product.id,
        category: product.category,
        behaviour: { views, cartAdds, purchases, wishlist },
        orders,
        allProducts: products,
        limit: 4,
        contextType: 'goes-well-with',
      },
      recommenderEngine
    );
  }, [
    currentUser?.id,
    product.id,
    product.category,
    views,
    cartAdds,
    purchases,
    wishlist,
    orders,
    products,
    recommenderEngine,
  ]);

  const othersAlsoBought = useMemo(() => {
    const excludeIds = [product.id, ...goesWellWith.map((s) => s.product.id)];
    return recommendScored(
      {
        userId: currentUser?.id,
        currentProductId: product.id,
        excludeIds,
        behaviour: { views, cartAdds, purchases, wishlist },
        orders,
        allProducts: products,
        limit: 4,
        contextType: 'others-also-bought',
      },
      recommenderEngine
    );
  }, [
    currentUser?.id,
    product.id,
    goesWellWith,
    views,
    cartAdds,
    purchases,
    wishlist,
    orders,
    products,
    recommenderEngine,
  ]);

  // Calculate rating summary and distribution bars
  const totalReviewsCount = reviews.length;
  const starCounts = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const rounded = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
      counts[rounded] = (counts[rounded] || 0) + 1;
    });
    return counts;
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    let list = [...reviews];
    if (selectedStarFilter !== 'all') {
      list = list.filter((r) => Math.round(r.rating) === selectedStarFilter);
    }
    if (reviewSort === 'helpful') {
      list.sort((a, b) => b.helpfulCount - a.helpfulCount);
    } else {
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    return list;
  }, [reviews, selectedStarFilter, reviewSort]);

  // Gallery 4 angle presets
  const angles = [
    {
      label: '01 / Front Face',
      short: 'Front',
      scale: 1,
      rotation: -2,
      pattern: product.pattern,
      showAccentBadge: false,
      stampText: undefined,
    },
    {
      label: '02 / Macro Detail',
      short: 'Macro',
      scale: 1.35,
      rotation: 8,
      pattern: 'dots' as ProductPattern,
      showAccentBadge: true,
      stampText: undefined,
    },
    {
      label: '03 / Companion Accent',
      short: 'Profile',
      scale: 0.95,
      rotation: -14,
      pattern: 'stripes' as ProductPattern,
      showAccentBadge: true,
      stampText: undefined,
    },
    {
      label: '04 / Postal Inspected',
      short: 'Inspected',
      scale: 1.12,
      rotation: 16,
      pattern: 'waves' as ProductPattern,
      showAccentBadge: false,
      stampText: 'PARCEL CERTIFIED',
    },
  ];

  const currentAngle = angles[activeAngle];

  // Mouse Parallax Handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    setMouseOffset({
      x: x * 10,
      y: y * 10,
      rotX: -y * 8,
      rotY: x * 8,
    });
  };

  const handleMouseLeave = () => {
    setMouseOffset({ x: 0, y: 0, rotX: 0, rotY: 0 });
  };

  // Trigger Add To Cart with Flying Arc Sticker
  const handleAddToCart = (e?: React.MouseEvent) => {
    const val = validateAddToCartQty(quantity);
    if (!val.valid) {
      addToast({ title: 'Invalid Quantity', message: val.error, variant: 'stamp' });
      return;
    }

    // Trigger flying sticker
    const clientX = e ? e.clientX : window.innerWidth / 2;
    const clientY = e ? e.clientY : window.innerHeight / 2;
    setFlyingItems((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        emoji: product.emoji,
        startX: clientX,
        startY: clientY,
      },
    ]);

    const res = addToCart(product, quantity, selectedVariant || undefined);
    if (res.success) {
      addToast({
        title: 'Packed in Bag',
        message: `${quantity}x ${product.name} stamped for dispatch`,
        variant: 'tomato',
      });
    } else {
      addToast({
        title: 'Dispatch Notice',
        message: res.error || 'Could not pack item',
        variant: 'stamp',
      });
    }
  };

  // Buy Now: adds to cart and navigates straight to checkout
  const handleBuyNow = () => {
    const val = validateAddToCartQty(quantity);
    if (!val.valid) {
      addToast({ title: 'Invalid Quantity', message: val.error, variant: 'stamp' });
      return;
    }

    addToCart(product, quantity, selectedVariant || undefined);
    navigate('/checkout');
  };

  // Pincode Delivery Check
  const handleCheckPincode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincodeInput.trim()) return;

    if (!isValidPinCode(pincodeInput)) {
      setPincodeResult({
        checked: true,
        valid: false,
        message: 'Please enter a valid 6-digit Indian PIN code (e.g. 400050)',
      });
      return;
    }

    // Compute realistic estimated delivery date (3 days out)
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 3);
    const dateFormatted = deliveryDate.toLocaleDateString('en-IN', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });

    setPincodeResult({
      checked: true,
      valid: true,
      estimateDate: dateFormatted,
      message: `Standard Express Dispatch to PIN ${pincodeInput}`,
    });
  };

  // Submit Review
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTitle.trim() || !reviewComment.trim()) return;

    addReview({
      productId: product.id,
      userId: currentUser?.id || 'usr-demo',
      userName: currentUser?.name || 'Verified Recipient',
      userAvatar: currentUser?.avatar || '📦',
      rating: reviewRating,
      title: reviewTitle.trim(),
      comment: reviewComment.trim(),
      verifiedBuyer: true,
    });

    addToast({
      title: 'Review Stamped',
      message: 'Your dispatch note was recorded and verified',
      variant: 'mint',
    });

    setIsReviewModalOpen(false);
    setReviewTitle('');
    setReviewComment('');
  };

  // Dispatch verification helper: mark order as delivered for testing reviews
  const handleMarkDelivered = () => {
    if (orders.length > 0) {
      advanceOrderStatus(orders[0].id);
      addToast({
        title: 'Dispatch Verified',
        message: 'Order status advanced to delivered. You can now write a note!',
        variant: 'saffron',
      });
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-16">
      {/* Flying Arc Sticker Animation Layer */}
      <FlyingArcSticker
        items={flyingItems}
        onComplete={(removedId) =>
          setFlyingItems((prev) => prev.filter((item) => item.id !== removedId))
        }
      />

      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs font-label-mono text-[#14231C]/65 flex-wrap">
        <Link to="/" className="hover:text-[#14231C] underline-offset-2 hover:underline">
          PARCEL
        </Link>
        <span>/</span>
        <Link to="/shop" className="hover:text-[#14231C] underline-offset-2 hover:underline">
          CATALOG
        </Link>
        <span>/</span>
        <Link
          to={`/shop?category=${product.category}`}
          className="hover:text-[#14231C] uppercase underline-offset-2 hover:underline"
        >
          {product.category}
        </Link>
        <span>/</span>
        <span className="text-[#14231C] font-semibold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main PDP Grid: Left 5A Gallery, Right 5B Buy Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* ================= 5A. GALLERY COLUMN ================= */}
        <div className="lg:col-span-7 space-y-4">
          {/* Large Sticker Stage with Mouse Parallax */}
          <div
            ref={stageRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative w-full aspect-square sm:aspect-[4/3] rounded-[22px] border-[1.5px] border-[#14231C] p-8 sm:p-12 flex flex-col items-center justify-center shadow-[4px_4px_0_#14231C] overflow-hidden transition-colors duration-300 select-none"
            style={{
              backgroundColor: currentBgHex,
              perspective: '1000px',
            }}
          >
            {/* Background Pattern */}
            <div
              className="absolute inset-0 opacity-15 pointer-events-none transition-all duration-300"
              style={{
                backgroundImage:
                  currentAngle.pattern === 'dots'
                    ? 'radial-gradient(#14231C 2px, transparent 2px)'
                    : currentAngle.pattern === 'stripes'
                      ? 'repeating-linear-gradient(45deg, #14231C, #14231C 2px, transparent 2px, transparent 14px)'
                      : currentAngle.pattern === 'waves'
                        ? 'repeating-radial-gradient(circle at 0 0, transparent 0, #14231C 2px, transparent 10px)'
                        : 'radial-gradient(#14231C 1.5px, transparent 1.5px)',
                backgroundSize: currentAngle.pattern === 'waves' ? '24px 24px' : '16px 16px',
              }}
            />

            {/* Corner Postal Label Callout */}
            <div className="absolute top-4 right-4 z-10">
              <Tag
                price={product.price}
                label="POSTAL RATE"
                variant={currentBackdropColor === 'kraft' ? 'paper' : 'kraft'}
                size="md"
              />
            </div>

            {/* Keyboard Arrow Navigation Hint */}
            <div className="absolute top-4 left-4 z-10 hidden sm:flex items-center gap-1.5 font-label-mono text-[9px] text-[#14231C]/60 bg-[#F3EBDD]/80 backdrop-blur-xs px-2 py-1 rounded-[6px] border border-[#14231C]/20 shadow-xs">
              <kbd className="px-1 py-0.5 bg-[#EADFCB] border border-[#14231C]/30 rounded text-[8px] font-bold">
                ←
              </kbd>
              <kbd className="px-1 py-0.5 bg-[#EADFCB] border border-[#14231C]/30 rounded text-[8px] font-bold">
                →
              </kbd>
              <span>SWITCH ANGLE</span>
            </div>

            {/* Main Stage Animated Sticker with Smooth Cross-fade and 3D Parallax */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`${product.id}-${activeAngle}-${selectedVariant}`}
                initial={{ opacity: 0, scale: 0.92, rotate: currentAngle.rotation - 5 }}
                animate={{
                  opacity: 1,
                  scale: currentAngle.scale,
                  rotate: currentAngle.rotation + mouseOffset.rotY,
                  x: mouseOffset.x,
                  y: mouseOffset.y,
                }}
                exit={{ opacity: 0, scale: 1.05, rotate: currentAngle.rotation + 5 }}
                transition={{
                  duration: 0.35,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="relative z-10 flex items-center justify-center"
              >
                <Sticker
                  emoji={product.emoji}
                  color={currentBackdropColor}
                  size="xl"
                  rotation={0}
                />

                {/* Floating Companion Accent Emoji for Angle 2 & 3 */}
                {currentAngle.showAccentBadge && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 20 }}
                    className="absolute -bottom-4 -right-4 text-4xl p-2.5 rounded-full border-[2px] border-[#14231C] bg-[#F3EBDD] shadow-[3px_3px_0_#14231C]"
                  >
                    {product.accentEmoji}
                  </motion.div>
                )}

                {/* Rubber Stamp Overlay for Angle 3 */}
                {currentAngle.stampText && (
                  <motion.div
                    initial={{ scale: 1.8, opacity: 0, rotate: -35 }}
                    animate={{ scale: 1, opacity: 0.88, rotate: -15 }}
                    transition={{ delay: 0.1, duration: 0.25 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    <Stamp text={currentAngle.stampText} variant="tomato" size="md" rotation={-14} />
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Stage Footer Badge */}
            <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2">
              <span className="text-xl p-1 rounded-full border border-[#14231C] bg-[#F3EBDD] shadow-[1.5px_1.5px_0_#14231C]">
                {product.accentEmoji}
              </span>
              <span className="font-label-mono text-[10px] text-[#14231C]/75 bg-[#F3EBDD]/90 px-2 py-0.5 rounded border border-[#14231C]/30">
                {currentAngle.label}
              </span>
            </div>
          </div>

          {/* 4 Gallery Thumbnails */}
          <div className="grid grid-cols-4 gap-3">
            {angles.map((ang, idx) => {
              const isActive = activeAngle === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveAngle(idx)}
                  className={`
                    relative rounded-[12px] border-[1.5px] p-2.5 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer
                    ${
                      isActive
                        ? 'border-[#14231C] bg-[#EADFCB] shadow-[3px_3px_0_#14231C] ring-2 ring-[#E8502B]'
                        : 'border-[#14231C]/30 bg-[#F3EBDD] hover:border-[#14231C] hover:bg-[#EADFCB]/60'
                    }
                  `}
                  aria-label={`View angle: ${ang.label}`}
                >
                  <div
                    className="w-10 h-10 rounded-[8px] border border-[#14231C]/30 flex items-center justify-center overflow-hidden text-xl"
                    style={{ backgroundColor: currentBgHex }}
                  >
                    <span
                      style={{
                        transform: `scale(${ang.scale * 0.75}) rotate(${ang.rotation}deg)`,
                      }}
                    >
                      {product.emoji}
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="font-label-mono text-[9px] font-bold text-[#14231C] block uppercase tracking-tight">
                      {ang.short}
                    </span>
                    <span className="font-mono text-[8px] text-[#14231C]/50 block">0{idx + 1}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ================= 5B. BUY PANEL ================= */}
        <div className="lg:col-span-5 space-y-6 bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[22px] p-6 sm:p-8 shadow-[4px_4px_0_#14231C]">
          {/* Header Info */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs uppercase tracking-wider text-[#14231C]/65 font-medium">
                {product.brand} · {product.category}
              </span>

              {/* Stock Indicator */}
              {isOutOfStock ? (
                <Stamp text="SOLD OUT" size="sm" variant="tomato" rotation={-2} />
              ) : isLowStock ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8502B]/10 border border-[#E8502B]/40 text-[#E8502B] font-label-mono text-[10px] font-bold">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E8502B] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E8502B]"></span>
                  </span>
                  <span>ONLY {product.stock} LEFT</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#286345]/10 border border-[#286345]/40 text-[#286345] font-label-mono text-[10px] font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#286345]" />
                  <span>IN STOCK · READY</span>
                </div>
              )}
            </div>

            <h1 className="font-fraunces text-2xl sm:text-3xl font-semibold text-[#14231C] leading-snug">
              {product.name}
            </h1>

            {/* Clickable Rating with Smooth Scroll to Reviews */}
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('reviews-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-3 pt-1 cursor-pointer group text-left"
              aria-label="Scroll to customer reviews"
            >
              <RatingStars
                rating={product.rating}
                reviewCount={product.ratingCount}
                showValue
                size={16}
              />
              <span className="text-[#14231C]/40">·</span>
              <span className="font-label-mono text-xs text-[#286345] group-hover:underline font-semibold flex items-center gap-1">
                <HandTick size={13} /> {reviews.length} VERIFIED NOTES
              </span>
            </button>
          </div>

          {/* Hanging Price Tag Module */}
          <div className="relative bg-[#F3EBDD] border-[1.5px] border-[#14231C] rounded-[14px] p-4 shadow-[2px_2px_0_#14231C] space-y-2">
            {/* Eyelet hole punch graphic */}
            <div className="absolute top-2 right-3 flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full border border-[#14231C] bg-[#EADFCB] shadow-inner" />
            </div>

            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="font-mono font-bold text-2xl sm:text-3xl text-[#14231C]">
                {formatINR(product.price)}
              </span>
              {product.mrp > product.price && (
                <>
                  <span className="font-mono text-sm text-[#14231C]/45 line-through">
                    MRP {formatINR(product.mrp)}
                  </span>
                  <span className="font-label-mono text-xs text-[#E8502B] font-bold bg-[#E8502B]/10 px-2 py-0.5 rounded border border-[#E8502B]/30">
                    SAVE {formatINR(product.mrp - product.price)} (
                    {Math.round(((product.mrp - product.price) / product.mrp) * 100)}% OFF)
                  </span>
                </>
              )}
            </div>
            <p className="font-label-mono text-[10px] text-[#14231C]/60">
              INCLUSIVE OF ALL POSTAL TAXES & DISPATCH LEVIES
            </p>
          </div>

          {/* Short Description */}
          <p className="text-sm text-[#14231C]/85 leading-relaxed font-sans">{product.shortDesc}</p>

          {/* Variant Selector (Visibly alters backdrop) */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="font-label-mono text-xs text-[#14231C]/75 block font-bold">
                  SELECT {product.variants[0].name.toUpperCase()}:
                </label>
                <span className="font-mono text-[11px] text-[#14231C]/60">{selectedVariant}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.variants[0].options.map((opt) => {
                  const isSelected = selectedVariant === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setSelectedVariant(opt)}
                      className={`
                        px-3.5 py-1.5 rounded-[8px] text-xs font-mono font-medium border-[1.5px] cursor-pointer transition-all
                        ${
                          isSelected
                            ? 'border-[#14231C] bg-[#14231C] text-[#F3EBDD] shadow-[2px_2px_0_#E8502B]'
                            : 'border-[#14231C]/40 bg-[#F3EBDD] text-[#14231C] hover:border-[#14231C] hover:bg-[#EAE1D3]'
                        }
                      `}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity & Action CTAs Row */}
          <div className="space-y-4 pt-2">
            <div className="flex items-end gap-3 flex-wrap sm:flex-nowrap">
              {/* Stepper with 1-10 clamp, shake animation, and micro message */}
              <div className="space-y-1">
                <span className="font-label-mono text-[10px] text-[#14231C]/70 block font-bold">
                  QTY (1–10)
                </span>
                <Stepper
                  value={quantity}
                  onChange={setQuantity}
                  min={1}
                  max={Math.min(10, product.stock || 1)}
                  disabled={isOutOfStock}
                />
              </div>

              {/* Add to Bag CTA */}
              <div className="flex-1 space-y-1">
                <span className="font-label-mono text-[10px] text-[#14231C]/60 block opacity-0 select-none">
                  ADD
                </span>
                <Button
                  ref={buyButtonRef}
                  variant="primary"
                  fullWidth
                  size="md"
                  disabled={isOutOfStock}
                  onClick={handleAddToCart}
                >
                  {isOutOfStock ? 'Sold Out' : 'Add to Bag'}
                </Button>
              </div>

              {/* Buy Now CTA */}
              <div className="space-y-1">
                <span className="font-label-mono text-[10px] text-[#14231C]/60 block opacity-0 select-none">
                  BUY
                </span>
                <Button
                  variant="secondary"
                  size="md"
                  disabled={isOutOfStock}
                  onClick={handleBuyNow}
                  className="whitespace-nowrap"
                >
                  Buy Now
                </Button>
              </div>

              {/* Wishlist Toggle Heart Button */}
              <div className="space-y-1">
                <span className="font-label-mono text-[10px] text-[#14231C]/60 block opacity-0 select-none">
                  WISH
                </span>
                <button
                  type="button"
                  onClick={() => toggleWishlist(product.id)}
                  className={`
                    w-11 h-10 rounded-[8px] border-[1.5px] border-[#14231C] flex items-center justify-center cursor-pointer transition-all shadow-[2px_2px_0_#14231C] active:scale-90
                    ${isWish ? 'bg-[#E8502B] text-[#F3EBDD]' : 'bg-[#F3EBDD] text-[#14231C] hover:bg-[#14231C]/10'}
                  `}
                  aria-label="Toggle saved wishlist"
                >
                  <HandHeart size={20} filled={isWish} />
                </button>
              </div>
            </div>

            {/* Pincode & Dispatch Estimation Check */}
            <div className="p-3.5 bg-[#F3EBDD] rounded-[10px] border border-[#14231C]/25 space-y-2">
              <span className="font-label-mono text-[10px] text-[#14231C]/75 block font-bold uppercase tracking-wider">
                POSTAL DISPATCH ESTIMATE (PINCODE CHECK)
              </span>

              <form onSubmit={handleCheckPincode} className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit PIN (e.g. 400050)"
                  value={pincodeInput}
                  onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[6px] px-3 py-1.5 text-xs font-mono text-[#14231C] placeholder-[#14231C]/45 focus:outline-none focus:bg-[#F3EBDD]"
                />
                <Button type="submit" variant="secondary" size="sm">
                  Check PIN
                </Button>
              </form>

              {pincodeResult && (
                <AnimatePresence>
                  {pincodeResult.valid ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="pt-1 space-y-1.5"
                    >
                      {/* Animated Postal Van 🚚 driving along dashed line */}
                      <div className="relative w-full h-6 flex items-center overflow-hidden">
                        <div className="absolute inset-x-0 border-b border-dashed border-[#14231C]/40 top-3" />
                        <motion.div
                          animate={{ x: [0, 180, 0] }}
                          transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
                          className="relative z-10 text-base"
                        >
                          🚚
                        </motion.div>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-label-mono text-[#286345] font-semibold">
                        <HandTick size={13} />
                        <span>Arrives by {pincodeResult.estimateDate}</span>
                      </div>
                      <p className="text-[10px] font-label-mono text-[#14231C]/65">
                        Direct postal dispatch from {seller.address?.city || 'Bengaluru'} workshop hub.
                      </p>
                    </motion.div>
                  ) : (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[11px] font-label-mono text-[#E8502B] font-bold"
                    >
                      {pincodeResult.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================= 5C. DETAILS & SPECIFICATIONS ================= */}
      <section className="space-y-6 pt-6 border-t-[1.5px] border-[#14231C]">
        <div className="space-y-1">
          <p className="font-label-mono text-xs text-[#14231C]/60 uppercase">PROVENANCE & ARCHIVE</p>
          <h2 className="font-fraunces text-2xl font-semibold text-[#14231C]">
            Craft <span className="font-fraunces-italic font-normal">Specifications</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* 3 Spec Rows in Mono */}
          <div className="md:col-span-8 bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[18px] p-6 shadow-[3px_3px_0_#14231C] space-y-4">
            <h3 className="font-label-mono text-xs font-bold text-[#14231C] uppercase tracking-wider pb-2 border-b border-[#14231C]/15">
              WORKSHOP DOSSIER
            </h3>

            <div className="space-y-3 font-mono text-xs">
              {getProductSpecs(product.category, product.name).map((spec, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-[#F3EBDD] rounded-[8px] border border-[#14231C]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <span className="font-label-mono text-[10px] text-[#14231C]/60 tracking-wider">
                    {spec.label}
                  </span>
                  <span className="font-semibold text-[#14231C] sm:text-right">{spec.value}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex items-center gap-2 flex-wrap text-[11px] font-label-mono text-[#14231C]/70">
              <span className="font-bold text-[#14231C]">TAGS:</span>
              {product.tags.map((t) => (
                <span
                  key={t}
                  className="bg-[#F3EBDD] px-2 py-0.5 rounded border border-[#14231C]/30 text-[#14231C]"
                >
                  #{t}
                </span>
              ))}
            </div>
          </div>

          {/* "Sold by" Tag with Seller's Emoji Avatar */}
          <div className="md:col-span-4 bg-[#F3EBDD] border-[1.5px] border-[#14231C] rounded-[18px] p-6 shadow-[3px_3px_0_#14231C] space-y-4">
            <span className="font-label-mono text-[10px] text-[#14231C]/60 block uppercase font-bold tracking-wider">
              OFFICIAL DISPATCHER
            </span>

            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full border-[1.5px] border-[#14231C] bg-[#EADFCB] flex items-center justify-center text-3xl shadow-[2px_2px_0_#14231C]">
                {seller.avatar}
              </div>
              <div className="space-y-0.5">
                <h4 className="font-fraunces text-base font-semibold text-[#14231C]">
                  {seller.sellerShopName || seller.name}
                </h4>
                <p className="font-label-mono text-[10px] text-[#14231C]/65">
                  {seller.address?.city}, {seller.address?.state}
                </p>
                <div className="flex items-center gap-1 text-[9px] font-label-mono text-[#286345] font-bold">
                  <HandTick size={11} /> VERIFIED SELLER
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#14231C]/15 text-xs text-[#14231C]/75 font-sans leading-relaxed">
              Every parcel from this workshop is hand-stamped, checked for postal integrity, and
              individually boxed before dispatch.
            </div>

            <Button
              variant="secondary"
              size="sm"
              fullWidth
              onClick={() => navigate(`/shop?brand=${encodeURIComponent(product.brand)}`)}
            >
              View More by {product.brand}
            </Button>
          </div>
        </div>
      </section>

      {/* ================= 5D. REVIEWS SECTION ================= */}
      <section id="reviews-section" className="space-y-6 pt-6 border-t-[1.5px] border-[#14231C]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="font-label-mono text-xs text-[#14231C]/60 uppercase">POSTAL DISPATCH LOG</p>
            <h2 className="font-fraunces text-2xl font-semibold text-[#14231C]">
              Customer <span className="font-fraunces-italic font-normal">Notes</span> ({reviews.length})
            </h2>
          </div>

          {/* Write a Review Gate */}
          <div className="flex items-center gap-3 flex-wrap">
            {!currentUser ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate(`/login?redirect=/product/${product.id}`)}
              >
                Sign In to Review
              </Button>
            ) : hasDeliveredOrder ? (
              <Button variant="primary" size="sm" onClick={() => setIsReviewModalOpen(true)}>
                ✍️ Write a Note
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled
                  title="Verified reviews only available for delivered orders of this ware"
                  className="opacity-70 cursor-not-allowed"
                >
                  🔒 Note Locked (Delivery Required)
                </Button>
                {/* Postal verification toggle to easily unlock note writing */}
                <button
                  type="button"
                  onClick={handleMarkDelivered}
                  className="text-[10px] font-label-mono text-[#E8502B] hover:underline cursor-pointer"
                  title="Stamp dispatch verification to write review"
                >
                  [Verify Dispatch Note]
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Rating Summary with Animated Distribution Bars */}
        <div className="bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[18px] p-6 shadow-[3px_3px_0_#14231C] grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Big Score Block */}
          <div className="md:col-span-4 text-center md:text-left space-y-1 md:border-r border-[#14231C]/20 md:pr-6">
            <span className="font-fraunces text-5xl font-bold text-[#14231C] block">
              {product.rating.toFixed(1)}
            </span>
            <RatingStars rating={product.rating} size={20} />
            <p className="font-label-mono text-xs text-[#14231C]/65 pt-1">
              Based on {totalReviewsCount} stamped dispatches
            </p>
          </div>

          {/* Animated Rating Distribution Bars */}
          <div className="md:col-span-8 space-y-2">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = starCounts[stars as keyof typeof starCounts] || 0;
              const pct = totalReviewsCount > 0 ? (count / totalReviewsCount) * 100 : 0;
              const isSelected = selectedStarFilter === stars;

              return (
                <button
                  key={stars}
                  type="button"
                  onClick={() =>
                    setSelectedStarFilter(selectedStarFilter === stars ? 'all' : (stars as number))
                  }
                  className={`
                    w-full flex items-center gap-3 text-xs font-mono group cursor-pointer p-1 rounded transition-colors
                    ${isSelected ? 'bg-[#F3EBDD] font-bold ring-1 ring-[#14231C]' : 'hover:bg-[#F3EBDD]/50'}
                  `}
                >
                  <span className="w-10 text-left font-label-mono text-[11px] text-[#14231C]">
                    {stars} ★
                  </span>

                  {/* Distribution Bar Track */}
                  <div className="flex-1 h-3 rounded-full bg-[#D8CDBC] overflow-hidden border border-[#14231C]/20">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="h-full bg-[#E8502B] rounded-full"
                    />
                  </div>

                  <span className="w-12 text-right font-label-mono text-[10px] text-[#14231C]/70">
                    {count} ({Math.round(pct)}%)
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter & Sort Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          {/* Star Filter Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-label-mono text-[10px] text-[#14231C]/60 mr-1">FILTER:</span>
            {(['all', 5, 4, 3, 2, 1] as const).map((filterVal) => (
              <button
                key={String(filterVal)}
                type="button"
                onClick={() => setSelectedStarFilter(filterVal)}
                className={`
                  px-2.5 py-1 rounded-[6px] text-xs font-mono font-medium border cursor-pointer transition-colors
                  ${
                    selectedStarFilter === filterVal
                      ? 'border-[#14231C] bg-[#14231C] text-[#F3EBDD]'
                      : 'border-[#14231C]/30 bg-[#F3EBDD] text-[#14231C] hover:border-[#14231C]'
                  }
                `}
              >
                {filterVal === 'all' ? `All (${reviews.length})` : `${filterVal} ★ (${starCounts[filterVal as keyof typeof starCounts] || 0})`}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="font-label-mono text-[10px] text-[#14231C]/60">SORT:</span>
            <select
              value={reviewSort}
              onChange={(e) => setReviewSort(e.target.value as 'newest' | 'helpful')}
              className="bg-[#F3EBDD] border-[1.5px] border-[#14231C] rounded-[6px] px-2.5 py-1 text-xs font-mono text-[#14231C] outline-none cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="helpful">Most Helpful</option>
            </select>
          </div>
        </div>

        {/* Review Cards Grid */}
        {filteredReviews.length === 0 ? (
          <div className="p-8 text-center bg-[#EADFCB] rounded-[14px] border-[1.5px] border-[#14231C] space-y-2">
            <span className="text-3xl block">🫥</span>
            <p className="font-fraunces text-base font-semibold">No notes match this filter</p>
            <Button variant="secondary" size="sm" onClick={() => setSelectedStarFilter('all')}>
              Show All Notes
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredReviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[16px] p-5 shadow-[2px_2px_0_#14231C] flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl select-none p-1 rounded-full bg-[#F3EBDD] border border-[#14231C]/20">
                        {rev.userAvatar}
                      </span>
                      <div>
                        <p className="font-medium text-xs text-[#14231C] leading-none">
                          {rev.userName}
                        </p>
                        <span className="font-label-mono text-[9px] text-[#14231C]/60">
                          {rev.date}
                        </span>
                      </div>
                    </div>

                    <RatingStars rating={rev.rating} size={14} />
                  </div>

                  <h4 className="font-fraunces text-base font-semibold text-[#14231C]">
                    {rev.title}
                  </h4>

                  <p className="text-xs text-[#14231C]/85 leading-relaxed font-sans">{rev.comment}</p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#14231C]/15 text-[10px] font-label-mono">
                  {/* Verified Buyer Stamp */}
                  <span className="text-[#286345] flex items-center gap-1 font-bold bg-[#286345]/10 px-2 py-0.5 rounded border border-[#286345]/30">
                    <HandTick size={12} /> VERIFIED RECIPIENT
                  </span>

                  {/* Helpful Vote Button */}
                  <button
                    type="button"
                    onClick={() => {
                      markReviewHelpful(rev.id);
                      addToast({
                        title: 'Feedback Recorded',
                        message: 'Helpful vote stamped for this note',
                        variant: 'mint',
                      });
                    }}
                    className="hover:text-[#E8502B] text-[#14231C]/75 cursor-pointer font-bold transition-colors flex items-center gap-1"
                  >
                    <span>Helpful</span>
                    <span className="bg-[#F3EBDD] px-1.5 py-0.2 rounded border border-[#14231C]/20">
                      {rev.helpfulCount}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ================= 5E. RECOMMENDATIONS ================= */}
      {/* 1. "Goes well with" */}
      {goesWellWith.length > 0 && (
        <section className="space-y-6 pt-6 border-t-[1.5px] border-[#14231C]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div className="space-y-1">
              <p className="font-label-mono text-xs text-[#14231C]/60 uppercase">
                COMPANION DISPATCHES
              </p>
              <h2 className="font-fraunces text-2xl font-semibold text-[#14231C]">
                Goes <span className="font-fraunces-italic font-normal">Well With</span>
              </h2>
            </div>
            <span className="font-label-mono text-[10px] text-[#286345] bg-[#286345]/10 px-2 py-0.5 rounded border border-[#286345]/30 font-bold uppercase self-start sm:self-auto">
              {recommenderEngine === 'smart' ? 'Smart Hybrid Engine' : 'Popularity Engine'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {goesWellWith.map((scored) => {
              const item = scored.product;
              return (
                <motion.div
                  layout
                  key={item.id}
                  onClick={() => navigate(`/product/${item.id}`)}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[16px] p-3.5 shadow-[2px_2px_0_#14231C] hover:shadow-[4px_4px_0_#14231C] transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    {/* Top match ring and brand */}
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-[#14231C]/60 truncate font-semibold">
                        {item.brand}
                      </span>
                      <MatchRing percentage={scored.matchPercentage} size={32} />
                    </div>

                    <div
                      className="w-full aspect-square rounded-[10px] border-[1.5px] border-[#14231C] flex items-center justify-center mb-2.5 transition-transform group-hover:scale-102"
                      style={{ backgroundColor: item.bgHex }}
                    >
                      <Sticker emoji={item.emoji} color={item.backdropColor} size="md" />
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-fraunces text-xs sm:text-sm font-semibold text-[#14231C] line-clamp-1 group-hover:text-[#E8502B] transition-colors">
                        {item.name}
                      </h4>
                      {/* Reason line */}
                      <p className="font-mono text-[9px] text-[#14231C]/75 truncate flex items-center gap-1">
                        <span className="text-[#E8502B] text-[8px]">✦</span>
                        <span className="truncate">{scored.reason}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-[#14231C]/15">
                    <span className="font-mono font-bold text-xs">{formatINR(item.price)}</span>
                    <RatingStars rating={item.rating} size={11} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* 2. "Others also bought" */}
      {othersAlsoBought.length > 0 && (
        <section className="space-y-6 pt-6 border-t-[1.5px] border-[#14231C]">
          <div className="space-y-1">
            <p className="font-label-mono text-xs text-[#14231C]/60 uppercase">
              RECIPIENT FAVORITES
            </p>
            <h2 className="font-fraunces text-2xl font-semibold text-[#14231C]">
              Others <span className="font-fraunces-italic font-normal">Also Bought</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {othersAlsoBought.map((scored) => {
              const item = scored.product;
              return (
                <motion.div
                  layout
                  key={item.id}
                  onClick={() => navigate(`/product/${item.id}`)}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[16px] p-3.5 shadow-[2px_2px_0_#14231C] hover:shadow-[4px_4px_0_#14231C] transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    {/* Top match ring and brand */}
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-[#14231C]/60 truncate font-semibold">
                        {item.brand}
                      </span>
                      <MatchRing percentage={scored.matchPercentage} size={32} />
                    </div>

                    <div
                      className="w-full aspect-square rounded-[10px] border-[1.5px] border-[#14231C] flex items-center justify-center mb-2.5 transition-transform group-hover:scale-102"
                      style={{ backgroundColor: item.bgHex }}
                    >
                      <Sticker emoji={item.emoji} color={item.backdropColor} size="md" />
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-fraunces text-xs sm:text-sm font-semibold text-[#14231C] line-clamp-1 group-hover:text-[#E8502B] transition-colors">
                        {item.name}
                      </h4>
                      {/* Reason line */}
                      <p className="font-mono text-[9px] text-[#14231C]/75 truncate flex items-center gap-1">
                        <span className="text-[#E8502B] text-[8px]">✦</span>
                        <span className="truncate">{scored.reason}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-[#14231C]/15">
                    <span className="font-mono font-bold text-xs">{formatINR(item.price)}</span>
                    <RatingStars rating={item.rating} size={11} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* ================= STICKY MOBILE BOTTOM ADD-TO-CART BAR ================= */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-14 lg:hidden left-0 right-0 z-40 bg-[#F3EBDD]/95 backdrop-blur-md border-t-[1.5px] border-[#14231C] px-4 py-3 shadow-[0_-4px_12px_rgba(20,35,28,0.15)] flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-10 h-10 rounded-[6px] border border-[#14231C] flex items-center justify-center text-xl shrink-0"
                style={{ backgroundColor: currentBgHex }}
              >
                {product.emoji}
              </div>
              <div className="min-w-0">
                <p className="font-fraunces text-xs font-semibold text-[#14231C] truncate">
                  {product.name}
                </p>
                <p className="font-mono text-xs font-bold text-[#14231C]">
                  {formatINR(product.price)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="primary"
                size="sm"
                disabled={isOutOfStock}
                onClick={handleAddToCart}
              >
                {isOutOfStock ? 'Sold Out' : 'Add to Bag'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= WRITE REVIEW MODAL ================= */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title="Leave a Dispatch Note"
        subtitle={`POSTAL REVIEW · ${product.name}`}
      >
        <form onSubmit={handleSubmitReview} className="space-y-4">
          <div className="space-y-1.5">
            <label className="font-label-mono text-xs text-[#14231C]/75 block font-bold">
              YOUR IMPRESSION (STARS):
            </label>
            <RatingStars
              rating={reviewRating}
              interactive
              onChange={setReviewRating}
              size={24}
              showValue
            />
          </div>

          <Input
            label="Note Headline"
            value={reviewTitle}
            onChange={(e) => setReviewTitle(e.target.value)}
            placeholder="e.g. Unboxing was a tactile delight"
            required
          />

          <div className="space-y-1 pt-1">
            <label className="font-label-mono text-xs text-[#14231C]/75 block font-bold">
              OBSERVATIONS & TACTILE NOTES:
            </label>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              rows={4}
              placeholder="Describe the paper weight, joinery, finish, tactile response, or postal unboxing experience..."
              className="w-full bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[8px] p-3 text-xs font-sans text-[#14231C] outline-none placeholder-[#14231C]/45 focus:bg-[#F3EBDD]"
              required
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#14231C]/20">
            <span className="font-label-mono text-[10px] text-[#286345] font-bold flex items-center gap-1">
              <HandTick size={12} /> VERIFIED RECIPIENT STAMP
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Stamp Note
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
