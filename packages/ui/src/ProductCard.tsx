import React from 'react';
import { Button } from './Button';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  stock: number;
  rating?: number;
  reviewCount?: number;
  oldPrice?: number;
  discountPct?: number;
  isWishlisted?: boolean;
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: string) => void;
  onViewDetails?: (productId: string) => void;
  onToggleWishlist?: (productId: string) => void;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onViewDetails,
  onToggleWishlist,
  className = '',
}) => {
  const {
    id,
    name,
    price,
    images,
    stock,
    oldPrice,
    discountPct,
    isWishlisted,
  } = product;

  const mainImage = images[0] || '/images/placeholder-product.jpg';
  const isOutOfStock = stock <= 0;

  const formatPrice = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  return (
    <div className={`bg-white rounded-xl border overflow-hidden transition-colors ${className}`}>
      {/* Image */}
      <div className="relative w-full aspect-[3/4] bg-gray-100">
        <img
          src={mainImage}
          alt={name}
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.src = '/images/placeholder-product.jpg';
          }}
        />
        {!!discountPct && (
          <div className="absolute left-2 top-2 text-[11px] px-2 py-1 rounded-full bg-[#800020] text-white">-{discountPct}%</div>
        )}
        <button
          aria-label="wishlist"
          className={`absolute right-2 top-2 text-[18px] ${isWishlisted ? 'text-[#800020]' : 'text-white'} drop-shadow`}
          onClick={(e)=>{ e.preventDefault(); onToggleWishlist?.(id); }}
        >
          {isWishlisted ? '❤' : '♡'}
        </button>
        {isOutOfStock && (
          <div className="absolute right-2 bottom-2 text-[11px] px-2 py-1 rounded-full bg-black/70 text-white">غير متوفر</div>
        )}
      </div>
      {/* Info */}
      <div className="p-2">
        <button
          className="block text-right w-full"
          onClick={() => onViewDetails?.(id)}
          aria-label={`view-${id}`}
        >
          <div className="text-[12px] text-gray-700 line-clamp-2 leading-snug">{name}</div>
          <div className="mt-1 flex items-center gap-2">
            <div className="text-[13px] font-bold text-[#800020]">{formatPrice(price)}</div>
            {!!oldPrice && oldPrice > price && (
              <div className="text-[11px] text-gray-400 line-through">{formatPrice(oldPrice)}</div>
            )}
          </div>
        </button>
      </div>
    </div>
  );
};