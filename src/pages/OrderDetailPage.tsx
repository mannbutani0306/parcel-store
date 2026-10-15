import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Receipt,
  Perforation,
  Stamp,
  Button,
  Modal,
  Sheet,
  HandArrow,
  HandTick,
  MatchRing,
  Sticker,
  RatingStars,
} from '../components/ui';
import { useParcelStore } from '../store';
import { useToastStore } from '../store/toastStore';
import { formatINR, formatDate } from '../lib/format';
import { recommendScored } from '../lib/recommend';
import { OrderStatus } from '../data/orders';

// 5-node tracking stages
const TRACKING_STAGES: {
  key: string;
  label: string;
  sublabel: string;
}[] = [
  { key: 'placed', label: 'Placed', sublabel: 'Manifest Registered' },
  { key: 'packed', label: 'Packed', sublabel: 'Wax Sealed in Bag' },
  { key: 'shipped', label: 'Shipped', sublabel: 'National Rail Transit' },
  { key: 'out_for_delivery', label: 'Out for Delivery', sublabel: 'With Carrier' },
  { key: 'delivered', label: 'Delivered', sublabel: 'Signed & Received' },
];

function getStageIndex(status: OrderStatus): number {
  switch (status) {
    case 'placed':
      return 0;
    case 'packed':
    case 'processing':
      return 1;
    case 'shipped':
    case 'dispatched':
      return 2;
    case 'out_for_delivery':
      return 3;
    case 'delivered':
      return 4;
    default:
      return 0;
  }
}

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    getOrderById,
    cancelOrder,
    returnOrder,
    advanceOrderStatus,
    reorder,
    currentUser,
    addToCart,
    products,
    views,
    cartAdds,
    purchases,
    wishlist,
    orders,
    recommenderEngine,
  } = useParcelStore();

  const { addToast } = useToastStore();

  // Modal / Sheet States
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Duplicate order placed by mistake');
  const [isRefundingAnimation, setIsRefundingAnimation] = useState(false);

  const [isReturnSheetOpen, setIsReturnSheetOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('Damaged during postal dispatch');
  const [selectedReturnItemIds, setSelectedReturnItemIds] = useState<string[]>([]);
  const [returnSubmitted, setReturnSubmitted] = useState(false);

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const order = getOrderById(id || '');

  // 6D. Next Up recommendations (Phase 6)
  const nextUpWares = useMemo(() => {
    if (!order) return [];
    const purchasedIds = order.items.map((i) => i.productId);
    return recommendScored(
      {
        userId: currentUser?.id,
        excludeIds: purchasedIds,
        behaviour: { views, cartAdds, purchases, wishlist },
        orders,
        allProducts: products,
        limit: 3,
        contextType: 'order-next-up',
      },
      recommenderEngine
    );
  }, [
    order,
    currentUser?.id,
    views,
    cartAdds,
    purchases,
    wishlist,
    orders,
    products,
    recommenderEngine,
  ]);

  // Guest Access Guard
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center space-y-5 bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[22px] shadow-[4px_4px_0_#14231C] my-10">
        <Stamp text="IDENTIFICATION REQUIRED" variant="tomato" size="md" rotation={-2} />
        <h2 className="font-fraunces text-2xl font-semibold text-[#14231C]">
          Order Manifest Locked
        </h2>
        <p className="text-xs text-[#14231C]/75 font-sans leading-relaxed">
          Sign in to inspect full tracking, recipient address, and settled charges for this parcel.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate(`/login?redirect=/orders/${id}`)}
          >
            Sign in to Inspect
          </Button>
          <Button variant="secondary" size="md" onClick={() => navigate('/shop')}>
            Browse Wares
          </Button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-6 py-20 text-center space-y-4">
        <span className="text-4xl block">📜</span>
        <h2 className="font-fraunces text-2xl font-semibold">Order slip not found</h2>
        <p className="text-xs text-[#14231C]/70">The requested manifest does not exist in registry.</p>
        <Button variant="primary" size="sm" onClick={() => navigate('/orders')}>
          Return to Orders
        </Button>
      </div>
    );
  }

  const isDelivered = order.status === 'delivered';
  const isCancelled = order.status === 'cancelled';
  const isReturned = order.status === 'returned';
  const canCancel =
    order.status === 'placed' || order.status === 'packed' || order.status === 'processing';

  // Return within 7 days of delivery
  const isWithin7Days = useMemo(() => {
    if (!isDelivered) return false;
    if (!order.deliveredAt) return true;
    const diff = (Date.now() - new Date(order.deliveredAt).getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  }, [isDelivered, order.deliveredAt]);

  const currentStageIndex = getStageIndex(order.status);

  // Cancellation Execution with Refund Animation
  const handleExecuteCancel = () => {
    setIsRefundingAnimation(true);
    setTimeout(() => {
      const res = cancelOrder(order.id, cancelReason);
      setIsRefundingAnimation(false);
      setIsCancelModalOpen(false);
      if (res.success) {
        addToast({
          title: 'Order Cancelled',
          message: `₹${order.total} refund credited to original payment. Stock restored.`,
          variant: 'tomato',
        });
      } else {
        addToast({ title: 'Notice', message: res.error, variant: 'stamp' });
      }
    }, 1500);
  };

  // Return Execution
  const handleExecuteReturn = () => {
    const res = returnOrder(
      order.id,
      returnReason,
      selectedReturnItemIds.length > 0 ? selectedReturnItemIds : undefined
    );
    if (res.success) {
      setReturnSubmitted(true);
      addToast({
        title: 'Postal Return Manifest Created',
        message: 'Carrier scheduled for reverse parcel collection.',
        variant: 'mint',
      });
      setTimeout(() => {
        setIsReturnSheetOpen(false);
        setReturnSubmitted(false);
      }, 1800);
    } else {
      addToast({ title: 'Notice', message: res.error, variant: 'stamp' });
    }
  };

  // Reorder Helper
  const handleReorder = () => {
    const res = reorder(order.id);
    if (res.success) {
      addToast({
        title: 'Manifest Reordered',
        message: `${res.addedCount} items added to your postal bag!`,
        variant: 'tomato',
      });
    } else {
      addToast({
        title: 'Reorder Notice',
        message: res.error || 'Items could not be reordered',
        variant: 'stamp',
      });
    }
  };

  // Advance Order Status Helper (Live or Testing)
  const handleAdvance = () => {
    advanceOrderStatus(order.id);
    addToast({
      title: 'Status Advanced',
      message: 'Postal manifest moved to next tracking station',
      variant: 'mint',
    });
  };

  const getStatusStamp = () => {
    switch (order.status) {
      case 'delivered':
        return <Stamp text="DELIVERED" variant="mint" size="md" rotation={-3} />;
      case 'shipped':
      case 'dispatched':
        return <Stamp text="IN TRANSIT" variant="stamp-blue" size="md" rotation={2} />;
      case 'out_for_delivery':
        return <Stamp text="OUT FOR DELIVERY" variant="stamp-blue" size="md" rotation={-1} />;
      case 'packed':
      case 'processing':
        return <Stamp text="PACKED & SEALED" variant="saffron" size="md" rotation={-1} />;
      case 'placed':
        return <Stamp text="ORDER PLACED" variant="ink" size="md" rotation={1} />;
      case 'cancelled':
        return <Stamp text="CANCELLED" variant="tomato" size="md" rotation={4} />;
      case 'returned':
        return <Stamp text="RETURNED" variant="tomato" size="md" rotation={-2} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
      {/* Top back navigation */}
      <div className="flex items-center justify-between border-b-[1.5px] border-[#14231C] pb-4">
        <Link
          to="/orders"
          className="font-label-mono text-xs hover:underline flex items-center gap-1.5 text-[#14231C]/80"
        >
          <HandArrow size={14} className="rotate-180" />
          <span>Back to All Orders</span>
        </Link>

        {/* Live status test control for Admin/Seller or quick prototyping */}
        {!isDelivered && !isCancelled && !isReturned && (
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-[#14231C]/60 hidden sm:inline">
              Auto-advancing live (15s)
            </span>
            <button
              type="button"
              onClick={handleAdvance}
              className="font-label-mono text-[10px] px-2.5 py-1 rounded border border-[#14231C] bg-[#EADFCB] hover:bg-[#14231C] hover:text-[#F3EBDD] transition-colors cursor-pointer"
            >
              Advance Station →
            </button>
          </div>
        )}
      </div>

      {/* Manifest Header */}
      <div className="bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[20px] p-6 shadow-[3px_3px_0_#14231C] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="font-label-mono text-xs text-[#14231C]/60 uppercase">
              REGISTERED POSTAL MANIFEST
            </span>
            <h1 className="font-mono font-bold text-2xl sm:text-3xl text-[#14231C] tracking-wide">
              {order.id}
            </h1>
            <p className="font-mono text-xs text-[#14231C]/75 mt-0.5">
              Booked on {formatDate(order.createdAt)} · Tracking No:{' '}
              <strong className="text-[#14231C]">{order.trackingNumber}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">{getStatusStamp()}</div>
        </div>
      </div>

      {/* =========================================================================
          8B. HORIZONTAL ROUTE DRAWN AS AN SVG PATH WITH 5 NODES
          Placed → Packed → Shipped → Out for delivery → Delivered
          A 📦 sits on current node and slides along the path. Completed nodes get inked ticks.
         ========================================================================= */}
      {!isCancelled && !isReturned && (
        <div className="bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[20px] p-6 shadow-[3px_3px_0_#14231C] space-y-6">
          <div className="flex items-center justify-between border-b border-[#14231C]/20 pb-3">
            <div>
              <span className="font-label-mono text-[10px] text-[#14231C]/60 uppercase">
                SPEED POST CONSIGNMENT ROUTE
              </span>
              <h2 className="font-fraunces text-xl font-semibold text-[#14231C]">
                Postal Transit Track
              </h2>
            </div>
            <span className="font-mono text-[11px] font-bold text-[#286345] bg-[#286345]/15 px-2 py-0.5 rounded border border-[#286345]/30 uppercase">
              {TRACKING_STAGES[currentStageIndex]?.label}
            </span>
          </div>

          {/* SVG Route Track */}
          <div className="relative pt-6 pb-4 px-3 sm:px-6">
            {/* SVG Connecting Rail */}
            <svg
              className="w-full h-8 overflow-visible"
              viewBox="0 0 100 2"
              preserveAspectRatio="none"
            >
              {/* Inactive Base Path */}
              <line
                x1="0"
                y1="1"
                x2="100"
                y2="1"
                stroke="#14231C"
                strokeOpacity="0.25"
                strokeWidth="2.5"
                strokeDasharray="4 3"
              />
              {/* Active Filled Path */}
              <motion.line
                x1="0"
                y1="1"
                x2={currentStageIndex === 0 ? 0 : (currentStageIndex / 4) * 100}
                y2="1"
                stroke="#286345"
                strokeWidth="3.5"
                strokeLinecap="round"
                initial={false}
                animate={{
                  x2: currentStageIndex === 0 ? 0 : (currentStageIndex / 4) * 100,
                }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              />
            </svg>

            {/* Moving Sliding Package 📦 */}
            <motion.div
              className="absolute top-3 -translate-y-1/2 -translate-x-1/2 z-20 pointer-events-none drop-shadow-md"
              initial={false}
              animate={{
                left: `calc(${currentStageIndex * 25}% + ${
                  currentStageIndex === 0 ? '16px' : currentStageIndex === 4 ? '-16px' : '0px'
                })`,
              }}
              transition={{
                type: 'spring',
                stiffness: 280,
                damping: 24,
              }}
            >
              <div className="w-9 h-9 rounded-full bg-[#E8502B] text-white flex items-center justify-center text-lg border-[1.5px] border-[#14231C] shadow-[2px_2px_0_#14231C]">
                📦
              </div>
            </motion.div>

            {/* 5 Node Circles */}
            <div className="relative flex justify-between items-center -mt-4">
              {TRACKING_STAGES.map((stage, idx) => {
                const isCompleted = idx < currentStageIndex;
                const isCurrent = idx === currentStageIndex;

                return (
                  <div key={stage.key} className="flex flex-col items-center group select-none">
                    <div className="relative">
                      {/* Pulsing ring for current node */}
                      {isCurrent && (
                        <span className="absolute -inset-1.5 rounded-full bg-[#E8502B]/30 animate-ping pointer-events-none" />
                      )}

                      <div
                        className={`w-7 h-7 rounded-full border-[1.5px] border-[#14231C] flex items-center justify-center text-xs font-mono font-bold transition-all shadow-[1px_1px_0_#14231C] ${
                          isCompleted
                            ? 'bg-[#286345] text-white'
                            : isCurrent
                              ? 'bg-[#E8502B] text-white scale-110'
                              : 'bg-[#F3EBDD] text-[#14231C]/60'
                        }`}
                      >
                        {isCompleted ? <HandTick size={13} /> : idx + 1}
                      </div>
                    </div>

                    <div className="text-center mt-2.5 max-w-[70px] sm:max-w-[90px]">
                      <span
                        className={`font-label-mono text-[10px] sm:text-xs font-bold block truncate ${
                          isCurrent
                            ? 'text-[#E8502B]'
                            : isCompleted
                              ? 'text-[#286345]'
                              : 'text-[#14231C]/60'
                        }`}
                      >
                        {stage.label}
                      </span>
                      <span className="font-mono text-[8px] text-[#14231C]/60 hidden sm:block truncate">
                        {stage.sublabel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current Stage Status Notice */}
          <div className="p-3.5 rounded-[12px] bg-[#F3EBDD] border border-[#14231C]/25 text-xs font-mono flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#286345] animate-pulse" />
              <span>
                Current Status:{' '}
                <strong>{TRACKING_STAGES[currentStageIndex]?.label.toUpperCase()}</strong> —{' '}
                {TRACKING_STAGES[currentStageIndex]?.sublabel}
              </span>
            </div>
            <span className="text-[10px] text-[#14231C]/60 font-label-mono">
              UPDATED LIVE
            </span>
          </div>
        </div>
      )}

      {/* Terminal State Alert (Cancelled or Returned) */}
      {(isCancelled || isReturned) && (
        <div className="bg-[#E8502B]/15 border-[1.5px] border-[#E8502B] rounded-[16px] p-5 space-y-2 font-mono text-xs">
          <div className="flex items-center gap-2 text-[#E8502B] font-bold">
            <Stamp
              text={isCancelled ? 'CANCELLED' : 'RETURNED'}
              variant="tomato"
              size="sm"
              rotation={-1}
            />
            <span className="text-sm">
              {isCancelled ? 'Parcel Cancelled Before Transit' : 'Postal Return Slip Finalized'}
            </span>
          </div>
          <p className="text-[#14231C]/80">
            {order.cancellationReason ||
              'Payment refunded to original instrument. Inventory returned to artisan warehouse.'}
          </p>
        </div>
      )}

      {/* =========================================================================
          8B & 8C: ITEM LIST, ADDRESS, PAYMENT (LAST 4 ONLY), PRICE BREAKDOWN
         ========================================================================= */}
      <Receipt variant="paper" orderNumber={order.id} date={formatDate(order.createdAt)}>
        {/* Item List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-dashed border-[#14231C]/25 pb-2">
            <span className="font-label-mono text-xs font-bold text-[#14231C]">
              PARCEL INVENTORY ({order.items.length} ITEMS)
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsInvoiceModalOpen(true)}
            >
              📄 Printable Invoice
            </Button>
          </div>

          <div className="divide-y divide-dashed divide-[#14231C]/20">
            {order.items.map((item, idx) => (
              <div
                key={idx}
                className="py-3 first:pt-0 space-y-2 font-mono text-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl shrink-0">{item.emoji}</span>
                    <div className="min-w-0">
                      <Link
                        to={`/product/${item.productId}`}
                        className="font-fraunces font-semibold text-sm text-[#14231C] hover:text-[#E8502B] transition-colors truncate block"
                      >
                        {item.name}
                      </Link>
                      <div className="flex items-center gap-2 text-[10px] text-[#14231C]/65">
                        {item.variant && (
                          <span className="font-label-mono px-1 rounded bg-[#EADFCB] border border-[#14231C]/30">
                            {item.variant}
                          </span>
                        )}
                        <span>
                          {item.quantity} × {formatINR(item.price)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="font-bold text-sm text-[#14231C] shrink-0">
                    {formatINR(item.price * item.quantity)}
                  </span>
                </div>

                {/* 8C. "Rate your items" prompt on delivered orders */}
                {isDelivered && (
                  <div className="flex items-center justify-between pt-1 text-[11px] bg-[#BCD9C4]/25 p-2 rounded-[8px] border border-[#286345]/30">
                    <span className="font-sans text-[#286345] font-semibold flex items-center gap-1">
                      <span>★</span> Rate this ware's tactile quality:
                    </span>
                    <Link
                      to={`/product/${item.productId}?review=true`}
                      className="font-label-mono text-xs text-[#286345] font-bold underline hover:text-[#14231C]"
                    >
                      Write Postal Review →
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <Perforation notchBg="#F3EBDD" label="CHARGES &amp; PAYMENT" />

        {/* Price Breakdown */}
        <div className="space-y-1.5 font-mono text-xs">
          <div className="flex justify-between text-[#14231C]/80">
            <span>Wares Subtotal</span>
            <span>{formatINR(order.subtotal)}</span>
          </div>

          {order.discount > 0 && (
            <div className="flex justify-between text-[#286345] font-bold">
              <span>Stamp Coupon Discount ({order.couponCode || 'PROMO'})</span>
              <span>−{formatINR(order.discount)}</span>
            </div>
          )}

          <div className="flex justify-between text-[#14231C]/80">
            <span>
              Delivery Speed ({order.deliverySpeed === 'express' ? 'Speed Post Airmail' : 'Standard Surface'})
            </span>
            <span>{order.shippingFee === 0 ? 'FREE' : formatINR(order.shippingFee)}</span>
          </div>

          <div className="flex justify-between text-[10px] text-[#14231C]/60 pt-0.5">
            <span>Central GST (18% included in merchandise total)</span>
            <span>{formatINR(Math.round((order.subtotal * 18) / 118))}</span>
          </div>

          <div className="flex justify-between items-center pt-2.5 border-t border-[#14231C]/25 text-base font-bold text-[#14231C]">
            <span className="font-fraunces text-base">Grand Total</span>
            <span className="font-mono text-xl text-[#E8502B]">{formatINR(order.total)}</span>
          </div>
        </div>

        <Perforation notchBg="#F3EBDD" label="RECIPIENT DESTINATION" />

        {/* Shipping address & Payment (last 4 only) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="space-y-0.5">
            <span className="font-label-mono text-[10px] text-[#14231C]/60 block uppercase">
              DELIVER TO
            </span>
            <p className="font-bold text-[#14231C]">{order.shippingAddress.fullName}</p>
            <p className="text-[#14231C]/80">{order.shippingAddress.line1}</p>
            <p className="text-[#14231C]/80">
              {order.shippingAddress.city}, {order.shippingAddress.state} —{' '}
              {order.shippingAddress.pincode}
            </p>
            <p className="text-[10px] text-[#14231C]/60">Contact: {order.shippingAddress.phone}</p>
          </div>

          <div className="space-y-0.5">
            <span className="font-label-mono text-[10px] text-[#14231C]/60 block uppercase">
              SETTLED VIA (LAST 4 ONLY)
            </span>
            <p className="font-bold text-[#14231C]">{order.paymentMethod}</p>
            <p className="text-[10px] text-[#286345] font-bold">✓ Transaction Verified &amp; Cleared</p>
          </div>
        </div>
      </Receipt>

      {/* =========================================================================
          8C. ACTIONS: Cancel (before Shipped), Return (within 7d of Delivered), Reorder
         ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="md" onClick={() => navigate('/orders')}>
            ← All Orders
          </Button>
          <Button variant="secondary" size="md" onClick={handleReorder}>
            🔁 Reorder Wares
          </Button>
        </div>

        <div className="flex items-center gap-3">
          {/* Cancel button: only before Shipped */}
          {canCancel && (
            <Button
              variant="secondary"
              size="md"
              onClick={() => setIsCancelModalOpen(true)}
              className="text-[#E8502B] border-[#E8502B] hover:bg-[#E8502B]/10"
            >
              Cancel Manifest
            </Button>
          )}

          {/* Return button: within 7 days of Delivered */}
          {isDelivered && isWithin7Days && (
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                setSelectedReturnItemIds(order.items.map((i) => i.productId));
                setIsReturnSheetOpen(true);
              }}
              className="text-[#286345] border-[#286345] hover:bg-[#286345]/10"
            >
              Request Postal Return (7 Days)
            </Button>
          )}
        </div>
      </div>

      {/* =========================================================================
          CANCEL CONFIRMATION MODAL WITH REASON CHIPS & REFUND ANIMATION
         ========================================================================= */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => !isRefundingAnimation && setIsCancelModalOpen(false)}
        title="Cancel Postal Order"
        subtitle={`MANIFEST ${order.id}`}
      >
        <div className="space-y-4">
          {isRefundingAnimation ? (
            <div className="py-8 text-center space-y-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-12 h-12 mx-auto rounded-full border-[3px] border-[#E8502B] border-t-transparent"
              />
              <p className="font-fraunces text-base font-semibold text-[#14231C]">
                Processing Postal Refund...
              </p>
              <p className="font-mono text-xs text-[#14231C]/75">
                Restoring reserved wares to warehouse inventory
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-[#14231C]/80 leading-relaxed font-sans">
                Cancelling this order will release reserved artisan inventory and refund{' '}
                <strong>{formatINR(order.total)}</strong> to your {order.paymentMethod}.
              </p>

              <div className="space-y-2">
                <label className="font-label-mono text-xs text-[#14231C]/70 block font-bold">
                  SELECT REASON CHIP:
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Duplicate order placed by mistake',
                    'Change of delivery address',
                    'Ordered wrong variant or dimensions',
                    'Delivery window unsuitable',
                    'Found alternate item in catalog',
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setCancelReason(chip)}
                      className={`px-2.5 py-1.5 rounded-[8px] text-xs font-mono border transition-all cursor-pointer ${
                        cancelReason === chip
                          ? 'bg-[#14231C] text-[#F3EBDD] border-[#14231C]'
                          : 'bg-[#F3EBDD] text-[#14231C] border-[#14231C]/30 hover:border-[#14231C]'
                      }`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#14231C]/15">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsCancelModalOpen(false)}
                >
                  Keep Order
                </Button>
                <Button variant="tomato" size="sm" onClick={handleExecuteCancel}>
                  Confirm Cancellation &amp; Refund
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* =========================================================================
          RETURN SHEET WITH ITEM SELECTION, REASON CHIPS & REFUND TIMELINE
         ========================================================================= */}
      <Sheet
        isOpen={isReturnSheetOpen}
        onClose={() => setIsReturnSheetOpen(false)}
        title="Postal Return Request"
        subtitle={`7-DAY RETURN WINDOW · ${order.id}`}
      >
        <div className="space-y-5">
          {returnSubmitted ? (
            <div className="py-12 text-center space-y-4">
              <Stamp text="RETURN AUTHORIZED" variant="mint" size="lg" rotation={-2} />
              <h3 className="font-fraunces text-xl font-semibold text-[#14231C]">
                Reverse Pickup Booked!
              </h3>
              <p className="text-xs text-[#14231C]/75 font-mono max-w-xs mx-auto">
                A parcel courier will collect the sealed return packet. Refund credited within 24 hours of inspection.
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs text-[#14231C]/80 font-sans leading-relaxed">
                Eligible under Indian Postal Guild regulations. Select wares to return and indicate the tactile reason:
              </p>

              {/* Item selection checkboxes */}
              <div className="space-y-2">
                <span className="font-label-mono text-xs text-[#14231C]/70 block font-bold">
                  SELECT ITEMS TO RETURN:
                </span>
                <div className="space-y-2 bg-[#EADFCB] p-3 rounded-[12px] border border-[#14231C]/25">
                  {order.items.map((item) => {
                    const isSelected = selectedReturnItemIds.includes(item.productId);
                    return (
                      <label
                        key={item.productId}
                        className="flex items-center justify-between gap-3 p-2 rounded-[8px] bg-[#F3EBDD] border border-[#14231C]/15 text-xs font-mono cursor-pointer"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              setSelectedReturnItemIds((prev) =>
                                isSelected
                                  ? prev.filter((id) => id !== item.productId)
                                  : [...prev, item.productId]
                              );
                            }}
                            className="rounded border-[#14231C] text-[#286345] focus:ring-0"
                          />
                          <span className="text-lg">{item.emoji}</span>
                          <span className="truncate font-semibold text-[#14231C]">
                            {item.name}
                          </span>
                        </div>
                        <span className="font-bold">{formatINR(item.price * item.quantity)}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Reason Chips */}
              <div className="space-y-2">
                <span className="font-label-mono text-xs text-[#14231C]/70 block font-bold">
                  RETURN REASON:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Damaged during postal dispatch',
                    'Defective artisan joinery / bindery',
                    'Item does not match catalogue sample',
                    'Dimension or weight mismatch',
                    'Changed requirements',
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setReturnReason(chip)}
                      className={`px-2.5 py-1 rounded-[6px] text-xs font-mono border transition-all cursor-pointer ${
                        returnReason === chip
                          ? 'bg-[#286345] text-white border-[#286345]'
                          : 'bg-[#EADFCB] text-[#14231C] border-[#14231C]/30 hover:border-[#14231C]'
                      }`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Refund Timeline Preview */}
              <div className="p-4 rounded-[12px] bg-[#EADFCB] border border-[#14231C]/25 space-y-2 text-xs font-mono">
                <span className="font-label-mono font-bold text-[#14231C] block">
                  RETURN &amp; REFUND TIMELINE:
                </span>
                <div className="space-y-1.5 text-[11px] text-[#14231C]/75">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#286345]" />
                    <span>Day 1: Return Slip Stamped &amp; Courier Picked</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#286345]" />
                    <span>Day 2: Sorting Desk Inspection</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#286345]" />
                    <span>Day 3: Full Refund Credited to {order.paymentMethod}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3">
                <Button
                  variant="primary"
                  fullWidth
                  size="md"
                  disabled={selectedReturnItemIds.length === 0}
                  onClick={handleExecuteReturn}
                >
                  Generate Postal Return Manifest
                </Button>
              </div>
            </>
          )}
        </div>
      </Sheet>

      {/* =========================================================================
          PRINTABLE INVOICE MODAL (with Print button)
         ========================================================================= */}
      <Modal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        title="Official G.P.O. Tax Invoice"
        subtitle={`INVOICE REF: INV-${order.id}`}
      >
        <div className="space-y-6 text-[#14231C]">
          <div className="p-5 bg-white border-[1.5px] border-[#14231C] rounded-[10px] space-y-4 font-mono text-xs shadow-inner">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-[#14231C]/30 pb-3">
              <div>
                <p className="font-bold text-sm">DEPARTMENT OF POSTS · INDIA</p>
                <p className="text-[10px] text-slate-500">
                  CENTRAL G.P.O. COMMERCIAL DIVISION · SAC 996812
                </p>
                <p className="text-[10px] text-slate-500">GSTIN: 27AABCP1423P1ZQ</p>
              </div>
              <div className="text-right">
                <p className="font-bold">TAX INVOICE</p>
                <p className="text-[10px]">Date: {formatDate(order.createdAt)}</p>
                <p className="text-[10px]">Inv #: INV-{order.id}</p>
              </div>
            </div>

            {/* Recipient */}
            <div className="text-[11px] space-y-0.5">
              <p className="font-bold uppercase text-slate-700">Billed &amp; Dispatched To:</p>
              <p className="font-bold">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.line1}</p>
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state} —{' '}
                {order.shippingAddress.pincode}
              </p>
            </div>

            {/* Table */}
            <div className="divide-y divide-slate-200 text-[11px]">
              <div className="grid grid-cols-12 font-bold py-1 bg-slate-100 px-1">
                <span className="col-span-6">Ware Description</span>
                <span className="col-span-2 text-center">Qty</span>
                <span className="col-span-2 text-right">Rate</span>
                <span className="col-span-2 text-right">Amount</span>
              </div>
              {order.items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-12 py-1.5 px-1">
                  <span className="col-span-6 truncate">
                    {it.name} {it.variant ? `(${it.variant})` : ''}
                  </span>
                  <span className="col-span-2 text-center">{it.quantity}</span>
                  <span className="col-span-2 text-right">{formatINR(it.price)}</span>
                  <span className="col-span-2 text-right">
                    {formatINR(it.price * it.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="border-t border-[#14231C]/30 pt-2 space-y-1 text-right text-[11px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatINR(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-[#286345]">
                  <span>Coupon Deduction:</span>
                  <span>−{formatINR(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Postal Dispatch:</span>
                <span>{order.shippingFee === 0 ? 'FREE' : formatINR(order.shippingFee)}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[10px]">
                <span>Integrated GST (18% included):</span>
                <span>{formatINR(Math.round((order.subtotal * 18) / 118))}</span>
              </div>
              <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-300">
                <span>Total Settled:</span>
                <span>{formatINR(order.total)}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-dashed border-slate-300 text-[10px] text-slate-500 text-center">
              Settled via {order.paymentMethod} · Computer generated postal invoice · No signature required
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsInvoiceModalOpen(false)}
            >
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => window.print()}
            >
              🖨️ Print Invoice
            </Button>
          </div>
        </div>
      </Modal>

      {/* =========================================================================
          6D. NEXT UP FOR YOUR PARCEL (Recommendations)
         ========================================================================= */}
      {nextUpWares.length > 0 && (
        <section className="pt-8 border-t-[1.5px] border-[#14231C] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <p className="font-label-mono text-xs text-[#14231C]/65 uppercase">
                FORWARD DISPATCHES
              </p>
              <h2 className="font-fraunces text-2xl font-semibold text-[#14231C]">
                Next <span className="font-fraunces-italic font-normal">Up</span> For Your Parcel
              </h2>
            </div>
            <span className="font-label-mono text-[10px] text-[#286345] bg-[#286345]/10 px-2 py-0.5 rounded border border-[#286345]/30 font-bold uppercase self-start sm:self-auto">
              {recommenderEngine === 'smart' ? 'Smart Hybrid Engine' : 'Popularity Engine'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {nextUpWares.map((scored) => {
              const item = scored.product;
              return (
                <motion.div
                  layout
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[16px] p-4 shadow-[2px_2px_0_#14231C] hover:shadow-[4px_4px_0_#14231C] transition-all flex flex-col justify-between"
                >
                  <div
                    onClick={() => navigate(`/product/${item.id}`)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-[#14231C]/60 truncate font-semibold">
                        {item.brand}
                      </span>
                      <MatchRing percentage={scored.matchPercentage} size={32} />
                    </div>

                    <div
                      className="w-full h-28 rounded-[10px] border border-[#14231C]/30 flex items-center justify-center mb-2.5 transition-transform hover:scale-102"
                      style={{ backgroundColor: item.bgHex }}
                    >
                      <Sticker emoji={item.emoji} color={item.backdropColor} size="md" />
                    </div>

                    <h4 className="font-fraunces font-semibold text-sm text-[#14231C] hover:text-[#E8502B] transition-colors truncate">
                      {item.name}
                    </h4>

                    {/* Tiny reason line in mono type */}
                    <p className="font-mono text-[10px] text-[#14231C]/75 truncate pt-0.5 flex items-center gap-1">
                      <span className="text-[#E8502B] text-[8px]">✦</span>
                      <span className="truncate">{scored.reason}</span>
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
                          title: 'Packed for Next Parcel',
                          message: `${item.name} added to your bag`,
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
  );
};
