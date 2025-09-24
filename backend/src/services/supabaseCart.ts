import { supabase, supabaseAdmin } from '@/utils/supabase';

export interface CartItemInput {
  productId: string;
  size: string;
  color: string;
  quantity: number;
  price?: number; // fallback if product table not joined
}

export const carts = {
  async ensureCart(userId: string) {
    let { data: cart, error } = await supabaseAdmin
      .from('carts')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    if (!cart) {
      const res = await supabaseAdmin
        .from('carts')
        .insert({ user_id: userId })
        .select('*')
        .single();
      if (res.error) throw res.error;
      cart = res.data;
    }
    return cart;
  },

  async getCart(userId: string) {
    const cart = await this.ensureCart(userId);

    const { data: items, error } = await supabaseAdmin
      .from('cart_items')
      .select('*')
      .eq('cart_id', cart.id)
      .order('created_at', { ascending: true });
    if (error) throw error;

    return { cart, items };
  },

  async addItem(userId: string, input: CartItemInput) {
    const cart = await this.ensureCart(userId);

    // try to find existing item with same product/size/color
    const { data: existing, error: findErr } = await supabaseAdmin
      .from('cart_items')
      .select('*')
      .eq('cart_id', cart.id)
      .eq('product_id', input.productId)
      .eq('size', input.size)
      .eq('color', input.color)
      .maybeSingle();
    if (findErr && findErr.code !== 'PGRST116') throw findErr;

    if (existing) {
      const { error } = await supabaseAdmin
        .from('cart_items')
        .update({ quantity: existing.quantity + input.quantity })
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabaseAdmin
        .from('cart_items')
        .insert({
          cart_id: cart.id,
          product_id: input.productId,
          size: input.size,
          color: input.color,
          quantity: input.quantity,
          price: input.price ?? 0,
        });
      if (error) throw error;
    }

    return this.getCart(userId);
  },

  async updateItem(userId: string, input: CartItemInput) {
    const cart = await this.ensureCart(userId);
    const { error } = await supabaseAdmin
      .from('cart_items')
      .update({ quantity: input.quantity })
      .eq('cart_id', cart.id)
      .eq('product_id', input.productId)
      .eq('size', input.size)
      .eq('color', input.color);
    if (error) throw error;
    return this.getCart(userId);
  },

  async removeItem(userId: string, input: Omit<CartItemInput, 'quantity' | 'price'>) {
    const cart = await this.ensureCart(userId);
    const { error } = await supabaseAdmin
      .from('cart_items')
      .delete()
      .eq('cart_id', cart.id)
      .eq('product_id', input.productId)
      .eq('size', input.size)
      .eq('color', input.color);
    if (error) throw error;
    return this.getCart(userId);
  },

  async clearCart(userId: string) {
    const cart = await this.ensureCart(userId);
    const { error } = await supabaseAdmin
      .from('cart_items')
      .delete()
      .eq('cart_id', cart.id);
    if (error) throw error;
    return this.getCart(userId);
  },
};

export const wishlist = {
  async ensure(userId: string) {
    let { data: row, error } = await supabaseAdmin
      .from('wishlists')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    if (!row) {
      const res = await supabaseAdmin
        .from('wishlists')
        .insert({ user_id: userId })
        .select('*')
        .single();
      if (res.error) throw res.error;
      row = res.data;
    }
    return row;
  },

  async get(userId: string) {
    const wl = await this.ensure(userId);
    const { data: items, error } = await supabaseAdmin
      .from('wishlist_items')
      .select('*')
      .eq('wishlist_id', wl.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return { wishlist: wl, items };
  },

  async add(userId: string, productId: string) {
    const wl = await this.ensure(userId);
    const { data: existing, error: findErr } = await supabaseAdmin
      .from('wishlist_items')
      .select('id')
      .eq('wishlist_id', wl.id)
      .eq('product_id', productId)
      .maybeSingle();
    if (findErr && findErr.code !== 'PGRST116') throw findErr;
    if (!existing) {
      const { error } = await supabaseAdmin
        .from('wishlist_items')
        .insert({ wishlist_id: wl.id, product_id: productId });
      if (error) throw error;
    }
    return this.get(userId);
  },

  async remove(userId: string, productId: string) {
    const wl = await this.ensure(userId);
    const { error } = await supabaseAdmin
      .from('wishlist_items')
      .delete()
      .eq('wishlist_id', wl.id)
      .eq('product_id', productId);
    if (error) throw error;
    return this.get(userId);
  },

  async toggle(userId: string, productId: string) {
    const wl = await this.ensure(userId);
    const { data: existing, error: findErr } = await supabaseAdmin
      .from('wishlist_items')
      .select('id')
      .eq('wishlist_id', wl.id)
      .eq('product_id', productId)
      .maybeSingle();
    if (findErr && findErr.code !== 'PGRST116') throw findErr;
    if (existing) {
      await supabaseAdmin.from('wishlist_items').delete().eq('id', existing.id);
    } else {
      await supabaseAdmin.from('wishlist_items').insert({ wishlist_id: wl.id, product_id: productId });
    }
    return this.get(userId);
  }
};
