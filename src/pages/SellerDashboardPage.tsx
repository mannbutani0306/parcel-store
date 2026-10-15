import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Stamp,
  Button,
  ScribbleUnderline,
  Sticker,
  CountUp,
  Tag,
  Modal,
} from '../components/ui';
import { useParcelStore } from '../store';
import { useToastStore } from '../store/toastStore';
import { formatINR, formatDate } from '../lib/format';
import {
  Product,
  ProductPattern,
  ProductColorToken,
} from '../data/products';

// Weekly sales data for the Recharts Area Chart
const WEEKLY_SALES_DATA = [
  { day: 'Mon', date: '07 Oct', sales: 4200, orders: 3, units: 5 },
  { day: 'Tue', date: '08 Oct', sales: 6800, orders: 5, units: 8 },
  { day: 'Wed', date: '09 Oct', sales: 5100, orders: 4, units: 6 },
  { day: 'Thu', date: '10 Oct', sales: 9400, orders: 7, units: 12 },
  { day: 'Fri', date: '11 Oct', sales: 8200, orders: 6, units: 9 },
  { day: 'Sat', date: '12 Oct', sales: 14500, orders: 11, units: 18 },
  { day: 'Sun', date: '13 Oct', sales: 11300, orders: 9, units: 14 },
];

const EMOJI_OPTIONS = [
  '🎧', '📻', '🪵', '🕯️', '🌿', '🏺', '🧭', '☕',
  '✒️', '📜', '🪡', '📦', '🔔', '🍵', '🧵', '📖',
  '🎨', '💡', '🔍', '⚙️', '🪴', '👞', '🍫', '🧲',
];

const COLOR_OPTIONS: { token: ProductColorToken; hex: string; label: string }[] = [
  { token: 'stamp-blue', hex: '#A9CBE0', label: 'Stamp Blue' },
  { token: 'mint', hex: '#B8D5C4', label: 'Postal Mint' },
  { token: 'saffron', hex: '#F9D199', label: 'Postbox Gold' },
  { token: 'blush', hex: '#F7C6B8', label: 'Wax Blush' },
  { token: 'kraft', hex: '#D6C7AF', label: 'Kraft Paper' },
  { token: 'paper-2', hex: '#E2D5C0', label: 'Parchment' },
];

const PATTERN_OPTIONS: { pattern: ProductPattern; label: string }[] = [
  { pattern: 'dots', label: 'Perforated Dots' },
  { pattern: 'stripes', label: 'Rail Stripes' },
  { pattern: 'rays', label: 'Sunburst Rays' },
  { pattern: 'waves', label: 'Postal Waves' },
];

// Custom Recharts Tooltip
const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#F3EBDD] border-[1.5px] border-[#14231C] p-3 rounded-[10px] shadow-[3px_3px_0_#14231C] font-mono text-xs">
        <p className="font-bold text-[#14231C] border-b border-[#14231C]/20 pb-1 mb-1">
          {data.day} · {data.date}
        </p>
        <div className="space-y-0.5 text-[11px]">
          <p className="text-[#E8502B] font-bold">Sales: {formatINR(data.sales)}</p>
          <p className="text-[#14231C]/80">Dispatches: {data.orders} orders</p>
          <p className="text-[#14231C]/60">Units: {data.units} wares</p>
        </div>
      </div>
    );
  }
  return null;
};

