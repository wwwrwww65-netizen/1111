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
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: string) => void;
  onViewDetails?: (productId: string) => void;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onViewDetails,
  className = '',
}) => {
  const {
    id,
    name,
    description,
    price,
    images,
    stock,
    rating = 0,
    reviewCount = 0,
  } = product;

  const mainImage = images[0] || '/placeholder-product.jpg';
  const isOutOfStock = stock <= 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i}>⭐</span>);
    }

    if (hasHalfStar) {
      stars.push(<span key="half">⭐</span>);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="text-gray-300">⭐</span>);
    }

    return stars;
  };

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
            target.src = '/placeholder-product.jpg';
          }}
        />
        {isOutOfStock && (
          <div className="absolute right-2 top-2 text-[11px] px-2 py-1 rounded-full bg-black/70 text-white">غير متوفر</div>
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
          <div className="mt-1 text-[13px] font-bold text-[#800020]">{formatPrice(price)}</div>
        </button>
      </div>
    </div>
  );
};