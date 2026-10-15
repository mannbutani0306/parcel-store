import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Stamp,
  Button,
  ScribbleUnderline,
  CountUp,
  Tag,
  Sticker,
  MatchRing,
  Modal,
} from '../components/ui';
import { useParcelStore } from '../store';
import { useToastStore } from '../store/toastStore';
import { formatINR, formatDate } from '../lib/format';
import { recommendScored } from '../lib/recommend';
import { Coupon } from '../data/coupons';

// 7-day revenue dataset
const REVENUE_7_DAYS = [
  { day: 'Mon', date: '07 Oct', revenue: 18400, orders: 12 },
  { day: 'Tue', date: '08 Oct', revenue: 26200, orders: 17 },
  { day: 'Wed', date: '09 Oct', revenue: 21500, orders: 14 },
  { day: 'Thu', date: '10 Oct', revenue: 38900, orders: 24 },
  { day: 'Fri', date: '11 Oct', revenue: 34100, orders: 21 },
  { day: 'Sat', date: '12 Oct', revenue: 56800, orders: 36 },
  { day: 'Sun', date: '13 Oct', revenue: 49200, orders: 31 },
];

const CATEGORY_COLORS: { [key: string]: string } = {
  tech: '#286289',
  home: '#286345',
  style: '#E8502B',
  beauty: '#D97706',
  books: '#7C3AED',
  play: '#E69224',
};

// Relative time helper
function getRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}

