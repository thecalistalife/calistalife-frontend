import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { HeroAnimated, ProductCard } from '../components/index';
import { ProductsAPI } from '../lib/api';

export const Home = () => {
  const { data: collectionsRes } = useQuery({
    queryKey: ['collections'],
    queryFn: async () => (await ProductsAPI.collections()).data.data as any[],
  });
  const { data: newArrivalsRes } = useQuery({
    queryKey: ['new-arrivals'],
    queryFn: async () => (await ProductsAPI.newArrivals(4)).data.data as any[],
  });
  const { data: bestSellersRes } = useQuery({
    queryKey: ['best-sellers'],
    queryFn: async () => (await ProductsAPI.bestSellers(4)).data.data as any[],
  });

  const collections = (collectionsRes ?? []).map((c: any) => ({ ...c, id: c.id || c._id || c.slug }));
  const newArrivals = (newArrivalsRes ?? []).map((p: any) => ({ ...p, id: p.id || p._id || p.slug }));
  const bestSellers = (bestSellersRes ?? []).map((p: any) => ({ ...p, id: p.id || p._id || p.slug }));

  return (
    <div className="pt-16 lg:pt-20">
      {/* Hero Section */}
      <HeroAnimated />

      {/* Featured Collections */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-black mb-4">
              Featured Collections
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover our curated collections of contemporary streetwear
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
{collections.slice(0, 3).map((collection) => (
              <div 
                key={collection.id}
                className="group cursor-pointer"
              >
                <div className="relative overflow-hidden rounded-lg mb-4">
                  <img
                    src={collection.image}
                    alt={collection.name}
                    className="w-full h-80 object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://placehold.co/600x400?text=${encodeURIComponent(collection.name)}&bg=E5E7EB&color=111827`;
                    }}
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all duration-300"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <Link
                      to={`/collections/${collection.slug}`}
className="block w-full bg-white text-black py-3 font-bold text-center uppercase tracking-wider hover:bg-red-500 hover:text-white transition-all"
                    >
                      View Collection
                    </Link>
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-black mb-2">
                    {collection.name}
                  </h3>
                  <p className="text-gray-600 mb-2">{collection.description}</p>
                  <p className="text-sm text-gray-500">
                    {collection.productCount} Products
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-black mb-4">
              New Arrivals
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover our latest pieces designed for everyday style
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link
              to="/collections"
              className="inline-block px-8 py-4 font-bold uppercase tracking-wider border-2 border-black text-black hover:bg-black hover:text-white transition-all"
            >
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-black mb-4">
              Best Sellers
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our customers' favorite pieces
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* About Section Preview */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-black mb-6">
                  Our Philosophy
                </h2>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  At TheCalista, we believe that true style comes from the intersection 
                  of comfort, quality, and contemporary design. Founded with a vision to 
                  redefine streetwear, we create pieces that speak to the modern individual 
                  who values both form and function.
                </p>
                <p className="text-gray-600 leading-relaxed mb-8">
                  Every piece in our collection is thoughtfully designed and ethically 
                  produced, ensuring that you not only look good but feel good about 
                  your choices.
                </p>
                <Link
                  to="/about"
className="inline-block px-8 py-4 font-bold uppercase tracking-wider bg-black text-white hover:bg-red-500 transition-all"
                >
                  Learn More About Us
                </Link>
              </div>
              <div className="bg-white rounded-lg p-8 shadow-lg">
                <h3 className="text-2xl font-bold text-black mb-6">
                  Our Values
                </h3>
                <ul className="space-y-4">
                  {[
                    'Sustainable fashion practices',
                    'Ethical manufacturing',
                    'Minimalist design approach',
                    'Quality over quantity',
                    'Inclusive sizing'
                  ].map((value, index) => (
                    <li key={index} className="flex items-start">
<span className="w-3 h-3 bg-red-500 rounded-full mt-1.5 mr-4 flex-shrink-0"></span>
                      <span className="text-gray-600">{value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-20 bg-black text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-6">
              Join Our Community
            </h2>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
              Subscribe to our newsletter for exclusive offers, new arrivals, and style inspiration.
            </p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
              <input
                type="email"
                placeholder="Your email address"
                className="flex-grow px-6 py-4 text-black rounded-lg focus:outline-none"
                required
              />
              <button
                type="submit"
className="px-8 py-4 font-bold uppercase tracking-wider bg-red-500 text-white hover:bg-white hover:text-black transition-all"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};
