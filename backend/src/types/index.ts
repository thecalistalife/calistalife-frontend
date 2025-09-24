import { Request } from 'express';
import { Document } from 'mongoose';

// User Types
export interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: 'customer' | 'admin';
  avatar?: string;
  phone?: string;
  emailVerified: boolean;
  googleId?: string | null;
  refreshTokenHash?: string | null;
  refreshTokenExpires?: Date | null;
  passwordResetToken?: string | null;
  passwordResetExpires?: Date | null;
  emailVerificationToken?: string | null;
  emailVerificationExpires?: Date | null;
  addresses: IAddress[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IAddress {
  _id?: string;
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
}

// Product Types
export interface IProduct {
  _id: string;
  name: string;
  slug: string;
  brand: string;
  price: number;
  originalPrice?: number;
  images: string[];
  description: string;
  shortDescription?: string;
  category: string;
  collection: string;
  sizes: string[];
  colors: string[];
  tags: string[];
  inStock: boolean;
  stockQuantity: number;
  rating: number;
  reviews: number;
  isNew?: boolean;
  isBestSeller?: boolean;
  isOnSale?: boolean;
  isFeatured?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Cart Types
export interface ICartItem {
  product: string | IProduct;
  size: string;
  color: string;
  quantity: number;
  price: number;
}

export interface ICart extends Document {
  user: string | IUser;
  items: ICartItem[];
  totalAmount: number;
  createdAt: Date;
updatedAt: Date;
  addItem(productId: string, size: string, color: string, quantity: number, price: number): Promise<ICart>;
  removeItem(productId: string, size: string, color: string): Promise<ICart>;
  updateItemQuantity(productId: string, size: string, color: string, quantity: number): Promise<ICart>;
  clearCart(): Promise<ICart>;
  getTotalItems(): number;
}

// Wishlist Types
export interface IWishlistItem {
  product: string | IProduct;
  addedAt: Date;
}

export interface IWishlist extends Document {
  user: string | IUser;
  items: IWishlistItem[];
  createdAt: Date;
updatedAt: Date;
  addItem(productId: string): Promise<IWishlist>;
  removeItem(productId: string): Promise<IWishlist>;
}

// Order Types
export interface IOrderItem {
  product: string | IProduct;
  name: string;
  image: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
  total: number;
}

export interface IOrder extends Document {
  _id: string;
  user: string | IUser;
  orderNumber: string;
  items: IOrderItem[];
  shippingAddress: IAddress;
  billingAddress: IAddress;
  paymentMethod: 'stripe' | 'paypal';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  orderStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  shippingCost: number;
  tax: number;
  totalAmount: number;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Collection Types
export interface ICollection extends Document {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// Review Types
export interface IReview extends Document {
  _id: string;
  user: string | IUser;
  product: string | IProduct;
  rating: number;
  title: string;
  comment: string;
  isVerified: boolean;
  helpful: number;
  createdAt: Date;
  updatedAt: Date;
}

// Request Extensions
export interface AuthRequest extends Request {
  user?: IUser;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Query Types
export interface ProductQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  collection?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  sizes?: string[];
  colors?: string[];
  inStock?: boolean;
  sortBy?: 'featured' | 'newest' | 'price-low' | 'price-high' | 'name' | 'rating';
}

// Filter Types
export type SortOption = 'featured' | 'newest' | 'price-low' | 'price-high' | 'name' | 'rating';

export interface FilterOptions {
  categories: string[];
  collections: string[];
  brands: string[];
  priceRange: [number, number];
  sizes: string[];
  colors: string[];
  inStock: boolean;
}