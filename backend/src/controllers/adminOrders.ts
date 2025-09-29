import { Request, Response } from 'express';
import { supabaseAdmin } from '@/utils/supabase';
import { sendOrderEmail } from '@/services/orderEmailService';
import { persistentEmailQueue } from '@/services/persistentEmailQueue';
import { smsService } from '@/services/smsService';
import type { OrderStatus } from '@/utils/order';

export const listOrders = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ success: false, message: 'Failed to fetch orders' });
    return res.status(200).json({ success: true, data });
  } catch {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as any;
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', id)
      .single();
    if (error) return res.status(404).json({ success: false, message: 'Order not found' });
    return res.status(200).json({ success: true, data });
  } catch {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as any;
    const { order_status, tracking_number, courier, track_url, estimated_delivery } = req.body as Partial<{ order_status: OrderStatus; tracking_number: string; courier: string; track_url: string; estimated_delivery: string; }>;

    const updates: any = {};
    if (order_status) updates.order_status = order_status;
    if (tracking_number !== undefined) updates.tracking_number = tracking_number;
    if (courier !== undefined) updates.courier = courier;
    if (track_url !== undefined) updates.track_url = track_url;
    if (estimated_delivery !== undefined) updates.estimated_delivery = estimated_delivery;

    if (Object.keys(updates).length === 0) return res.status(400).json({ success: false, message: 'No updates provided' });

    const { data: orderRow, error } = await supabaseAdmin
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();
    if (error) return res.status(400).json({ success: false, message: error.message });

    // Send status emails, SMS, and schedule follow-up if delivered
    try {
      const recipientEmail = orderRow.shipping_address?.email || orderRow.billing_address?.email;
      
      if (order_status === 'shipped') {
        await sendOrderEmail('shipped', { order: orderRow, trackingNumber: tracking_number, courier, trackUrl: track_url, estDelivery: estimated_delivery || undefined });
        await smsService.sendOrderSMS('shipped', orderRow, tracking_number);
      } else if (order_status === 'out_for_delivery') {
        await sendOrderEmail('out_for_delivery', { order: orderRow });
        await smsService.sendOrderSMS('out_for_delivery', orderRow);
      } else if (order_status === 'delivered') {
        await sendOrderEmail('delivered', { order: orderRow });
        await smsService.sendOrderSMS('delivered', orderRow);
        
        // Schedule follow-up email in 3 days
        if (recipientEmail) {
          const in3days = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
          await persistentEmailQueue.schedule(orderRow.order_number, 'follow_up', recipientEmail, in3days);
        }
      }
    } catch {}

    return res.status(200).json({ success: true, data: orderRow });
  } catch {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};