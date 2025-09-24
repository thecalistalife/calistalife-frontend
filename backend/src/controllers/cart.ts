import { Response, NextFunction } from 'express';
import { AuthRequest, ApiResponse } from '@/types';
import { carts, wishlist } from '@/services/supabaseCart';

// Get user's cart
export const getCart = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = (req.user as any)._id || (req.user as any).id;
    const data = await carts.getCart(userId);
    res.status(200).json({ success: true, message: 'Cart retrieved successfully', data });
  } catch (error) {
    next(error);
  }
};

// Add item to cart
export const addToCart = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req.user as any)._id || (req.user as any).id;
    const { productId, size, color, quantity = 1, price } = req.body;
    const data = await carts.addItem(userId, { productId, size, color, quantity, price });
    res.status(200).json({ success: true, message: 'Item added to cart successfully', data });
  } catch (error) {
    next(error);
  }
};

// Update cart item quantity
export const updateCartItem = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req.user as any)._id || (req.user as any).id;
    const { productId, size, color, quantity } = req.body;
    if (quantity < 1) {
      res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
      return;
    }
    const data = await carts.updateItem(userId, { productId, size, color, quantity });
    res.status(200).json({ success: true, message: 'Cart item updated successfully', data });
  } catch (error) {
    next(error);
  }
};

// Remove item from cart
export const removeFromCart = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req.user as any)._id || (req.user as any).id;
    const { productId, size, color } = req.body;
    const data = await carts.removeItem(userId, { productId, size, color });
    res.status(200).json({ success: true, message: 'Item removed from cart successfully', data });
  } catch (error) {
    next(error);
  }
};

// Clear cart
export const clearCart = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req.user as any)._id || (req.user as any).id;
    const data = await carts.clearCart(userId);
    res.status(200).json({ success: true, message: 'Cart cleared successfully', data });
  } catch (error) {
    next(error);
  }
};

// Get user's wishlist
export const getWishlist = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = (req.user as any)._id || (req.user as any).id;
    const data = await wishlist.get(userId);
    res.status(200).json({ success: true, message: 'Wishlist retrieved successfully', data });
  } catch (error) {
    next(error);
  }
};

// Add item to wishlist
export const addToWishlist = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req.user as any)._id || (req.user as any).id;
    const { productId } = req.body;
    const data = await wishlist.add(userId, productId);
    res.status(200).json({ success: true, message: 'Item added to wishlist successfully', data });
  } catch (error) {
    next(error);
  }
};

// Remove item from wishlist
export const removeFromWishlist = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req.user as any)._id || (req.user as any).id;
    const { productId } = req.body;
    const data = await wishlist.remove(userId, productId);
    res.status(200).json({ success: true, message: 'Item removed from wishlist successfully', data });
  } catch (error) {
    next(error);
  }
};

// Toggle wishlist item (add if not present, remove if present)
export const toggleWishlistItem = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req.user as any)._id || (req.user as any).id;
    const { productId } = req.body;
    const data = await wishlist.toggle(userId, productId);
    res.status(200).json({ success: true, message: 'Wishlist updated successfully', data });
  } catch (error) {
    next(error);
  }
};
