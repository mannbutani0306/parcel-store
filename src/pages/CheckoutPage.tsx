import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Button,
  Input,
  Receipt,
  Perforation,
  Stamp,
  ScribbleUnderline,
  HandTick,
  HandArrow,
  Sticker,
} from '../components/ui';
import { useParcelStore } from '../store';
import { useToastStore } from '../store/toastStore';
import { formatINR } from '../lib/format';
import {
  isValidIndianPhone,
  isValidPinCode,
  isValidCardLuhn,
} from '../lib/validators';

type CheckoutStage = 'address' | 'delivery' | 'payment';

interface SavedAddress {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
}

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    cartItems,
    currentUser,
    getCartSubtotal,
    getDiscountAmount,
    appliedCoupon,
    placeOrder,
  } = useParcelStore();

  const { addToast } = useToastStore();

  // Three-stage flow
  const [currentStage, setCurrentStage] = useState<CheckoutStage>('address');

  // Saved Addresses list
  const initialSavedAddresses = useMemo<SavedAddress[]>(() => {
    const userCity = currentUser?.address?.city || 'Mumbai';
    const userState = currentUser?.address?.state || 'Maharashtra';
    const userPin = currentUser?.address?.pincode || '400050';
    const userLine = currentUser?.address?.line1 || 'Flat 4B, Gulmohar Apartments, Bandra West';
    const userName = currentUser?.name || 'Aarav Mehta';
    const userPhone = currentUser?.phone || '9876543210';

    return [
      {
        id: 'addr-primary',
        label: 'Postal Residence (Primary)',
        fullName: userName,
        phone: userPhone,
        line1: userLine,
        city: userCity,
        state: userState,
        pincode: userPin,
      },
      {
        id: 'addr-studio',
        label: 'Artisan Workshop / Guild',
        fullName: userName,
        phone: userPhone,
        line1: '14 Post Office Lane, Heritage Quarter',
        city: userCity,
        state: userState,
        pincode: '400001',
      },
    ];
  }, [currentUser]);

  const [selectedAddressId, setSelectedAddressId] = useState<string>('addr-primary');
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);

  // New Address Form Fields
  const [newFullName, setNewFullName] = useState(currentUser?.name || '');
  const [newPhone, setNewPhone] = useState(currentUser?.phone || '');
  const [newLine1, setNewLine1] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('');
  const [newPincode, setNewPincode] = useState('');
  const [addressErrors, setAddressErrors] = useState<{ [key: string]: string }>({});

  // Stage 2: Delivery Speed
  const [deliverySpeed, setDeliverySpeed] = useState<'standard' | 'express'>('standard');

  // Stage 3: Payment
  const [paymentTab, setPaymentTab] = useState<'card' | 'upi' | 'cod'>('card');
  const [cardNumber, setCardNumber] = useState('4532 0158 9214 4022');
  const [cardHolder, setCardHolder] = useState(currentUser?.name || 'Aarav Mehta');
  const [cardExpiry, setCardExpiry] = useState('11/28');
  const [cardCvv, setCardCvv] = useState('842');
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [paymentErrors, setPaymentErrors] = useState<{ [key: string]: string }>({});

  // UPI State
  const [upiId, setUpiId] = useState('recipient@okaxis');

  // Order Placement Process States (7C)
  // 'idle' | 'processing' | 'success' | 'failure'
  const [orderProcessState, setOrderProcessState] = useState<
    'idle' | 'processing' | 'success' | 'failure'
  >('idle');
  const [placedOrderId, setPlacedOrderId] = useState<string>('');
  const [failureReason, setFailureReason] = useState<string>('');
  const [stepStockUpdated, setStepStockUpdated] = useState(false);
  const [stepCourierNotified, setStepCourierNotified] = useState(false);

  // Financials Calculation
  const subtotal = getCartSubtotal();
  const discount = getDiscountAmount();
  const isFreeShip = appliedCoupon?.type === 'shipping' || subtotal >= 999;
  const standardFee = isFreeShip ? 0 : 80;
  const expressFee = isFreeShip ? 80 : 160;
  const activeShippingFee = deliverySpeed === 'express' ? expressFee : standardFee;
  const finalTotal = Math.max(0, subtotal - discount + activeShippingFee);
  const gstIncluded = Math.round((subtotal * 18) / 118);

  // Selected address object resolution
  const activeAddress = useMemo(() => {
    if (isAddingNewAddress) {
      return {
        fullName: newFullName,
        phone: newPhone,
        line1: newLine1,
        city: newCity,
        state: newState,
        pincode: newPincode,
      };
    }
    const found = initialSavedAddresses.find((a) => a.id === selectedAddressId);
    return (
      found || {
        fullName: currentUser?.name || 'Aarav Mehta',
        phone: currentUser?.phone || '9876543210',
        line1: currentUser?.address?.line1 || 'Flat 4B, Gulmohar Apartments',
        city: currentUser?.address?.city || 'Mumbai',
        state: currentUser?.address?.state || 'Maharashtra',
        pincode: currentUser?.address?.pincode || '400050',
      }
    );
  }, [
    isAddingNewAddress,
    selectedAddressId,
    initialSavedAddresses,
    newFullName,
    newPhone,
    newLine1,
    newCity,
    newState,
    newPincode,
    currentUser,
  ]);

  // Card formatting helpers
  const handleCardNumberChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 16);
    const formatted = digits.replace(/(.{4})/g, '$1 ').trim();
    setCardNumber(formatted);
  };

  const handleExpiryChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      setCardExpiry(`${digits.slice(0, 2)}/${digits.slice(2)}`);
    } else {
      setCardExpiry(digits);
    }
  };

  // Stage 1 Validation & Proceed
  const handleProceedToDelivery = () => {
    if (isAddingNewAddress) {
      const errs: { [key: string]: string } = {};
      if (!newFullName.trim()) errs.newFullName = 'Recipient full name is required';
      if (!newPhone.trim() || !isValidIndianPhone(newPhone)) {
        errs.newPhone = 'Valid 10-digit mobile number required (e.g. 9876543210)';
      }
      if (!newLine1.trim()) errs.newLine1 = 'Street and building line required';
      if (!newCity.trim()) errs.newCity = 'City required';
      if (!newState.trim()) errs.newState = 'State required';
      if (!newPincode.trim() || !isValidPinCode(newPincode)) {
        errs.newPincode = 'Valid 6-digit PIN code required';
      }

      setAddressErrors(errs);
      if (Object.keys(errs).length > 0) {
        addToast({
          title: 'Address Incomplete',
          message: 'Please resolve errors in the dispatch address form',
          variant: 'stamp',
        });
        return;
      }
    }
    setAddressErrors({});
    setCurrentStage('delivery');
  };

  // Stage 2 Proceed
  const handleProceedToPayment = () => {
    setCurrentStage('payment');
  };

  // Stage 3 / 7C: Place Order Execution
  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: { [key: string]: string } = {};

    const cleanCard = cardNumber.replace(/\s/g, '');

    if (paymentTab === 'card') {
      if (!cardHolder.trim()) errs.cardHolder = 'Cardholder name required';
      const isTestSimulationCard = cleanCard.endsWith('0000') || cleanCard.endsWith('4242');
      if (!cleanCard || cleanCard.length < 13 || (!isTestSimulationCard && !isValidCardLuhn(cleanCard))) {
        errs.cardNumber = 'Invalid card number (failed Luhn algorithm check)';
      }
      if (!cardExpiry || !/^\d{2}\/\d{2}$/.test(cardExpiry)) {
        errs.cardExpiry = 'Enter MM/YY';
      } else {
        const [mmStr, yyStr] = cardExpiry.split('/');
        const mm = parseInt(mmStr, 10);
        if (mm < 1 || mm > 12) errs.cardExpiry = 'Invalid month (01-12)';
      }
      if (!cardCvv || cardCvv.length < 3) errs.cardCvv = '3 or 4-digit CVV required';
    } else if (paymentTab === 'upi') {
      if (!upiId.includes('@') || upiId.length < 5) {
        errs.upiId = 'Valid UPI ID required (e.g. username@bank)';
      }
    }

    setPaymentErrors(errs);
    if (Object.keys(errs).length > 0) {
      addToast({
        title: 'Check Payment Slip',
        message: 'Please review highlighted payment details',
        variant: 'stamp',
      });
      return;
    }

    // Begin 7C: Processing screen (stamp pressing animation, 2s)
    setOrderProcessState('processing');

    const paymentLabel =
      paymentTab === 'upi'
        ? `UPI (${upiId})`
        : paymentTab === 'card'
          ? `Card (•••• ${cleanCard.slice(-4)})`
          : 'Cash on Delivery (COD)';

    // Simulated payment rule:
    // "a card ending 0000 FAILS, everything else succeeds."
    const isSimulatedFail = paymentTab === 'card' && cleanCard.endsWith('0000');

    setTimeout(() => {
      const res = placeOrder(
        activeAddress,
        paymentLabel,
        deliverySpeed,
        activeShippingFee,
        isSimulatedFail
      );

      if (res.success && res.orderId) {
        setPlacedOrderId(res.orderId);
        setOrderProcessState('success');

        // Confetti explosion!
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#E8502B', '#286345', '#F4B63F', '#2D668A'],
        });

        // Parallel steps run side by side with animated ticks
        setTimeout(() => setStepStockUpdated(true), 600);
        setTimeout(() => setStepCourierNotified(true), 1100);
      } else {
        setPlacedOrderId(res.orderId || 'PRCL-FAIL-IN');
        setFailureReason(
          res.error ||
            'Authorization declined for card ending 0000 (simulated failure). Your cart is kept safe.'
        );
        setOrderProcessState('failure');
      }
    }, 2000);
  };

  // Guest Access Guard
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center space-y-5 bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[22px] shadow-[4px_4px_0_#14231C] my-10">
        <Stamp text="IDENTIFICATION REQUIRED" variant="tomato" size="md" rotation={-3} />
        <h2 className="font-fraunces text-2xl font-semibold text-[#14231C]">
          Recipient Manifest Required
        </h2>
        <p className="text-xs text-[#14231C]/75 font-sans leading-relaxed">
          Postal regulations require a verified recipient profile before dispatching parcels. Your packed wares are preserved in your bag.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/login?redirect=/checkout')}
          >
            Sign in to Dispatch
          </Button>
          <Button variant="secondary" size="md" onClick={() => navigate('/cart')}>
            Back to Bag
          </Button>
        </div>
      </div>
    );
  }

  // Empty Bag Guard (unless currently in success/failure screen of an order)
  if (cartItems.length === 0 && orderProcessState === 'idle') {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center space-y-4">
        <span className="text-4xl block">📦</span>
        <h2 className="font-fraunces text-2xl font-semibold">Your bag is empty</h2>
        <p className="text-xs text-[#14231C]/70">Add items to your bag before checking out.</p>
        <Button variant="primary" size="sm" onClick={() => navigate('/shop')}>
          Return to Catalog
        </Button>
      </div>
    );
  }

  // =========================================================================
  // 7C. PROCESSING SCREEN (Stamp pressing animation, 2s)
  // =========================================================================
  if (orderProcessState === 'processing') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="relative bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[24px] p-8 sm:p-12 max-w-md w-full shadow-[6px_6px_0_#14231C] space-y-6 overflow-hidden">
          {/* Animated Stamp Pressing Effect */}
          <div className="py-4">
            <motion.div
              animate={{
                y: [-25, 0, -25],
                scale: [0.95, 1.05, 0.95],
                rotate: [-2, 2, -2],
              }}
              transition={{
                duration: 1.1,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="inline-block"
            >
              <div className="w-24 h-24 mx-auto rounded-full border-[2.5px] border-[#E8502B] bg-[#F3EBDD] flex items-center justify-center text-5xl shadow-[3px_3px_0_#E8502B]">
                📮
              </div>
            </motion.div>
          </div>

          <div className="space-y-2">
            <Stamp text="INKING POSTAL MANIFEST" variant="tomato" size="md" rotation={-1} />
            <h2 className="font-fraunces text-2xl font-bold text-[#14231C]">
              Authorizing Dispatch...
            </h2>
            <p className="text-xs text-[#14231C]/75 font-mono">
              Reserving artisan inventory · Registering tracking seal
            </p>
          </div>

          {/* Animated Progress Dots */}
          <div className="flex justify-center gap-2 pt-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E8502B] animate-bounce" />
            <span
              className="w-2.5 h-2.5 rounded-full bg-[#E8502B] animate-bounce"
              style={{ animationDelay: '0.2s' }}
            />
            <span
              className="w-2.5 h-2.5 rounded-full bg-[#E8502B] animate-bounce"
              style={{ animationDelay: '0.4s' }}
            />
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 7C. SUCCESS SCREEN: Giant "ORDER PLACED" stamp slams, emoji confetti, parallel steps
  // =========================================================================
  if (orderProcessState === 'success') {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="relative bg-[#EADFCB] border-[2px] border-[#14231C] rounded-[24px] p-6 sm:p-10 max-w-lg w-full shadow-[6px_6px_0_#14231C] space-y-6">
          {/* Giant Slamming ORDER PLACED Stamp */}
          <motion.div
            initial={{ scale: 3.2, opacity: 0, rotate: -14 }}
            animate={{ scale: 1, opacity: 1, rotate: -3 }}
            transition={{
              type: 'spring',
              stiffness: 450,
              damping: 18,
              mass: 1.2,
            }}
            className="inline-block py-2"
          >
            <div className="border-[3px] border-[#286345] px-6 py-2.5 rounded-[10px] bg-[#BCD9C4]/30 shadow-[3px_3px_0_#286345]">
              <span className="font-label-mono font-bold text-2xl sm:text-3xl tracking-widest text-[#286345] block">
                ★ ORDER PLACED ★
              </span>
              <span className="font-mono text-[10px] text-[#286345] tracking-tight block">
                GENERAL POST OFFICE · OFFICIAL DISPATCH REGISTRY
              </span>
            </div>
          </motion.div>

          {/* Order ID in mono */}
          <div className="space-y-1">
            <p className="font-label-mono text-xs text-[#14231C]/60 uppercase">
              REGISTERED PARCEL SLIP
            </p>
            <p className="font-mono font-bold text-2xl text-[#14231C] tracking-wider selection:bg-[#E8502B]">
              {placedOrderId}
            </p>
          </div>

          <p className="text-xs sm:text-sm text-[#14231C]/80 font-sans max-w-sm mx-auto leading-relaxed">
            Your parcel manifest has been logged. Our sorting clerks are applying jute bindings and wax seals.
          </p>

          {/* Parallel side-by-side verification steps */}
          <div className="grid grid-cols-2 gap-3 pt-2 text-left">
            {/* Step 1: Stock updated */}
            <div className="p-3.5 rounded-[12px] bg-[#F3EBDD] border-[1.5px] border-[#14231C] flex items-center gap-2.5 shadow-[2px_2px_0_#14231C]">
              <div
                className={`w-7 h-7 rounded-full border border-[#14231C] flex items-center justify-center shrink-0 transition-colors ${
                  stepStockUpdated ? 'bg-[#286345] text-white' : 'bg-transparent text-[#14231C]/40'
                }`}
              >
                {stepStockUpdated ? <HandTick size={14} /> : '1'}
              </div>
              <div className="min-w-0">
                <span className="font-label-mono font-bold text-xs block text-[#14231C] truncate">
                  Stock Updated
                </span>
                <span className="text-[10px] font-mono text-[#14231C]/65 block truncate">
                  Artisan bin locked
                </span>
              </div>
            </div>

            {/* Step 2: Courier notified */}
            <div className="p-3.5 rounded-[12px] bg-[#F3EBDD] border-[1.5px] border-[#14231C] flex items-center gap-2.5 shadow-[2px_2px_0_#14231C]">
              <div
                className={`w-7 h-7 rounded-full border border-[#14231C] flex items-center justify-center shrink-0 transition-colors ${
                  stepCourierNotified ? 'bg-[#286345] text-white' : 'bg-transparent text-[#14231C]/40'
                }`}
              >
                {stepCourierNotified ? <HandTick size={14} /> : '2'}
              </div>
              <div className="min-w-0">
                <span className="font-label-mono font-bold text-xs block text-[#14231C] truncate">
                  Courier Notified
                </span>
                <span className="text-[10px] font-mono text-[#14231C]/65 block truncate">
                  Speed Post dispatch
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 justify-center">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate(`/orders/${placedOrderId}`)}
            >
              Track Order Manifest →
            </Button>
            <Button variant="secondary" size="md" onClick={() => navigate('/shop')}>
              Keep Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 7C. FAILURE SCREEN: "PAYMENT FAILED" stamp, order marked Cancelled, stock restored, cart kept
  // =========================================================================
  if (orderProcessState === 'failure') {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="relative bg-[#EADFCB] border-[2px] border-[#14231C] rounded-[24px] p-6 sm:p-10 max-w-lg w-full shadow-[6px_6px_0_#14231C] space-y-6">
          {/* Giant Slamming PAYMENT FAILED Stamp */}
          <motion.div
            initial={{ scale: 3.2, opacity: 0, rotate: 12 }}
            animate={{ scale: 1, opacity: 1, rotate: 3 }}
            transition={{
              type: 'spring',
              stiffness: 450,
              damping: 18,
              mass: 1.2,
            }}
            className="inline-block py-2"
          >
            <div className="border-[3px] border-[#E8502B] px-6 py-2.5 rounded-[10px] bg-[#E8502B]/15 shadow-[3px_3px_0_#E8502B]">
              <span className="font-label-mono font-bold text-2xl sm:text-3xl tracking-widest text-[#E8502B] block">
                PAYMENT FAILED
              </span>
              <span className="font-mono text-[10px] text-[#E8502B] tracking-tight block">
                GATEWAY TRANSACTION DECLINED · SLIP CANCELLED
              </span>
            </div>
          </motion.div>

          <div className="space-y-1">
            <p className="font-label-mono text-xs text-[#14231C]/60 uppercase">
              CANCELLED MANIFEST REFERENCE
            </p>
            <p className="font-mono font-bold text-xl text-[#14231C]">{placedOrderId}</p>
          </div>

          <div className="p-4 rounded-[12px] bg-[#F3EBDD] border border-[#E8502B]/40 text-left space-y-1">
            <span className="font-label-mono text-xs font-bold text-[#E8502B] block">
              STATUS NOTICE:
            </span>
            <p className="text-xs font-mono text-[#14231C]/80 leading-relaxed">
              {failureReason}
            </p>
            <p className="text-[10px] font-mono text-[#286345] pt-1">
              ✓ Inventory restored · All items remain securely in your postal bag.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center">
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setOrderProcessState('idle');
                setCurrentStage('payment');
              }}
            >
              Retry Payment
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                setOrderProcessState('idle');
                setCurrentStage('payment');
                setPaymentTab('upi');
              }}
            >
              Change Payment Method
            </Button>
            <Button variant="secondary" size="md" onClick={() => navigate('/cart')}>
              Return to Bag
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // STANDARD CHECKOUT VIEW (7B): One page, three stages with ink progress rail
  // =========================================================================
  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
      {/* Header */}
      <div className="border-b-[1.5px] border-[#14231C] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <p className="font-label-mono text-xs text-[#14231C]/60">CENTRAL DISPATCH COUNTER</p>
          <h1 className="font-fraunces text-3xl sm:text-4xl font-semibold tracking-tight text-[#14231C]">
            Checkout <span className="font-fraunces-italic font-normal">Manifest</span>
          </h1>
          <div className="w-40 text-[#E8502B]">
            <ScribbleUnderline />
          </div>
        </div>
        <Link
          to="/cart"
          className="font-label-mono text-xs text-[#E8502B] hover:underline flex items-center gap-1 self-start sm:self-auto"
        >
          <HandArrow size={12} className="rotate-180" />
          <span>Back to Postal Bag</span>
        </Link>
      </div>

      {/* 7B. THREE STAGES WITH AN INK PROGRESS RAIL */}
      <div className="bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[16px] p-4 sm:p-5 shadow-[2px_2px_0_#14231C]">
        <div className="relative flex items-center justify-between max-w-xl mx-auto">
          {/* Continuous ink rail line */}
          <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-[2px] bg-[#14231C]/20 z-0" />
          <motion.div
            className="absolute left-6 top-1/2 -translate-y-1/2 h-[2px] bg-[#286345] z-0"
            initial={false}
            animate={{
              width:
                currentStage === 'address'
                  ? '0%'
                  : currentStage === 'delivery'
                    ? '50%'
                    : 'calc(100% - 48px)',
            }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />

          {/* Stage 1 Node */}
          <button
            type="button"
            onClick={() => setCurrentStage('address')}
            className="relative z-10 flex flex-col items-center gap-1.5 cursor-pointer group"
          >
            <div
              className={`w-9 h-9 rounded-full border-[1.5px] border-[#14231C] flex items-center justify-center font-mono text-xs font-bold transition-all shadow-[1px_1px_0_#14231C] ${
                currentStage === 'address'
                  ? 'bg-[#E8502B] text-white scale-110'
                  : 'bg-[#286345] text-white'
              }`}
            >
              {currentStage !== 'address' ? <HandTick size={14} /> : '1'}
            </div>
            <span
              className={`font-label-mono text-[11px] font-bold ${
                currentStage === 'address' ? 'text-[#E8502B]' : 'text-[#14231C]'
              }`}
            >
              1. Address
            </span>
          </button>

          {/* Stage 2 Node */}
          <button
            type="button"
            onClick={() => setCurrentStage('delivery')}
            className="relative z-10 flex flex-col items-center gap-1.5 cursor-pointer group"
          >
            <div
              className={`w-9 h-9 rounded-full border-[1.5px] border-[#14231C] flex items-center justify-center font-mono text-xs font-bold transition-all shadow-[1px_1px_0_#14231C] ${
                currentStage === 'delivery'
                  ? 'bg-[#E8502B] text-white scale-110'
                  : currentStage === 'payment'
                    ? 'bg-[#286345] text-white'
                    : 'bg-[#F3EBDD] text-[#14231C]'
              }`}
            >
              {currentStage === 'payment' ? <HandTick size={14} /> : '2'}
            </div>
            <span
              className={`font-label-mono text-[11px] font-bold ${
                currentStage === 'delivery' ? 'text-[#E8502B]' : 'text-[#14231C]'
              }`}
            >
              2. Delivery
            </span>
          </button>

          {/* Stage 3 Node */}
          <button
            type="button"
            onClick={() => {
              if (currentStage === 'delivery' || currentStage === 'payment') {
                setCurrentStage('payment');
              }
            }}
            className="relative z-10 flex flex-col items-center gap-1.5 cursor-pointer group"
          >
            <div
              className={`w-9 h-9 rounded-full border-[1.5px] border-[#14231C] flex items-center justify-center font-mono text-xs font-bold transition-all shadow-[1px_1px_0_#14231C] ${
                currentStage === 'payment'
                  ? 'bg-[#E8502B] text-white scale-110'
                  : 'bg-[#F3EBDD] text-[#14231C]'
              }`}
            >
              3
            </div>
            <span
              className={`font-label-mono text-[11px] font-bold ${
                currentStage === 'payment' ? 'text-[#E8502B]' : 'text-[#14231C]'
              }`}
            >
              3. Pay
            </span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Stage Form + Right Sticky Order-Summary Receipt */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: ACTIVE STAGE */}
        <div className="lg:col-span-7 space-y-6">
          {/* =========================================================================
              STAGE 1: ADDRESS
             ========================================================================= */}
          {currentStage === 'address' && (
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[18px] p-6 shadow-[3px_3px_0_#14231C] space-y-6"
            >
              <div className="flex items-center justify-between border-b border-[#14231C]/20 pb-3">
                <div>
                  <span className="font-label-mono text-xs text-[#14231C]/60 uppercase">
                    STAGE 01
                  </span>
                  <h2 className="font-fraunces text-xl font-semibold text-[#14231C]">
                    Recipient Address
                  </h2>
                </div>
                <Stamp text="INDIAN POST" variant="stamp-blue" size="sm" rotation={-2} />
              </div>

              {/* Saved Addresses as Selectable Tag Cards */}
              <div className="space-y-3">
                <span className="font-label-mono text-xs font-bold text-[#14231C] block">
                  SELECT REGISTERED DISPATCH TAG:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {initialSavedAddresses.map((addr) => {
                    const isSelected = !isAddingNewAddress && selectedAddressId === addr.id;
                    return (
                      <div
                        key={addr.id}
                        onClick={() => {
                          setSelectedAddressId(addr.id);
                          setIsAddingNewAddress(false);
                        }}
                        className={`p-4 rounded-[12px] border-[1.5px] cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#F3EBDD] border-[#E8502B] shadow-[3px_3px_0_#E8502B]'
                            : 'bg-[#EADFCB]/80 border-[#14231C]/40 hover:border-[#14231C] hover:bg-[#F3EBDD]/50'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-label-mono text-[10px] uppercase font-bold text-[#14231C]">
                              {addr.label}
                            </span>
                            {isSelected && (
                              <span className="w-2.5 h-2.5 rounded-full bg-[#E8502B]" />
                            )}
                          </div>
                          <p className="font-mono text-xs font-bold text-[#14231C]">
                            {addr.fullName}
                          </p>
                          <p className="font-mono text-xs text-[#14231C]/75 line-clamp-2 mt-0.5">
                            {addr.line1}
                          </p>
                          <p className="font-mono text-xs text-[#14231C]/75">
                            {addr.city}, {addr.state} — {addr.pincode}
                          </p>
                          <p className="font-mono text-[10px] text-[#14231C]/60 mt-1">
                            Phone: {addr.phone}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Option to toggle Add New Form */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingNewAddress(!isAddingNewAddress)}
                    className="font-label-mono text-xs text-[#E8502B] hover:underline cursor-pointer flex items-center gap-1.5"
                  >
                    <span>{isAddingNewAddress ? '✕ Use Saved Tag' : '+ Add New Dispatch Address'}</span>
                  </button>
                </div>
              </div>

              {/* Add New Address Form with Validation */}
              {isAddingNewAddress && (
                <div className="p-4 rounded-[12px] bg-[#F3EBDD] border-[1.5px] border-[#14231C] space-y-4">
                  <span className="font-label-mono text-xs font-bold text-[#14231C] block">
                    ENTER RECIPIENT PARTICULARS:
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Full Recipient Name"
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      error={addressErrors.newFullName}
                      required
                    />

                    <Input
                      label="Mobile Number (10 Digits)"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      error={addressErrors.newPhone}
                      placeholder="e.g. 9876543210"
                      required
                    />

                    <div className="sm:col-span-2">
                      <Input
                        label="Street Address / Building / Flat"
                        value={newLine1}
                        onChange={(e) => setNewLine1(e.target.value)}
                        error={addressErrors.newLine1}
                        placeholder="House/Apartment, Street name, Locality"
                        required
                      />
                    </div>

                    <Input
                      label="City / Town"
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      error={addressErrors.newCity}
                      required
                    />

                    <Input
                      label="State"
                      value={newState}
                      onChange={(e) => setNewState(e.target.value)}
                      error={addressErrors.newState}
                      required
                    />

                    <div className="sm:col-span-2">
                      <Input
                        label="Postal PIN Code (6 Digits)"
                        value={newPincode}
                        onChange={(e) => setNewPincode(e.target.value)}
                        error={addressErrors.newPincode}
                        placeholder="e.g. 400050"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-[#14231C]/20 flex justify-end">
                <Button variant="primary" size="md" onClick={handleProceedToDelivery}>
                  Continue to Delivery Speed →
                </Button>
              </div>
            </motion.div>
          )}

          {/* =========================================================================
              STAGE 2: DELIVERY SPEED
             ========================================================================= */}
          {currentStage === 'delivery' && (
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[18px] p-6 shadow-[3px_3px_0_#14231C] space-y-6"
            >
              <div className="flex items-center justify-between border-b border-[#14231C]/20 pb-3">
                <div>
                  <span className="font-label-mono text-xs text-[#14231C]/60 uppercase">
                    STAGE 02
                  </span>
                  <h2 className="font-fraunces text-xl font-semibold text-[#14231C]">
                    Delivery Speed &amp; Packaging
                  </h2>
                </div>
                <Stamp text="POSTAL SPEED" variant="mint" size="sm" rotation={1} />
              </div>

              <div className="space-y-4">
                {/* Standard Option */}
                <div
                  onClick={() => setDeliverySpeed('standard')}
                  className={`p-4 rounded-[14px] border-[1.5px] cursor-pointer transition-all flex items-start justify-between gap-4 ${
                    deliverySpeed === 'standard'
                      ? 'bg-[#F3EBDD] border-[#E8502B] shadow-[3px_3px_0_#E8502B]'
                      : 'bg-[#EADFCB]/80 border-[#14231C]/35 hover:border-[#14231C]'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="text-2xl mt-0.5">🚚</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-fraunces font-semibold text-base text-[#14231C]">
                          Standard Parcel Post
                        </span>
                        {isFreeShip && (
                          <span className="font-label-mono text-[9px] px-1.5 py-0.2 rounded bg-[#286345]/15 text-[#286345] font-bold">
                            FREE
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#14231C]/75 font-sans mt-0.5">
                        Surface postal transport via National Postal Rail network.
                      </p>
                      <p className="font-mono text-xs text-[#14231C]/80 mt-1">
                        Estimated arrival: <strong>3–5 working days</strong>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-sm text-[#14231C]">
                      {standardFee === 0 ? 'FREE' : formatINR(standardFee)}
                    </span>
                  </div>
                </div>

                {/* Express Speed Post Option */}
                <div
                  onClick={() => setDeliverySpeed('express')}
                  className={`p-4 rounded-[14px] border-[1.5px] cursor-pointer transition-all flex items-start justify-between gap-4 ${
                    deliverySpeed === 'express'
                      ? 'bg-[#F3EBDD] border-[#E8502B] shadow-[3px_3px_0_#E8502B]'
                      : 'bg-[#EADFCB]/80 border-[#14231C]/35 hover:border-[#14231C]'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="text-2xl mt-0.5">✈️</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-fraunces font-semibold text-base text-[#14231C]">
                          Speed Post (Airmail Priority)
                        </span>
                        <Stamp text="AIRMAIL" variant="saffron" size="sm" rotation={-2} />
                      </div>
                      <p className="text-xs text-[#14231C]/75 font-sans mt-0.5">
                        Air-routed priority bag with wax seal &amp; immediate sorting at airport depot.
                      </p>
                      <p className="font-mono text-xs text-[#E8502B] mt-1 font-bold">
                        Guaranteed arrival: <strong>1–2 working days</strong>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-sm text-[#14231C]">
                      {formatINR(expressFee)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#14231C]/20 flex justify-between items-center">
                <Button variant="secondary" size="md" onClick={() => setCurrentStage('address')}>
                  ← Back to Address
                </Button>
                <Button variant="primary" size="md" onClick={handleProceedToPayment}>
                  Continue to Payment →
                </Button>
              </div>
            </motion.div>
          )}

          {/* =========================================================================
              STAGE 3: PAYMENT
             ========================================================================= */}
          {currentStage === 'payment' && (
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[18px] p-6 shadow-[3px_3px_0_#14231C] space-y-6"
            >
              <div className="flex items-center justify-between border-b border-[#14231C]/20 pb-3">
                <div>
                  <span className="font-label-mono text-xs text-[#14231C]/60 uppercase">
                    STAGE 03
                  </span>
                  <h2 className="font-fraunces text-xl font-semibold text-[#14231C]">
                    Postal Settlement
                  </h2>
                </div>
                <Stamp text="SECURE DISPATCH" variant="tomato" size="sm" rotation={-1} />
              </div>

              {/* Payment Tabs: Card | UPI | COD */}
              <div className="flex border-[1.5px] border-[#14231C] rounded-[10px] overflow-hidden p-1 bg-[#F3EBDD] gap-1">
                <button
                  type="button"
                  onClick={() => setPaymentTab('card')}
                  className={`flex-1 py-2 text-xs font-mono font-bold rounded-[6px] transition-all cursor-pointer ${
                    paymentTab === 'card'
                      ? 'bg-[#14231C] text-[#F3EBDD] shadow-sm'
                      : 'text-[#14231C] hover:bg-[#14231C]/10'
                  }`}
                >
                  💳 Credit / Debit Card
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentTab('upi')}
                  className={`flex-1 py-2 text-xs font-mono font-bold rounded-[6px] transition-all cursor-pointer ${
                    paymentTab === 'upi'
                      ? 'bg-[#14231C] text-[#F3EBDD] shadow-sm'
                      : 'text-[#14231C] hover:bg-[#14231C]/10'
                  }`}
                >
                  ⚡ UPI Instant
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentTab('cod')}
                  className={`flex-1 py-2 text-xs font-mono font-bold rounded-[6px] transition-all cursor-pointer ${
                    paymentTab === 'cod'
                      ? 'bg-[#14231C] text-[#F3EBDD] shadow-sm'
                      : 'text-[#14231C] hover:bg-[#14231C]/10'
                  }`}
                >
                  💵 Cash on Delivery
                </button>
              </div>

              {/* TAB 1: CARD WITH 3D FLIP PREVIEW */}
              {paymentTab === 'card' && (
                <div className="space-y-6">
                  {/* 3D Flipping Card Preview */}
                  <div className="perspective-1000 max-w-sm mx-auto w-full h-52">
                    <motion.div
                      className="w-full h-full relative rounded-[16px] text-[#F3EBDD] shadow-[4px_4px_0_#14231C] transition-transform duration-700 preserve-3d"
                      animate={{ rotateY: isCardFlipped ? 180 : 0 }}
                    >
                      {/* CARD FRONT */}
                      <div className="absolute inset-0 backface-hidden rounded-[16px] border-[1.5px] border-[#14231C] bg-gradient-to-tr from-[#1B3528] via-[#14231C] to-[#284838] p-5 flex flex-col justify-between overflow-hidden">
                        {/* Background postal foil watermark */}
                        <div className="absolute -right-8 -bottom-8 opacity-10 text-9xl pointer-events-none select-none">
                          📮
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="font-label-mono text-[9px] tracking-widest text-[#F3EBDD]/70 uppercase">
                            POSTAL COMMERCIAL CARD
                          </span>
                          <span className="font-fraunces font-bold text-base tracking-wider text-[#F4B63F]">
                            {cardNumber.startsWith('4')
                              ? 'VISA'
                              : cardNumber.startsWith('5')
                                ? 'MASTERCARD'
                                : 'RUPAY'}
                          </span>
                        </div>

                        {/* Gold Brass Chip */}
                        <div className="w-10 h-7 rounded-[4px] bg-[#D4AF37] border border-[#B38F24] shadow-inner flex items-center justify-center">
                          <div className="w-6 h-4 border border-[#B38F24]/50 rounded-[2px]" />
                        </div>

                        {/* Card Number */}
                        <div className="font-mono text-lg sm:text-xl font-bold tracking-widest text-[#F3EBDD]">
                          {cardNumber || '•••• •••• •••• ••••'}
                        </div>

                        <div className="flex items-end justify-between font-mono text-[10px] text-[#F3EBDD]/80">
                          <div>
                            <span className="text-[8px] text-[#F3EBDD]/60 block uppercase">
                              CARDHOLDER
                            </span>
                            <span className="font-bold text-xs uppercase text-[#F3EBDD] truncate block max-w-[170px]">
                              {cardHolder || 'YOUR NAME'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[8px] text-[#F3EBDD]/60 block uppercase">
                              EXPIRES
                            </span>
                            <span className="font-bold text-xs text-[#F3EBDD]">
                              {cardExpiry || 'MM/YY'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* CARD BACK */}
                      <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-[16px] border-[1.5px] border-[#14231C] bg-[#14231C] py-4 flex flex-col justify-between overflow-hidden">
                        {/* Magnetic Strip */}
                        <div className="w-full h-10 bg-black/80" />

                        {/* Signature Stripe & CVV */}
                        <div className="px-6 space-y-1">
                          <div className="bg-[#F3EBDD] h-8 rounded-[4px] flex items-center justify-end px-3">
                            <span className="font-mono font-bold text-sm text-[#14231C] tracking-widest">
                              {cardCvv || '•••'}
                            </span>
                          </div>
                          <p className="font-mono text-[8px] text-[#F3EBDD]/60 text-right">
                            SECURITY CODE (CVV)
                          </p>
                        </div>

                        <p className="font-mono text-[8px] text-[#F3EBDD]/50 px-6 text-center">
                          AUTHORISED POSTAL FINANCIAL CARD · PROPERTY OF CENTRAL G.P.O.
                        </p>
                      </div>
                    </motion.div>
                  </div>

                  {/* Card Inputs with Auto-formatting and CVV flip focus */}
                  <div className="space-y-4">
                    <Input
                      label="Cardholder Name"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      error={paymentErrors.cardHolder}
                      placeholder="e.g. Aarav Mehta"
                      required
                    />

                    <Input
                      label="Card Number (Luhn check validated)"
                      value={cardNumber}
                      onChange={(e) => handleCardNumberChange(e.target.value)}
                      error={paymentErrors.cardNumber}
                      placeholder="4532 0158 9214 4022"
                      required
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Expiry Date"
                        value={cardExpiry}
                        onChange={(e) => handleExpiryChange(e.target.value)}
                        error={paymentErrors.cardExpiry}
                        placeholder="MM/YY"
                        required
                      />

                      <Input
                        label="CVV (3 or 4 digits)"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        onFocus={() => setIsCardFlipped(true)}
                        onBlur={() => setIsCardFlipped(false)}
                        error={paymentErrors.cardCvv}
                        placeholder="842"
                        type="password"
                        required
                      />
                    </div>

                    {/* Simulation hint box for testing */}
                    <div className="p-3 rounded-[8px] bg-[#F3EBDD] border border-[#14231C]/25 text-[11px] font-mono text-[#14231C]/80">
                      <strong>🧪 Simulation Rule:</strong> Any card ending with{' '}
                      <span className="text-[#E8502B] font-bold">0000</span> will simulate a{' '}
                      <strong>PAYMENT FAILED</strong> flow. Any other card will SUCCEED.
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: UPI INSTANT */}
              {paymentTab === 'upi' && (
                <div className="space-y-4">
                  <Input
                    label="Virtual Payment Address (VPA / UPI ID)"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    error={paymentErrors.upiId}
                    placeholder="name@okaxis"
                    required
                  />

                  {/* Quick Bank Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
                    <span className="text-[#14231C]/70">Handles:</span>
                    {['@okaxis', '@okhdfcbank', '@paytm', '@ybl', '@postbank'].map((handle) => (
                      <button
                        key={handle}
                        type="button"
                        onClick={() => {
                          const base = upiId.split('@')[0] || 'recipient';
                          setUpiId(`${base}${handle}`);
                        }}
                        className="px-2 py-0.5 rounded border border-[#14231C]/30 bg-[#F3EBDD] hover:border-[#14231C] cursor-pointer"
                      >
                        {handle}
                      </button>
                    ))}
                  </div>

                  <p className="text-xs text-[#14231C]/70 font-sans">
                    A notification will be dispatched to your UPI app for instant settlement.
                  </p>
                </div>
              )}

              {/* TAB 3: CASH ON DELIVERY */}
              {paymentTab === 'cod' && (
                <div className="p-5 rounded-[12px] bg-[#F3EBDD] border-[1.5px] border-[#14231C] space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">💵</span>
                    <span className="font-fraunces font-semibold text-base text-[#14231C]">
                      Cash on Postal Delivery
                    </span>
                  </div>
                  <p className="text-xs text-[#14231C]/75 font-sans leading-relaxed">
                    Settle with physical cash or mobile QR scanner upon hand-over by your India Post letter carrier. Exact change is requested.
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-[#14231C]/20 flex justify-between items-center">
                <Button variant="secondary" size="md" onClick={() => setCurrentStage('delivery')}>
                  ← Back to Delivery
                </Button>
                <Button variant="primary" size="lg" onClick={handleSubmitPayment}>
                  Stamp &amp; Authorize · {formatINR(finalTotal)}
                </Button>
              </div>
            </motion.div>
          )}
        </div>

        {/* RIGHT COLUMN: STICKY ORDER-SUMMARY RECEIPT WITH COUPON APPLIED */}
        <div className="lg:col-span-5 sticky top-20">
          <Receipt variant="paper" orderNumber="DISPATCH RECAP">
            <div className="space-y-4 font-mono text-xs">
              <div className="text-center pb-2 border-b border-dashed border-[#14231C]/30">
                <span className="font-label-mono text-[9px] uppercase tracking-wider text-[#14231C]/60 block">
                  SUMMARY OF PARCEL CONTENTS
                </span>
                <span className="font-fraunces font-bold text-base text-[#14231C]">
                  {cartItems.length} Packed Wares
                </span>
              </div>

              {/* Items summary list */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {cartItems.map(({ product, quantity, variant }) => (
                  <div
                    key={`${product.id}-${variant || 'default'}`}
                    className="flex justify-between items-center gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span>{product.emoji}</span>
                      <div className="min-w-0">
                        <p className="font-semibold text-[#14231C] truncate">{product.name}</p>
                        <p className="text-[10px] text-[#14231C]/60">
                          {quantity} × {formatINR(product.price)}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-[#14231C] shrink-0">
                      {formatINR(product.price * quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <Perforation notchBg="#F3EBDD" label="SETTLEMENT BREAKDOWN" />

              {/* Totals */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-[#14231C]/80">
                  <span>Wares Subtotal</span>
                  <span className="font-bold">{formatINR(subtotal)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-[#286345] font-bold">
                    <span>Discount ({appliedCoupon?.code})</span>
                    <span>−{formatINR(discount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-[#14231C]/80">
                  <span>
                    Delivery ({deliverySpeed === 'express' ? 'Speed Post' : 'Standard'})
                  </span>
                  <span className="font-bold">
                    {activeShippingFee === 0 ? 'FREE' : formatINR(activeShippingFee)}
                  </span>
                </div>

                <div className="flex justify-between text-[10px] text-[#14231C]/60 pt-0.5">
                  <span>18% GST (included in items)</span>
                  <span>{formatINR(gstIncluded)}</span>
                </div>

                <div className="flex justify-between items-center pt-3 border-t-[1.5px] border-[#14231C] font-bold text-sm text-[#14231C]">
                  <span className="font-fraunces text-base">Grand Total</span>
                  <span className="font-mono text-xl text-[#E8502B]">
                    {formatINR(finalTotal)}
                  </span>
                </div>
              </div>

              {/* Coupon confirmation if applied */}
              {appliedCoupon && (
                <div className="p-2.5 rounded-[8px] bg-[#BCD9C4]/30 border border-[#286345]/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Stamp text={appliedCoupon.code} variant="mint" size="sm" rotation={-1} />
                    <span className="text-[11px] font-mono text-[#286345] font-bold">
                      {appliedCoupon.badge} active
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#286345]">
                    −{formatINR(discount)}
                  </span>
                </div>
              )}

              {/* Destination preview */}
              <div className="p-2.5 rounded-[8px] bg-[#EADFCB] border border-[#14231C]/25 text-[10px] space-y-0.5">
                <span className="font-label-mono font-bold text-[#14231C]/70 block uppercase">
                  DISPATCH TO:
                </span>
                <p className="font-bold text-[#14231C]">{activeAddress.fullName}</p>
                <p className="text-[#14231C]/75 truncate">{activeAddress.line1}</p>
                <p className="text-[#14231C]/75">
                  {activeAddress.city}, {activeAddress.state} {activeAddress.pincode}
                </p>
              </div>
            </div>
          </Receipt>
        </div>
      </div>
    </div>
  );
};
