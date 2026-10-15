import React, { useState } from 'react';
import {
  Button,
  Sticker,
  Tag,
  Stamp,
  Perforation,
  Receipt,
  Chip,
  Input,
  Stepper,
  Modal,
  Sheet,
  Skeleton,
  RatingStars,
  BrandWordmark,
  HandArrow,
  HandTick,
  HandStar,
  HandHeart,
  ScribbleUnderline,
  PostalWavyLines,
  ParcelBoxIcon,
} from '../components/ui';
import { useToastStore } from '../store/toastStore';
import { formatINR, formatOrderId, formatDate } from '../lib/format';
import { isValidIndianPhone, isValidPinCode, isValidEmail } from '../lib/validators';

export const KitPage: React.FC = () => {
  const { addToast } = useToastStore();

  // Interactive component states for QA
  const [stepperValue, setStepperValue] = useState(2);
  const [activeChip, setActiveChip] = useState('stationery');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [interactiveRating, setInteractiveRating] = useState(4.5);
  const [showSkeleton, setShowSkeleton] = useState(false);

  // Form field states
  const [sampleName, setSampleName] = useState('Aarav Mehta');
  const [samplePin, setSamplePin] = useState('110001');
  const [samplePhone, setSamplePhone] = useState('9876543210');
  const [sampleEmail, setSampleEmail] = useState('aarav@postbox.in');

  const pinError = samplePin && !isValidPinCode(samplePin) ? 'Enter valid 6-digit PIN' : undefined;
  const phoneError =
    samplePhone && !isValidIndianPhone(samplePhone) ? 'Enter valid 10-digit number' : undefined;
  const emailError = sampleEmail && !isValidEmail(sampleEmail) ? 'Enter valid email address' : undefined;

  return (
    <div className="min-h-screen bg-[#F3EBDD] text-[#14231C] pb-24 selection:bg-[#E8502B] selection:text-[#F3EBDD]">
      {/* Top bar for Kit */}
      <header className="border-b-[1.5px] border-[#14231C] bg-[#EADFCB] px-6 py-4 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandWordmark size="md" />
            <span className="font-label-mono px-2 py-0.5 rounded-[4px] border-[1px] border-[#14231C] bg-[#F3EBDD] text-[10px]">
              KIT #01
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="#/"
              className="font-label-mono text-xs hover:underline flex items-center gap-1.5"
            >
              <HandArrow size={14} className="rotate-180" />
              <span>Back to Store</span>
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-10 space-y-16">
        {/* Title Section */}
        <section className="space-y-3">
          <p className="font-label-mono text-[#14231C]/65">Postal Design System</p>
          <h1 className="font-fraunces text-4xl sm:text-5xl font-semibold tracking-tight text-[#14231C]">
            Tactile <span className="font-fraunces-italic font-normal">Component</span> Specimen
          </h1>
          <div className="w-48 text-[#E8502B]">
            <ScribbleUnderline />
          </div>
        </section>

        {/* 1. Design Tokens & Color Palette */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b-[1.5px] border-[#14231C] pb-2">
            <h2 className="font-fraunces text-2xl font-semibold">01. Design Tokens</h2>
            <span className="font-label-mono text-xs text-[#14231C]/60">HEX &amp; TINTS</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {[
              { name: 'Paper', hex: '#F3EBDD', bg: 'bg-[#F3EBDD]', border: 'border-[#14231C]' },
              { name: 'Paper-2', hex: '#EADFCB', bg: 'bg-[#EADFCB]', border: 'border-[#14231C]' },
              { name: 'Ink', hex: '#14231C', bg: 'bg-[#14231C]', text: 'text-[#F3EBDD]' },
              { name: 'Kraft', hex: '#C99A67', bg: 'bg-[#C99A67]', border: 'border-[#14231C]' },
              { name: 'Tomato', hex: '#E8502B', bg: 'bg-[#E8502B]', text: 'text-[#F3EBDD]' },
              { name: 'Saffron', hex: '#F4B63F', bg: 'bg-[#F4B63F]', border: 'border-[#14231C]' },
              { name: 'Mint', hex: '#BCD9C4', bg: 'bg-[#BCD9C4]', border: 'border-[#14231C]' },
              { name: 'Stamp-Blue', hex: '#A9CBE0', bg: 'bg-[#A9CBE0]', border: 'border-[#14231C]' },
              { name: 'Blush', hex: '#F2C4B8', bg: 'bg-[#F2C4B8]', border: 'border-[#14231C]' },
              {
                name: 'Ink 62%',
                hex: 'rgba(20,35,28,0.62)',
                bg: 'bg-[#14231C]/62',
                text: 'text-[#F3EBDD]',
              },
            ].map((token) => (
              <div
                key={token.name}
                className={`p-4 rounded-[8px] border-[1.5px] ${token.border || 'border-transparent'} ${token.bg} ${token.text || 'text-[#14231C]'} shadow-[2px_2px_0_#14231C] flex flex-col justify-between h-28`}
              >
                <span className="font-fraunces font-semibold text-sm">{token.name}</span>
                <span className="font-label-mono text-[10px] tracking-widest">{token.hex}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Brand Wordmark & Typography Scale */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b-[1.5px] border-[#14231C] pb-2">
            <h2 className="font-fraunces text-2xl font-semibold">02. Brand &amp; Typography</h2>
            <span className="font-label-mono text-xs text-[#14231C]/60">FRAUNCES + DM MONO</span>
          </div>

          <div className="bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[14px] p-6 space-y-6 shadow-[3px_3px_0_#14231C]">
            <div className="flex flex-wrap items-center gap-8 pb-6 border-b-[1.5px] border-[#14231C]/20">
              <BrandWordmark size="xl" />
              <BrandWordmark size="lg" />
              <BrandWordmark size="md" />
              <BrandWordmark size="sm" />
            </div>

            <div className="space-y-4">
              <div>
                <span className="font-label-mono text-[10px] text-[#14231C]/60 block mb-1">
                  Fraunces 600 Headline (-0.03em) with Italic Accent:
                </span>
                <h3 className="font-fraunces text-3xl font-semibold text-[#14231C]">
                  Freshly printed folios, <span className="font-fraunces-italic font-normal">sealed</span> by hand.
                </h3>
              </div>

              <div>
                <span className="font-label-mono text-[10px] text-[#14231C]/60 block mb-1">
                  DM Mono (11px, 0.12em tracking) for labels, prices, IDs:
                </span>
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <span className="font-label-mono font-medium">ORDER REF: {formatOrderId(7741)}</span>
                  <span className="font-label-mono font-medium">DISPATCH: {formatDate()}</span>
                  <span className="font-label-mono font-medium text-[#E8502B]">
                    PRICE: {formatINR(124999)}
                  </span>
                </div>
              </div>

              <div>
                <span className="font-label-mono text-[10px] text-[#14231C]/60 block mb-1">
                  Hanken Grotesk body typeface:
                </span>
                <p className="text-sm text-[#14231C]/80 leading-relaxed max-w-2xl">
                  Every parcel is hand-wrapped in heavyweight unbleached kraft paper, tied with three-ply natural jute twine, and inspected before postal pickup.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Reusable Signature Elements: Stickers */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b-[1.5px] border-[#14231C] pb-2">
            <h2 className="font-fraunces text-2xl font-semibold">03. Emoji Stickers</h2>
            <span className="font-label-mono text-xs text-[#14231C]/60">BLOBS + HARD SHADOW</span>
          </div>

          <div className="bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[14px] p-6 space-y-6">
            <p className="text-xs text-[#14231C]/75 font-label-mono">
              Hover or click interactive stickers for organic spring lift and tilt:
            </p>
            <div className="flex flex-wrap items-center gap-6">
              <Sticker
                emoji="📦"
                color="kraft"
                size="lg"
                rotation={-3}
                interactive
                label="PARCEL"
                onClick={() => addToast({ title: 'Parcel Sticker', message: 'Ready for shipping' })}
              />
              <Sticker
                emoji="💌"
                color="blush"
                size="lg"
                rotation={4}
                interactive
                label="AIRMAIL"
                onClick={() => addToast({ title: 'Airmail Sticker', message: 'Sealed with care' })}
              />
              <Sticker
                emoji="✂️"
                color="mint"
                size="md"
                rotation={-4}
                interactive
                onClick={() => addToast({ title: 'Clipper', message: 'Snip and trim' })}
              />
              <Sticker
                emoji="🗓️"
                color="saffron"
                size="md"
                rotation={2}
                interactive
                onClick={() => addToast({ title: 'Date Stamp', message: 'Dated today' })}
              />
              <Sticker
                emoji="📯"
                color="stamp-blue"
                size="md"
                rotation={-2}
                interactive
              />
              <Sticker
                emoji="✒️"
                color="paper-2"
                size="sm"
                rotation={5}
                interactive
              />
              <Sticker
                emoji="🧶"
                color="tomato"
                size="sm"
                rotation={-3}
                interactive
              />
            </div>
          </div>
        </section>

        {/* 4. Shipping Tags & Rubber Stamps */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b-[1.5px] border-[#14231C] pb-2">
            <h2 className="font-fraunces text-2xl font-semibold">04. Shipping Tags &amp; Rubber Stamps</h2>
            <span className="font-label-mono text-xs text-[#14231C]/60">EYELETS &amp; SEALS</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Tags */}
            <div className="bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[14px] p-6 space-y-4">
              <h3 className="font-fraunces text-lg font-semibold">Shipping Tags with Twine</h3>
              <div className="flex flex-wrap items-center gap-4">
                <Tag price={1850} label="POSTAL JOURNAL" variant="kraft" />
                <Tag price={2490} label="BRASS STAMP" variant="saffron" />
                <Tag price={650} label="MANILA PACK" variant="mint" size="sm" />
                <Tag price={14500} label="HEIRLOOM FOLIO" variant="paper" size="lg" />
              </div>
            </div>

            {/* Stamps */}
            <div className="bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[14px] p-6 space-y-4">
              <h3 className="font-fraunces text-lg font-semibold">Rubber Stamps</h3>
              <div className="flex flex-wrap items-center gap-5">
                <Stamp text="FREE SHIP" variant="tomato" rotation={-3} />
                <Stamp text="NEW ARRIVAL" variant="mint" rotation={2} />
                <Stamp text="DISPATCHED" variant="stamp-blue" rotation={-4} />
                <Stamp text="ARCHIVAL" variant="saffron" rotation={1} />
                <Stamp text="POST OFFICE" subtext="DELHI G.P.O." shape="round" variant="tomato" rotation={-5} />
                <Stamp text="INSPECTED" subtext="NO. 42" shape="round" variant="ink" rotation={4} />
              </div>
            </div>
          </div>
        </section>

        {/* 5. Perforation & Sawtooth Receipt */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b-[1.5px] border-[#14231C] pb-2">
            <h2 className="font-fraunces text-2xl font-semibold">05. Perforation &amp; Receipts</h2>
            <span className="font-label-mono text-xs text-[#14231C]/60">TEAR LINES</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Perforation line specimen */}
            <div className="bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[14px] p-6 space-y-4">
              <h3 className="font-fraunces text-lg font-semibold">Dashed Tear Lines</h3>
              <p className="text-xs text-[#14231C]/75">
                Semicircle notches on both ends create the feel of a detachable ticket or postal slip.
              </p>

              <Perforation notchBg="#EADFCB" label="DETACH HERE" showScissors />
              <Perforation notchBg="#EADFCB" label="INVOICE COPY" />
              <Perforation notchBg="#EADFCB" />
            </div>

            {/* Sawtooth receipt */}
            <Receipt orderNumber="PRCL-8492-IN" date="14 OCT 2026" variant="paper">
              <div className="text-center pb-3 border-b border-dashed border-[#14231C]/30">
                <BrandWordmark size="sm" />
                <p className="font-label-mono text-[9px] text-[#14231C]/60 mt-1">
                  CENTRAL DISPATCH OFFICE
                </p>
              </div>

              <div className="py-3 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span>1x Hardcover Journal</span>
                  <span>{formatINR(1850)}</span>
                </div>
                <div className="flex justify-between">
                  <span>1x Wax Seal Kit</span>
                  <span>{formatINR(1450)}</span>
                </div>
                <div className="flex justify-between text-[#14231C]/60">
                  <span>Postal Shipping</span>
                  <span>FREE</span>
                </div>
              </div>

              <Perforation notchBg="#F3EBDD" label="TOTAL" />

              <div className="flex justify-between items-center pt-1 font-mono font-bold text-sm">
                <span>TOTAL AMOUNT</span>
                <span className="text-[#E8502B] text-base">{formatINR(3300)}</span>
              </div>
            </Receipt>
          </div>
        </section>

        {/* 6. Buttons, Steppers & Chips */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b-[1.5px] border-[#14231C] pb-2">
            <h2 className="font-fraunces text-2xl font-semibold">06. Buttons, Steppers &amp; Chips</h2>
            <span className="font-label-mono text-xs text-[#14231C]/60">PRESS-IN INTERACTIONS</span>
          </div>

          <div className="bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[14px] p-6 space-y-6">
            {/* Buttons */}
            <div className="space-y-3">
              <span className="font-label-mono text-[10px] text-[#14231C]/60 block">
                Buttons (Notice primary tomato shadow presses in):
              </span>
              <div className="flex flex-wrap items-center gap-4">
                <Button
                  variant="primary"
                  onClick={() =>
                    addToast({
                      title: 'Added to Parcel',
                      message: 'Hardcover Postal Journal added to bag',
                      variant: 'tomato',
                    })
                  }
                >
                  Primary Action (Click Me)
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    addToast({
                      title: 'Postal Info',
                      message: 'Standard tracked dispatch via India Post',
                    })
                  }
                >
                  Secondary Outlined
                </Button>
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="tomato" size="sm">
                  Small Tomato
                </Button>
                <Button variant="primary" disabled>
                  Disabled
                </Button>
              </div>
            </div>

            {/* Steppers & Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-[#14231C]/20">
              <div className="space-y-3">
                <span className="font-label-mono text-[10px] text-[#14231C]/60 block">
                  Quantity Stepper (Current: {stepperValue}):
                </span>
                <div className="flex items-center gap-4">
                  <Stepper value={stepperValue} onChange={setStepperValue} min={1} max={10} />
                  <Stepper value={stepperValue} onChange={setStepperValue} size="sm" />
                </div>
              </div>

              <div className="space-y-3">
                <span className="font-label-mono text-[10px] text-[#14231C]/60 block">
                  Filter Chips (Active: {activeChip}):
                </span>
                <div className="flex flex-wrap gap-2">
                  {['all', 'stationery', 'stamps', 'wrapping'].map((cat) => (
                    <Chip
                      key={cat}
                      label={cat}
                      active={activeChip === cat}
                      onClick={() => setActiveChip(cat)}
                      count={cat === 'all' ? 8 : 2}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Input with Floating Label & Underline */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b-[1.5px] border-[#14231C] pb-2">
            <h2 className="font-fraunces text-2xl font-semibold">07. Inputs &amp; Form Fields</h2>
            <span className="font-label-mono text-xs text-[#14231C]/60">ANIMATED INK UNDERLINE</span>
          </div>

          <div className="bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[14px] p-6 max-w-2xl space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input
                label="Full Name"
                value={sampleName}
                onChange={(e) => setSampleName(e.target.value)}
                hint="For postal delivery label"
              />

              <Input
                label="Postal PIN Code"
                value={samplePin}
                onChange={(e) => setSamplePin(e.target.value)}
                error={pinError}
                hint="6-digit Indian PIN code"
              />

              <Input
                label="Phone Number"
                value={samplePhone}
                onChange={(e) => setSamplePhone(e.target.value)}
                error={phoneError}
                hint="10-digit mobile number"
              />

              <Input
                label="Email Address"
                value={sampleEmail}
                onChange={(e) => setSampleEmail(e.target.value)}
                error={emailError}
              />
            </div>
          </div>
        </section>

        {/* 8. Rating Stars & Hand-drawn SVGs */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b-[1.5px] border-[#14231C] pb-2">
            <h2 className="font-fraunces text-2xl font-semibold">08. Hand-Drawn SVGs &amp; Ratings</h2>
            <span className="font-label-mono text-xs text-[#14231C]/60">ORGANIC VECTORS</span>
          </div>

          <div className="bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[14px] p-6 grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="space-y-4">
              <span className="font-label-mono text-[10px] text-[#14231C]/60 block">
                Interactive Rating Stars:
              </span>
              <RatingStars
                rating={interactiveRating}
                interactive
                onChange={setInteractiveRating}
                showValue
                size={22}
                reviewCount={142}
              />
              <p className="text-xs text-[#14231C]/70">
                Click any star above to test tactile rating state.
              </p>
            </div>

            <div className="space-y-4">
              <span className="font-label-mono text-[10px] text-[#14231C]/60 block">
                Hand-Drawn Postal SVGs:
              </span>
              <div className="flex items-center gap-6 text-[#14231C]">
                <div className="flex flex-col items-center gap-1">
                  <HandArrow size={24} />
                  <span className="font-label-mono text-[9px]">Arrow</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <HandTick size={24} className="text-[#286345]" />
                  <span className="font-label-mono text-[9px]">Tick</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <HandStar size={24} filled className="text-[#F4B63F]" />
                  <span className="font-label-mono text-[9px]">Star</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <HandHeart size={24} filled className="text-[#E8502B]" />
                  <span className="font-label-mono text-[9px]">Heart</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <PostalWavyLines />
                  <span className="font-label-mono text-[9px]">Postmark</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <ParcelBoxIcon size={24} />
                  <span className="font-label-mono text-[9px]">Box</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 9. Modal, Sheet & Skeletons */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b-[1.5px] border-[#14231C] pb-2">
            <h2 className="font-fraunces text-2xl font-semibold">09. Sheets, Modals &amp; Shimmer</h2>
            <span className="font-label-mono text-xs text-[#14231C]/60">22PX SHEET RADII</span>
          </div>

          <div className="bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[14px] p-6 space-y-6">
            <div className="flex flex-wrap items-center gap-4">
              <Button variant="secondary" onClick={() => setIsModalOpen(true)}>
                Open Modal Sheet
              </Button>
              <Button variant="primary" onClick={() => setIsSheetOpen(true)}>
                Open Slide Drawer
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowSkeleton(!showSkeleton)}
              >
                {showSkeleton ? 'Hide Shimmers' : 'Toggle Paper Shimmer'}
              </Button>
            </div>

            {showSkeleton && (
              <div className="pt-4 border-t border-[#14231C]/20 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Skeleton height={140} rounded="sheet" />
                  <Skeleton height={18} width="70%" />
                  <Skeleton height={14} width="40%" />
                </div>
                <div className="space-y-2">
                  <Skeleton height={140} rounded="sheet" />
                  <Skeleton height={18} width="85%" />
                  <Skeleton height={14} width="50%" />
                </div>
                <div className="space-y-2">
                  <Skeleton height={140} rounded="sheet" />
                  <Skeleton height={18} width="60%" />
                  <Skeleton height={14} width="35%" />
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Modal Dialog */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Postal Dispatch Notice"
        subtitle="MANIFEST PRCL-901"
      >
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-[#14231C]/85">
            Your goods are carefully inspected, protected in acid-free tissue wrap, and encased in rigid kraft mailers.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-[#14231C]/15">
            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setIsModalOpen(false);
                addToast({ title: 'Manifest Verified', variant: 'airmail' });
              }}
            >
              Confirm Slip
            </Button>
          </div>
        </div>
      </Modal>

      {/* Slide Drawer Sheet */}
      <Sheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title="Postal Bag Drawer"
        subtitle="2 ITEMS PACKED"
      >
        <div className="space-y-6">
          <Receipt variant="paper-2" shadow={false}>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span>Hardcover Journal</span>
                <span>{formatINR(1850)}</span>
              </div>
              <div className="flex justify-between">
                <span>Brass Date Stamp</span>
                <span>{formatINR(2490)}</span>
              </div>
            </div>
            <Perforation notchBg="#EADFCB" label="SUBTOTAL" />
            <div className="flex justify-between font-mono font-bold text-sm">
              <span>ESTIMATED TOTAL</span>
              <span className="text-[#E8502B]">{formatINR(4340)}</span>
            </div>
          </Receipt>

          <Button
            variant="primary"
            fullWidth
            onClick={() => {
              setIsSheetOpen(false);
              addToast({ title: 'Dispatched to Counter', variant: 'tomato' });
            }}
          >
            Proceed to Counter
          </Button>
        </div>
      </Sheet>
    </div>
  );
};
