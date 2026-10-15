import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sheet,
  Button,
  Stepper,
  Receipt,
  Perforation,
  Stamp,
  Input,
  MatchRing,
  Sticker,
  FreeDeliveryRoad,
  HandHeart,
} from '../ui';
import { useParcelStore, CartItem } from '../../store';
import { useToastStore } from '../../store/toastStore';
import { formatINR } from '../../lib/format';
import { recommendScored } from '../../lib/recommend';

export const CartDrawer: React.FC = () => {
  const {
    drawerOpen,
    setDrawerOpen,
    cartItems,
    addToCart,
    updateQty,
    removeFromCart,
    saveForLater,
    restoreCartItem,
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
  const navigate = useNavigate();
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | undefined>();

  const totalItems = getCartTotalItems();
  const subtotal = getCartSubtotal();
  const discount = getDiscountAmount();
  const finalTotal = getFinalTotal();
  const isFreeShip = appliedCoupon?.type === 'shipping' || subtotal >= 999;
  const shippingFee = isFreeShip || subtotal === 0 ? 0 : 80;
  const gstIncluded = Math.round((subtotal * 18) / 118);

  // Recommendations for Empty Drawer or "Forgot something?" companions
  const emptyRecommendations = useMemo(() => {
    return recommendScored(
      {
        behaviour: { views, cartAdds, purchases, wishlist },
        orders,
        allProducts: products,
        limit: 3,
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
        limit: 2,
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

  const handleRemove = (item: CartItem) => {
    removeFromCart(item.product.id, item.variant);
    addToast({
      title: 'Item Removed',
      message: `${item.product.name} removed from bag`,
      variant: 'tomato',
      action: {
        label: 'Undo',
        onClick: () => {
          restoreCartItem(item);
          addToast({
            title: 'Restored',
            message: `${item.product.name} returned to bag`,
            variant: 'mint',
          });
        },
      },
    });
  };

  const handleSaveLater = (item: CartItem) => {
    saveForLater(item.product.id, item.variant);
    addToast({
      title: 'Saved For Later',
      message: `${item.product.name} moved to wishlist`,
      variant: 'wax',
    });
  };

  const handleCheckout = () => {
    setDrawerOpen(false);
    navigate('/checkout');
  };

  return (
    <Sheet
      isOpen={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      title="Postal Bag"
      subtitle={`${totalItems} ${totalItems === 1 ? 'ITEM' : 'ITEMS'} PACKED`}
    >
      {cartItems.length === 0 ? (
        <div className="py-12 text-center space-y-6">
          <div className="w-16 h-16 rounded-full border-[1.5px] border-[#14231C] bg-[#EADFCB] flex items-center justify-center text-3xl mx-auto shadow-[2px_2px_0_#14231C]">
            📦
          </div>
          <div>
            <h4 className="font-fraunces text-xl font-semibold">Your bag is empty</h4>
            <p className="text-xs text-[#14231C]/65 font-sans max-w-xs mx-auto mt-1">
              Select from our 36 archival wares, leather folios, and brass instruments.
            </p>
          </div>

          <div className="pt-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setDrawerOpen(false);
                navigate('/shop');
              }}
            >
              Explore Catalog
            </Button>
          </div>

          {/* Recommendations in empty drawer */}
          <div className="pt-6 border-t border-[#14231C]/15 space-y-3 text-left">
            <span className="font-label-mono text-[10px] text-[#14231C]/60 uppercase block">
              SUGGESTED DISPATCHES
            </span>
            <div className="space-y-2">
              {emptyRecommendations.map((scored) => {
                const item = scored.product;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setDrawerOpen(false);
                      navigate(`/product/${item.id}`);
                    }}
                    className="p-2.5 rounded-[10px] border border-[#14231C]/30 bg-[#EADFCB] hover:bg-[#F3EBDD] flex items-center justify-between gap-2 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xl shrink-0">{item.emoji}</span>
                      <div className="min-w-0">
                        <p className="font-fraunces font-semibold text-xs text-[#14231C] truncate">
                          {item.name}
                        </p>
                        <p className="font-mono text-[9px] text-[#14231C]/65 truncate">
                          ✦ {scored.reason}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-xs shrink-0">
                      {formatINR(item.price)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Free Delivery Road */}
          <FreeDeliveryRoad subtotal={subtotal} threshold={999} />

          {/* Paper Receipt Container */}
          <Receipt variant="paper-2" shadow={false} orderNumber="POSTAL MANIFEST SLIP">
            {/* Items That "Print" In Staggered */}
            <div className="divide-y divide-dashed divide-[#14231C]/25 space-y-1">
              <AnimatePresence>
                {cartItems.map((item, index) => {
                  const { product, quantity, variant } = item;
                  const lineTotal = product.price * quantity;

                  return (
                    <motion.div
                      key={`${product.id}-${variant || 'default'}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                      transition={{ duration: 0.3, delay: index * 0.06 }}
                      className="py-3 first:pt-0 space-y-1.5 font-mono text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xl shrink-0">{product.emoji}</span>
                          <div className="min-w-0">
                            <p className="font-semibold text-[#14231C] truncate">{product.name}</p>
                            <div className="flex items-center gap-1.5 text-[10px] text-[#14231C]/65">
                              {variant && (
                                <span className="font-label-mono px-1 rounded bg-[#F3EBDD] border border-[#14231C]/30">
                                  {variant}
                                </span>
                              )}
                              <span>{formatINR(product.price)} each</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-bold text-sm text-[#14231C]">
                            {formatINR(lineTotal)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        {/* Stepper with validator max 10 */}
                        <Stepper
                          value={quantity}
                          onChange={(newQty) => updateQty(product.id, newQty, variant)}
                          size="sm"
                          max={Math.min(10, product.stock)}
                        />

                        {/* Save for later & Remove */}
                        <div className="flex items-center gap-2.5 text-[10px] font-label-mono">
                          <button
                            type="button"
                            onClick={() => handleSaveLater(item)}
                            className="text-[#286345] hover:underline cursor-pointer flex items-center gap-0.5"
                          >
                            <HandHeart size={10} />
                            <span>Save later</span>
                          </button>
                          <span className="text-[#14231C]/30">|</span>
                          <button
                            type="button"
                            onClick={() => handleRemove(item)}
                            className="text-[#E8502B] hover:underline cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            <Perforation notchBg="#EADFCB" label="CHARGES" />

            {/* Financial Summary Breakdown with Animated Totals */}
            <div className="space-y-1.5 text-xs font-mono pt-1">
              <div className="flex justify-between text-[#14231C]/75">
                <span>Wares Subtotal</span>
                <motion.span
                  key={subtotal}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  className="font-bold"
                >
                  {formatINR(subtotal)}
                </motion.span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-[#286345] font-semibold">
                  <span>Stamp Discount ({appliedCoupon?.code})</span>
                  <span>−{formatINR(discount)}</span>
                </div>
              )}

              <div className="flex justify-between text-[#14231C]/75">
                <span>Dispatch Fee</span>
                <span>{shippingFee === 0 ? 'FREE' : formatINR(shippingFee)}</span>
              </div>

              <div className="flex justify-between text-[10px] text-[#14231C]/60">
                <span>GST (18% included)</span>
                <span>{formatINR(gstIncluded)}</span>
              </div>

              <div className="flex justify-between font-bold text-sm pt-2 border-t border-[#14231C]/20">
                <span>GRAND TOTAL</span>
                <motion.span
                  key={finalTotal}
                  initial={{ scale: 1.15, color: '#E8502B' }}
                  animate={{ scale: 1, color: '#14231C' }}
                  className="text-base font-bold text-[#E8502B]"
                >
                  {formatINR(finalTotal)}
                </motion.span>
              </div>
            </div>
          </Receipt>

          {/* Coupon Code Input */}
          <div className="bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[12px] p-3.5 space-y-2.5">
            {appliedCoupon ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Stamp text={appliedCoupon.code} variant="mint" size="sm" rotation={-1} />
                  <span className="text-xs font-mono text-[#286345] font-semibold">
                    {appliedCoupon.badge} Applied
                  </span>
                </div>
                <button
                  type="button"
                  onClick={removeCoupon}
                  className="font-label-mono text-[10px] text-[#E8502B] hover:underline cursor-pointer font-bold"
                >
                  ✕ REMOVE
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="space-y-2">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Input
                      label="Coupon Stamp"
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value);
                        setCouponError(undefined);
                      }}
                      error={couponError}
                      placeholder="e.g. PARCEL10"
                    />
                  </div>
                  <Button variant="secondary" size="sm" type="submit">
                    Apply
                  </Button>
                </div>
                <div className="flex gap-2 text-[10px] font-label-mono text-[#14231C]/60 flex-wrap">
                  <span>Stamps:</span>
                  <button
                    type="button"
                    onClick={() => setCouponInput('PARCEL10')}
                    className="underline hover:text-[#14231C] cursor-pointer"
                  >
                    PARCEL10
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => setCouponInput('FIRST100')}
                    className="underline hover:text-[#14231C] cursor-pointer"
                  >
                    FIRST100
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => setCouponInput('FREESHIP')}
                    className="underline hover:text-[#14231C] cursor-pointer"
                  >
                    FREESHIP
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Companion items strip: Forgot something? */}
          {cartForgotWares.length > 0 && (
            <div className="bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[12px] p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-label-mono text-[10px] text-[#14231C]/75 uppercase font-bold tracking-wider">
                  FORGOT SOMETHING?
                </span>
                <span className="font-mono text-[9px] text-[#286345] font-bold">
                  {recommenderEngine === 'smart' ? 'SMART MATCH' : 'POPULAR'}
                </span>
              </div>

              <div className="space-y-1.5">
                {cartForgotWares.map((scored) => (
                  <div
                    key={scored.product.id}
                    className="flex items-center justify-between gap-2 p-2 rounded-[8px] bg-[#F3EBDD] border border-[#14231C]/20 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg shrink-0">{scored.product.emoji}</span>
                      <div className="min-w-0">
                        <p className="font-fraunces font-semibold text-xs text-[#14231C] truncate">
                          {scored.product.name}
                        </p>
                        <p className="font-mono text-[9px] text-[#14231C]/65 truncate">
                          ✦ {scored.reason}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <MatchRing percentage={scored.matchPercentage} size={28} />
                      <button
                        type="button"
                        onClick={() => {
                          addToCart(scored.product, 1);
                          addToast({
                            title: 'Packed',
                            message: `${scored.product.name} added to parcel`,
                            variant: 'tomato',
                          });
                        }}
                        className="px-2 py-1 bg-[#14231C] text-[#F3EBDD] font-mono text-[10px] font-bold rounded hover:bg-[#E8502B] transition-colors cursor-pointer whitespace-nowrap"
                      >
                        + {formatINR(scored.product.price)}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Checkout CTA */}
          <div className="space-y-2 pt-2">
            <Button
              variant="primary"
              fullWidth
              size="lg"
              onClick={handleCheckout}
            >
              Proceed to Dispatch Counter · {formatINR(finalTotal)}
            </Button>
            <p className="text-center font-label-mono text-[10px] text-[#14231C]/60">
              PACKED &amp; SEALED WITH THREE-PLY JUTE TWINE
            </p>
          </div>
        </div>
      )}
    </Sheet>
  );
};
