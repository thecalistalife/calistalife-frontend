import { Product, FilterOptions, SortOption } from '@/types';

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
};

export const formatRating = (rating: number): string => {
  return rating.toFixed(1);
};

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const filterProducts = (
  products: Product[],
  query: string,
  filters: FilterOptions
): Product[] => {
  return products.filter((product) => {
    // Search query
    if (query) {
      const searchFields = [
        product.name,
        product.brand,
        product.description,
        ...product.tags,
      ].join(' ').toLowerCase();
      
      if (!searchFields.includes(query.toLowerCase())) {
        return false;
      }
    }

    // Categories
    if (filters.categories.length > 0 && !filters.categories.includes(product.category)) {
      return false;
    }

    // Collections
    if (filters.collections.length > 0 && !filters.collections.includes(product.collection)) {
      return false;
    }

    // Brands
    if (filters.brands.length > 0 && !filters.brands.includes(product.brand)) {
      return false;
    }

    // Price range
    if (product.price < filters.priceRange[0] || product.price > filters.priceRange[1]) {
      return false;
    }

    // Sizes
    if (filters.sizes.length > 0) {
      const hasMatchingSize = filters.sizes.some(size => product.sizes.includes(size));
      if (!hasMatchingSize) {
        return false;
      }
    }

    // Colors
    if (filters.colors.length > 0) {
      const hasMatchingColor = filters.colors.some(color => product.colors.includes(color));
      if (!hasMatchingColor) {
        return false;
      }
    }

    // In stock
    if (filters.inStock && !product.inStock) {
      return false;
    }

    return true;
  });
};

export const sortProducts = (products: Product[], sortBy: SortOption): Product[] => {
  const sortedProducts = [...products];

  switch (sortBy) {
    case 'newest':
      // Assuming newer products have higher IDs or isNew flag
      return sortedProducts.sort((a, b) => {
        if (a.isNew && !b.isNew) return -1;
        if (!a.isNew && b.isNew) return 1;
        return parseInt(b.id) - parseInt(a.id);
      });
    
    case 'price-low':
      return sortedProducts.sort((a, b) => a.price - b.price);
    
    case 'price-high':
      return sortedProducts.sort((a, b) => b.price - a.price);
    
    case 'name':
      return sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
    
    case 'featured':
    default:
      // Featured sort: best sellers first, then new items, then by rating
      return sortedProducts.sort((a, b) => {
        if (a.isBestSeller && !b.isBestSeller) return -1;
        if (!a.isBestSeller && b.isBestSeller) return 1;
        if (a.isNew && !b.isNew) return -1;
        if (!a.isNew && b.isNew) return 1;
        return b.rating - a.rating;
      });
  }
};

export const cn = (...classes: (string | undefined | null | boolean)[]): string => {
  return classes.filter(Boolean).join(' ');
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export const getDiscountPercentage = (price: number, originalPrice: number): number => {
  return Math.round(((originalPrice - price) / originalPrice) * 100);
};