import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Sticker,
  Stamp,
  Button,
  BrandWordmark,
  ScribbleUnderline,
} from '../components/ui';
import { useParcelStore } from '../store';
import { useToastStore } from '../store/toastStore';
import { isValidEmail } from '../lib/validators';
import { UserRole, USERS } from '../data';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/';

  const { login, register, switchUser, currentUser } = useParcelStore();
  const { addToast } = useToastStore();

  const [tab, setTab] = useState<'signin' | 'join'>('signin');
  const [role, setRole] = useState<UserRole>('customer');

  // Form states
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [shopName, setShopName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Validation on blur
  const [touchedEmail, setTouchedEmail] = useState(false);
  const [touchedPassword, setTouchedPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Parallax mouse position
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const x = (clientX / window.innerWidth - 0.5) * 24;
    const y = (clientY / window.innerHeight - 0.5) * 24;
    setMousePos({ x, y });
  };

  // Password Strength calculation (0 to 4)
  const passwordStrength = useMemo(() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  }, [password]);

  const emailError =
    touchedEmail && email && !isValidEmail(email)
      ? 'Enter a valid postal email address'
      : undefined;

  const passwordError =
    touchedPassword && password && password.length < 6
      ? 'Password must be at least 6 characters'
      : undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouchedEmail(true);
    setTouchedPassword(true);

    if (!email || !isValidEmail(email)) return;
    if (!password || password.length < 6) return;
    if (tab === 'join' && !name.trim()) return;

    setIsSubmitting(true);

    // 700ms realistic stamp press loading state
    setTimeout(() => {
      if (tab === 'signin') {
        const res = login(email, role);
        addToast({
          title: 'Dispatch Clearance',
          message: `Welcome back, ${res.user?.name}`,
          variant: 'mint',
        });
      } else {
        const res = register({
          email,
          name,
          role,
          shopName: role === 'seller' ? shopName : undefined,
        });
        addToast({
          title: 'Registered on Manifest',
          message: `Welcome to Parcel, ${res.user?.name}`,
          variant: 'tomato',
        });
      }

      setIsSubmitting(false);
      navigate(redirectTarget);
    }, 700);
  };

  const handleQuickSignIn = (userId: string) => {
    setIsSubmitting(true);
    setTimeout(() => {
      switchUser(userId);
      const targetUser = USERS.find((u) => u.id === userId);
      addToast({
        title: 'Cleared by Stamp',
        message: `Dispatched as ${targetUser?.name} (${targetUser?.role})`,
        variant: 'mint',
      });
      setIsSubmitting(false);
      navigate(redirectTarget);
    }, 500);
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className="min-h-screen bg-[#F3EBDD] flex flex-col lg:flex-row select-none"
    >
      {/* LEFT: Kraft Paper Wall with Floating Sticker Collage & Rotating Circular Stamp */}
      <div className="lg:w-1/2 relative bg-[#C99A67] p-8 sm:p-12 overflow-hidden border-b-[1.5px] lg:border-b-0 lg:border-r-[1.5px] border-[#14231C] flex flex-col justify-between min-h-[420px] lg:min-h-screen">
        {/* Tactile kraft noise/grid texture */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(#14231C 1.5px, transparent 1.5px)',
            backgroundSize: '20px 20px',
          }}
        />

        {/* Top Header on Kraft */}
        <div className="relative z-10 flex items-center justify-between">
          <BrandWordmark size="lg" />
          <span className="font-label-mono text-[10px] px-2.5 py-1 rounded-[6px] border-[1.5px] border-[#14231C] bg-[#F3EBDD] text-[#14231C] shadow-[2px_2px_0_#14231C]">
            CENTRAL POST OFFICE
          </span>
        </div>

        {/* Floating Emoji Stickers Collage with Gentle Parallax */}
        <div className="relative z-10 my-auto py-12 flex items-center justify-center">
          <div className="relative w-full max-w-md h-72">
            {/* Sticker 1 */}
            <motion.div
              animate={{ x: mousePos.x * 0.8, y: mousePos.y * 0.8 }}
              transition={{ type: 'spring', damping: 25, stiffness: 180 }}
              className="absolute -top-4 left-4"
            >
              <Sticker emoji="📦" color="kraft" size="lg" rotation={-6} />
            </motion.div>

            {/* Sticker 2 */}
            <motion.div
              animate={{ x: -mousePos.x * 0.6, y: -mousePos.y * 0.6 }}
              transition={{ type: 'spring', damping: 25, stiffness: 180 }}
              className="absolute top-2 right-6"
            >
              <Sticker emoji="💌" color="blush" size="lg" rotation={8} />
            </motion.div>

            {/* Sticker 3 */}
            <motion.div
              animate={{ x: mousePos.x * 1.2, y: mousePos.y * 1.2 }}
              transition={{ type: 'spring', damping: 25, stiffness: 180 }}
              className="absolute top-20 left-28"
            >
              <Sticker emoji="🎧" color="stamp-blue" size="xl" rotation={-3} />
            </motion.div>

            {/* Sticker 4 */}
            <motion.div
              animate={{ x: -mousePos.x * 0.9, y: mousePos.y * 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 180 }}
              className="absolute bottom-4 left-8"
            >
              <Sticker emoji="🪴" color="mint" size="md" rotation={4} />
            </motion.div>

            {/* Sticker 5 */}
            <motion.div
              animate={{ x: mousePos.x * 0.7, y: -mousePos.y * 0.7 }}
              transition={{ type: 'spring', damping: 25, stiffness: 180 }}
              className="absolute bottom-6 right-12"
            >
              <Sticker emoji="👟" color="saffron" size="lg" rotation={-8} />
            </motion.div>

            {/* Sticker 6 */}
            <motion.div
              animate={{ x: -mousePos.x * 1.1, y: -mousePos.y * 1.1 }}
              transition={{ type: 'spring', damping: 25, stiffness: 180 }}
              className="absolute top-24 right-2"
            >
              <Sticker emoji="📚" color="kraft" size="md" rotation={5} />
            </motion.div>

            {/* Sticker 7 */}
            <motion.div
              animate={{ x: mousePos.x * 0.5, y: -mousePos.y * 0.5 }}
              transition={{ type: 'spring', damping: 25, stiffness: 180 }}
              className="absolute -bottom-2 left-44"
            >
              <Sticker emoji="🎮" color="paper-2" size="sm" rotation={-4} />
            </motion.div>

            {/* Sticker 8 */}
            <motion.div
              animate={{ x: -mousePos.x * 0.8, y: mousePos.y * 0.8 }}
              transition={{ type: 'spring', damping: 25, stiffness: 180 }}
              className="absolute top-4 left-44"
            >
              <Sticker emoji="🧴" color="blush" size="sm" rotation={10} />
            </motion.div>
          </div>
        </div>

        {/* Bottom Rotating Circular Text Stamp */}
        <div className="relative z-10 flex items-center justify-between pt-6 border-t-[1.5px] border-[#14231C]/25">
          <div className="space-y-0.5">
            <p className="font-fraunces text-lg font-semibold text-[#14231C]">
              Every parcel carries a story.
            </p>
            <p className="font-label-mono text-[10px] text-[#14231C]/75">
              EST. 2026 · INDIAN POSTAL SYSTEM
            </p>
          </div>

          {/* Rotating Circular Stamp */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 28, ease: 'linear' }}
            className="w-20 h-20 shrink-0 pointer-events-none select-none"
          >
            <svg viewBox="0 0 100 100" className="w-full h-full text-[#14231C]">
              <path
                id="stampCirclePath"
                d="M 50, 50 m -36, 0 a 36,36 0 1,1 72,0 a 36,36 0 1,1 -72,0"
                fill="none"
              />
              <text className="font-label-mono text-[9px] font-bold tracking-[0.16em] uppercase fill-current">
                <textPath href="#stampCirclePath" startOffset="0%">
                  PARCEL DISPATCH · NEW DELHI · EST 2026 ·
                </textPath>
              </text>
              <circle cx="50" cy="50" r="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
              <text x="50" y="54" textAnchor="middle" className="text-sm">📦</text>
            </svg>
          </motion.div>
        </div>
      </div>

      {/* RIGHT: Tactile Paper Sheet Form */}
      <div className="lg:w-1/2 p-6 sm:p-12 lg:p-16 flex items-center justify-center bg-[#F3EBDD]">
        <div className="w-full max-w-md bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[22px] p-6 sm:p-8 shadow-[4px_4px_0_#14231C] space-y-6">
          {/* Tabs: Sign in / Join with animated ink underline */}
          <div className="flex border-b-[1.5px] border-[#14231C]/25 pb-1 relative">
            <button
              type="button"
              onClick={() => {
                setTab('signin');
                if (role === 'admin') setRole('customer');
              }}
              className={`flex-1 pb-2.5 text-center font-fraunces text-lg font-semibold transition-colors cursor-pointer ${
                tab === 'signin' ? 'text-[#14231C]' : 'text-[#14231C]/45 hover:text-[#14231C]'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('join');
                if (role === 'admin') setRole('customer');
              }}
              className={`flex-1 pb-2.5 text-center font-fraunces text-lg font-semibold transition-colors cursor-pointer ${
                tab === 'join' ? 'text-[#14231C]' : 'text-[#14231C]/45 hover:text-[#14231C]'
              }`}
            >
              Join
            </button>

            {/* Animated ink underline */}
            <motion.div
              layoutId="auth-tab-underline"
              transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              className={`absolute bottom-0 h-[2.5px] bg-[#14231C] ${
                tab === 'signin' ? 'left-0 w-1/2' : 'left-1/2 w-1/2'
              }`}
            />
          </div>

          {/* Role selector as 3 shipping-label chips (Admin only on sign in) */}
          <div className="space-y-1.5">
            <span className="font-label-mono text-[10px] text-[#14231C]/65 uppercase block">
              IDENTIFY ROLES:
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'customer', label: 'Shopper', icon: '🛍️' },
                { id: 'seller', label: 'Seller', icon: '🪵' },
                ...(tab === 'signin' ? [{ id: 'admin', label: 'Admin', icon: '🎩' }] : []),
              ].map((r) => {
                const isSelected = role === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id as UserRole)}
                    className={`
                      p-2 rounded-[8px] border-[1.5px] flex items-center justify-center gap-1.5 text-xs font-mono font-medium cursor-pointer transition-all
                      ${
                        isSelected
                          ? 'bg-[#14231C] text-[#F3EBDD] border-[#14231C] shadow-[2px_2px_0_#E8502B]'
                          : 'bg-[#F3EBDD] text-[#14231C] border-[#14231C]/40 hover:border-[#14231C]'
                      }
                    `}
                  >
                    <span>{r.icon}</span>
                    <span>{r.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'join' && (
              <div className="space-y-1">
                <label className="font-label-mono text-[10px] text-[#14231C]/70 block">
                  FULL RECIPIENT NAME
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Diya Sharma"
                  className="w-full bg-[#F3EBDD] border-[1.5px] border-[#14231C] rounded-[8px] p-2.5 text-xs font-mono outline-none"
                  required
                />
              </div>
            )}

            {tab === 'join' && role === 'seller' && (
              <div className="space-y-1">
                <label className="font-label-mono text-[10px] text-[#14231C]/70 block">
                  WORKBENCH / SHOP NAME
                </label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="e.g. Deccan Mechanicals"
                  className="w-full bg-[#F3EBDD] border-[1.5px] border-[#14231C] rounded-[8px] p-2.5 text-xs font-mono outline-none"
                  required
                />
              </div>
            )}

            {/* Email with validation on blur */}
            <div className="space-y-1">
              <label className="font-label-mono text-[10px] text-[#14231C]/70 block">
                POSTAL EMAIL ADDRESS
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouchedEmail(true)}
                placeholder="name@domain.in"
                className="w-full bg-[#F3EBDD] border-[1.5px] border-[#14231C] rounded-[8px] p-2.5 text-xs font-mono outline-none"
                required
              />
              {emailError && (
                <p className="text-[10px] font-label-mono text-[#E8502B] pt-0.5">
                  ● {emailError}
                </p>
              )}
            </div>

            {/* Password with show/hide eye toggle */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-label-mono text-[10px] text-[#14231C]/70 block">
                  SECURITY KEY / PASSWORD
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="font-label-mono text-[10px] text-[#14231C]/70 hover:underline cursor-pointer"
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouchedPassword(true)}
                  placeholder="••••••••"
                  className="w-full bg-[#F3EBDD] border-[1.5px] border-[#14231C] rounded-[8px] p-2.5 text-xs font-mono outline-none"
                  required
                />
              </div>

              {passwordError && (
                <p className="text-[10px] font-label-mono text-[#E8502B] pt-0.5">
                  ● {passwordError}
                </p>
              )}
            </div>

            {/* Password Strength as 4 Stamp Rings Filling Up */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[10px] font-label-mono text-[#14231C]/65">
                <span>STAMP SECURITY:</span>
                <span>
                  {passwordStrength === 0
                    ? 'EMPTY'
                    : passwordStrength === 1
                      ? 'LIGHT IMPRESSION'
                      : passwordStrength === 2
                        ? 'BALANCED'
                        : passwordStrength === 3
                          ? 'HEAVY INK'
                          : 'MAX ARCHIVAL'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map((ring) => {
                  const isFilled = passwordStrength >= ring;
                  return (
                    <div
                      key={ring}
                      className={`
                        flex-1 h-2 rounded-[3px] border-[1.5px] border-[#14231C] transition-all duration-200
                        ${
                          isFilled
                            ? ring <= 1
                              ? 'bg-[#E8502B]'
                              : ring <= 2
                                ? 'bg-[#F4B63F]'
                                : ring <= 3
                                  ? 'bg-[#A9CBE0]'
                                  : 'bg-[#286345]'
                            : 'bg-transparent'
                        }
                      `}
                    />
                  );
                })}
              </div>
            </div>

            {/* Submit Button with 700ms realistic stamp press loading */}
            <div className="pt-2">
              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileTap={!isSubmitting ? { scale: 0.96, y: 2 } : undefined}
                className={`
                  w-full py-3 px-4 rounded-[8px] border-[1.5px] border-[#14231C]
                  font-medium text-xs tracking-wider uppercase select-none cursor-pointer transition-all
                  ${
                    isSubmitting
                      ? 'bg-[#14231C] text-[#F3EBDD] shadow-[1px_1px_0_#E8502B] translate-y-[2px] translate-x-[2px]'
                      : 'bg-[#14231C] text-[#F3EBDD] shadow-[4px_4px_0_#E8502B] hover:shadow-[5px_5px_0_#E8502B]'
                  }
                `}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block animate-spin text-sm">⟳</span>
                    <span>STAMPING MANIFEST...</span>
                  </span>
                ) : (
                  <span>{tab === 'signin' ? 'Sign into Parcel' : 'Join Parcel Registry'}</span>
                )}
              </motion.button>
            </div>
          </form>

          {/* Under the form: Three tiny subtle "Continue as" chips */}
          <div className="pt-4 border-t border-[#14231C]/15 space-y-2">
            <span className="font-label-mono text-[9px] text-[#14231C]/50 block text-center uppercase tracking-wider">
              FAST-TRACK DISPATCH (SEEDED ACCOUNTS):
            </span>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handleQuickSignIn('usr-demo')}
                className="font-label-mono text-[10px] px-2.5 py-1 rounded-[6px] border border-[#14231C]/30 bg-[#F3EBDD] hover:bg-[#14231C] hover:text-[#F3EBDD] transition-colors cursor-pointer shadow-[1px_1px_0_#14231C]"
              >
                Shopper (Aarav 🧔🏽)
              </button>

              <button
                type="button"
                onClick={() => handleQuickSignIn('sel-1')}
                className="font-label-mono text-[10px] px-2.5 py-1 rounded-[6px] border border-[#14231C]/30 bg-[#F3EBDD] hover:bg-[#14231C] hover:text-[#F3EBDD] transition-colors cursor-pointer shadow-[1px_1px_0_#14231C]"
              >
                Seller (Oiled Oak 🪵)
              </button>

              <button
                type="button"
                onClick={() => handleQuickSignIn('usr-admin')}
                className="font-label-mono text-[10px] px-2.5 py-1 rounded-[6px] border border-[#14231C]/30 bg-[#F3EBDD] hover:bg-[#14231C] hover:text-[#F3EBDD] transition-colors cursor-pointer shadow-[1px_1px_0_#14231C]"
              >
                Admin (Kabir 🎩)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
