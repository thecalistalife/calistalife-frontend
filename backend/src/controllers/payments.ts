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
    const { amount } = req.body as { amount: number };
    if (!amount || amount < 100) {
      res.status(400).json({ success: false, message: 'Amount must be at least 100 paise (₹1)' });
      return;
    }

    const order = await razorpay.orders.create({ amount, currency: 'INR', receipt: `rcpt_${Date.now()}` });
    res.status(200).json({ success: true, data: { orderId: order.id, amount: order.amount, currency: order.currency } });
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