import { Link } from 'react-router-dom';
import { useWishlistStore } from '../store';
import { ProductCard } from '../components/ProductCard';

export default function Wishlist() {
  const items = useWishlistStore((s) => s.items);

  return (
    <div className="pt-16 lg:pt-20 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Wishlist</h1>
          {items.length > 0 && (
            <div className="text-sm text-gray-600">{items.length} item(s)</div>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16">
<h3 className="text-xl font-bold mb-2">Your wishlist is empty</h3>
            <p className="text-gray-600 mb-6">Save products you like to view them later.</p>
            <Link to="/collections" className="px-6 py-3 bg-black text-white font-medium rounded hover:bg-red-500 transition-colors">Browse products</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {items.map(({ product }) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
