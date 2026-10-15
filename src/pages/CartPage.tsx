import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Receipt,
  Perforation,
  Button,
  Stepper,
  Stamp,
  Input,
  ScribbleUnderline,
  MatchRing,
  Sticker,
  FreeDeliveryRoad,
  HandArrow,
  HandHeart,
} from '../components/ui';
import { useParcelStore, CartItem } from '../store';
import { useToastStore } from '../store/toastStore';
import { formatINR } from '../lib/format';
import { recommendScored } from '../lib/recommend';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    cartItems,
    addToCart,
    updateQty,
    removeFromCart,
    saveForLater,
    restoreCartItem,
    clearCart,
    getCartSubtotal,
    getCartTotalItems,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    getDiscountAmount,
    getFinalTotal,
    products,
    views,
    cartAdds,
    purchases,
    wishlist,
    orders,
    recommenderEngine,
  } = useParcelStore();

  const { addToast } = useToastStore();
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | undefined>();

  const totalItems = getCartTotalItems();
  const subtotal = getCartSubtotal();
  const discount = getDiscountAmount();
  const finalTotal = getFinalTotal();
  const isFreeShip = appliedCoupon?.type === 'shipping' || subtotal >= 999;
  const shippingFee = isFreeShip || subtotal === 0 ? 0 : 80;
  const gstIncluded = Math.round((subtotal * 18) / 118);

  // Recommendations for Empty Cart or "Forgot something?" companions
  const emptyCartRecommendations = useMemo(() => {
    return recommendScored(
      {
        behaviour: { views, cartAdds, purchases, wishlist },
        orders,
        allProducts: products,
        limit: 4,
        contextType: 'home-picked',
      },
      recommenderEngine
    );
  }, [views, cartAdds, purchases, wishlist, orders, products, recommenderEngine]);

  const cartForgotWares = useMemo(() => {
    const cartProductIds = cartItems.map((i) => i.product.id);
    return recommendScored(
      {
        excludeIds: cartProductIds,
        behaviour: { views, cartAdds, purchases, wishlist },
        orders,
        allProducts: products,
        limit: 3,
        contextType: 'cart-forgot',
      },
      recommenderEngine
    );
  }, [
    cartItems,
    views,
    cartAdds,
    purchases,
    wishlist,
    orders,
    products,
    recommenderEngine,
  ]);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(undefined);
    if (!couponInput.trim()) return;

    const res = applyCoupon(couponInput);
    if (res.success) {
      addToast({
        title: 'Coupon Stamped',
        message: `Applied ${couponInput.toUpperCase()}`,
        variant: 'wax',
      });
      setCouponInput('');
    } else {
      setCouponError(res.error);
    }
  };

  const handleRemoveItem = (item: CartItem) => {
    removeFromCart(item.product.id, item.variant);
    addToast({
      title: 'Item Removed',
      message: `${item.product.name} removed from postal bag`,
      variant: 'tomato',
      action: {
        label: 'Undo',
        onClick: () => {
          restoreCartItem(item);
          addToast({
            title: 'Restored',
            message: `${item.product.name} put back in parcel`,
            variant: 'mint',
          });
        },
      },
    });
  };

  const handleSaveForLater = (item: CartItem) => {
    saveForLater(item.product.id, item.variant);
    addToast({
      title: 'Moved to Wishlist',
      message: `${item.product.name} preserved in your saved wares`,
      variant: 'wax',
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-10">
      {/* Page Header */}
      <div className="flex items-end justify-between border-b-[1.5px] border-[#14231C] pb-4">
        <div>
          <p className="font-label-mono text-xs text-[#14231C]/60">MANIFEST DISPATCH SLIP</p>
          <h1 className="font-fraunces text-3xl sm:text-4xl font-semibold tracking-tight text-[#14231C]">
            Postal <span className="font-fraunces-italic font-normal">Bag</span> ({totalItems})
          </h1>
          <div className="w-32 text-[#E8502B]">
            <ScribbleUnderline />
          </div>
        </div>

        {cartItems.length > 0 && (
          <button
            type="button"
            onClick={clearCart}
            className="font-label-mono text-xs text-[#E8502B] hover:underline cursor-pointer"
          >
            CLEAR BAG
          </button>
        )}
      </div>

      {/* Free Delivery Road Progress */}
      {cartItems.length > 0 && <FreeDeliveryRoad subtotal={subtotal} threshold={999} />}

      {/* Empty State vs. Long Paper Receipt */}
      {cartItems.length === 0 ? (
        <div className="space-y-12">
          {/* Illustrated Empty Bag Box */}
          <div className="py-16 px-6 text-center space-y-4 bg-[#EADFCB] rounded-[22px] border-[1.5px] border-[#14231C] shadow-[4px_4px_0_#14231C] max-w-xl mx-auto">
            <div className="w-20 h-20 mx-auto rounded-full bg-[#F3EBDD] border-[1.5px] border-[#14231C] flex items-center justify-center text-4xl shadow-[2px_2px_0_#14231C]">
              📦
            </div>
            <Stamp text="PARCEL SACK VACANT" variant="tomato" size="md" rotation={-2} />
            <h2 className="font-fraunces text-2xl font-semibold text-[#14231C]">
              Your postal bag is empty
            </h2>
            <p className="text-xs text-[#14231C]/70 font-sans max-w-sm mx-auto leading-relaxed">
              No registered wares are queued for packaging. Explore our artisan catalog of journals, brassware, and handcrafted instruments.
            </p>
            <div className="pt-2">
              <Button variant="primary" size="md" onClick={() => navigate('/shop')}>
                Explore Catalog
              </Button>
            </div>
          </div>

          {/* Recommendations for Empty Cart */}
          <div className="space-y-4">
            <div className="border-b-[1.5px] border-[#14231C] pb-2 flex items-center justify-between">
              <div>
                <span className="font-label-mono text-[10px] text-[#14231C]/60 uppercase">
                  RECOMMENDED DISPATCHES
                </span>
                <h3 className="font-fraunces text-xl font-semibold text-[#14231C]">
                  Curated Wares to Begin Your Parcel
                </h3>
              </div>
              <Link
                to="/shop"
                className="font-label-mono text-xs text-[#E8502B] hover:underline flex items-center gap-1"
              >
                <span>ALL WARES</span>
                <HandArrow size={12} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {emptyCartRecommendations.map((scored) => {
                const item = scored.product;
                return (
                  <div
                    key={item.id}
                    className="bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[16px] p-4 shadow-[2px_2px_0_#14231C] flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono text-[9px] uppercase tracking-wider text-[#14231C]/60 truncate font-semibold">
                          {item.brand}
                        </span>
                        <MatchRing percentage={scored.matchPercentage} size={28} />
                      </div>

                      <div
                        onClick={() => navigate(`/product/${item.id}`)}
                        className="w-full aspect-square rounded-[10px] border border-[#14231C]/30 flex items-center justify-center mb-2.5 cursor-pointer hover:scale-102 transition-transform"
                        style={{ backgroundColor: item.bgHex }}
                      >
                        <Sticker emoji={item.emoji} color={item.backdropColor} size="md" />
                      </div>

                      <h4
                        onClick={() => navigate(`/product/${item.id}`)}
                        className="font-fraunces font-semibold text-sm text-[#14231C] group-hover:text-[#E8502B] transition-colors truncate cursor-pointer"
                      >
                        {item.name}
                      </h4>
                      <p className="font-mono text-[10px] text-[#14231C]/70 truncate pt-0.5">
                        ✦ {scored.reason}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 mt-2 border-t border-[#14231C]/15">
                      <span className="font-mono font-bold text-xs">{formatINR(item.price)}</span>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          addToCart(item, 1);
                          addToast({
                            title: 'Packed',
                            message: `${item.name} added to parcel`,
                            variant: 'tomato',
                          });
                        }}
                      >
                        + Pack
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-10">
          {/* 7A. LONG PAPER RECEIPT CONTAINER */}
          <div className="relative mx-auto w-full max-w-2xl shadow-[6px_6px_0_#14231C]">
            {/* Top Perforated Sawtooth Edge */}
            <div className="w-full h-3.5 overflow-hidden shrink-0 -mb-[1px]">
              <svg
                viewBox="0 0 360 14"
                preserveAspectRatio="none"
                className="w-full h-full block"
                fill="none"
              >
                <path
                  d="M0 14 L10 0 L20 14 L30 0 L40 14 L50 0 L60 14 L70 0 L80 14 L90 0 L100 14 L110 0 L120 14 L130 0 L140 14 L150 0 L160 14 L170 0 L180 14 L190 0 L200 14 L210 0 L220 14 L230 0 L240 14 L250 0 L260 14 L270 0 L280 14 L290 0 L300 14 L310 0 L320 14 L330 0 L340 14 L350 0 L360 14 Z"
                  fill="#F3EBDD"
                  stroke="#14231C"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Main Receipt Sheet Body */}
            <div className="relative border-x-[1.5px] border-[#14231C] bg-[#F3EBDD] px-6 sm:px-8 py-6 space-y-6">
              {/* Receipt Postal Header */}
              <div className="text-center space-y-1 pb-4 border-b-[1.5px] border-dashed border-[#14231C]/35">
                <div className="flex items-center justify-between font-label-mono text-[10px] text-[#14231C]/65">
                  <span>POSTAL MANIFEST #BAG-{totalItems}</span>
                  <span>CENTRAL G.P.O. DESK</span>
                </div>
                <h2 className="font-fraunces text-2xl font-semibold tracking-tight text-[#14231C]">
                  General Post Office Dispatch Slip
                </h2>
                <p className="font-mono text-[10px] text-[#14231C]/75">
                  REGISTRY VERIFIED · SAC CODE 996812 · ALL PRICES INCL. TAX
                </p>
              </div>

              {/* Monospaced Column Headers */}
              <div className="grid grid-cols-12 gap-2 font-mono text-[10px] uppercase font-bold text-[#14231C]/60 pb-2 border-b border-[#14231C]/15">
                <span className="col-span-6 sm:col-span-7">ITEM &amp; VARIANT</span>
                <span className="col-span-3 sm:col-span-2 text-center">QTY</span>
                <span className="col-span-3 text-right">TOTAL</span>
              </div>

              {/* Items That "Print" In One by One with Staggered Motion */}
              <div className="divide-y divide-dashed divide-[#14231C]/25 space-y-1">
                <AnimatePresence>
                  {cartItems.map((item, index) => {
                    const { product, quantity, variant } = item;
                    const lineTotal = product.price * quantity;

                    return (
                      <motion.div
                        key={`${product.id}-${variant || 'default'}`}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                        transition={{
                          duration: 0.35,
                          delay: index * 0.08,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        className="py-4 first:pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono"
                      >
                        {/* Product Identification */}
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          {/* Small Sticker */}
                          <div
                            className="w-11 h-11 rounded-[8px] border-[1.5px] border-[#14231C] flex items-center justify-center shrink-0 text-xl shadow-[1px_1px_0_#14231C]"
                            style={{ backgroundColor: product.bgHex }}
                          >
                            <Sticker emoji={product.emoji} color={product.backdropColor} size="sm" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <Link
                              to={`/product/${product.id}`}
                              className="font-fraunces font-semibold text-sm text-[#14231C] hover:text-[#E8502B] transition-colors truncate block"
                            >
                              {product.name}
                            </Link>
                            <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-[#14231C]/70">
                              {variant && (
                                <span className="font-label-mono text-[9px] px-1.5 py-0.2 rounded border border-[#14231C]/40 bg-[#EADFCB]">
                                  {variant}
                                </span>
                              )}
                              <span className="font-mono text-[11px] font-bold text-[#14231C]">
                                {formatINR(product.price)} each
                              </span>
                            </div>

                            {/* Secondary Actions: Save for later & Remove */}
                            <div className="flex items-center gap-3 pt-2 text-[10px] font-label-mono">
                              <button
                                type="button"
                                onClick={() => handleSaveForLater(item)}
                                className="text-[#286345] hover:underline cursor-pointer flex items-center gap-1"
                              >
                                <HandHeart size={12} />
                                <span>Save for later</span>
                              </button>
                              <span className="text-[#14231C]/30">|</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item)}
                                className="text-[#E8502B] hover:underline cursor-pointer"
                              >
                                Remove (Undo)
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Stepper (1-10) and Line Total */}
                        <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0">
                          <Stepper
                            value={quantity}
                            onChange={(newQty) => updateQty(product.id, newQty, variant)}
                            size="sm"
                            max={Math.min(10, product.stock)}
                          />

                          <div className="text-right min-w-[70px]">
                            <span className="font-mono font-bold text-sm text-[#14231C]">
                              {formatINR(lineTotal)}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Perforated Divider */}
              <Perforation notchBg="#F3EBDD" label="POSTAL CHARGES" />

              {/* 7A. Coupon Field */}
              <div className="bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[12px] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-label-mono text-xs text-[#14231C]/70 font-bold block">
                    POSTAL STAMP COUPON
                  </span>
                  <span className="font-label-mono text-[10px] text-[#14231C]/60">
                    OPTIONAL PROMOTION
                  </span>
                </div>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-2.5 rounded-[8px] bg-[#F3EBDD] border border-[#286345]/50">
                    <div className="flex items-center gap-2.5">
                      <Stamp text={appliedCoupon.code} variant="mint" size="sm" rotation={-1} />
                      <div>
                        <span className="text-xs font-mono text-[#286345] font-bold block">
                          {appliedCoupon.badge} Applied!
                        </span>
                        <span className="text-[10px] font-mono text-[#14231C]/70">
                          {appliedCoupon.description}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="font-label-mono text-xs font-bold text-[#E8502B] hover:underline px-2 py-1 cursor-pointer"
                    >
                      ✕ Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="space-y-2">
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <Input
                          label="Enter Stamp Code"
                          value={couponInput}
                          onChange={(e) => {
                            setCouponInput(e.target.value);
                            setCouponError(undefined);
                          }}
                          error={couponError}
                          placeholder="PARCEL10, FIRST100, FREESHIP"
                        />
                      </div>
                      <Button variant="secondary" size="sm" type="submit">
                        Apply Stamp
                      </Button>
                    </div>

                    {/* Quick suggestion stamp buttons */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-label-mono text-[#14231C]/70 pt-1">
                      <span className="font-bold">Available:</span>
                      <button
                        type="button"
                        onClick={() => setCouponInput('PARCEL10')}
                        className="px-2 py-0.5 rounded border border-[#14231C]/30 bg-[#F3EBDD] hover:border-[#14231C] cursor-pointer"
                      >
                        PARCEL10 (10% off)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCouponInput('FIRST100')}
                        className="px-2 py-0.5 rounded border border-[#14231C]/30 bg-[#F3EBDD] hover:border-[#14231C] cursor-pointer"
                      >
                        FIRST100 (₹100 off)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCouponInput('FREESHIP')}
                        className="px-2 py-0.5 rounded border border-[#14231C]/30 bg-[#F3EBDD] hover:border-[#14231C] cursor-pointer"
                      >
                        FREESHIP (Free Delivery)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCouponInput('MONSOON25')}
                        className="px-2 py-0.5 rounded border border-[#E8502B]/30 bg-[#F3EBDD] text-[#E8502B] hover:border-[#E8502B] cursor-pointer"
                        title="Expired coupon for test validation"
                      >
                        MONSOON25 (Expired)
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* 7A. Totals with Motion Animation on Change */}
              <div className="space-y-2.5 pt-2 border-t-[1.5px] border-dashed border-[#14231C]/35 font-mono text-xs">
                <div className="flex justify-between items-center text-[#14231C]/80">
                  <span>Subtotal ({totalItems} wares)</span>
                  <motion.span
                    key={subtotal}
                    initial={{ scale: 1.1, color: '#E8502B' }}
                    animate={{ scale: 1, color: '#14231C' }}
                    className="font-bold"
                  >
                    {formatINR(subtotal)}
                  </motion.span>
                </div>

                {discount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex justify-between items-center text-[#286345] font-bold"
                  >
                    <span>Coupon Discount ({appliedCoupon?.code})</span>
                    <span>−{formatINR(discount)}</span>
                  </motion.div>
                )}

                <div className="flex justify-between items-center text-[#14231C]/80">
                  <div className="flex items-center gap-1.5">
                    <span>Postal Dispatch Fee</span>
                    {isFreeShip && (
                      <span className="text-[9px] bg-[#286345]/15 text-[#286345] px-1 rounded font-bold">
                        FREE
                      </span>
                    )}
                  </div>
                  <motion.span
                    key={shippingFee}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    className="font-bold"
                  >
                    {shippingFee === 0 ? '₹0' : formatINR(shippingFee)}
                  </motion.span>
                </div>

                <div className="flex justify-between items-center text-[10px] text-[#14231C]/60 pt-0.5">
                  <span>Central GST (18% included in merchandise total)</span>
                  <span>{formatINR(gstIncluded)}</span>
                </div>

                {/* Grand Total Bar */}
                <div className="flex justify-between items-center pt-3 border-t-[1.5px] border-[#14231C] text-base font-bold text-[#14231C]">
                  <div>
                    <span className="font-fraunces text-lg">Grand Total</span>
                    <span className="block font-mono text-[9px] text-[#14231C]/60 font-normal">
                      FINAL SETTLED VALUE
                    </span>
                  </div>
                  <motion.span
                    key={finalTotal}
                    initial={{ scale: 1.15, color: '#E8502B' }}
                    animate={{ scale: 1, color: '#14231C' }}
                    transition={{ duration: 0.3 }}
                    className="font-mono text-2xl font-bold"
                  >
                    {formatINR(finalTotal)}
                  </motion.span>
                </div>
              </div>

              {/* Checkout CTA */}
              <div className="pt-4 space-y-2">
                <Button
                  variant="primary"
                  fullWidth
                  size="lg"
                  onClick={() => navigate('/checkout')}
                >
                  Proceed to Dispatch Counter · {formatINR(finalTotal)}
                </Button>
                <p className="text-center font-label-mono text-[10px] text-[#14231C]/60">
                  SEALED WITH WAX &amp; THREE-PLY JUTE TWINE · VERIFIED COUNTER RECEIPT
                </p>
              </div>
            </div>

            {/* Bottom Perforated Sawtooth Edge */}
            <div className="w-full h-3.5 overflow-hidden shrink-0 -mt-[1px]">
              <svg
                viewBox="0 0 360 14"
                preserveAspectRatio="none"
                className="w-full h-full block"
                fill="none"
              >
                <path
                  d="M0 0 L10 14 L20 0 L30 14 L40 0 L50 14 L60 0 L70 14 L80 0 L90 14 L100 0 L110 14 L120 0 L130 14 L140 0 L150 14 L160 0 L170 14 L180 0 L190 14 L200 0 L210 14 L220 0 L230 14 L240 0 L250 14 L260 0 L270 14 L280 0 L290 14 L300 0 L310 14 L320 0 L330 14 L340 0 L350 14 L360 0 Z"
                  fill="#F3EBDD"
                  stroke="#14231C"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* 7A / 6D. "Forgot something?" Postal companions strip */}
          {cartForgotWares.length > 0 && (
            <section className="pt-8 border-t-[1.5px] border-[#14231C] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                <div>
                  <p className="font-label-mono text-xs text-[#14231C]/65 uppercase">
                    COMPANION DISPATCHES
                  </p>
                  <h2 className="font-fraunces text-2xl font-semibold text-[#14231C]">
                    Forgot <span className="font-fraunces-italic font-normal">Something?</span>
                  </h2>
                </div>
                <span className="font-label-mono text-[10px] text-[#286345] bg-[#286345]/10 px-2 py-0.5 rounded border border-[#286345]/30 font-bold uppercase self-start sm:self-auto">
                  {recommenderEngine === 'smart' ? 'Smart Hybrid Engine' : 'Popularity Engine'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {cartForgotWares.map((scored) => {
                  const item = scored.product;
                  return (
                    <motion.div
                      layout
                      key={item.id}
                      className="bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[14px] p-4 shadow-[2px_2px_0_#14231C] flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-mono text-[9px] uppercase tracking-wider text-[#14231C]/60 truncate font-semibold">
                            {item.brand}
                          </span>
                          <MatchRing percentage={scored.matchPercentage} size={30} />
                        </div>

                        <div
                          onClick={() => navigate(`/product/${item.id}`)}
                          className="w-full h-24 rounded-[8px] border border-[#14231C]/30 flex items-center justify-center mb-2 cursor-pointer hover:scale-102 transition-transform"
                          style={{ backgroundColor: item.bgHex }}
                        >
                          <Sticker emoji={item.emoji} color={item.backdropColor} size="sm" />
                        </div>

                        <h4
                          onClick={() => navigate(`/product/${item.id}`)}
                          className="font-fraunces font-semibold text-sm text-[#14231C] truncate cursor-pointer hover:text-[#E8502B] transition-colors"
                        >
                          {item.name}
                        </h4>

                        {/* Tiny reason line in mono */}
                        <p className="font-mono text-[10px] text-[#14231C]/70 truncate pt-0.5">
                          ✦ {scored.reason}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 mt-2 border-t border-[#14231C]/15">
                        <span className="font-mono font-bold text-xs">{formatINR(item.price)}</span>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            addToCart(item, 1);
                            addToast({
                              title: 'Packed',
                              message: `${item.name} added to bag`,
                              variant: 'tomato',
                            });
                          }}
                        >
                          + Pack
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};
