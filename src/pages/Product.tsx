import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { Plus, Minus, Heart, Truck, Shield, RotateCcw } from 'lucide-react';
import { useCartStore, useWishlistStore } from '../store/index';
import { formatPrice, cn } from '../utils/index';
import { ProductGallery } from '../components/ProductGallery';
import { MagneticButton } from '../components/MagneticButton';
import { ProductsAPI } from '../lib/api';
import EnhancedProductReviews from '../components/reviews/EnhancedProductReviews';
import { ProductRecommendations, useRecentlyViewed } from '../components/recommendations/ProductRecommendations';

export const Product = () => {
  const { id } = useParams();
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  
  const { data, isLoading } = useQuery({
    queryKey: ['product', id],
    enabled: !!id,
    queryFn: async () => {
      try {
        return (await ProductsAPI.get(id!)).data.data as any;
      } catch (e) {
        const { products: sample } = await import('../data/index');
        const found = sample.find((p) => p.id === id || p.slug === id);
        if (!found) throw e;
        return found as any;
      }
    },
  });

  const product = data ? { ...data, id: data.id || data._id || data.slug } : null;
  const addToCart = useCartStore(state => state.addItem);
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore();
  const { addToRecentlyViewed } = useRecentlyViewed();

  // Add to recently viewed when product loads
  useEffect(() => {
    if (product) {
      addToRecentlyViewed(product);
    }
  }, [product, addToRecentlyViewed]);
  
  if (isLoading) {
    return (
      <div className="pt-16 lg:pt-20 min-h-screen flex items-center justify-center">Loading...</div>
    );
  }

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

            {/* Quality Information */}
            {(product.quality_grade || product.sustainability_rating || product.fabric_composition) && (
              <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                <h3 className="font-semibold mb-3 text-lg">Quality Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {product.quality_grade && (
                    <div className="text-center p-3 bg-white rounded border">
                      <div className="text-sm text-gray-600">Quality Grade</div>
                      <div className="font-semibold text-lg capitalize">{product.quality_grade}</div>
                    </div>
                  )}
                  {product.sustainability_rating && (
                    <div className="text-center p-3 bg-white rounded border">
                      <div className="text-sm text-gray-600">Sustainability</div>
                      <div className="font-semibold text-lg">{product.sustainability_rating}</div>
                    </div>
                  )}
                  {product.durability_score && (
                    <div className="text-center p-3 bg-white rounded border">
                      <div className="text-sm text-gray-600">Durability</div>
                      <div className="font-semibold text-lg">{product.durability_score}/10</div>
                    </div>
                  )}
                </div>
                
                {/* Fabric Information */}
                {(product.fabric_composition || product.thread_count || product.fabric_weight) && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Fabric Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {product.fabric_composition && Object.keys(product.fabric_composition).length > 0 && (
                        <div>
                          <span className="font-medium">Composition:</span>
                          {Object.entries(product.fabric_composition).map(([material, percentage], idx) => (
                            <span key={idx} className="ml-2">
                              {percentage}% {material}
                              {idx < Object.entries(product.fabric_composition).length - 1 ? ',' : ''}
                            </span>
                          ))}
                        </div>
                      )}
                      {product.thread_count && (
                        <div><span className="font-medium">Thread Count:</span> {product.thread_count}</div>
                      )}
                      {product.fabric_weight && (
                        <div><span className="font-medium">Weight:</span> {product.fabric_weight} oz/yd²</div>
                      )}
                      {product.stretch_level && (
                        <div><span className="font-medium">Stretch:</span> {product.stretch_level.replace('_', ' ')}</div>
                      )}
                      {product.breathability_rating && (
                        <div><span className="font-medium">Breathability:</span> {product.breathability_rating}/5</div>
                      )}
                      {product.fit_type && (
                        <div><span className="font-medium">Fit:</span> {product.fit_type} fit</div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Care Instructions */}
                {product.care_instructions && product.care_instructions.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Care Instructions</h4>
                    <ul className="text-sm text-gray-700 list-disc list-inside">
                      {product.care_instructions.map((instruction, idx) => (
                        <li key={idx}>{instruction}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Certifications */}
                {product.certifications && product.certifications.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Certifications</h4>
                    <div className="flex flex-wrap gap-2">
                      {product.certifications.map((cert, idx) => (
                        <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

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
                <span className="text-sm">Free shipping on orders over ₹999</span>
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

      {/* Reviews */}
      {product?.id && (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <EnhancedProductReviews productId={product.id} />
        </div>
      )}

      {/* Product Recommendations */}
      {product?.id && (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <ProductRecommendations 
            productId={product.id} 
            type="similar" 
            maxItems={4}
          />
          <ProductRecommendations 
            productId={product.id} 
            type="frequently_bought_together" 
            maxItems={3}
          />
        </div>
      )}
    </div>
  );
};
