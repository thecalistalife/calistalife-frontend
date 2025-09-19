import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star } from 'lucide-react';
import type { Product } from '../types/index';
import { useCartStore, useWishlistStore } from '../store/index';
import { formatPrice, getDiscountPercentage, cn } from '../utils/index';

interface ProductCardProps {
  product: Product;
  className?: string;
}

export const ProductCard = ({ product, className }: ProductCardProps) => {
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || '');
  const [selectedColor, setSelectedColor] = useState(product.colors[0] || '');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  
  const addToCart = useCartStore((state) => state.addItem);
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore();
  
  const isWishlisted = isInWishlist(product.id);
  const discount = product.originalPrice ? getDiscountPercentage(product.price, product.originalPrice) : 0;

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isWishlisted) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (product.inStock) {
      if (product.sizes.length > 1 || product.colors.length > 1) {
        setIsQuickAddOpen(true);
      } else {
        addToCart(product, selectedSize, selectedColor);
      }
    }
  };

  const handleAddToCart = () => {
    addToCart(product, selectedSize, selectedColor);
    setIsQuickAddOpen(false);
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={i} size={12} className="fill-yellow-400 text-yellow-400" />
        ))}
        {hasHalfStar && (
          <Star size={12} className="fill-yellow-400/50 text-yellow-400" />
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={i} size={12} className="text-gray-300" />
        ))}
      </div>
    );
  };

  return (
    <div className={cn("group relative bg-white rounded-lg overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg", className)}>
      <Link to={`/product/${product.id}`} className="block">
        <div className="relative overflow-hidden">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-80 object-cover transition-transform duration-700 group-hover:scale-105"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://placehold.co/400x400?text=${encodeURIComponent(product.name)}&bg=E5E7EB&color=111827`;
            }}
          />
          
          {/* Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {product.isNew && (
              <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                New
              </span>
            )}
            {product.isBestSeller && (
              <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                Best Seller
              </span>
            )}
            {discount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                -{discount}%
              </span>
            )}
            {!product.inStock && (
              <span className="bg-gray-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                Sold Out
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            onClick={handleWishlistToggle}
            className={cn(
              "absolute top-4 right-4 p-2 rounded-full transition-all duration-200",
              isWishlisted
                ? "bg-red-500 text-white"
                : "bg-white/80 text-gray-700 hover:bg-red-500 hover:text-white"
            )}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart size={16} className={isWishlisted ? "fill-current" : ""} />
          </button>

          {/* Quick Add Button */}
          {product.inStock && (
            <button
              onClick={handleQuickAdd}
className="absolute bottom-4 left-4 right-4 bg-black text-white py-3 font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 hover:bg-red-500"
            >
              Quick Add
            </button>
          )}
        </div>

        <div className="p-4">
<h3 className="font-bold text-black mb-1 group-hover:text-red-600 transition-colors">
            {product.name}
          </h3>
          
          <p className="text-gray-600 text-sm mb-2">{product.brand}</p>
          
          <div className="flex items-center mb-2">
            {renderStars(product.rating)}
            <span className="ml-2 text-sm text-gray-600">({product.reviews})</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-black">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && (
                <span className="text-sm text-gray-500 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
            
            {product.inStock ? (
              <span className="text-sm text-green-600 font-medium">In Stock</span>
            ) : (
              <span className="text-sm text-red-600 font-medium">Sold Out</span>
            )}
          </div>
        </div>
      </Link>

      {/* Quick Add Modal */}
      {isQuickAddOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">{product.name}</h3>
            
            {product.sizes.length > 1 && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Size</label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={cn(
                        "px-3 py-2 border rounded transition-colors",
                        selectedSize === size
                          ? "border-black bg-black text-white"
                          : "border-gray-300 hover:border-black"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.colors.length > 1 && (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Color</label>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={cn(
                        "px-3 py-2 border rounded transition-colors",
                        selectedColor === color
                          ? "border-black bg-black text-white"
                          : "border-gray-300 hover:border-black"
                      )}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setIsQuickAddOpen(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddToCart}
                className="flex-1 px-4 py-3 bg-black text-white font-medium rounded hover:bg-orange-500 transition-colors"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};