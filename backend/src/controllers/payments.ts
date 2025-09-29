import type { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import Razorpay from 'razorpay';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecret ? new Stripe(stripeSecret) : null;

const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
const razorpay = razorpayKeyId && razorpayKeySecret ? new Razorpay({ key_id: razorpayKeyId, key_secret: razorpayKeySecret }) : null;

export const getRazorpayKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID || null;
    res.status(200).json({ success: true, data: { keyId } });
  } catch (err) {
    next(err);
  }
};

export const createPaymentIntent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!stripe) {
      res.status(500).json({ success: false, message: 'Stripe secret key is not configured' });
      return;
    }

    const { amount, currency = 'usd', metadata = {} } = req.body as {
      amount: number; currency?: string; metadata?: Record<string, string>;
    };

    // Basic sanity checks
    if (amount < 50) {
      res.status(400).json({ success: false, message: 'Amount must be at least 50 cents' });
      return;
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: {
        ...metadata,
        userId: (req.user as any)?._id?.toString() || 'guest',
      },
      automatic_payment_methods: { enabled: true },
    });

    res.status(200).json({ 
      success: true, 
      data: { 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      } 
    });
  } catch (err) {
    next(err);
  }
};

export const createRazorpayOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!razorpay) {
      res.status(500).json({ success: false, message: 'Razorpay is not configured' });
      return;
    }
    const { amount, orderNumber, notes } = req.body as { amount: number; orderNumber?: string; notes?: Record<string, string> };
    if (!amount || amount < 100) {
      res.status(400).json({ success: false, message: 'Amount must be at least 100 paise (₹1)' });
      return;
    }

    const receipt = orderNumber || `rcpt_${Date.now()}`;
    const order = await razorpay.orders.create({ amount, currency: 'INR', receipt, notes });
    res.status(200).json({ success: true, data: { orderId: order.id, amount: order.amount, currency: order.currency, receipt } });
  } catch (err) {
    next(err);
  }
};

// Razorpay webhook handler with signature verification
export const handleRazorpayWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string | undefined;
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!signature || !secret) {
      res.status(400).json({ success: false, message: 'Missing Razorpay signature or secret' });
      return;
    }

    const rawBody = (req.body instanceof Buffer) ? req.body : Buffer.from(JSON.stringify(req.body));
    const crypto = await import('crypto');
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    if (expected !== signature) {
      res.status(400).json({ success: false, message: 'Invalid Razorpay signature' });
      return;
    }

    const payload = JSON.parse(rawBody.toString());
    const event = payload.event as string;

    // Attempt to map to an order via receipt (we use orderNumber as receipt when creating order)
    const orderEntity = payload.payload?.order?.entity;
    const paymentEntity = payload.payload?.payment?.entity;

    if (orderEntity?.receipt) {
      const orderNumber = orderEntity.receipt as string;
      // Update order record by order_number
      const updates: any = { payment_status: 'paid', order_status: 'confirmed', razorpay_order_id: orderEntity.id };
      if (paymentEntity?.id) updates.razorpay_payment_id = paymentEntity.id;
      const { supabaseAdmin } = await import('@/utils/supabase');
      await supabaseAdmin
        .from('orders')
        .update(updates)
        .eq('order_number', orderNumber);

      // Send order confirmation email using template and schedule processing
      try {
        const { data: orderRow } = await supabaseAdmin
          .from('orders')
          .select('*')
          .eq('order_number', orderNumber)
          .single();
        if (orderRow) {
          const { sendOrderEmail } = await import('@/services/orderEmailService');
          const { persistentEmailQueue } = await import('@/services/persistentEmailQueue');
          await sendOrderEmail('confirmed', { order: orderRow });
          
          // Schedule processing email
          const runAt = new Date(Date.now() + 90 * 60 * 1000);
          const recipientEmail = orderRow.shipping_address?.email || orderRow.billing_address?.email;
          if (recipientEmail) {
            await persistentEmailQueue.schedule(orderNumber, 'processing', recipientEmail, runAt);
          }
        }
      } catch (e) {
        console.log('Payment email notify failed:', (e as any)?.message);
      }
    }

    res.status(200).json({ success: true, message: 'Webhook processed' });
  } catch (err) {
    next(err);
  }
};

export const handleStripeWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!stripe || !webhookSecret) {
      res.status(500).json({ success: false, message: 'Stripe not configured' });
      return;
    }

    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment succeeded:', paymentIntent.id);
        // TODO: Update order status, send confirmation email, etc.
        break;
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        console.log('Payment failed:', failedPayment.id);
        // TODO: Handle failed payment
        break;
      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    next(err);
  }
};