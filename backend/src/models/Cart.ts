import { Schema, model } from 'mongoose';
import { ICart, ICartItem } from '@/types';

const cartItemSchema = new Schema<ICartItem>({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  size: {
    type: String,
    required: true
  },
  color: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  }
}, {
  _id: false
});

const cartSchema = new Schema<ICart>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  totalAmount: {
    type: Number,
    default: 0,
    min: [0, 'Total amount cannot be negative']
  }
}, {
  timestamps: true
});

// Pre-save middleware to calculate total amount
cartSchema.pre('save', function (next) {
  this.totalAmount = this.items.reduce((total: number, item: ICartItem) => {
    return total + (item.price * item.quantity);
  }, 0);
  next();
});

// Method to add item to cart
cartSchema.methods.addItem = function (productId: string, size: string, color: string, quantity: number, price: number) {
  const existingItemIndex = this.items.findIndex(
    (item: ICartItem) => 
      item.product.toString() === productId &&
      item.size === size &&
      item.color === color
  );

  if (existingItemIndex >= 0) {
    // Update existing item
    this.items[existingItemIndex].quantity += quantity;
  } else {
    // Add new item
    this.items.push({
      product: productId,
      size,
      color,
      quantity,
      price
    });
  }

  return this.save();
};

// Method to remove item from cart
cartSchema.methods.removeItem = function (productId: string, size: string, color: string) {
  this.items = this.items.filter(
    (item: ICartItem) => !(
      item.product.toString() === productId &&
      item.size === size &&
      item.color === color
    )
  );

  return this.save();
};

// Method to update item quantity
cartSchema.methods.updateItemQuantity = function (productId: string, size: string, color: string, quantity: number) {
  const item = this.items.find(
    (item: ICartItem) => 
      item.product.toString() === productId &&
      item.size === size &&
      item.color === color
  );

  if (item) {
    item.quantity = quantity;
  }

  return this.save();
};

// Method to clear cart
cartSchema.methods.clearCart = function () {
  this.items = [];
  return this.save();
};

// Method to get total items count
cartSchema.methods.getTotalItems = function () {
  return this.items.reduce((total: number, item: ICartItem) => total + item.quantity, 0);
};

export const Cart = model<ICart>('Cart', cartSchema);