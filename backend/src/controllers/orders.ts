import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '@/utils/supabase';

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user || null;
    const {
      items,
      shippingAddress,
      billingAddress,
      subtotal,
      shippingCost = 0,
      tax = 0,
      totalAmount,
      payment,
      notes
    } = req.body as any;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: 'Order items are required' });
      return;
    }
    if (!totalAmount || totalAmount <= 0) {
      res.status(400).json({ success: false, message: 'Total amount is invalid' });
      return;
    }

    const orderNumber = `TC${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Insert order row
    const { data: orderRow, error: orderErr } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: user ? (user._id || user.id) : null,
        order_number: orderNumber,
        subtotal,
        shipping_cost: shippingCost,
        tax,
        total_amount: totalAmount,
        payment_method: payment?.method || 'cod',
        payment_status: payment?.status || 'pending',
        order_status: 'processing',
        shipping_address: shippingAddress || null,
        billing_address: billingAddress || null,
        notes: notes || null,
        stripe_session_id: null,
        stripe_payment_intent_id: null
      })
      .select('*')
      .single();

    if (orderErr) throw orderErr;

    // Insert order items
    const orderItems = items.map((it: any) => ({
      order_id: orderRow!.id,
      product_id: it.productId,
      name: it.name,
      image: it.image,
      size: it.size,
      color: it.color,
      quantity: it.quantity,
      price: it.price,
      total: Math.round((it.price || 0) * (it.quantity || 1))
    }));

    const { error: itemsErr } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems);

    if (itemsErr) throw itemsErr;

    res.status(200).json({ success: true, message: 'Order created', data: { id: orderRow!.id, orderNumber } });
  } catch (err) {
    next(err);
  }
};