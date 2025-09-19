import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Plus, Minus, Heart, Truck, Shield, RotateCcw } from 'lucide-react';
import { products } from '../data/index';
import { useCartStore, useWishlistStore } from '../store/index';
import { formatPrice, cn } from '../utils/index';
import { ProductGallery } from '../components/ProductGallery';
import { MagneticButton } from '../components/MagneticButton';

export const Product = () => {
  const { id } = useParams();
  // Image state handled by ProductGallery
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  
  const product = products.find(p => p.id === id);
  const addToCart = useCartStore(state => state.addItem);
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore();
  
  if (!product) {
    return (
      <div className="pt-16 lg:pt-20 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product not found</h1>
          <Link to="/collections" className="text-orange-500 hover:underline">
            Return to Collections
          </Link>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (selectedSize && selectedColor) {
      addToCart(product, selectedSize, selectedColor, quantity);
    }
  };

  const isWishlisted = isInWishlist(product.id);

  return (
    <div className="pt-16 lg:pt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div>
            <ProductGallery images={product.images} alt={product.name} />
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <p className="text-gray-600 mb-4">{product.brand}</p>
            <div className="flex items-center gap-4 mb-6">
              <span className="text-2xl font-bold">{formatPrice(product.price)}</span>
              {product.originalPrice && (
                <span className="text-xl text-gray-500 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>

            <p className="text-gray-700 mb-6">{product.description}</p>

            {/* Size Selection */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Size</h3>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={cn(
                      "px-4 py-2 border rounded transition-colors",
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

            {/* Color Selection */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Color</h3>
              <div className="flex flex-wrap gap-2">
                {product.colors.map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={cn(
                      "px-4 py-2 border rounded transition-colors",
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

            {/* Quantity */}
            <div className="mb-8">
              <h3 className="font-semibold mb-3">Quantity</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  <Minus size={16} />
                </button>
                <span className="text-xl font-medium w-8 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 mb-8">
              <MagneticButton strength={0.2} as="div">
                <button
                  onClick={handleAddToCart}
                  disabled={!selectedSize || !selectedColor || !product.inStock}
                  className="flex-1 py-4 bg-black text-white font-bold uppercase tracking-wider hover:bg-orange-500 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed rounded"
                >
                  {product.inStock ? 'Add to Cart' : 'Sold Out'}
                </button>
              </MagneticButton>
              <button
                onClick={() => isWishlisted ? removeFromWishlist(product.id) : addToWishlist(product)}
                className={cn(
                  "px-6 py-4 border-2 rounded transition-colors",
                  isWishlisted
                    ? "border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                    : "border-gray-300 hover:border-black"
                )}
              >
                <Heart size={20} className={isWishlisted ? "fill-current" : ""} />
              </button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center gap-3 p-4 border border-gray-200 rounded">
                <Truck size={20} className="text-gray-600" />
                <span className="text-sm">Free shipping on orders over $100</span>
              </div>
              <div className="flex items-center gap-3 p-4 border border-gray-200 rounded">
                <RotateCcw size={20} className="text-gray-600" />
                <span className="text-sm">30-day return policy</span>
              </div>
              <div className="flex items-center gap-3 p-4 border border-gray-200 rounded">
                <Shield size={20} className="text-gray-600" />
                <span className="text-sm">1-year warranty</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};