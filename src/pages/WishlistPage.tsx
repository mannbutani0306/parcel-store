import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Button,
  Sticker,
  Tag,
  Stamp,
  RatingStars,
  ScribbleUnderline,
  HandHeart,
} from '../components/ui';
import { useParcelStore } from '../store';
import { useToastStore } from '../store/toastStore';
import { formatINR } from '../lib/format';

export const WishlistPage: React.FC = () => {
  const navigate = useNavigate();
  const { wishlist, products, addToCart, toggleWishlist, currentUser } = useParcelStore();
  const { addToast } = useToastStore();

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center space-y-5 bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[22px] shadow-[4px_4px_0_#14231C] my-10">
        <Stamp text="IDENTIFICATION REQUIRED" variant="tomato" size="md" rotation={-2} />
        <h2 className="font-fraunces text-2xl font-semibold text-[#14231C]">
          Saved Wares Manifest
        </h2>
        <p className="text-xs text-[#14231C]/75 font-sans leading-relaxed">
          Sign into your recipient account to synchronize starred folios, brass instruments, and botanicals.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/login?redirect=/wishlist')}
          >
            Sign in to View Saved
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate('/shop')}
          >
            Browse Catalog
          </Button>
        </div>
      </div>
    );
  }

  const wishlistedProducts = products.filter((p) => wishlist.includes(p.id));

  const handleMoveToCart = (product: any) => {
    const res = addToCart(product, 1);
    if (res.success) {
      toggleWishlist(product.id);
      addToast({
        title: 'Moved to Postal Bag',
        message: `${product.name} transferred to your bag for dispatch`,
        variant: 'tomato',
      });
    } else {
      addToast({
        title: 'Notice',
        message: res.error || 'Could not move to bag',
        variant: 'stamp',
      });
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-10">
      {/* Header */}
      <div className="border-b-[1.5px] border-[#14231C] pb-4">
        <p className="font-label-mono text-xs text-[#14231C]/60">SAVED MANIFEST</p>
        <h1 className="font-fraunces text-3xl sm:text-4xl font-semibold tracking-tight text-[#14231C]">
          Saved <span className="font-fraunces-italic font-normal">Wares</span> ({wishlistedProducts.length})
        </h1>
        <div className="w-36 text-[#E8502B]">
          <ScribbleUnderline />
        </div>
      </div>

      {wishlistedProducts.length === 0 ? (
        <div className="py-20 text-center space-y-4 bg-[#EADFCB] rounded-[18px] border-[1.5px] border-[#14231C] p-8">
          <span className="text-4xl block">🤍</span>
          <h3 className="font-fraunces text-xl font-semibold">No saved wares yet</h3>
          <p className="text-xs text-[#14231C]/70 max-w-sm mx-auto font-sans">
            Tap the heart on any ware card to reserve it on your personal manifest.
          </p>
          <div className="pt-2">
            <Button variant="primary" size="sm" onClick={() => navigate('/shop')}>
              Explore Catalog
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {wishlistedProducts.map((product) => (
            <div
              key={product.id}
              className="bg-[#EADFCB] border-[1.5px] border-[#14231C] rounded-[18px] p-5 shadow-[3px_3px_0_#14231C] flex flex-col justify-between space-y-4"
            >
              <div
                onClick={() => navigate(`/product/${product.id}`)}
                className="relative w-full h-40 rounded-[12px] border-[1.5px] border-[#14231C] flex items-center justify-center cursor-pointer overflow-hidden p-4 group"
                style={{ backgroundColor: product.bgHex }}
              >
                <Sticker
                  emoji={product.emoji}
                  color={product.backdropColor}
                  size="xl"
                  rotation={-2}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWishlist(product.id);
                  }}
                  className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-[#F3EBDD] border-[1.5px] border-[#14231C] text-[#E8502B] hover:scale-110 transition-transform cursor-pointer shadow-[1px_1px_0_#14231C]"
                  aria-label="Remove from saved"
                >
                  <HandHeart size={16} filled />
                </button>
              </div>

              <div className="space-y-1.5 flex-1">
                <span className="font-label-mono text-[10px] text-[#14231C]/60 uppercase">
                  {product.brand} · {product.category}
                </span>
                <Link
                  to={`/product/${product.id}`}
                  className="font-fraunces font-semibold text-base text-[#14231C] hover:text-[#E8502B] block leading-snug"
                >
                  {product.name}
                </Link>
                <div className="flex items-center justify-between pt-1">
                  <span className="font-mono font-bold text-base text-[#14231C]">
                    {formatINR(product.price)}
                  </span>
                  <RatingStars rating={product.rating} size={12} />
                </div>
              </div>

              <div className="pt-3 border-t border-[#14231C]/20 flex items-center justify-between gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  disabled={product.stock === 0}
                  onClick={() => handleMoveToCart(product)}
                  className="flex-1"
                >
                  {product.stock === 0 ? 'Out of Stock' : 'Move to Cart'}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    toggleWishlist(product.id);
                    addToast({
                      title: 'Removed from Saved',
                      message: `${product.name} removed from your wishlist`,
                      variant: 'stamp',
                    });
                  }}
                  className="text-[#E8502B] hover:bg-[#E8502B]/10"
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
