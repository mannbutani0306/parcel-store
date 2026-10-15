import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t-[1.5px] border-[#14231C] bg-[#EADFCB] overflow-hidden select-none">
      {/* Tiny Links Header */}
      <div className="max-w-6xl mx-auto px-6 py-6 flex flex-wrap items-center justify-between gap-4 border-b-[1.5px] border-[#14231C]/20">
        <div className="flex items-center gap-3">
          <span className="font-label-mono text-xs font-semibold text-[#14231C]">
            G.P.O. DISPATCH 2026
          </span>
          <span className="text-[#14231C]/40">·</span>
          <span className="font-label-mono text-[10px] text-[#14231C]/65">
            ALL WARES HAND-TIED
          </span>
        </div>

        {/* Few tiny links */}
        <div className="flex flex-wrap items-center gap-5 text-xs font-label-mono text-[#14231C]/80">
          <Link to="/shop" className="hover:text-[#E8502B] hover:underline underline-offset-4">
            CATALOG
          </Link>
          <Link to="/orders" className="hover:text-[#E8502B] hover:underline underline-offset-4">
            DISPATCH TRACKING
          </Link>
          <Link to="/wishlist" className="hover:text-[#E8502B] hover:underline underline-offset-4">
            SAVED WARES
          </Link>
          <Link to="/seller" className="hover:text-[#E8502B] hover:underline underline-offset-4">
            SELLER DESK
          </Link>
          <Link to="/admin" className="hover:text-[#E8502B] hover:underline underline-offset-4">
            ADMIN REGISTRY
          </Link>
          <Link to="/kit" className="hover:text-[#E8502B] hover:underline underline-offset-4 opacity-70">
            SPECIMEN KIT
          </Link>
        </div>
      </div>

      {/* Giant Oversized "parcel" Wordmark Cropped at the Bottom */}
      <div className="relative w-full flex justify-center overflow-hidden pointer-events-none select-none">
        <span
          className="font-fraunces font-bold text-[#14231C]/12 text-[26vw] leading-[0.72] tracking-tighter uppercase translate-y-[12%]"
          aria-hidden="true"
        >
          parcel
        </span>
      </div>
    </footer>
  );
};
