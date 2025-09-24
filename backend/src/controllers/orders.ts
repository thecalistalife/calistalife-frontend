import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '@/utils/supabase';
import { sendMail } from '@/utils/email';

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

    try {
      const toEmail = (shippingAddress?.email || (user?.email)) as string | undefined;
      if (toEmail) {
        await sendMail({
          to: toEmail,
          subject: `Order received: ${orderNumber}`,
          html: `<p>Thanks for your order.</p><p>Your order number is <b>${orderNumber}</b>.</p><p>Total: <b>${totalAmount}</b></p>`
        });
      }
    } catch (e) {
      console.log('Email notify failed:', (e as any)?.message);
    }

    res.status(200).json({ success: true, message: 'Order created', data: { id: orderRow!.id, orderNumber } });
  } catch (err) {
    next(err);
  }
};

export const getMyOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (!user) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
    const userId = user._id || user.id;
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

export const getOrderById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (!user) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
    const userId = user._id || user.id;
    const { id } = req.params as any;
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    if (!data) { res.status(404).json({ success: false, message: 'Order not found' }); return; }
    if (data.user_id !== userId && (user.role !== 'admin')) { res.status(403).json({ success: false, message: 'Forbidden' }); return; }
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

export const getOrderByNumber = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderNumber } = req.params as any;
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('order_number', orderNumber)
      .single();
    if (error) throw error;
    if (!data) { res.status(404).json({ success: false, message: 'Order not found' }); return; }
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};