// Custom Tooltip for charts
const CustomAdminTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-[#F3EBDD] border-[1.5px] border-[#14231C] p-2.5 rounded-[8px] shadow-[2px_2px_0_#14231C] font-mono text-xs">
        <p className="font-bold text-[#14231C] border-b border-[#14231C]/15 pb-1 mb-1">
          {label || data.name}
        </p>
        <p className="text-[#E8502B] font-bold">
          {typeof data.value === 'number' && data.value > 100 ? formatINR(data.value) : data.value}
        </p>
      </div>
    );
  }
  return null;
};

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentUser,
    orders,
    products,
    allUsers,
    coupons,
    activities,
    recommenderEngine,
    setRecommenderEngine,
    advanceOrderStatus,
    cancelOrder,
    toggleUserBlock,
    toggleProductHidden,
    createCoupon,
    toggleCouponEnabled,
    switchUser,
    views,
    cartAdds,
    purchases,
    wishlist,
    resetAllData,
  } = useParcelStore();
  const { addToast } = useToastStore();

  // Active Tab in slim left rail
  const [activeTab, setActiveTab] = useState<
    'overview' | 'orders' | 'moderation' | 'coupons' | 'engine' | 'users' | 'activity' | 'settings'
  >('overview');

  const [showResetModal, setShowResetModal] = useState(false);

  // Filters for Orders Table
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'active' | 'delivered' | 'cancelled'>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');

  // Filters for Users Table
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Filters for Products Moderation
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');

  // New Coupon Form States
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'percent' | 'flat' | 'shipping'>('percent');
  const [newCouponValue, setNewCouponValue] = useState('15');
  const [newCouponMinSpend, setNewCouponMinSpend] = useState('600');
  const [newCouponExpiry, setNewCouponExpiry] = useState('');
  const [newCouponDesc, setNewCouponDesc] = useState('');
  const [couponErrors, setCouponErrors] = useState<{ [key: string]: string }>({});

  const isAdmin = currentUser?.role === 'admin';
  const adminUser = allUsers.find((u) => u.role === 'admin');

  // Guard if not logged in as Admin
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center space-y-5 bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[22px] shadow-[4px_4px_0_#14231C] my-10">
        <Stamp text="SUPERINTENDENT DESK ONLY" variant="tomato" size="md" rotation={-3} />
        <h2 className="font-fraunces text-2xl font-semibold text-[#14231C]">
          Central Registry Locked
        </h2>
        <p className="text-xs text-[#14231C]/75 font-sans leading-relaxed">
          {currentUser
            ? `You are logged in as ${currentUser.name} (${currentUser.role}). Central manifest moderation is restricted to G.P.O. superintendents.`
            : 'Access to the central dispatch registry requires an active administrator credential.'}
        </p>
        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          {adminUser && (
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                switchUser(adminUser.id);
                addToast({
                  title: 'Superintendent Logged In',
                  message: `Switched to ${adminUser.name}`,
                  variant: 'mint',
                });
              }}
            >
              Enter as {adminUser.name}
            </Button>
          )}
          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate('/login?redirect=/admin')}
          >
            Switch Account
          </Button>
        </div>
      </div>
    );
  }

  // KPI Calculations
  const totalRevenue = useMemo(() => {
    return orders.reduce((acc, o) => (o.status !== 'cancelled' ? acc + o.total : acc), 0);
  }, [orders]);

  const activeSellersCount = useMemo(() => {
    return allUsers.filter((u) => u.role === 'seller' && !u.blocked).length;
  }, [allUsers]);

  // Chart 2: Category sales donut data
  const categoryDonutData = useMemo(() => {
    const counts: { [key: string]: number } = {
      tech: 0,
      home: 0,
      style: 0,
      beauty: 0,
      books: 0,
      play: 0,
    };
    orders.forEach((o) => {
      o.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        const cat = prod?.category || 'home';
        counts[cat] = (counts[cat] || 0) + item.price * item.quantity;
      });
    });
    return Object.entries(counts).map(([cat, val]) => ({
      name: cat.toUpperCase(),
      value: val > 0 ? val : 2500,
      color: CATEGORY_COLORS[cat] || '#286345',
    }));
  }, [orders, products]);

  // Chart 3: Orders by status bar data
  const ordersStatusBarData = useMemo(() => {
    const counts: { [key: string]: number } = {
      placed: 0,
      packed: 0,
      shipped: 0,
      out_for_delivery: 0,
      delivered: 0,
      cancelled: 0,
    };
    orders.forEach((o) => {
      const st = o.status === 'processing' ? 'packed' : o.status === 'dispatched' ? 'shipped' : o.status;
      if (counts[st] !== undefined) {
        counts[st] += 1;
      }
    });
    return [
      { status: 'Placed', count: counts.placed },
      { status: 'Packed', count: counts.packed },
      { status: 'Shipped', count: counts.shipped },
      { status: 'Out', count: counts.out_for_delivery },
      { status: 'Delivered', count: counts.delivered },
      { status: 'Cancelled', count: counts.cancelled },
    ];
  }, [orders]);

  // Live Recommendation Engine comparison preview
  const smartRecommendationsPreview = useMemo(() => {
    return recommendScored(
      {
        behaviour: { views, cartAdds, purchases, wishlist },
        orders,
        allProducts: products,
        limit: 3,
        contextType: 'home-picked',
      },
      'smart'
    );
  }, [views, cartAdds, purchases, wishlist, orders, products]);

  const popularRecommendationsPreview = useMemo(() => {
    return recommendScored(
      {
        behaviour: { views, cartAdds, purchases, wishlist },
        orders,
        allProducts: products,
        limit: 3,
        contextType: 'home-picked',
      },
      'popular'
    );
  }, [views, cartAdds, purchases, wishlist, orders, products]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (orderStatusFilter === 'active') {
        if (o.status === 'delivered' || o.status === 'cancelled' || o.status === 'returned') return false;
      } else if (orderStatusFilter === 'delivered') {
        if (o.status !== 'delivered') return false;
      } else if (orderStatusFilter === 'cancelled') {
        if (o.status !== 'cancelled' && o.status !== 'returned') return false;
      }

      if (orderSearchQuery.trim()) {
        const q = orderSearchQuery.toLowerCase().trim();
        const matchesId = o.id.toLowerCase().includes(q);
        const matchesName = o.shippingAddress.fullName.toLowerCase().includes(q);
        const matchesCity = o.shippingAddress.city.toLowerCase().includes(q);
        return matchesId || matchesName || matchesCity;
      }

      return true;
    });
  }, [orders, orderStatusFilter, orderSearchQuery]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return allUsers.filter((u) => {
      if (!userSearchQuery.trim()) return true;
      const q = userSearchQuery.toLowerCase().trim();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
      );
    });
  }, [allUsers, userSearchQuery]);

  // Filtered Products for Moderation
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (productCategoryFilter !== 'all' && p.category !== productCategoryFilter) {
        return false;
      }
      if (productSearchQuery.trim()) {
        const q = productSearchQuery.toLowerCase().trim();
        return (
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, productCategoryFilter, productSearchQuery]);

  // Handle Create Coupon
  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: { [key: string]: string } = {};

    if (!newCouponCode.trim()) errs.code = 'Coupon stamp code is required';
    const numVal = Number(newCouponValue);
    const numMin = Number(newCouponMinSpend);

    if (isNaN(numVal) || numVal < 0) errs.val = 'Enter valid discount value';
    if (isNaN(numMin) || numMin < 0) errs.min = 'Enter valid minimum spend';

    if (Object.keys(errs).length > 0) {
      setCouponErrors(errs);
      return;
    }

    setCouponErrors({});

    const normalizedCode = newCouponCode.trim().toUpperCase();
    const badge =
      newCouponType === 'percent'
        ? `${numVal}% OFF`
        : newCouponType === 'flat'
          ? `₹${numVal} OFF`
          : 'FREE DELIVERY';

    const res = createCoupon({
      code: normalizedCode,
      type: newCouponType,
      value: numVal,
      minOrder: numMin > 0 ? numMin : undefined,
      expiryDate: newCouponExpiry || undefined,
      description: newCouponDesc.trim() || `${badge} on postal orders above ₹${numMin}.`,
      badge,
      disabled: false,
    });

    if (res.success) {
      addToast({
        title: 'Postal Stamp Coupon Issued',
        message: `Seal ${normalizedCode} is now active and immediately usable at checkout!`,
        variant: 'mint',
      });
      setNewCouponCode('');
      setNewCouponDesc('');
      setNewCouponValue('15');
      setNewCouponMinSpend('600');
    } else {
      setCouponErrors({ code: res.error || 'Failed to issue stamp' });
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* DASHBOARD HEADER */}
      <div className="border-b-[1.5px] border-[#14231C] pb-5 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-label-mono text-xs text-[#14231C]/60 uppercase">
              GENERAL POST OFFICE · CENTRAL REGISTRY
            </span>
            <span className="text-xs">·</span>
            <span className="font-mono text-xs font-bold text-[#E8502B] bg-[#E8502B]/10 px-2 py-0.5 rounded border border-[#E8502B]/20">
              Superintendent {currentUser.name}
            </span>
          </div>
          <h1 className="font-fraunces text-3xl sm:text-4xl font-semibold tracking-tight text-[#14231C]">
            Superintendent <span className="font-fraunces-italic font-normal">Command</span>
          </h1>
          <div className="w-44 text-[#E8502B]">
            <ScribbleUnderline />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-xs text-[#14231C]/75 hidden sm:inline">
            National Speed Post Railway Network
          </span>
          <Stamp text="SUPERINTENDENT" variant="tomato" size="md" rotation={-2} />
        </div>
      </div>

      {/* DASHBOARD LAYOUT: Slim Left Rail with Emoji Nav + Main Paper Sheet */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* SLIM LEFT RAIL */}
        <aside className="w-full lg:w-52 shrink-0 bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[18px] p-2.5 shadow-[3px_3px_0_#14231C] sticky top-24 z-10">
          <nav className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[12px] text-xs font-mono font-semibold transition-all text-left whitespace-nowrap cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-[#14231C] text-[#F3EBDD] shadow-[2px_2px_0_#E8502B]'
                  : 'text-[#14231C]/80 hover:bg-[#F3EBDD] hover:text-[#14231C]'
              }`}
            >
              <span className="text-base">🏛️</span>
              <span>Overview</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-[12px] text-xs font-mono font-semibold transition-all text-left whitespace-nowrap cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-[#14231C] text-[#F3EBDD] shadow-[2px_2px_0_#E8502B]'
                  : 'text-[#14231C]/80 hover:bg-[#F3EBDD] hover:text-[#14231C]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">📋</span>
                <span>Manifests</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#E8502B]/20 text-[#E8502B]">
                {orders.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('moderation')}
              className={`flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-[12px] text-xs font-mono font-semibold transition-all text-left whitespace-nowrap cursor-pointer ${
                activeTab === 'moderation'
                  ? 'bg-[#14231C] text-[#F3EBDD] shadow-[2px_2px_0_#E8502B]'
                  : 'text-[#14231C]/80 hover:bg-[#F3EBDD] hover:text-[#14231C]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">📦</span>
                <span>Catalog</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#286345]/20 text-[#286345]">
                {products.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('coupons')}
              className={`flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-[12px] text-xs font-mono font-semibold transition-all text-left whitespace-nowrap cursor-pointer ${
                activeTab === 'coupons'
                  ? 'bg-[#14231C] text-[#F3EBDD] shadow-[2px_2px_0_#E8502B]'
                  : 'text-[#14231C]/80 hover:bg-[#F3EBDD] hover:text-[#14231C]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">🎟️</span>
                <span>Coupons</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#D97706]/20 text-[#D97706]">
                {coupons.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('engine')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[12px] text-xs font-mono font-semibold transition-all text-left whitespace-nowrap cursor-pointer ${
                activeTab === 'engine'
                  ? 'bg-[#14231C] text-[#F3EBDD] shadow-[2px_2px_0_#E8502B]'
                  : 'text-[#14231C]/80 hover:bg-[#F3EBDD] hover:text-[#14231C]'
              }`}
            >
              <span className="text-base">🤖</span>
              <span>Algorithms</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-[12px] text-xs font-mono font-semibold transition-all text-left whitespace-nowrap cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-[#14231C] text-[#F3EBDD] shadow-[2px_2px_0_#E8502B]'
                  : 'text-[#14231C]/80 hover:bg-[#F3EBDD] hover:text-[#14231C]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">👥</span>
                <span>Users</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#14231C]/15 text-[#14231C]">
                {allUsers.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('activity')}
              className={`flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-[12px] text-xs font-mono font-semibold transition-all text-left whitespace-nowrap cursor-pointer ${
                activeTab === 'activity'
                  ? 'bg-[#14231C] text-[#F3EBDD] shadow-[2px_2px_0_#E8502B]'
                  : 'text-[#14231C]/80 hover:bg-[#F3EBDD] hover:text-[#14231C]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">⚡</span>
                <span>Activity</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#286345]/20 text-[#286345]">
                {activities.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[12px] text-xs font-mono font-semibold transition-all text-left whitespace-nowrap cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-[#14231C] text-[#F3EBDD] shadow-[2px_2px_0_#E8502B]'
                  : 'text-[#14231C]/80 hover:bg-[#F3EBDD] hover:text-[#14231C]'
              }`}
            >
              <span className="text-base">⚙️</span>
              <span>Settings</span>
            </button>
          </nav>
        </aside>

        {/* MAIN PAPER SHEET */}
        <main className="flex-1 w-full space-y-8">
          {/* TAB 1: OVERVIEW & 3 RECHARTS CHARTS */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* KPI STICKERS WITH COUNT-UP ANIMATION */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* 1. Total Revenue */}
                <div className="bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[16px] p-5 shadow-[3px_3px_0_#14231C] flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-label-mono text-[10px] text-[#14231C]/60 uppercase">
                      SETTLED REVENUE
                    </span>
                    <span className="text-sm">🪙</span>
                  </div>
                  <div className="font-mono font-bold text-2xl sm:text-3xl text-[#14231C]">
                    <CountUp value={totalRevenue} prefix="₹" duration={1200} />
                  </div>
                  <span className="font-label-mono text-[9px] text-[#286345] font-semibold mt-1">
                    ↑ 23.1% postal volume
                  </span>
                </div>

                {/* 2. Total Orders */}
                <div className="bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[16px] p-5 shadow-[3px_3px_0_#14231C] flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-label-mono text-[10px] text-[#14231C]/60 uppercase">
                      TOTAL MANIFESTS
                    </span>
                    <span className="text-sm">📜</span>
                  </div>
                  <div className="font-mono font-bold text-2xl sm:text-3xl text-[#14231C]">
                    <CountUp value={orders.length} suffix=" orders" duration={1000} />
                  </div>
                  <span className="font-label-mono text-[9px] text-[#14231C]/60 mt-1">
                    Central Speed Post logs
                  </span>
                </div>

                {/* 3. Total Users */}
                <div className="bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[16px] p-5 shadow-[3px_3px_0_#14231C] flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-label-mono text-[10px] text-[#14231C]/60 uppercase">
                      REGISTERED RECIPIENTS
                    </span>
                    <span className="text-sm">👥</span>
                  </div>
                  <div className="font-mono font-bold text-2xl sm:text-3xl text-[#14231C]">
                    <CountUp value={allUsers.length} suffix=" users" duration={1100} />
                  </div>
                  <span className="font-label-mono text-[9px] text-[#286345] font-semibold mt-1">
                    All accounts verified
                  </span>
                </div>

                {/* 4. Active Sellers */}
                <div className="bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[16px] p-5 shadow-[3px_3px_0_#14231C] flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-label-mono text-[10px] text-[#14231C]/60 uppercase">
                      ACTIVE GUILD SELLERS
                    </span>
                    <span className="text-sm">🪵</span>
                  </div>
                  <div className="font-mono font-bold text-2xl sm:text-3xl text-[#E8502B]">
                    <CountUp value={activeSellersCount} suffix=" guilds" duration={900} />
                  </div>
                  <span className="font-label-mono text-[9px] text-[#14231C]/60 mt-1">
                    Licensed artisan workshops
                  </span>
                </div>
              </div>

              {/* CHART 1: REVENUE OVER 7 DAYS (AREA CHART) */}
              <div className="bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[20px] p-6 shadow-[3px_3px_0_#14231C] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#14231C]/20 pb-3">
                  <div>
                    <span className="font-label-mono text-[10px] text-[#14231C]/60 uppercase">
                      POSTAL TREASURY REVENUE
                    </span>
                    <h2 className="font-fraunces text-xl font-semibold text-[#14231C]">
                      Consignment Revenue Over 7 Days
                    </h2>
                  </div>
                  <span className="font-mono text-xs font-bold text-[#E8502B] bg-[#E8502B]/10 px-2 py-0.5 rounded border border-[#E8502B]/30">
                    7-Day Gross: {formatINR(REVENUE_7_DAYS.reduce((a, b) => a + b.revenue, 0))}
                  </span>
                </div>

                <div className="h-64 sm:h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={REVENUE_7_DAYS}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="adminRevGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#14231C" stopOpacity={0.6} />
                          <stop offset="95%" stopColor="#E8502B" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="day"
                        stroke="#14231C"
                        opacity={0.65}
                        tick={{ fontFamily: 'monospace', fontSize: 11 }}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#14231C"
                        opacity={0.65}
                        tick={{ fontFamily: 'monospace', fontSize: 10 }}
                        tickLine={false}
                        tickFormatter={(val) => `₹${val / 1000}k`}
                      />
                      <Tooltip content={<CustomAdminTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#14231C"
                        strokeWidth={2.5}
                        fill="url(#adminRevGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ROW OF 2 CHARTS: DONUT (SALES BY CATEGORY) & BARS (ORDERS BY STATUS) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* CHART 2: DONUT (SALES BY CATEGORY) */}
                <div className="bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[20px] p-6 shadow-[3px_3px_0_#14231C] space-y-4">
                  <div className="border-b border-[#14231C]/20 pb-3">
                    <span className="font-label-mono text-[10px] text-[#14231C]/60 uppercase">
                      CATALOG DISTRIBUTION
                    </span>
                    <h2 className="font-fraunces text-xl font-semibold text-[#14231C]">
                      Sales by Category
                    </h2>
                  </div>

                  <div className="h-60 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryDonutData}
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {categoryDonutData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="#14231C" strokeWidth={1.5} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomAdminTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#14231C]/15 font-mono text-[10px]">
                    {categoryDonutData.map((c) => (
                      <div key={c.name} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0 border border-[#14231C]" style={{ backgroundColor: c.color }} />
                        <span className="truncate">{c.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CHART 3: BARS (ORDERS BY STATUS) */}
                <div className="bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[20px] p-6 shadow-[3px_3px_0_#14231C] space-y-4">
                  <div className="border-b border-[#14231C]/20 pb-3">
                    <span className="font-label-mono text-[10px] text-[#14231C]/60 uppercase">
                      RAIL TRANSIT STAGES
                    </span>
                    <h2 className="font-fraunces text-xl font-semibold text-[#14231C]">
                      Orders by Station Status
                    </h2>
                  </div>

                  <div className="h-60 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ordersStatusBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis
                          dataKey="status"
                          stroke="#14231C"
                          opacity={0.65}
                          tick={{ fontFamily: 'monospace', fontSize: 10 }}
                          tickLine={false}
                        />
                        <YAxis
                          stroke="#14231C"
                          opacity={0.65}
                          tick={{ fontFamily: 'monospace', fontSize: 10 }}
                          tickLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip content={<CustomAdminTooltip />} />
                        <Bar dataKey="count" fill="#E8502B" radius={[4, 4, 0, 0]} stroke="#14231C" strokeWidth={1} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <p className="font-mono text-[10px] text-[#14231C]/60 text-center border-t border-[#14231C]/15 pt-2">
                    Consignments in transit auto-advance stations every 15 seconds.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ALL ORDERS TABLE WITH FILTERS & CANCEL */}
          {activeTab === 'orders' && (
            <div className="bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[20px] p-6 shadow-[3px_3px_0_#14231C] space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#14231C]/20 pb-4">
                <div>
                  <span className="font-label-mono text-[10px] text-[#14231C]/60 uppercase">
                    CENTRAL SPEED POST REGISTRY
                  </span>
                  <h2 className="font-fraunces text-2xl font-semibold text-[#14231C]">
                    All Consignment Manifests ({filteredOrders.length})
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Status Filter Tabs */}
                  <div className="flex bg-[#F3EBDD] border-[1.5px] border-[#14231C] rounded-[10px] p-0.5 font-mono text-[11px]">
                    {(['all', 'active', 'delivered', 'cancelled'] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setOrderStatusFilter(tab)}
                        className={`px-3 py-1 rounded-[6px] capitalize font-bold transition-all cursor-pointer ${
                          orderStatusFilter === tab
                            ? 'bg-[#14231C] text-white shadow-[1px_1px_0_#E8502B]'
                            : 'text-[#14231C]/70 hover:text-[#14231C]'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {/* Search query */}
                  <input
                    type="text"
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    placeholder="Search by ID or recipient..."
                    className="bg-[#F3EBDD] border-[1.5px] border-[#14231C] rounded-[10px] px-3 py-1.5 text-xs font-mono text-[#14231C] focus:outline-none"
                  />
                </div>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="py-16 text-center space-y-2">
                  <span className="text-4xl block">📋</span>
                  <p className="font-fraunces font-semibold text-base text-[#14231C]">
                    No manifests match the filter criteria
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs border-collapse">
                    <thead>
                      <tr className="border-b-[1.5px] border-[#14231C] text-[10px] text-[#14231C]/70 font-label-mono uppercase">
                        <th className="py-3 px-2">Manifest ID</th>
                        <th className="py-3 px-2">Recipient / Station</th>
                        <th className="py-3 px-2">Wares</th>
                        <th className="py-3 px-2">Total (INR)</th>
                        <th className="py-3 px-2">Station Status</th>
                        <th className="py-3 px-2 text-right">Superintendent Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#14231C]/15">
                      {filteredOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-[#F3EBDD]/60 transition-colors">
                          <td className="py-3 px-2 font-bold">
                            <Link
                              to={`/orders/${ord.id}`}
                              className="text-[#14231C] hover:text-[#E8502B] underline"
                            >
                              {ord.id}
                            </Link>
                            <span className="block text-[9px] text-[#14231C]/50 font-normal">
                              {formatDate(ord.createdAt)}
                            </span>
                          </td>

                          <td className="py-3 px-2">
                            <span className="font-bold block text-[#14231C]">
                              {ord.shippingAddress.fullName}
                            </span>
                            <span className="text-[10px] text-[#14231C]/60 block truncate max-w-[140px]">
                              {ord.shippingAddress.city}, {ord.shippingAddress.state}
                            </span>
                          </td>

                          <td className="py-3 px-2">
                            <span className="text-xs">
                              {ord.items.length} item{ord.items.length > 1 ? 's' : ''}
                            </span>
                            <span className="block text-[10px] text-[#14231C]/60 truncate max-w-[150px]">
                              {ord.items.map((i) => i.name).join(', ')}
                            </span>
                          </td>

                          <td className="py-3 px-2 font-bold text-sm text-[#14231C]">
                            {formatINR(ord.total)}
                          </td>

                          <td className="py-3 px-2">
                            <span
                              className={`font-label-mono text-[9px] px-2 py-0.5 rounded border uppercase font-bold ${
                                ord.status === 'delivered'
                                  ? 'border-[#286345] text-[#286345] bg-[#286345]/10'
                                  : ord.status === 'cancelled'
                                    ? 'border-[#E8502B] text-[#E8502B] bg-[#E8502B]/10'
                                    : 'border-[#14231C] text-[#14231C] bg-[#F3EBDD]'
                              }`}
                            >
                              {ord.status}
                            </span>
                          </td>

                          <td className="py-3 px-2 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {ord.status !== 'delivered' && ord.status !== 'cancelled' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      advanceOrderStatus(ord.id);
                                      addToast({
                                        title: 'Manifest Advanced',
                                        message: `Order ${ord.id} moved to next station`,
                                        variant: 'mint',
                                      });
                                    }}
                                    className="font-label-mono text-[10px] px-2 py-1 rounded border border-[#14231C] bg-[#F3EBDD] hover:bg-[#14231C] hover:text-[#F3EBDD] cursor-pointer"
                                  >
                                    Advance →
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      cancelOrder(ord.id, 'Superintendent administrative cancellation');
                                      addToast({
                                        title: 'Manifest Cancelled',
                                        message: `Order ${ord.id} cancelled. Stock returned.`,
                                        variant: 'tomato',
                                      });
                                    }}
                                    className="font-label-mono text-[10px] px-2 py-1 rounded border border-[#E8502B] text-[#E8502B] hover:bg-[#E8502B] hover:text-white cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PRODUCT MODERATION */}
          {activeTab === 'moderation' && (
            <div className="bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[20px] p-6 shadow-[3px_3px_0_#14231C] space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#14231C]/20 pb-4">
                <div>
                  <span className="font-label-mono text-[10px] text-[#14231C]/60 uppercase">
                    CENTRAL CATALOG MODERATION
                  </span>
                  <h2 className="font-fraunces text-2xl font-semibold text-[#14231C]">
                    All Catalog Wares ({filteredProducts.length})
                  </h2>
                  <p className="text-xs text-[#14231C]/75 font-sans mt-0.5">
                    Superintendent moderation to hide or unhide any product across all merchant workshops.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={productCategoryFilter}
                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                    className="bg-[#F3EBDD] border-[1.5px] border-[#14231C] rounded-[10px] px-3 py-1.5 text-xs font-mono text-[#14231C] focus:outline-none"
                  >
                    <option value="all">All Categories</option>
                    <option value="tech">Tech</option>
                    <option value="home">Home</option>
                    <option value="style">Style</option>
                    <option value="beauty">Beauty</option>
                    <option value="books">Books</option>
                    <option value="play">Play</option>
                  </select>

                  <input
                    type="text"
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    placeholder="Search title, brand, or ID..."
                    className="bg-[#F3EBDD] border-[1.5px] border-[#14231C] rounded-[10px] px-3 py-1.5 text-xs font-mono text-[#14231C] focus:outline-none"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="border-b-[1.5px] border-[#14231C] text-[10px] text-[#14231C]/70 font-label-mono uppercase">
                      <th className="py-3 px-2">Ware</th>
                      <th className="py-3 px-2">Brand / Guild</th>
                      <th className="py-3 px-2">Price</th>
                      <th className="py-3 px-2">Stock</th>
                      <th className="py-3 px-2">Catalog Status</th>
                      <th className="py-3 px-2 text-right">Moderation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#14231C]/15">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-[#F3EBDD]/60 transition-colors">
                        <td className="py-3 px-2 min-w-[180px]">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-[6px] border-[1.5px] border-[#14231C] flex items-center justify-center text-base shrink-0"
                              style={{ backgroundColor: p.bgHex }}
                            >
                              {p.emoji}
                            </div>
                            <div className="min-w-0">
                              <Link
                                to={`/product/${p.id}`}
                                className="font-fraunces font-semibold text-sm text-[#14231C] hover:text-[#E8502B] truncate block"
                              >
                                {p.name}
                              </Link>
                              <span className="font-label-mono text-[9px] text-[#14231C]/60 block">
                                {p.id} · {p.category.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-2 text-[#14231C]">{p.brand}</td>
                        <td className="py-3 px-2 font-bold">{formatINR(p.price)}</td>
                        <td className="py-3 px-2">{p.stock} units</td>

                        <td className="py-3 px-2">
                          <span
                            className={`font-label-mono text-[9px] px-2 py-0.5 rounded border uppercase font-bold ${
                              p.hidden
                                ? 'border-[#E8502B] text-[#E8502B] bg-[#E8502B]/10'
                                : 'border-[#286345] text-[#286345] bg-[#286345]/10'
                            }`}
                          >
                            {p.hidden ? 'Hidden / Delisted' : 'Public in Shop'}
                          </span>
                        </td>

                        <td className="py-3 px-2 text-right">
                          <Button
                            variant={p.hidden ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={() => {
                              toggleProductHidden(p.id);
                              addToast({
                                title: p.hidden ? 'Ware Restored' : 'Ware Delisted',
                                message: p.hidden
                                  ? `${p.name} returned to active shop`
                                  : `${p.name} hidden from public catalog`,
                                variant: p.hidden ? 'mint' : 'wax',
                              });
                            }}
                          >
                            {p.hidden ? 'Unhide' : 'Hide from Shop'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: COUPON MANAGER */}
          {activeTab === 'coupons' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
              {/* CREATE COUPON FORM (5 COLS) */}
              <div className="xl:col-span-5 bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[20px] p-6 shadow-[3px_3px_0_#14231C] space-y-5">
                <div className="border-b border-[#14231C]/20 pb-3">
                  <span className="font-label-mono text-[10px] text-[#14231C]/60 uppercase">
                    PROMOTIONAL SEAL DESK
                  </span>
                  <h2 className="font-fraunces text-2xl font-semibold text-[#14231C]">
                    Create Postal Coupon
                  </h2>
                  <p className="text-xs text-[#14231C]/75 font-sans mt-0.5">
                    New promotional seals work immediately in checkout for all recipients.
                  </p>
                </div>

                <form onSubmit={handleCreateCoupon} className="space-y-4">
                  <div className="space-y-1">
                    <label className="font-label-mono text-[10px] uppercase text-[#14231C]/80 block">
                      COUPON STAMP CODE *
                    </label>
                    <input
                      type="text"
                      value={newCouponCode}
                      onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                      placeholder="e.g. FESTIVE20, AUTUMN50"
                      className="w-full bg-[#F3EBDD] border-[1.5px] border-[#14231C] rounded-[10px] px-3 py-2 text-xs font-mono font-bold tracking-wider text-[#14231C] focus:outline-none focus:ring-1 focus:ring-[#E8502B]"
                    />
                    {couponErrors.code && (
                      <p className="text-[10px] text-[#E8502B] font-mono">{couponErrors.code}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-label-mono text-[10px] uppercase text-[#14231C]/80 block">
                        DISCOUNT TYPE
                      </label>
                      <select
                        value={newCouponType}
                        onChange={(e) => setNewCouponType(e.target.value as any)}
                        className="w-full bg-[#F3EBDD] border-[1.5px] border-[#14231C] rounded-[10px] px-3 py-2 text-xs font-mono text-[#14231C] focus:outline-none"
                      >
                        <option value="percent">Percentage (%)</option>
                        <option value="flat">Flat Cash (₹)</option>
                        <option value="shipping">Free Delivery</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-label-mono text-[10px] uppercase text-[#14231C]/80 block">
                        DISCOUNT VALUE
                      </label>
                      <input
                        type="number"
                        value={newCouponValue}
                        onChange={(e) => setNewCouponValue(e.target.value)}
                        disabled={newCouponType === 'shipping'}
                        className="w-full bg-[#F3EBDD] border-[1.5px] border-[#14231C] rounded-[10px] px-3 py-2 text-xs font-mono font-bold text-[#14231C] focus:outline-none disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-label-mono text-[10px] uppercase text-[#14231C]/80 block">
                        MIN SPEND (₹)
                      </label>
                      <input
                        type="number"
                        value={newCouponMinSpend}
                        onChange={(e) => setNewCouponMinSpend(e.target.value)}
                        placeholder="e.g. 500"
                        className="w-full bg-[#F3EBDD] border-[1.5px] border-[#14231C] rounded-[10px] px-3 py-2 text-xs font-mono text-[#14231C] focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-label-mono text-[10px] uppercase text-[#14231C]/80 block">
                        EXPIRY (OPTIONAL)
                      </label>
                      <input
                        type="date"
                        value={newCouponExpiry}
                        onChange={(e) => setNewCouponExpiry(e.target.value)}
                        className="w-full bg-[#F3EBDD] border-[1.5px] border-[#14231C] rounded-[10px] px-3 py-2 text-xs font-mono text-[#14231C] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-label-mono text-[10px] uppercase text-[#14231C]/80 block">
                      STAMP DESCRIPTION
                    </label>
                    <textarea
                      rows={2}
                      value={newCouponDesc}
                      onChange={(e) => setNewCouponDesc(e.target.value)}
                      placeholder="e.g. 15% off any handcrafted parcel above ₹600."
                      className="w-full bg-[#F3EBDD] border-[1.5px] border-[#14231C] rounded-[10px] p-3 text-xs font-sans text-[#14231C] focus:outline-none"
                    />
                  </div>

                  <div className="pt-2">
                    <Button variant="primary" size="md" type="submit" className="w-full">
                      Issue Coupon Seal
                    </Button>
                  </div>
                </form>
              </div>

              {/* COUPON REGISTRY TABLE (7 COLS) */}
              <div className="xl:col-span-7 bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[20px] p-6 shadow-[3px_3px_0_#14231C] space-y-4">
                <div className="flex items-center justify-between border-b border-[#14231C]/20 pb-3">
                  <div>
                    <span className="font-label-mono text-[10px] text-[#14231C]/60 uppercase">
                      ACTIVE &amp; EXPIRED REGISTRY
                    </span>
                    <h2 className="font-fraunces text-xl font-semibold text-[#14231C]">
                      Promotional Seals ({coupons.length})
                    </h2>
                  </div>
                </div>

                <div className="space-y-3">
                  {coupons.map((c) => (
                    <div
                      key={c.code}
                      className="p-4 rounded-[14px] border-[1.5px] border-[#14231C] bg-[#F3EBDD] flex flex-wrap items-center justify-between gap-3 shadow-[2px_2px_0_#14231C]"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-base text-[#14231C]">
                            {c.code}
                          </span>
                          <span className="font-label-mono text-[9px] px-1.5 py-0.5 rounded border border-[#14231C]/40 bg-[#EADFCB] font-bold">
                            {c.badge}
                          </span>
                          {c.disabled && (
                            <span className="font-label-mono text-[9px] px-1.5 py-0.5 rounded border border-[#E8502B] text-[#E8502B] bg-[#E8502B]/10 font-bold">
                              DISABLED
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#14231C]/75 font-sans mt-0.5">
                          {c.description} {c.minOrder ? `(Min. spend: ₹${c.minOrder})` : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <Button
                          variant={c.disabled ? 'primary' : 'secondary'}
                          size="sm"
                          onClick={() => {
                            toggleCouponEnabled(c.code);
                            addToast({
                              title: c.disabled ? 'Coupon Enabled' : 'Coupon Disabled',
                              message: c.disabled
                                ? `Coupon ${c.code} is now usable at checkout`
                                : `Coupon ${c.code} is temporarily disabled`,
                              variant: c.disabled ? 'mint' : 'wax',
                            });
                          }}
                        >
                          {c.disabled ? 'Enable' : 'Disable'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: RECOMMENDATION ENGINE SWITCH & LIVE PREVIEW STRIP */}
          {activeTab === 'engine' && (
            <div className="space-y-6">
              <div className="bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[20px] p-6 shadow-[3px_3px_0_#14231C] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#14231C]/20 pb-3">
                  <div>
                    <span className="font-label-mono text-[10px] text-[#14231C]/60 uppercase">
                      CENTRAL ALGORITHM CONTROL
                    </span>
                    <h2 className="font-fraunces text-2xl font-semibold text-[#14231C]">
                      Recommendation Engine Switch
                    </h2>
                    <p className="text-xs text-[#14231C]/75 font-sans">
                      Select between the Smart Hybrid engine and the Popularity engine. The chosen engine dynamically computes recommendations across Home, Product Detail, Cart, and Order Confirmation slips.
                    </p>
                  </div>
                  <span className="font-label-mono text-xs font-bold text-[#286345] bg-[#286345]/10 px-3 py-1 rounded border border-[#286345]/30 uppercase self-start sm:self-auto">
                    ACTIVE: {recommenderEngine.toUpperCase()}
                  </span>
                </div>

                {/* SEGMENTED CONTROL: SMART VS POPULAR */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* Option 1: Smart Hybrid */}
                  <div
                    onClick={() => {
                      setRecommenderEngine('smart');
                      addToast({
                        title: 'Engine Swapped',
                        message: 'Activated Smart Hybrid algorithm (affinity + co-purchase + tags)',
                        variant: 'tomato',
                      });
                    }}
                    className={`p-5 rounded-[16px] border-[1.5px] transition-all cursor-pointer flex flex-col justify-between ${
                      recommenderEngine === 'smart'
                        ? 'bg-[#F3EBDD] border-[#E8502B] shadow-[3px_3px_0_#E8502B]'
                        : 'bg-[#EADFCB]/60 border-[#14231C]/30 hover:border-[#14231C] hover:bg-[#F3EBDD]/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-fraunces font-semibold text-lg text-[#14231C]">
                          Smart Hybrid Scoring
                        </span>
                        {recommenderEngine === 'smart' && (
                          <Stamp text="ACTIVE" variant="tomato" size="sm" rotation={-2} />
                        )}
                      </div>
                      <p className="text-xs text-[#14231C]/75 font-sans leading-relaxed mb-3">
                        Blends recipient behaviour graphs, seeded co-purchase matrices, and tag affinity.
                      </p>
                      <div className="bg-[#14231C]/5 p-3 rounded-[10px] font-mono text-[10px] text-[#14231C]/80 space-y-1">
                        <div>0.35 × categoryAffinity + 0.25 × tagOverlap</div>
                        <div>0.25 × coPurchase + 0.10 × rating + 0.05 × recency</div>
                        <div className="text-[9px] text-[#286345] font-semibold pt-1">
                          Weights: View 1 · Wishlist 2 · CartAdd 3 · Purchase 5
                        </div>
                      </div>
                    </div>
                    <div className="pt-4 mt-3 flex items-center justify-between border-t border-[#14231C]/10 text-xs">
                      <span className="font-label-mono text-[10px] text-[#14231C]/60">
                        Adaptive &amp; Personalized
                      </span>
                      <Button
                        variant={recommenderEngine === 'smart' ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRecommenderEngine('smart');
                        }}
                      >
                        {recommenderEngine === 'smart' ? 'Active Engine' : 'Activate'}
                      </Button>
                    </div>
                  </div>

                  {/* Option 2: Popularity */}
                  <div
                    onClick={() => {
                      setRecommenderEngine('popular');
                      addToast({
                        title: 'Engine Swapped',
                        message: 'Activated Popularity algorithm (rating × review count + recency)',
                        variant: 'wax',
                      });
                    }}
                    className={`p-5 rounded-[16px] border-[1.5px] transition-all cursor-pointer flex flex-col justify-between ${
                      recommenderEngine === 'popular'
                        ? 'bg-[#F3EBDD] border-[#E8502B] shadow-[3px_3px_0_#E8502B]'
                        : 'bg-[#EADFCB]/60 border-[#14231C]/30 hover:border-[#14231C] hover:bg-[#F3EBDD]/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-fraunces font-semibold text-lg text-[#14231C]">
                          Community Favorites (Popular)
                        </span>
                        {recommenderEngine === 'popular' && (
                          <Stamp text="ACTIVE" variant="mint" size="sm" rotation={2} />
                        )}
                      </div>
                      <p className="text-xs text-[#14231C]/75 font-sans leading-relaxed mb-3">
                        Ranked purely by verified star ratings, customer review volume, and arrival recency boost.
                      </p>
                      <div className="bg-[#14231C]/5 p-3 rounded-[10px] font-mono text-[10px] text-[#14231C]/80 space-y-1">
                        <div>Score = ratingCount × rating × recencyBoost</div>
                        <div className="text-[9px] text-[#14231C]/70 pt-1">
                          Ideal for cold starts and broad crowd-consensus trending.
                        </div>
                      </div>
                    </div>
                    <div className="pt-4 mt-3 flex items-center justify-between border-t border-[#14231C]/10 text-xs">
                      <span className="font-label-mono text-[10px] text-[#14231C]/60">
                        Crowd Consensus
                      </span>
                      <Button
                        variant={recommenderEngine === 'popular' ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRecommenderEngine('popular');
                        }}
                      >
                        {recommenderEngine === 'popular' ? 'Active Engine' : 'Activate'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* LIVE PREVIEW STRIP OF HOME PAGE UNDER EACH ENGINE */}
              <div className="bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[20px] p-6 shadow-[3px_3px_0_#14231C] space-y-4">
                <div className="border-b border-[#14231C]/20 pb-3">
                  <span className="font-label-mono text-[10px] text-[#14231C]/60 uppercase">
                    LIVE HOMEPAGE DISPATCH COMPARISON
                  </span>
                  <h3 className="font-fraunces text-xl font-semibold text-[#14231C]">
                    Preview Strip: &quot;Picked for you&quot; Under Current Store State
                  </h3>
                  <p className="text-xs text-[#14231C]/75 font-sans">
                    Compare how the two algorithms score and reason about the top 3 recommended wares right now:
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left: Smart Hybrid Output */}
                  <div className="bg-[#F3EBDD] border-[1.5px] border-[#14231C] rounded-[16px] p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-[#14231C]/15 pb-2">
                      <span className="font-fraunces font-bold text-sm text-[#14231C]">
                        Smart Hybrid Results
                      </span>
                      <span className="font-label-mono text-[9px] text-[#E8502B] font-bold">
                        BEHAVIOUR-DRIVEN
                      </span>
                    </div>

                    <div className="space-y-2">
                      {smartRecommendationsPreview.map((scored) => (
                        <div
                          key={scored.product.id}
                          className="flex items-center justify-between gap-3 p-2.5 rounded-[10px] bg-[#EADFCB]/60 border border-[#14231C]/20"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-xl shrink-0">{scored.product.emoji}</span>
                            <div className="min-w-0">
                              <p className="font-fraunces font-semibold text-xs text-[#14231C] truncate">
                                {scored.product.name}
                              </p>
                              <p className="font-mono text-[9px] text-[#14231C]/60 truncate">
                                {scored.reason}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <MatchRing percentage={scored.matchPercentage} size={30} strokeWidth={2.5} />
                            <span className="font-mono text-xs font-bold text-[#14231C]">
                              {formatINR(scored.product.price)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Popular Output */}
                  <div className="bg-[#F3EBDD] border-[1.5px] border-[#14231C] rounded-[16px] p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-[#14231C]/15 pb-2">
                      <span className="font-fraunces font-bold text-sm text-[#14231C]">
                        Popularity Results
                      </span>
                      <span className="font-label-mono text-[9px] text-[#286345] font-bold">
                        RATING × REVIEWS
                      </span>
                    </div>

                    <div className="space-y-2">
                      {popularRecommendationsPreview.map((scored) => (
                        <div
                          key={scored.product.id}
                          className="flex items-center justify-between gap-3 p-2.5 rounded-[10px] bg-[#EADFCB]/60 border border-[#14231C]/20"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-xl shrink-0">{scored.product.emoji}</span>
                            <div className="min-w-0">
                              <p className="font-fraunces font-semibold text-xs text-[#14231C] truncate">
                                {scored.product.name}
                              </p>
                              <p className="font-mono text-[9px] text-[#14231C]/60 truncate">
                                {scored.reason}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <MatchRing percentage={scored.matchPercentage} size={30} strokeWidth={2.5} />
                            <span className="font-mono text-xs font-bold text-[#14231C]">
                              {formatINR(scored.product.price)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: USERS TABLE WITH SEARCH, ROLES, BLOCK/UNBLOCK */}
          {activeTab === 'users' && (
            <div className="bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[20px] p-6 shadow-[3px_3px_0_#14231C] space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#14231C]/20 pb-4">
                <div>
                  <span className="font-label-mono text-[10px] text-[#14231C]/60 uppercase">
                    CENTRAL IDENTIFICATION REGISTRY
                  </span>
                  <h2 className="font-fraunces text-2xl font-semibold text-[#14231C]">
                    All Registered Accounts ({filteredUsers.length})
                  </h2>
                </div>

                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Search by name, email, or role..."
                  className="bg-[#F3EBDD] border-[1.5px] border-[#14231C] rounded-[10px] px-3 py-1.5 text-xs font-mono text-[#14231C] focus:outline-none"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="border-b-[1.5px] border-[#14231C] text-[10px] text-[#14231C]/70 font-label-mono uppercase">
                      <th className="py-3 px-2">User / Identity</th>
                      <th className="py-3 px-2">Email Address</th>
                      <th className="py-3 px-2">Role</th>
                      <th className="py-3 px-2">Account State</th>
                      <th className="py-3 px-2 text-right">Administrative Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#14231C]/15">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-[#F3EBDD]/60 transition-colors">
                        <td className="py-3 px-2 font-bold">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{u.avatar}</span>
                            <div>
                              <span className="text-[#14231C]">{u.name}</span>
                              {u.sellerShopName && (
                                <span className="block text-[9px] text-[#14231C]/60 font-normal">
                                  Workshop: {u.sellerShopName}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-2 text-[#14231C]/80">{u.email}</td>

                        <td className="py-3 px-2">
                          <span
                            className={`font-label-mono text-[9px] px-2 py-0.5 rounded border uppercase font-bold ${
                              u.role === 'admin'
                                ? 'border-[#E8502B] text-[#E8502B] bg-[#E8502B]/10'
                                : u.role === 'seller'
                                  ? 'border-[#286345] text-[#286345] bg-[#286345]/10'
                                  : 'border-[#14231C]/50 text-[#14231C] bg-[#F3EBDD]'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>

                        <td className="py-3 px-2">
                          <span
                            className={`font-label-mono text-[9px] px-2 py-0.5 rounded border uppercase font-bold ${
                              u.blocked
                                ? 'border-[#E8502B] text-[#E8502B] bg-[#E8502B]/10'
                                : 'border-[#286345] text-[#286345] bg-[#286345]/10'
                            }`}
                          >
                            {u.blocked ? 'Blocked' : 'Active'}
                          </span>
                        </td>

                        <td className="py-3 px-2 text-right">
                          {u.id !== currentUser.id && (
                            <Button
                              variant={u.blocked ? 'primary' : 'secondary'}
                              size="sm"
                              onClick={() => {
                                toggleUserBlock(u.id);
                                addToast({
                                  title: u.blocked ? 'User Unblocked' : 'User Blocked',
                                  message: u.blocked
                                    ? `Account ${u.name} unblocked`
                                    : `Account ${u.name} has been blocked from placing orders`,
                                  variant: u.blocked ? 'mint' : 'tomato',
                                });
                              }}
                            >
                              {u.blocked ? 'Unblock' : 'Block User'}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: ACTIVITY FEED */}
          {activeTab === 'activity' && (
            <div className="bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[20px] p-6 shadow-[3px_3px_0_#14231C] space-y-4">
              <div className="border-b border-[#14231C]/20 pb-3">
                <span className="font-label-mono text-[10px] text-[#14231C]/60 uppercase">
                  CENTRAL AUDIT DISPATCH LOG
                </span>
                <h2 className="font-fraunces text-2xl font-semibold text-[#14231C]">
                  Live Activity Feed
                </h2>
                <p className="text-xs text-[#14231C]/75 font-sans mt-0.5">
                  Real-time events recorded across orders, reviews, users, catalog editions, and transit updates.
                </p>
              </div>

              <div className="divide-y divide-[#14231C]/15 font-mono text-xs">
                {activities.map((act) => (
                  <div key={act.id} className="py-3.5 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full border border-[#14231C] bg-[#F3EBDD] flex items-center justify-center text-sm shrink-0 shadow-[1px_1px_0_#14231C]">
                        {act.icon}
                      </div>
                      <div>
                        <span className="font-fraunces font-semibold text-sm text-[#14231C] block">
                          {act.title}
                        </span>
                        <p className="text-xs text-[#14231C]/80 font-sans mt-0.5">
                          {act.description}
                        </p>
                      </div>
                    </div>

                    <span className="font-label-mono text-[10px] text-[#14231C]/60 shrink-0">
                      {getRelativeTime(act.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: REGISTRY SETTINGS & RESET DATA */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[20px] p-6 sm:p-8 shadow-[3px_3px_0_#14231C] space-y-6">
                <div className="border-b border-[#14231C]/20 pb-4">
                  <span className="font-label-mono text-[10px] text-[#14231C]/60 uppercase">
                    STATION CONFIGURATION · GENERAL POST OFFICE
                  </span>
                  <h2 className="font-fraunces text-2xl font-semibold text-[#14231C]">
                    Registry System Settings
                  </h2>
                  <p className="text-xs text-[#14231C]/75 font-sans mt-0.5">
                    Internal configuration for national dispatch routing, warehouse persistence, and master database states.
                  </p>
                </div>

                {/* System Specs Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-[#F3EBDD] border border-[#14231C]/20 rounded-[12px] p-4">
                    <span className="font-label-mono text-[10px] text-[#14231C]/60 uppercase block">
                      Local Manifest Vault
                    </span>
                    <span className="font-fraunces text-xl font-bold text-[#14231C]">
                      {orders.length} Active Orders
                    </span>
                    <p className="text-[11px] font-mono text-[#14231C]/70 mt-1">
                      {products.length} catalog items logged
                    </p>
                  </div>

                  <div className="bg-[#F3EBDD] border border-[#14231C]/20 rounded-[12px] p-4">
                    <span className="font-label-mono text-[10px] text-[#14231C]/60 uppercase block">
                      Recommendation Engine
                    </span>
                    <span className="font-fraunces text-xl font-bold text-[#286345] uppercase">
                      {recommenderEngine} Mode
                    </span>
                    <p className="text-[11px] font-mono text-[#14231C]/70 mt-1">
                      Swappable ranking active
                    </p>
                  </div>

                  <div className="bg-[#F3EBDD] border border-[#14231C]/20 rounded-[12px] p-4">
                    <span className="font-label-mono text-[10px] text-[#14231C]/60 uppercase block">
                      Postal Seals & Users
                    </span>
                    <span className="font-fraunces text-xl font-bold text-[#E8502B]">
                      {coupons.length} Seals · {allUsers.length} Users
                    </span>
                    <p className="text-[11px] font-mono text-[#14231C]/70 mt-1">
                      {activities.length} activity entries
                    </p>
                  </div>
                </div>

                {/* Maintenance Section with Hidden/Discrete Reset Button */}
                <div className="border-t border-[#14231C]/20 pt-6">
                  <div className="bg-[#F3EBDD] border-[1.5px] border-[#14231C]/30 rounded-[16px] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">🧯</span>
                        <h3 className="font-fraunces font-semibold text-base text-[#14231C]">
                          Emergency Maintenance
                        </h3>
                      </div>
                      <p className="text-xs text-[#14231C]/75 font-sans max-w-md">
                        Flush all customized local database states, newly added merchant wares, test orders, and restore factory postal catalog.
                      </p>
                    </div>

                    {/* Hidden / discrete "Reset data" button */}
                    <button
                      type="button"
                      onClick={() => setShowResetModal(true)}
                      className="px-3.5 py-2 rounded-[10px] border border-[#E8502B]/40 bg-[#E8502B]/10 hover:bg-[#E8502B] text-[#E8502B] hover:text-[#F3EBDD] text-xs font-mono font-bold transition-all shadow-[2px_2px_0_#14231C] active:translate-x-[1px] active:translate-y-[1px] whitespace-nowrap cursor-pointer"
                      title="Reset all store and localStorage data to defaults"
                    >
                      ⚠️ Reset Data
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* CONFIRM RESET DATA MODAL */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Reset All Registry Data?"
      >
        <div className="p-6 space-y-5 text-center">
          <div className="inline-block">
            <Stamp text="CAUTION RE-INITIALIZE" variant="tomato" size="md" rotation={-3} />
          </div>

          <div className="space-y-2">
            <h3 className="font-fraunces text-xl font-semibold text-[#14231C]">
              Restore Initial Postal Baseline?
            </h3>
            <p className="text-xs text-[#14231C]/75 font-sans leading-relaxed">
              This will clear cached localStorage data, restored seeded catalog wares, baseline users, initial waybill orders, and default coupons.
            </p>
          </div>

          <div className="pt-2 flex justify-center gap-3">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setShowResetModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                resetAllData();
                setShowResetModal(false);
                addToast({
                  title: 'Registry Re-initialized',
                  message: 'All postal catalog and order ledgers restored to factory baseline!',
                  variant: 'tomato',
                });
                setTimeout(() => {
                  window.location.reload();
                }, 400);
              }}
            >
              Confirm Reset Data
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
