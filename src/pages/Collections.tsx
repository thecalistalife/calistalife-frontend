import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Filter, Grid, List, X } from 'lucide-react';
import { ProductCard } from '../components/index';
import { useSearchStore } from '../store/index';
import { cn } from '../utils/index';
import type { SortOption } from '../types/index';
import { ProductsAPI, type ProductQuery } from '../lib/api';

export const Collections = () => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const { query, filters, sortBy, setFilters, setSortBy, resetFilters } = useSearchStore();

  const params: ProductQuery = {
    page: 1,
    limit: 24,
    search: query || undefined,
    category: filters.categories[0] || undefined,
    collection: filters.collections[0] || undefined,
    brand: filters.brands[0] || undefined,
    minPrice: filters.priceRange[0] || undefined,
    maxPrice: filters.priceRange[1] || undefined,
    sizes: filters.sizes.length ? filters.sizes : undefined,
    colors: filters.colors.length ? filters.colors : undefined,
    inStock: filters.inStock || undefined,
    sortBy,
  };

  const { data: filterData } = useQuery({
    queryKey: ['filters'],
    queryFn: async () => (await ProductsAPI.filters()).data.data as any,
  });

  const { data: listData, isLoading } = useQuery({
    queryKey: ['products', params],
    queryFn: async () => (await ProductsAPI.list(params)).data,
  });

  const products = listData?.data ?? [];
  const total = listData?.pagination?.total ?? products.length;

  const handleFilterChange = (key: keyof typeof filters, value: any) => {
    setFilters({ [key]: value });
  };

  const handleArrayFilterToggle = (key: keyof typeof filters, value: string) => {
    const currentValues = filters[key] as string[];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    setFilters({ [key]: newValues });
  };

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'featured', label: 'Featured' },
    { value: 'newest', label: 'Newest' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'name', label: 'Name' },
  ];

  return (
    <div className="pt-16 lg:pt-20">
      {/* Header */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-black mb-6">
              Our Collections
            </h1>
            <p className="text-xl text-gray-600">
              Discover our curated collections of contemporary streetwear
            </p>
          </div>
        </div>
      </section>

      {/* Filters and Sort */}
      <section className="py-8 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:border-black transition-colors"
              >
                <Filter size={16} />
                Filters
              </button>
              
              {Object.values(filters).some(f => Array.isArray(f) ? f.length > 0 : f) && (
                <button
                  onClick={resetFilters}
                  className="text-sm text-gray-600 hover:text-black transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="flex items-center gap-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "p-2 transition-colors",
                    viewMode === 'grid' ? "bg-black text-white" : "hover:bg-gray-50"
                  )}
                >
                  <Grid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "p-2 transition-colors",
                    viewMode === 'list' ? "bg-black text-white" : "hover:bg-gray-50"
                  )}
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>

            <div className="mt-4 text-sm text-gray-600">
            {isLoading ? 'Loading products...' : `Showing ${products.length} of ${total} products`}
          </div>
        </div>
      </section>

      {/* Filters Sidebar */}
      {isFilterOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 lg:relative lg:bg-transparent">
          <div className="absolute left-0 top-0 bottom-0 w-80 bg-white p-6 overflow-y-auto lg:relative lg:w-auto">
            <div className="flex justify-between items-center mb-6 lg:hidden">
              <h3 className="text-lg font-bold">Filters</h3>
              <button onClick={() => setIsFilterOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {/* Categories */}
            <div className="mb-6">
              <h4 className="font-semibold mb-3">Categories</h4>
              <div className="space-y-2">
                {(filterData?.categories ?? []).map((category: string) => (
                  <label key={category} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(category)}
                      onChange={() => handleArrayFilterToggle('categories', category)}
                      className="mr-2"
                    />
                    {category}
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="mb-6">
              <h4 className="font-semibold mb-3">Price Range</h4>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={filters.priceRange[0]}
                  onChange={(e) => handleFilterChange('priceRange', [Number(e.target.value), filters.priceRange[1]])}
                  className="w-20 px-2 py-1 border rounded"
                  placeholder="Min"
                />
                <span>-</span>
                <input
                  type="number"
                  value={filters.priceRange[1]}
                  onChange={(e) => handleFilterChange('priceRange', [filters.priceRange[0], Number(e.target.value)])}
                  className="w-20 px-2 py-1 border rounded"
                  placeholder="Max"
                />
              </div>
            </div>

            {/* Sizes */}
            <div className="mb-6">
              <h4 className="font-semibold mb-3">Sizes</h4>
              <div className="flex flex-wrap gap-2">
                {(filterData?.sizes ?? []).map((size: string) => (
                  <button
                    key={size}
                    onClick={() => handleArrayFilterToggle('sizes', size)}
                    className={cn(
                      "px-3 py-2 border rounded transition-colors",
                      filters.sizes.includes(size)
                        ? "border-black bg-black text-white"
                        : "border-gray-300 hover:border-black"
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div className="mb-6">
              <h4 className="font-semibold mb-3">Colors</h4>
              <div className="flex flex-wrap gap-2">
                {(filterData?.colors ?? []).map((color: string) => (
                  <button
                    key={color}
                    onClick={() => handleArrayFilterToggle('colors', color)}
                    className={cn(
                      "px-3 py-2 border rounded transition-colors text-sm",
                      filters.colors.includes(color)
                        ? "border-black bg-black text-white"
                        : "border-gray-300 hover:border-black"
                    )}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            {/* In Stock */}
            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.inStock}
                  onChange={(e) => handleFilterChange('inStock', e.target.checked)}
                  className="mr-2"
                />
                In Stock Only
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="text-center py-12">Loading...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-bold mb-4">No products found</h3>
              <p className="text-gray-600 mb-6">Try adjusting your filters or search terms</p>
              <button
                onClick={resetFilters}
                className="px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-orange-500 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className={cn(
              "grid gap-8",
              viewMode === 'grid' 
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "grid-cols-1"
            )}>
              {products.map((p: any) => {
                const product = {
                  ...p,
                  id: p.id || p._id || p.slug,
                };
                return (
                  <ProductCard 
                    key={product.id}
                    product={product}
                    className={viewMode === 'list' ? "flex flex-row" : ""}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};