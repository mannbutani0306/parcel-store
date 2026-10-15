import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useParcelStore } from '../../store';

export const BottomTabBar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { getCartTotalItems, currentUser } = useParcelStore();
  const cartCount = getCartTotalItems();

  const tabs = [
    { id: 'home', label: 'Home', icon: '🏠', path: '/' },
    { id: 'shop', label: 'Shop', icon: '🛍️', path: '/shop' },
    { id: 'cart', label: 'Cart', icon: '📦', path: '/cart', badge: cartCount > 0 ? cartCount : undefined },
    { id: 'orders', label: 'Orders', icon: '📜', path: '/orders' },
    { id: 'me', label: 'Me', icon: currentUser?.avatar || '👤', path: '/login' },
  ];

  const currentPath = location.pathname;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#EADFCB] border-t-[1.5px] border-[#14231C] px-2 py-1.5 shadow-[0_-3px_0_#14231C]"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive =
            tab.path === '/'
              ? currentPath === '/'
              : currentPath.startsWith(tab.path);

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => navigate(tab.path)}
              className="relative flex flex-col items-center justify-center py-1 px-3 min-w-[56px] cursor-pointer text-[#14231C] select-none focus-visible:outline-none"
            >
              {/* Sliding ink indicator background */}
              {isActive && (
                <motion.div
                  layoutId="bottom-tab-indicator"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  className="absolute inset-0 bg-[#14231C] rounded-[10px] -z-0"
                />
              )}

              {/* Icon & Badge */}
              <div className="relative z-10 flex items-center justify-center">
                <span
                  className={`text-base leading-none transition-transform ${
                    isActive ? 'scale-110' : ''
                  }`}
                >
                  {tab.icon}
                </span>

                {tab.badge !== undefined && (
                  <span
                    className={`
                      absolute -top-1.5 -right-3 px-1 rounded-full text-[9px] font-mono font-bold leading-none border-[1px]
                      ${
                        isActive
                          ? 'bg-[#E8502B] text-[#F3EBDD] border-[#F3EBDD]'
                          : 'bg-[#E8502B] text-[#F3EBDD] border-[#14231C]'
                      }
                    `}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={`
                  relative z-10 font-label-mono text-[9px] mt-0.5 tracking-wider uppercase
                  ${isActive ? 'text-[#F3EBDD] font-bold' : 'text-[#14231C]/70'}
                `}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
