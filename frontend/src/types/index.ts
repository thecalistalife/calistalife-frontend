export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  images: string[];
  description: string;
  category: string;
  collection: string;
  sizes: string[];
  colors: string[];
  tags: string[];
  inStock: boolean;
  rating: number;
  reviews: number;
  isNew?: boolean;
  isBestSeller?: boolean;
  isOnSale?: boolean;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  image: string;
  productCount: number;
  slug: string;
}

export interface CartItem {
  product: Product;
  size: string;
  color: string;
  quantity: number;
}

export interface WishlistItem {
  product: Product;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  createdAt: Date;
  shippingAddress: Address;
  billingAddress: Address;
}

export interface Address {
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export type SortOption = 'featured' | 'newest' | 'price-low' | 'price-high' | 'name';

export interface FilterOptions {
  categories: string[];
  collections: string[];
  brands: string[];
  priceRange: [number, number];
  sizes: string[];
  colors: string[];
  inStock: boolean;
}