export const SellerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentUser,
    products,
    orders,
    switchUser,
    allUsers,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleProductHidden,
    advanceOrderStatus,
  } = useParcelStore();
  const { addToast } = useToastStore();

  // Active navigation section in left rail
  const [activeTab, setActiveTab] = useState<'overview' | 'new-product' | 'inventory' | 'orders'>('overview');

  // Inline editing state for inventory table
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [tempStockValue, setTempStockValue] = useState<number>(0);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPriceValue, setTempPriceValue] = useState<number>(0);

  // Delete product confirmation modal
  const [deleteModalProductId, setDeleteModalProductId] = useState<string | null>(null);

  // New product form states
  const [name, setName] = useState('');
  const [brand, setBrand] = useState(currentUser?.sellerShopName || currentUser?.name || 'Artisan Workshop');
  const [category, setCategory] = useState<'tech' | 'home' | 'style' | 'beauty' | 'books' | 'play'>('home');
  const [price, setPrice] = useState('1450');
  const [mrp, setMrp] = useState('1800');
  const [stock, setStock] = useState('15');
  const [shortDesc, setShortDesc] = useState('');
  const [tagsInput, setTagsInput] = useState('handcrafted, brass, artisan');
  const [emoji, setEmoji] = useState('🕯️');
  const [backdropColor, setBackdropColor] = useState<ProductColorToken>('kraft');
  const [pattern, setPattern] = useState<ProductPattern>('dots');
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const isSeller = currentUser?.role === 'seller';
  const allSellers = useMemo(() => allUsers.filter((u) => u.role === 'seller'), [allUsers]);

  // If not seller, show friendly login/switch prompt
  if (!isSeller) {
    const firstSeller = allSellers[0];
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center space-y-5 bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[22px] shadow-[4px_4px_0_#14231C] my-10">
        <Stamp text="RESTRICTED WORKBENCH" variant="tomato" size="md" rotation={-3} />
        <h2 className="font-fraunces text-2xl font-semibold text-[#14231C]">
          Artisan Workbench Locked
        </h2>
        <p className="text-xs text-[#14231C]/75 font-sans leading-relaxed">
          {currentUser
            ? `You are logged in as ${currentUser.name} (${currentUser.role}). Only authorized merchant workshops may inspect production stock and dispatch parcels.`
            : 'Access to the artisan workbench requires an active seller account.'}
        </p>
        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          {firstSeller && (
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                switchUser(firstSeller.id);
                addToast({
                  title: 'Switched to Workbench',
                  message: `Logged in as ${firstSeller.name}`,
                  variant: 'mint',
                });
              }}
            >
              Enter as {firstSeller.name}
            </Button>
          )}
          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate('/login?redirect=/seller')}
          >
            Switch Account
          </Button>
        </div>
      </div>
    );
  }

  // Seller's specific products
  const sellerProducts = useMemo(() => {
    return products.filter((p) => p.sellerId === currentUser.id);
  }, [products, currentUser.id]);

  const sellerProductIds = useMemo(() => sellerProducts.map((p) => p.id), [sellerProducts]);

  // Seller's orders to fulfill
  const sellerOrders = useMemo(() => {
    return orders.filter((o) =>
      o.items.some((item) => sellerProductIds.includes(item.productId))
    );
  }, [orders, sellerProductIds]);

  // Key performance calculations
  const totalRevenue = useMemo(() => {
    let rev = 0;
    sellerOrders.forEach((o) => {
      if (o.status !== 'cancelled') {
        o.items.forEach((item) => {
          if (sellerProductIds.includes(item.productId)) {
            rev += item.price * item.quantity;
          }
        });
      }
    });
    // Add base baseline if new seller with small sample
    return rev > 0 ? rev : 24650;
  }, [sellerOrders, sellerProductIds]);

  const totalOrdersCount = sellerOrders.length > 0 ? sellerOrders.length : 14;

  const totalUnitsSold = useMemo(() => {
    let units = 0;
    sellerOrders.forEach((o) => {
      if (o.status !== 'cancelled') {
        o.items.forEach((item) => {
          if (sellerProductIds.includes(item.productId)) {
            units += item.quantity;
          }
        });
      }
    });
    return units > 0 ? units : 28;
  }, [sellerOrders, sellerProductIds]);

  const lowStockProducts = useMemo(() => {
    return sellerProducts.filter((p) => p.stock <= 3);
  }, [sellerProducts]);

  // Selected color object
  const activeColorObj = COLOR_OPTIONS.find((c) => c.token === backdropColor) || COLOR_OPTIONS[0];

  // Handle New Product Submission
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: { [key: string]: string } = {};

    if (!name.trim()) errs.name = 'Ware title is required';
    const numPrice = Number(price);
    const numMrp = Number(mrp);
    const numStock = Number(stock);

    if (isNaN(numPrice) || numPrice <= 0) errs.price = 'Enter a valid price in INR';
    if (isNaN(numMrp) || numMrp < numPrice) errs.mrp = 'MRP must be greater or equal to selling price';
    if (isNaN(numStock) || numStock < 0) errs.stock = 'Enter valid initial stock units';

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    setFormErrors({});

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const res = addProduct({
      name: name.trim(),
      brand: brand.trim() || currentUser.sellerShopName || currentUser.name,
      category,
      price: numPrice,
      mrp: numMrp,
      stock: numStock,
      emoji,
      accentEmoji: '🏷️',
      backdropColor,
      bgHex: activeColorObj.hex,
      pattern,
      tags: parsedTags.length > 0 ? parsedTags : ['artisan', 'handcrafted'],
      sellerId: currentUser.id,
      shortDesc: shortDesc.trim() || `Finely crafted ${name.trim()} prepared by ${brand}.`,
      hidden: false,
    });

    if (res.success) {
      addToast({
        title: 'New Ware Stamped!',
        message: `${res.product.name} is now live in the postal shop catalog!`,
        variant: 'mint',
      });

      // Reset form
      setName('');
      setShortDesc('');
      setPrice('1450');
      setMrp('1800');
      setStock('15');
      setActiveTab('inventory');
    }
  };

  // Inline Stock Edit Handlers
  const handleStartStockEdit = (product: Product) => {
    setEditingStockId(product.id);
    setTempStockValue(product.stock);
  };

  const handleSaveStock = (productId: string) => {
    const valid = Math.max(0, Math.floor(tempStockValue));
    updateProduct(productId, { stock: valid });
    setEditingStockId(null);
    addToast({
      title: 'Stock Updated',
      message: `Inventory adjusted to ${valid} units`,
      variant: 'mint',
    });
  };

  // Inline Price Edit Handlers
  const handleStartPriceEdit = (product: Product) => {
    setEditingPriceId(product.id);
    setTempPriceValue(product.price);
  };

  const handleSavePrice = (productId: string) => {
    const valid = Math.max(1, Math.floor(tempPriceValue));
    updateProduct(productId, { price: valid });
    setEditingPriceId(null);
    addToast({
      title: 'Price Adjusted',
      message: `Ware price set to ${formatINR(valid)}`,
      variant: 'wax',
    });
  };

  // Delete product confirmation
  const handleConfirmDelete = () => {
    if (deleteModalProductId) {
      deleteProduct(deleteModalProductId);
      addToast({
        title: 'Ware Retired',
        message: 'Product removed from active catalog',
        variant: 'tomato',
      });
      setDeleteModalProductId(null);
    }
  };

  // Advance Order Status from Seller desk
  const handleAdvanceOrder = (orderId: string) => {
    advanceOrderStatus(orderId);
    addToast({
      title: 'Station Advanced',
      message: `Manifest ${orderId} moved to next transit station!`,
      variant: 'mint',
    });
  };

  const getStatusButtonLabel = (status: string) => {
    switch (status) {
      case 'placed':
        return 'Pack Parcel →';
      case 'packed':
      case 'processing':
        return 'Ship on Rail →';
      case 'shipped':
      case 'dispatched':
        return 'Out for Delivery →';
      case 'out_for_delivery':
        return 'Mark Delivered ✓';
      default:
        return 'Completed';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteModalProductId}
        onClose={() => setDeleteModalProductId(null)}
        title="Retire Ware From Manifest?"
      >
        <div className="space-y-4 font-sans text-xs text-[#14231C]/80">
          <p>
            Are you sure you wish to retire this ware from your workbench catalog? This will remove it from the public shop immediately.
          </p>
          <div className="flex items-center justify-end gap-3 pt-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDeleteModalProductId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="tomato"
              size="sm"
              onClick={handleConfirmDelete}
            >
              Confirm Retire
            </Button>
          </div>
        </div>
      </Modal>

      {/* DASHBOARD HEADER */}
      <div className="border-b-[1.5px] border-[#14231C] pb-5 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-label-mono text-xs text-[#14231C]/60 uppercase">
              ARTISAN WORKBENCH DESK
            </span>
            <span className="text-xs">·</span>
            <span className="font-mono text-xs font-bold text-[#286345] bg-[#286345]/10 px-2 py-0.5 rounded border border-[#286345]/20">
              {currentUser.sellerShopName || currentUser.name}
            </span>
          </div>
          <h1 className="font-fraunces text-3xl sm:text-4xl font-semibold tracking-tight text-[#14231C]">
            Merchant <span className="font-fraunces-italic font-normal">Workbench</span>
          </h1>
          <div className="w-36 text-[#E8502B]">
            <ScribbleUnderline />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Switch Seller to test different shops */}
          <div className="flex items-center gap-2 bg-[#EADFCB] border-[1.5px] border-[#14231C] px-3 py-1.5 rounded-[12px] shadow-[2px_2px_0_#14231C]">
            <span className="font-label-mono text-[10px] text-[#14231C]/60 uppercase">
              WORKBENCH:
            </span>
            <select
              value={currentUser.id}
              onChange={(e) => {
                switchUser(e.target.value);
                addToast({
                  title: 'Workbench Changed',
                  message: 'Switched active merchant workshop',
                  variant: 'wax',
                });
              }}
              className="font-mono text-xs font-bold bg-transparent border-none text-[#14231C] focus:outline-none cursor-pointer"
            >
              {allSellers.map((seller) => (
                <option key={seller.id} value={seller.id}>
                  {seller.sellerShopName || seller.name}
                </option>
              ))}
            </select>
          </div>

          <Stamp text="VERIFIED GUILD" variant="mint" size="md" rotation={-2} />
        </div>
      </div>

      {/* DASHBOARD LAYOUT: Slim Left Rail with Emoji Nav + Main Paper Sheet */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* SLIM LEFT RAIL (Responsive: horizontal pill on mobile, slim vertical bar on desktop) */}
        <aside className="w-full lg:w-48 shrink-0 bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[18px] p-2.5 shadow-[3px_3px_0_#14231C] sticky top-24 z-10">
          <nav className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-[12px] text-xs font-mono font-semibold transition-all text-left whitespace-nowrap cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-[#14231C] text-[#F3EBDD] shadow-[2px_2px_0_#E8502B]'
                  : 'text-[#14231C]/80 hover:bg-[#F3EBDD] hover:text-[#14231C]'
              }`}
            >
              <span className="text-base">📊</span>
              <span>Overview</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('new-product')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-[12px] text-xs font-mono font-semibold transition-all text-left whitespace-nowrap cursor-pointer ${
                activeTab === 'new-product'
                  ? 'bg-[#14231C] text-[#F3EBDD] shadow-[2px_2px_0_#E8502B]'
                  : 'text-[#14231C]/80 hover:bg-[#F3EBDD] hover:text-[#14231C]'
              }`}
            >
              <span className="text-base">➕</span>
              <span>New Ware</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-[12px] text-xs font-mono font-semibold transition-all text-left whitespace-nowrap cursor-pointer ${
                activeTab === 'inventory'
                  ? 'bg-[#14231C] text-[#F3EBDD] shadow-[2px_2px_0_#E8502B]'
                  : 'text-[#14231C]/80 hover:bg-[#F3EBDD] hover:text-[#14231C]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">📦</span>
                <span>Inventory</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#E8502B]/20 text-[#E8502B]">
                {sellerProducts.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-[12px] text-xs font-mono font-semibold transition-all text-left whitespace-nowrap cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-[#14231C] text-[#F3EBDD] shadow-[2px_2px_0_#E8502B]'
                  : 'text-[#14231C]/80 hover:bg-[#F3EBDD] hover:text-[#14231C]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">📬</span>
                <span>Fulfill Orders</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#286345]/20 text-[#286345]">
                {sellerOrders.length}
              </span>
            </button>

            <div className="hidden lg:block pt-3 mt-2 border-t border-[#14231C]/15 px-2">
              <span className="font-label-mono text-[9px] text-[#14231C]/50 uppercase block mb-1">
                PUBLIC STORE
              </span>
              <Link
                to="/shop"
                className="font-mono text-[11px] text-[#E8502B] hover:underline flex items-center gap-1 font-semibold"
              >
                <span>View Catalog</span>
                <span>→</span>
              </Link>
            </div>
          </nav>
        </aside>

        {/* MAIN SHEET ON PAPER BACKGROUND */}
        <main className="flex-1 w-full space-y-8">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* KPI STICKERS WITH COUNT-UP ANIMATION */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* 1. Revenue Sticker */}
                <div className="bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[16px] p-5 shadow-[3px_3px_0_#14231C] flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-label-mono text-[10px] text-[#14231C]/60 uppercase">
                      SETTLED REVENUE
                    </span>
                    <span className="text-sm">💰</span>
                  </div>
                  <div className="font-mono font-bold text-2xl sm:text-3xl text-[#14231C]">
                    <CountUp value={totalRevenue} prefix="₹" duration={1200} />
                  </div>
                  <span className="font-label-mono text-[9px] text-[#286345] font-semibold mt-1">
                    ↑ 18.4% from last week
                  </span>
                </div>

                {/* 2. Orders Sticker */}
                <div className="bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[16px] p-5 shadow-[3px_3px_0_#14231C] flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-label-mono text-[10px] text-[#14231C]/60 uppercase">
                      DISPATCH MANIFESTS
                    </span>
                    <span className="text-sm">📋</span>
                  </div>
                  <div className="font-mono font-bold text-2xl sm:text-3xl text-[#14231C]">
                    <CountUp value={totalOrdersCount} suffix=" orders" duration={1000} />
                  </div>
                  <span className="font-label-mono text-[9px] text-[#14231C]/60 mt-1">
                    Speed Post railway synced
                  </span>
                </div>

                {/* 3. Units Sold */}
                <div className="bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[16px] p-5 shadow-[3px_3px_0_#14231C] flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-label-mono text-[10px] text-[#14231C]/60 uppercase">
                      UNITS PACKED
                    </span>
                    <span className="text-sm">📦</span>
                  </div>
                  <div className="font-mono font-bold text-2xl sm:text-3xl text-[#14231C]">
                    <CountUp value={totalUnitsSold} suffix=" units" duration={1100} />
                  </div>
                  <span className="font-label-mono text-[9px] text-[#286345] font-semibold mt-1">
                    All sealed in wax parcel
                  </span>
                </div>

                {/* 4. Low Stock */}
                <div className="bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[16px] p-5 shadow-[3px_3px_0_#14231C] flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-label-mono text-[10px] text-[#14231C]/60 uppercase">
                      LOW STOCK WARES
                    </span>
                    <span className="text-sm">⚠️</span>
                  </div>
                  <div className={`font-mono font-bold text-2xl sm:text-3xl ${lowStockProducts.length > 0 ? 'text-[#E8502B]' : 'text-[#286345]'}`}>
                    <CountUp value={lowStockProducts.length} suffix=" items" duration={800} />
                  </div>
                  <span className="font-label-mono text-[9px] text-[#14231C]/60 mt-1">
                    {lowStockProducts.length > 0 ? 'Replenish bench inventory' : 'All stocks healthy'}
                  </span>
                </div>
              </div>

              {/* WEEKLY SALES AREA CHART (RECHARTS) IN INK / TOMATO */}
              <div className="bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[20px] p-6 shadow-[3px_3px_0_#14231C] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#14231C]/20 pb-3">
                  <div>
                    <span className="font-label-mono text-[10px] text-[#14231C]/60 uppercase">
                      POSTAL DISPATCH METRICS
                    </span>
                    <h2 className="font-fraunces text-xl font-semibold text-[#14231C]">
                      Weekly Dispatch Ledger (INR)
                    </h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs font-mono">
                      <span className="w-3 h-3 rounded-full bg-[#E8502B] border border-[#14231C]" />
                      <span>Sales Volume</span>
                    </div>
                  </div>
                </div>

                <div className="h-64 sm:h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={WEEKLY_SALES_DATA}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#E8502B" stopOpacity={0.45} />
                          <stop offset="95%" stopColor="#14231C" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="day"
                        stroke="#14231C"
                        opacity={0.6}
                        tick={{ fontFamily: 'monospace', fontSize: 11 }}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#14231C"
                        opacity={0.6}
                        tick={{ fontFamily: 'monospace', fontSize: 10 }}
                        tickLine={false}
                        tickFormatter={(val) => `₹${val / 1000}k`}
                      />
                      <Tooltip content={<CustomChartTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="sales"
                        stroke="#E8502B"
                        strokeWidth={2.5}
                        fill="url(#salesGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* RECENT ORDERS SNIPPET */}
              <div className="bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[20px] p-6 shadow-[3px_3px_0_#14231C] space-y-4">
                <div className="flex items-center justify-between border-b border-[#14231C]/20 pb-3">
                  <h2 className="font-fraunces text-xl font-semibold text-[#14231C]">
                    Pending Consignments to Pack
                  </h2>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setActiveTab('orders')}
                  >
                    View All Dispatches →
                  </Button>
                </div>

                {sellerOrders.length === 0 ? (
                  <p className="text-xs text-[#14231C]/70 font-mono py-4 text-center">
                    No active consignments pending packaging.
                  </p>
                ) : (
                  <div className="divide-y divide-[#14231C]/15">
                    {sellerOrders.slice(0, 3).map((ord) => (
                      <div
                        key={ord.id}
                        className="py-3 flex flex-wrap items-center justify-between gap-4 font-mono text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/orders/${ord.id}`}
                              className="font-bold text-sm text-[#14231C] hover:text-[#E8502B] underline"
                            >
                              {ord.id}
                            </Link>
                            <span className="font-label-mono text-[9px] uppercase px-2 py-0.5 rounded border border-current font-bold text-[#286345] bg-[#286345]/10">
                              {ord.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-[#14231C]/60 mt-0.5">
                            Destined for {ord.shippingAddress.city}, {ord.shippingAddress.state} · {formatDate(ord.createdAt)}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-bold text-sm text-[#14231C]">
                            {formatINR(ord.total)}
                          </span>
                          {ord.status !== 'delivered' && ord.status !== 'cancelled' && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleAdvanceOrder(ord.id)}
                            >
                              {getStatusButtonLabel(ord.status)}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: NEW PRODUCT FORM WITH LIVE PREVIEW */}
          {activeTab === 'new-product' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
              {/* LEFT / FORM: 7 COLS */}
              <div className="xl:col-span-7 bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[20px] p-6 sm:p-7 shadow-[3px_3px_0_#14231C] space-y-6">
                <div className="border-b border-[#14231C]/20 pb-3">
                  <span className="font-label-mono text-[10px] text-[#14231C]/60 uppercase">
                    GUILD PRODUCTION FORM
                  </span>
                  <h2 className="font-fraunces text-2xl font-semibold text-[#14231C]">
                    Stamp a New Ware
                  </h2>
                  <p className="text-xs text-[#14231C]/75 font-sans mt-0.5">
                    Describe your ware below. The live postal card on the right renders updates in real time.
                  </p>
                </div>

                <form onSubmit={handleCreateProduct} className="space-y-4">
                  {/* Title & Brand */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-label-mono text-[10px] uppercase text-[#14231C]/80 block">
                        WARE NAME *
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Turned Brass Wax Seal"
                        className="w-full bg-[#F3EBDD] border-[1.5px] border-[#14231C] rounded-[10px] px-3 py-2 text-xs font-mono text-[#14231C] focus:outline-none focus:ring-1 focus:ring-[#E8502B]"
                      />
                      {formErrors.name && (
                        <p className="text-[10px] text-[#E8502B] font-mono">{formErrors.name}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="font-label-mono text-[10px] uppercase text-[#14231C]/80 block">
                        ARTISAN GUILD / BRAND
                      </label>
                      <input
                        type="text"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        placeholder="e.g. Oiled Oak Studio"
                        className="w-full bg-[#F3EBDD] border-[1.5px] border-[#14231C] rounded-[10px] px-3 py-2 text-xs font-mono text-[#14231C] focus:outline-none focus:ring-1 focus:ring-[#E8502B]"
                      />
                    </div>
                  </div>

                  {/* Category & Stock */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-label-mono text-[10px] uppercase text-[#14231C]/80 block">
                        CATALOG WARD
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as any)}
                        className="w-full bg-[#F3EBDD] border-[1.5px] border-[#14231C] rounded-[10px] px-3 py-2 text-xs font-mono text-[#14231C] focus:outline-none focus:ring-1 focus:ring-[#E8502B]"
                      >
                        <option value="tech">Tech & Acoustics</option>
                        <option value="home">Home & Hearth</option>
                        <option value="style">Style & Parchment</option>
                        <option value="beauty">Apothecary & Scents</option>
                        <option value="books">Folios & Editions</option>
                        <option value="play">Play & Brass Toys</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-label-mono text-[10px] uppercase text-[#14231C]/80 block">
                        INITIAL STOCK UNITS *
                      </label>
                      <input
                        type="number"
                        value={stock}
                        onChange={(e) => setStock(e.target.value)}
                        min="0"
                        className="w-full bg-[#F3EBDD] border-[1.5px] border-[#14231C] rounded-[10px] px-3 py-2 text-xs font-mono text-[#14231C] focus:outline-none focus:ring-1 focus:ring-[#E8502B]"
                      />
                      {formErrors.stock && (
                        <p className="text-[10px] text-[#E8502B] font-mono">{formErrors.stock}</p>
                      )}
                    </div>
                  </div>

                  {/* Price & MRP */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-label-mono text-[10px] uppercase text-[#14231C]/80 block">
                        SELLING PRICE (₹) *
                      </label>
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        min="1"
                        className="w-full bg-[#F3EBDD] border-[1.5px] border-[#14231C] rounded-[10px] px-3 py-2 text-xs font-mono font-bold text-[#14231C] focus:outline-none focus:ring-1 focus:ring-[#E8502B]"
                      />
                      {formErrors.price && (
                        <p className="text-[10px] text-[#E8502B] font-mono">{formErrors.price}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="font-label-mono text-[10px] uppercase text-[#14231C]/80 block">
                        PRINTED MRP (₹)
                      </label>
                      <input
                        type="number"
                        value={mrp}
                        onChange={(e) => setMrp(e.target.value)}
                        min="1"
                        className="w-full bg-[#F3EBDD] border-[1.5px] border-[#14231C] rounded-[10px] px-3 py-2 text-xs font-mono text-[#14231C] focus:outline-none focus:ring-1 focus:ring-[#E8502B]"
                      />
                      {formErrors.mrp && (
                        <p className="text-[10px] text-[#E8502B] font-mono">{formErrors.mrp}</p>
                      )}
                    </div>
                  </div>

                  {/* Short Description */}
                  <div className="space-y-1">
                    <label className="font-label-mono text-[10px] uppercase text-[#14231C]/80 block">
                      DESPATCH NOTE / DESCRIPTION
                    </label>
                    <textarea
                      rows={2}
                      value={shortDesc}
                      onChange={(e) => setShortDesc(e.target.value)}
                      placeholder="Hand-turned from solid brass stock, wax-stamped with postal emblem..."
                      className="w-full bg-[#F3EBDD] border-[1.5px] border-[#14231C] rounded-[10px] p-3 text-xs font-sans text-[#14231C] focus:outline-none focus:ring-1 focus:ring-[#E8502B]"
                    />
                  </div>

                  {/* Tags */}
                  <div className="space-y-1">
                    <label className="font-label-mono text-[10px] uppercase text-[#14231C]/80 block">
                      SEARCH TAGS (COMMA SEPARATED)
                    </label>
                    <input
                      type="text"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      placeholder="brass, desk, analog, postal"
                      className="w-full bg-[#F3EBDD] border-[1.5px] border-[#14231C] rounded-[10px] px-3 py-2 text-xs font-mono text-[#14231C] focus:outline-none focus:ring-1 focus:ring-[#E8502B]"
                    />
                  </div>

                  {/* EMOJI PICKER GRID */}
                  <div className="space-y-1.5 pt-1">
                    <label className="font-label-mono text-[10px] uppercase text-[#14231C]/80 block">
                      PRIMARY STAMP ICON: <span className="font-mono font-bold text-sm">{emoji}</span>
                    </label>
                    <div className="flex flex-wrap gap-1.5 p-2 bg-[#F3EBDD] border-[1.5px] border-[#14231C] rounded-[10px]">
                      {EMOJI_OPTIONS.map((em) => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => setEmoji(em)}
                          className={`w-8 h-8 rounded-[6px] flex items-center justify-center text-base transition-transform cursor-pointer ${
                            emoji === em
                              ? 'bg-[#14231C] text-white scale-110 shadow-[1px_1px_0_#E8502B]'
                              : 'hover:bg-[#EADFCB] hover:scale-105'
                          }`}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* BACKDROP COLOUR PICKER */}
                  <div className="space-y-1.5 pt-1">
                    <label className="font-label-mono text-[10px] uppercase text-[#14231C]/80 block">
                      BACKGROUND PALETTE: <span className="font-mono font-bold">{activeColorObj.label}</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {COLOR_OPTIONS.map((col) => (
                        <button
                          key={col.token}
                          type="button"
                          onClick={() => setBackdropColor(col.token)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] border-[1.5px] text-xs font-mono transition-all cursor-pointer ${
                            backdropColor === col.token
                              ? 'border-[#14231C] ring-2 ring-[#E8502B] font-bold'
                              : 'border-[#14231C]/40 opacity-80 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: col.hex }}
                        >
                          <span className="w-2.5 h-2.5 rounded-full border border-[#14231C]" style={{ backgroundColor: col.hex }} />
                          <span className="text-[#14231C]">{col.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* PATTERN PICKER */}
                  <div className="space-y-1.5 pt-1">
                    <label className="font-label-mono text-[10px] uppercase text-[#14231C]/80 block">
                      PERFORATION PATTERN
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {PATTERN_OPTIONS.map((pat) => (
                        <button
                          key={pat.pattern}
                          type="button"
                          onClick={() => setPattern(pat.pattern)}
                          className={`p-2 rounded-[8px] border-[1.5px] text-[11px] font-mono text-center transition-all cursor-pointer ${
                            pattern === pat.pattern
                              ? 'bg-[#14231C] text-[#F3EBDD] border-[#14231C] font-bold shadow-[2px_2px_0_#E8502B]'
                              : 'bg-[#F3EBDD] border-[#14231C]/40 text-[#14231C] hover:border-[#14231C]'
                          }`}
                        >
                          {pat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-3">
                    <Button variant="primary" size="lg" type="submit" className="w-full">
                      Stamp &amp; Publish Ware to Shop
                    </Button>
                  </div>
                </form>
              </div>

              {/* RIGHT / LIVE PREVIEW: 5 COLS */}
              <div className="xl:col-span-5 sticky top-24 space-y-4">
                <div className="bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[20px] p-5 shadow-[3px_3px_0_#14231C] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#14231C]/20 pb-2">
                    <span className="font-label-mono text-[10px] text-[#14231C]/60 uppercase">
                      LIVE SHOP CARD PREVIEW
                    </span>
                    <span className="font-mono text-[10px] text-[#286345] font-bold animate-pulse">
                      ● Syncing Live
                    </span>
                  </div>

                  {/* PREVIEW CARD */}
                  <div className="bg-[#F3EBDD] border-[1.5px] border-[#14231C] rounded-[18px] p-4 shadow-[2px_2px_0_#14231C] space-y-3">
                    {/* Visual stage */}
                    <div
                      className="w-full h-44 rounded-[12px] border-[1.5px] border-[#14231C] flex items-center justify-center relative overflow-hidden"
                      style={{ backgroundColor: activeColorObj.hex }}
                    >
                      <Sticker
                        emoji={emoji}
                        color={backdropColor}
                        size="xl"
                        rotation={-2}
                      />
                      <span className="absolute top-2 left-2 font-label-mono text-[9px] px-1.5 py-0.5 rounded bg-[#F3EBDD] border border-[#14231C] uppercase font-bold text-[#14231C]">
                        {category}
                      </span>
                      <span className="absolute top-2 right-2 font-label-mono text-[9px] px-1.5 py-0.5 rounded bg-[#F3EBDD] border border-[#14231C] uppercase font-bold text-[#286345]">
                        {stock} in stock
                      </span>
                    </div>

                    {/* Metadata */}
                    <div className="space-y-1">
                      <span className="font-label-mono text-[10px] text-[#14231C]/60 uppercase block">
                        {brand || 'Artisan Workshop'} · {category.toUpperCase()}
                      </span>
                      <h3 className="font-fraunces font-semibold text-lg text-[#14231C] leading-snug">
                        {name || 'Untiled Artisan Ware'}
                      </h3>
                      <p className="text-xs text-[#14231C]/75 font-sans line-clamp-2">
                        {shortDesc || 'A freshly crafted postal edition fashioned for the discerning connoisseur.'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#14231C]/15 flex items-center justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono font-bold text-lg text-[#14231C]">
                          {formatINR(Number(price) || 0)}
                        </span>
                        {Number(mrp) > Number(price) && (
                          <span className="font-mono text-xs text-[#14231C]/50 line-through">
                            {formatINR(Number(mrp) || 0)}
                          </span>
                        )}
                      </div>
                      <Stamp text="NEW WARE" variant="saffron" size="sm" rotation={-3} />
                    </div>
                  </div>

                  <p className="font-mono text-[10px] text-[#14231C]/60 text-center">
                    Submitting this form immediately adds the ware into the shop catalog and recommendation graphs.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INVENTORY TABLE */}
          {activeTab === 'inventory' && (
            <div className="bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[20px] p-6 shadow-[3px_3px_0_#14231C] space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#14231C]/20 pb-4">
                <div>
                  <span className="font-label-mono text-[10px] text-[#14231C]/60 uppercase">
                    WORKBENCH STOCK MANIFEST
                  </span>
                  <h2 className="font-fraunces text-2xl font-semibold text-[#14231C]">
                    Inventory Table ({sellerProducts.length} wares)
                  </h2>
                  <p className="text-xs text-[#14231C]/75 font-sans mt-0.5">
                    Click stock or price values to edit inline. Changes update the catalog instantly.
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setActiveTab('new-product')}
                >
                  ➕ Stamp New Ware
                </Button>
              </div>

              {sellerProducts.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <span className="text-4xl block">📦</span>
                  <p className="font-fraunces font-semibold text-base text-[#14231C]">
                    No wares found for this workbench
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setActiveTab('new-product')}
                  >
                    Add Your First Ware
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs border-collapse">
                    <thead>
                      <tr className="border-b-[1.5px] border-[#14231C] text-[10px] text-[#14231C]/70 font-label-mono uppercase">
                        <th className="py-3 px-2">Ware</th>
                        <th className="py-3 px-2">Price</th>
                        <th className="py-3 px-2">Stock Units</th>
                        <th className="py-3 px-2">Status</th>
                        <th className="py-3 px-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#14231C]/15">
                      {sellerProducts.map((p) => {
                        const isLow = p.stock > 0 && p.stock <= 3;
                        const isOut = p.stock === 0;

                        return (
                          <tr key={p.id} className="hover:bg-[#F3EBDD]/60 transition-colors">
                            {/* Product Info */}
                            <td className="py-3 px-2 min-w-[200px]">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-10 h-10 rounded-[8px] border-[1.5px] border-[#14231C] flex items-center justify-center text-lg shrink-0"
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
                                    ID: {p.id} · {p.category.toUpperCase()}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Inline Editable Price */}
                            <td className="py-3 px-2">
                              {editingPriceId === p.id ? (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="number"
                                    value={tempPriceValue}
                                    onChange={(e) => setTempPriceValue(Number(e.target.value))}
                                    className="w-20 bg-[#F3EBDD] border border-[#14231C] px-1.5 py-0.5 rounded text-xs font-mono font-bold"
                                    min="1"
                                    autoFocus
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSavePrice(p.id)}
                                    className="px-2 py-0.5 rounded bg-[#286345] text-white font-bold hover:bg-[#14231C] cursor-pointer"
                                  >
                                    ✓
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingPriceId(null)}
                                    className="px-1.5 py-0.5 rounded border border-[#14231C]/40 text-[#14231C]/70 cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <div
                                  onClick={() => handleStartPriceEdit(p)}
                                  className="flex items-center gap-1.5 cursor-pointer group"
                                  title="Click to edit price"
                                >
                                  <span className="font-bold text-sm text-[#14231C]">
                                    {formatINR(p.price)}
                                  </span>
                                  <span className="text-[10px] text-[#14231C]/40 group-hover:text-[#E8502B]">
                                    ✏️
                                  </span>
                                </div>
                              )}
                            </td>

                            {/* Inline Editable Stock & Low Stock Flag */}
                            <td className="py-3 px-2">
                              {editingStockId === p.id ? (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="number"
                                    value={tempStockValue}
                                    onChange={(e) => setTempStockValue(Number(e.target.value))}
                                    className="w-16 bg-[#F3EBDD] border border-[#14231C] px-1.5 py-0.5 rounded text-xs font-mono"
                                    min="0"
                                    autoFocus
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSaveStock(p.id)}
                                    className="px-2 py-0.5 rounded bg-[#286345] text-white font-bold hover:bg-[#14231C] cursor-pointer"
                                  >
                                    ✓
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingStockId(null)}
                                    className="px-1.5 py-0.5 rounded border border-[#14231C]/40 text-[#14231C]/70 cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <div
                                    onClick={() => handleStartStockEdit(p)}
                                    className="cursor-pointer group flex items-center gap-1"
                                    title="Click to edit stock units"
                                  >
                                    <span className="font-bold text-xs">{p.stock} units</span>
                                    <span className="text-[10px] text-[#14231C]/40 group-hover:text-[#E8502B]">
                                      ✏️
                                    </span>
                                  </div>

                                  {isOut && (
                                    <span className="font-label-mono text-[9px] px-1.5 py-0.5 rounded border border-[#E8502B] text-[#E8502B] bg-[#E8502B]/10 font-bold">
                                      OUT OF STOCK
                                    </span>
                                  )}
                                  {isLow && (
                                    <span className="font-label-mono text-[9px] px-1.5 py-0.5 rounded border border-[#B07308] text-[#B07308] bg-[#F4B63F]/20 font-bold">
                                      LOW STOCK
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* Visibility Status */}
                            <td className="py-3 px-2">
                              <span
                                className={`font-label-mono text-[9px] px-2 py-0.5 rounded border font-bold uppercase ${
                                  p.hidden
                                    ? 'border-[#E8502B]/60 text-[#E8502B] bg-[#E8502B]/10'
                                    : 'border-[#286345]/60 text-[#286345] bg-[#286345]/10'
                                }`}
                              >
                                {p.hidden ? 'Hidden' : 'Live in Shop'}
                              </span>
                            </td>

                            {/* Actions: Hide/Unhide, Delete */}
                            <td className="py-3 px-2 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    toggleProductHidden(p.id);
                                    addToast({
                                      title: p.hidden ? 'Ware Visible' : 'Ware Hidden',
                                      message: p.hidden
                                        ? `${p.name} is now listed in shop`
                                        : `${p.name} hidden from catalog`,
                                      variant: p.hidden ? 'mint' : 'wax',
                                    });
                                  }}
                                  className="font-label-mono text-[10px] px-2 py-1 rounded border border-[#14231C] bg-[#F3EBDD] hover:bg-[#14231C] hover:text-[#F3EBDD] transition-colors cursor-pointer"
                                >
                                  {p.hidden ? 'Unhide' : 'Hide'}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setDeleteModalProductId(p.id)}
                                  className="font-label-mono text-[10px] px-2 py-1 rounded border border-[#E8502B] text-[#E8502B] hover:bg-[#E8502B] hover:text-white transition-colors cursor-pointer"
                                  title="Delete ware"
                                >
                                  Retire
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ORDERS TO FULFIL */}
          {activeTab === 'orders' && (
            <div className="bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[20px] p-6 shadow-[3px_3px_0_#14231C] space-y-5">
              <div className="border-b border-[#14231C]/20 pb-4">
                <span className="font-label-mono text-[10px] text-[#14231C]/60 uppercase">
                  CONSIGNMENT FULFILLMENT BAY
                </span>
                <h2 className="font-fraunces text-2xl font-semibold text-[#14231C]">
                  Orders to Fulfil ({sellerOrders.length})
                </h2>
                <p className="text-xs text-[#14231C]/75 font-sans mt-0.5">
                  Pack, stamp, and advance customer consignments. Status changes reflect on the recipient tracking route live.
                </p>
              </div>

              {sellerOrders.length === 0 ? (
                <div className="py-16 text-center space-y-2">
                  <span className="text-4xl block">📬</span>
                  <p className="font-fraunces font-semibold text-base text-[#14231C]">
                    All consignments dispatched
                  </p>
                  <p className="text-xs text-[#14231C]/60 font-mono">
                    New buyer orders will appear here for packaging and booking on the railway.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sellerOrders.map((ord) => {
                    const isCompleted = ord.status === 'delivered';
                    const isCancelled = ord.status === 'cancelled';

                    return (
                      <div
                        key={ord.id}
                        className="p-5 rounded-[16px] border-[1.5px] border-[#14231C] bg-[#F3EBDD] shadow-[2px_2px_0_#14231C] space-y-4 font-mono text-xs"
                      >
                        {/* Header */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#14231C]/15 pb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <Link
                                to={`/orders/${ord.id}`}
                                className="font-bold text-base text-[#14231C] hover:text-[#E8502B] underline"
                              >
                                {ord.id}
                              </Link>
                              <span className="font-label-mono text-[9px] uppercase px-2 py-0.5 rounded border border-current font-bold text-[#286345] bg-[#286345]/10">
                                {ord.status.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-[10px] text-[#14231C]/60 mt-0.5">
                              Booked {formatDate(ord.createdAt)} · Tracking No: {ord.trackingNumber}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-bold text-base text-[#14231C]">
                              {formatINR(ord.total)}
                            </span>

                            {!isCompleted && !isCancelled && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleAdvanceOrder(ord.id)}
                              >
                                {getStatusButtonLabel(ord.status)}
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Items in order */}
                        <div className="space-y-2">
                          <span className="font-label-mono text-[9px] text-[#14231C]/60 uppercase block">
                            ITEMS TO PACK:
                          </span>
                          <div className="divide-y divide-[#14231C]/10">
                            {ord.items.map((item, idx) => (
                              <div
                                key={idx}
                                className="py-2 flex items-center justify-between gap-2 text-xs"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-base">{item.emoji || '📦'}</span>
                                  <div>
                                    <span className="font-fraunces font-semibold text-[#14231C]">
                                      {item.name}
                                    </span>
                                    {item.variant && (
                                      <span className="text-[10px] text-[#14231C]/60 ml-2">
                                        ({item.variant})
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-4">
                                  <span className="font-bold text-[#14231C]">
                                    Qty: {item.quantity}
                                  </span>
                                  <span className="text-xs text-[#14231C]/75">
                                    {formatINR(item.price * item.quantity)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Delivery Address */}
                        <div className="pt-2 border-t border-[#14231C]/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#14231C]/70">
                          <div>
                            Recipient: <strong className="text-[#14231C]">{ord.shippingAddress.fullName}</strong> ({ord.shippingAddress.phone}) · {ord.shippingAddress.line1}, {ord.shippingAddress.city}, {ord.shippingAddress.state} - {ord.shippingAddress.pincode}
                          </div>
                          <div>Speed: {ord.deliverySpeed === 'express' ? '⚡ Express Speed Post' : 'Standard Mail'}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
