import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useParcelStore } from '../../store';
import { useToastStore } from '../../store/toastStore';
import { Button } from '../ui';

const INACTIVITY_WARNING_MS = 14 * 60 * 1000; // 14 minutes = 840,000 ms
const SESSION_EXPIRE_MS = 15 * 60 * 1000; // 15 minutes = 900,000 ms
const COUNTDOWN_SECONDS = 60;

export const SessionSafetyModal: React.FC = () => {
  const {
    currentUser,
    lastActiveTime,
    touchActivity,
    resetSessionTimer,
    signOut,
  } = useParcelStore();
  const { addToast } = useToastStore();

  const [isWarningActive, setIsWarningActive] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(COUNTDOWN_SECONDS);
  const lastTouchRef = useRef(Date.now());

  // Listen for user actions to update last active timestamp
  useEffect(() => {
    if (!currentUser) return;

    const handleActivity = () => {
      const now = Date.now();
      // Throttle store update to once every 5 seconds
      if (now - lastTouchRef.current > 5000) {
        lastTouchRef.current = now;
        touchActivity();
      }
    };

    window.addEventListener('mousemove', handleActivity, { passive: true });
    window.addEventListener('keydown', handleActivity, { passive: true });
    window.addEventListener('click', handleActivity, { passive: true });
    window.addEventListener('touchstart', handleActivity, { passive: true });
    window.addEventListener('scroll', handleActivity, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [currentUser, touchActivity]);

  // Monitor elapsed inactivity time
  useEffect(() => {
    if (!currentUser) {
      setIsWarningActive(false);
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActiveTime;

      if (elapsed >= SESSION_EXPIRE_MS) {
        // Expired
        setIsWarningActive(false);
        signOut();
        addToast({
          title: 'Session Sealed',
          message: 'Signed out due to 15 min inactivity. Your bag is preserved.',
          variant: 'stamp',
        });
      } else if (elapsed >= INACTIVITY_WARNING_MS) {
        // Enter warning window
        setIsWarningActive(true);
        const timeLeftMs = SESSION_EXPIRE_MS - elapsed;
        setRemainingSeconds(Math.max(0, Math.ceil(timeLeftMs / 1000)));
      } else {
        setIsWarningActive(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentUser, lastActiveTime, signOut, addToast]);

  const handleStay = () => {
    lastTouchRef.current = Date.now();
    resetSessionTimer();
    setIsWarningActive(false);
    addToast({
      title: 'Session Restored',
      message: 'Dispatch session refreshed',
      variant: 'mint',
    });
  };

  const handleSignOutNow = () => {
    setIsWarningActive(false);
    signOut();
    addToast({
      title: 'Signed Out',
      message: 'Your postal bag is safely preserved.',
      variant: 'stamp',
    });
  };

  // SVG Ring calculation
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (remainingSeconds / COUNTDOWN_SECONDS) * circumference;

  return (
    <AnimatePresence>
      {isWarningActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#14231C]/65 backdrop-blur-[2px]"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="relative w-full max-w-sm bg-[#F3EBDD] border-[1.5px] border-[#14231C] rounded-[22px] p-6 shadow-[6px_6px_0_#14231C] text-center z-10 space-y-5"
            role="alertdialog"
            aria-modal="true"
          >
            {/* Countdown Ring Graphic */}
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                {/* Background Ring */}
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  fill="none"
                  stroke="#14231C"
                  strokeOpacity="0.15"
                  strokeWidth="4"
                />
                {/* Active Winding Ring */}
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  fill="none"
                  stroke={remainingSeconds <= 15 ? '#E8502B' : '#F4B63F'}
                  strokeWidth="4.5"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono font-bold text-2xl text-[#14231C] leading-none">
                  {remainingSeconds}
                </span>
                <span className="font-label-mono text-[9px] text-[#14231C]/60 mt-0.5">
                  SECONDS
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-1.5">
              <span className="font-label-mono text-[10px] text-[#E8502B] font-bold uppercase tracking-widest block">
                INACTIVITY WARNING · 14:00
              </span>
              <h3 className="font-fraunces text-2xl font-semibold text-[#14231C]">
                Still there?
              </h3>
              <p className="text-xs text-[#14231C]/75 font-sans leading-relaxed max-w-xs mx-auto">
                Your dispatch session will automatically seal to safeguard private postal details. Your bag will remain intact.
              </p>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                onClick={handleSignOutNow}
              >
                Sign Out Now
              </Button>
              <Button
                variant="primary"
                size="sm"
                fullWidth
                onClick={handleStay}
              >
                Stay Dispatched
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
