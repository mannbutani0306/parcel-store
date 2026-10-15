import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Button,
  Stamp,
  ScribbleUnderline,
  HandArrow,
  Receipt,
  Perforation,
  Sticker,
} from '../components/ui';
import { useParcelStore } from '../store';
import { useToastStore } from '../store/toastStore';
import { formatINR, formatDate } from '../lib/format';
import { Order } from '../data';

type OrderTab = 'active' | 'delivered' | 'cancelled_returned';

export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { orders, currentUser, reorder } = useParcelStore();
  const { addToast } = useToastStore();
  const [activeTab, setActiveTab] = useState<OrderTab>('active');

  // Guest Access Control: Orders require login
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center space-y-5 bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[22px] shadow-[4px_4px_0_#14231C] my-10">
        <Stamp text="IDENTIFICATION REQUIRED" variant="tomato" size="md" rotation={-2} />
        <h2 className="font-fraunces text-2xl font-semibold text-[#14231C]">
          Order Slips Manifest
        </h2>
        <p className="text-xs text-[#14231C]/75 font-sans leading-relaxed">
          Sign into your recipient account to review past dispatch manifests, live railway tracking records, and official parcel receipts.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/login?redirect=/orders')}
          >
            Sign in to View Slips
          </Button>
          <Button variant="secondary" size="md" onClick={() => navigate('/shop')}>
            Browse Wares
          </Button>
        </div>
      </div>
    );
  }

  // Filter orders for current user
  const userOrders = useMemo(() => {
    return orders.filter((o) => o.userId === currentUser.id);
  }, [orders, currentUser.id]);

  const activeOrders = useMemo(() => {
    return userOrders.filter(
      (o) =>
        o.status === 'placed' ||
        o.status === 'packed' ||
        o.status === 'processing' ||
        o.status === 'shipped' ||
        o.status === 'dispatched' ||
        o.status === 'out_for_delivery'
    );
  }, [userOrders]);

  const deliveredOrders = useMemo(() => {
    return userOrders.filter((o) => o.status === 'delivered');
  }, [userOrders]);

  const cancelledReturnedOrders = useMemo(() => {
    return userOrders.filter((o) => o.status === 'cancelled' || o.status === 'returned');
  }, [userOrders]);

  const displayedOrders = useMemo(() => {
    switch (activeTab) {
      case 'active':
        return activeOrders;
      case 'delivered':
        return deliveredOrders;
      case 'cancelled_returned':
        return cancelledReturnedOrders;
      default:
        return userOrders;
    }
  }, [activeTab, activeOrders, deliveredOrders, cancelledReturnedOrders, userOrders]);

  const getStatusStamp = (status: string) => {
    switch (status) {
      case 'placed':
        return <Stamp text="ORDER PLACED" variant="ink" size="sm" rotation={-1} />;
      case 'packed':
      case 'processing':
        return <Stamp text="PACKED" variant="saffron" size="sm" rotation={-2} />;
      case 'shipped':
      case 'dispatched':
        return <Stamp text="SHIPPED" variant="stamp-blue" size="sm" rotation={1} />;
      case 'out_for_delivery':
        return <Stamp text="OUT FOR DELIVERY" variant="stamp-blue" size="sm" rotation={-1} />;
      case 'delivered':
        return <Stamp text="DELIVERED" variant="mint" size="sm" rotation={-2} />;
      case 'cancelled':
        return <Stamp text="CANCELLED" variant="tomato" size="sm" rotation={3} />;
      case 'returned':
        return <Stamp text="RETURNED" variant="tomato" size="sm" rotation={-3} />;
      default:
        return <Stamp text={status.toUpperCase()} variant="ink" size="sm" />;
    }
  };

  const handleReorder = (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    const res = reorder(order.id);
    if (res.success) {
      addToast({
        title: 'Manifest Reordered',
        message: `${res.addedCount} wares added to your postal bag!`,
        variant: 'tomato',
      });
    } else {
      addToast({
        title: 'Reorder Notice',
        message: res.error || 'Could not reorder wares',
        variant: 'stamp',
      });
    }
  };

  const tabs: { id: OrderTab; label: string; count: number }[] = [
    { id: 'active', label: 'Active Dispatches', count: activeOrders.length },
    { id: 'delivered', label: 'Delivered', count: deliveredOrders.length },
    { id: 'cancelled_returned', label: 'Cancelled & Returned', count: cancelledReturnedOrders.length },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
      {/* Page Header */}
      <div className="space-y-2 border-b-[1.5px] border-[#14231C] pb-4">
        <p className="font-label-mono text-xs text-[#14231C]/60 uppercase">
          POSTAL RECIPIENT MANIFESTS · {currentUser.name}
        </p>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-fraunces text-3xl sm:text-4xl font-semibold tracking-tight text-[#14231C]">
              Order <span className="font-fraunces-italic font-normal">Slips</span> ({userOrders.length})
            </h1>
            <div className="w-32 text-[#E8502B]">
              <ScribbleUnderline />
            </div>
          </div>

          <div className="text-xs font-mono text-[#14231C]/75">
            Auto-syncing Speed Post tracking &amp; carrier logs
          </div>
        </div>
      </div>

      {/* 8A. TABS WITH A SLIDING INDICATOR */}
      <div className="relative flex border-[1.5px] border-[#14231C] rounded-[12px] bg-[#EADFCB] p-1.5 shadow-[2px_2px_0_#14231C]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex-1 py-2.5 px-3 text-xs font-mono font-bold transition-colors cursor-pointer select-none text-center ${
                isActive ? 'text-[#F3EBDD]' : 'text-[#14231C] hover:text-[#E8502B]'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="orderTabIndicator"
                  className="absolute inset-0 bg-[#14231C] rounded-[8px] shadow-sm"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
              )}
              <span className="relative z-10 flex items-center justify-center gap-1.5 truncate">
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                    isActive ? 'bg-[#F3EBDD]/20 text-[#F3EBDD]' : 'bg-[#14231C]/10 text-[#14231C]'
                  }`}
                >
                  {tab.count}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Orders List: Compact Receipt-Strip Cards */}
      {displayedOrders.length === 0 ? (
        <div className="py-20 text-center space-y-4 bg-[#EADFCB] rounded-[18px] border-[1.5px] border-[#14231C] p-8 shadow-[3px_3px_0_#14231C]">
          <span className="text-4xl block">📜</span>
          <h3 className="font-fraunces text-xl font-semibold">
            No {tabs.find((t) => t.id === activeTab)?.label.toLowerCase()} found
          </h3>
          <p className="text-xs text-[#14231C]/70 max-w-sm mx-auto font-sans leading-relaxed">
            All registered wares are cataloged and ready for packaging with jute twine and postal seals.
          </p>
          <div className="pt-2">
            <Button variant="primary" size="sm" onClick={() => navigate('/shop')}>
              Browse Wares
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedOrders.map((order) => {
            const isDelivered = order.status === 'delivered';
            const isCancelled = order.status === 'cancelled' || order.status === 'returned';
            const canCancel =
              order.status === 'placed' || order.status === 'packed' || order.status === 'processing';

            return (
              <motion.div
                layout
                key={order.id}
                onClick={() => navigate(`/orders/${order.id}`)}
                whileHover={{ y: -2, transition: { duration: 0.15 } }}
                className="relative bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[16px] p-4 sm:p-5 shadow-[3px_3px_0_#14231C] hover:shadow-[5px_5px_0_#14231C] transition-all cursor-pointer space-y-4 overflow-hidden group"
              >
                {/* Perforated Sawtooth Strip Indicator on Left edge */}
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#14231C]/20" />

                {/* Top Strip: Order ID, Date, Status Stamp */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-[#14231C]/25 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm text-[#14231C] tracking-wider group-hover:text-[#E8502B] transition-colors">
                      {order.id}
                    </span>
                    <span className="text-[#14231C]/40">·</span>
                    <span className="font-label-mono text-xs text-[#14231C]/70">
                      {formatDate(order.createdAt)}
                    </span>
                    {order.trackingNumber && (
                      <span className="hidden sm:inline font-mono text-[10px] text-[#14231C]/60 bg-[#F3EBDD] px-1.5 py-0.5 rounded border border-[#14231C]/20">
                        {order.trackingNumber}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusStamp(order.status)}
                  </div>
                </div>

                {/* Middle: Overlapping Sticker Stack + Items preview */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Overlapping sticker stack */}
                    <div className="flex -space-x-3 shrink-0">
                      {order.items.slice(0, 4).map((item, idx) => (
                        <div
                          key={idx}
                          className="w-10 h-10 rounded-[8px] border-[1.5px] border-[#14231C] bg-[#F3EBDD] flex items-center justify-center text-xl shadow-[1px_1px_0_#14231C] relative transition-transform hover:scale-110 hover:z-20"
                          title={`${item.name} (${item.quantity}x)`}
                        >
                          {item.emoji}
                        </div>
                      ))}
                      {order.items.length > 4 && (
                        <div className="w-10 h-10 rounded-[8px] border-[1.5px] border-[#14231C] bg-[#14231C] text-[#F3EBDD] flex items-center justify-center text-xs font-mono font-bold shadow-[1px_1px_0_#14231C] relative z-10">
                          +{order.items.length - 4}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 font-mono">
                      <p className="font-fraunces font-semibold text-sm text-[#14231C] truncate">
                        {order.items[0].name}
                        {order.items.length > 1 && ` & ${order.items.length - 1} more wares`}
                      </p>
                      <p className="text-[10px] text-[#14231C]/65 truncate">
                        Destination: {order.shippingAddress.city}, {order.shippingAddress.state}
                      </p>
                    </div>
                  </div>

                  {/* Financial Total in Mono */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between font-mono shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#14231C]/15">
                    <span className="text-[10px] text-[#14231C]/60 font-label-mono block uppercase">
                      SETTLED TOTAL
                    </span>
                    <span className="font-bold text-lg text-[#14231C]">
                      {formatINR(order.total)}
                    </span>
                  </div>
                </div>

                {/* Bottom Actions Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#14231C]/15 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/orders/${order.id}`);
                      }}
                    >
                      Track Manifest →
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => handleReorder(order, e)}
                    >
                      🔁 Reorder
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 font-label-mono text-[11px]">
                    {canCancel && (
                      <span className="text-[#E8502B] font-bold">
                        Eligible for counter cancellation
                      </span>
                    )}
                    {isDelivered && (
                      <span className="text-[#286345] font-bold">
                        ✓ Delivered · Eligible for postal return (7 days)
                      </span>
                    )}
                    {isCancelled && (
                      <span className="text-[#14231C]/60">
                        {order.status === 'cancelled' ? 'Order Cancelled' : 'Postal Return Completed'}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
