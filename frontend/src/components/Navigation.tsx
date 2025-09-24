import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Search, 
  User, 
  ShoppingBag, 
  Heart, 
  Menu, 
  X
} from 'lucide-react';
import { useCartStore, useWishlistStore, useSearchStore } from '../store/index';
import { cn } from '../utils/index';

export const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();
  
  const cartItems = useCartStore((state) => state.getTotalItems());
  const wishlistItems = useWishlistStore((state) => state.getTotalItems());
  const { query, setQuery } = useSearchStore();
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSuggestions = async (q: string) => {
    if (!q || q.length < 2) { setSuggestions([]); return; }
    try {
      setLoading(true);
      const { ProductsAPI } = await import('../lib/api');
      const res = await ProductsAPI.searchSuggestions(q);
      const list = (res.data.data ?? []).map((p: any) => ({ ...p, id: p.id || p._id || p.slug }));
      setSuggestions(list);
    } finally {
      setLoading(false);
    }
  };

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Collections', href: '/collections' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  const isActivePage = (href: string) => {
    return location.pathname === href;
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(query)}`;
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link 
              to="/" 
              className="text-2xl lg:text-3xl font-black uppercase tracking-tighter text-black hover:text-orange-500 transition-colors"
            >
              thecalista
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className={cn(
                    "text-sm font-semibold uppercase tracking-wide transition-colors",
                    isActivePage(link.href)
                      ? "text-orange-500"
                      : "text-gray-800 hover:text-orange-500"
                  )}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Desktop Icons */}
            <div className="hidden lg:flex items-center space-x-6">
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="text-gray-800 hover:text-orange-500 transition-colors"
                aria-label="Search"
              >
                <Search size={20} />
              </button>
              
              <Link 
                to="/account"
                className="text-gray-800 hover:text-orange-500 transition-colors"
                aria-label="Account"
              >
                <User size={20} />
              </Link>
              
              <Link 
                to="/wishlist"
                className="relative text-gray-800 hover:text-orange-500 transition-colors"
                aria-label="Wishlist"
              >
                <Heart size={20} />
                {wishlistItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {wishlistItems}
                  </span>
                )}
              </Link>
              
              <Link 
                to="/cart"
                className="relative text-gray-800 hover:text-orange-500 transition-colors"
                aria-label="Shopping Cart"
              >
                <ShoppingBag size={20} />
                {cartItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItems}
                  </span>
                )}
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-gray-800 hover:text-orange-500 transition-colors"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden py-4 border-t border-gray-100">
              <div className="flex flex-col space-y-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "py-2 text-base font-semibold uppercase tracking-wide transition-colors",
                      isActivePage(link.href)
                        ? "text-orange-500"
                        : "text-gray-800 hover:text-orange-500"
                    )}
                  >
                    {link.name}
                  </Link>
                ))}
                
                {/* Mobile Icons */}
                <div className="flex space-x-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setIsSearchOpen(!isSearchOpen);
                      setIsMobileMenuOpen(false);
                    }}
                    className="text-gray-800 hover:text-orange-500 transition-colors"
                    aria-label="Search"
                  >
                    <Search size={20} />
                  </button>
                  
                  <Link 
                    to="/account"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-gray-800 hover:text-orange-500 transition-colors"
                    aria-label="Account"
                  >
                    <User size={20} />
                  </Link>
                  
                  <Link 
                    to="/wishlist"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="relative text-gray-800 hover:text-orange-500 transition-colors"
                    aria-label="Wishlist"
                  >
                    <Heart size={20} />
                    {wishlistItems > 0 && (
                      <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {wishlistItems}
                      </span>
                    )}
                  </Link>
                  
                  <Link 
                    to="/cart"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="relative text-gray-800 hover:text-orange-500 transition-colors"
                    aria-label="Shopping Cart"
                  >
                    <ShoppingBag size={20} />
                    {cartItems > 0 && (
                      <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {cartItems}
                      </span>
                    )}
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-white z-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">Search Products</h2>
              <button 
                onClick={() => setIsSearchOpen(false)}
                className="p-2 hover:text-orange-500 transition-colors"
                aria-label="Close Search"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={query}
                placeholder="What are you looking for?"
                className="w-full p-4 border-2 border-black rounded-lg text-xl focus:outline-none focus:border-orange-500"
                autoFocus
                onChange={(e) => { setQuery(e.target.value); fetchSuggestions(e.target.value); }}
              />
              <button 
                type="submit"
                className="absolute right-2 top-2 p-2 bg-black text-white rounded-lg hover:bg-orange-500 transition-colors"
                aria-label="Search"
              >
                <Search size={20} />
              </button>
            </form>
            {/* Suggestions */}
            <div className="mt-4">
              {loading && <div className="text-gray-500">Loading...</div>}
              {!loading && suggestions.length > 0 && (
                <ul className="divide-y rounded-lg border">
                  {suggestions.map((s) => (
                    <li key={s.id} className="p-3 hover:bg-gray-50">
                      <Link to={`/product/${s.slug || s.id}`} onClick={() => setIsSearchOpen(false)} className="flex items-center gap-3">
                        <img src={(s.images && s.images[0]) || '/vite.svg'} alt={s.name} className="w-10 h-10 object-cover rounded" />
                        <div className="flex-1">
                          <div className="font-medium">{s.name}</div>
                          <div className="text-xs text-gray-500">{s.category}</div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};