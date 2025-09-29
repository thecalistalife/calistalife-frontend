// Enhanced Brevo Email Templates for CalistaLife
// Optimized for deliverability, personalization, and conversion

import { config } from '@/utils/config';

export interface CustomerData {
  email: string;
  firstName?: string;
  lastName?: string;
  totalSpent?: number;
  orderCount?: number;
  lastPurchaseDate?: string;
  preferredCategories?: string[];
  qualityScore?: number;
  sustainabilityRating?: number;
}

export interface ProductData {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  quality_grade?: string;
  sustainability_rating?: number;
  fabric_composition?: object;
  category?: string;
}

export interface OrderData {
  order_number: string;
  total: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    image_url?: string;
  }>;
  shipping_address?: object;
  tracking_number?: string;
  estimated_delivery?: string;
}

// Base template wrapper with CalistaLife branding
export function createBaseTemplate(content: string, preheader?: string): string {
  const logoUrl = process.env.BRAND_LOGO_URL || `${config.CLIENT_URL}/logo.svg`;
  const baseUrl = config.CLIENT_URL.replace(/\/$/, '');
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CalistaLife - Premium Fashion</title>
  ${preheader ? `<meta name="description" content="${preheader}">` : ''}
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f9fa; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #2c3e50, #3498db); padding: 30px 20px; text-align: center; }
    .logo { max-height: 50px; width: auto; }
    .content { padding: 30px 20px; line-height: 1.6; color: #2c3e50; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; }
    .button { display: inline-block; padding: 12px 24px; background: #e74c3c; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; }
    .quality-badge { display: inline-block; padding: 4px 8px; background: #27ae60; color: white; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
    .product-card { border: 1px solid #eee; border-radius: 8px; padding: 15px; margin: 10px 0; display: flex; align-items: center; }
    .product-image { width: 80px; height: 80px; object-fit: cover; border-radius: 6px; margin-right: 15px; }
    .sustainability-rating { color: #27ae60; font-weight: 600; }
    @media (max-width: 600px) {
      .content { padding: 20px 15px; }
      .product-card { flex-direction: column; text-align: center; }
      .product-image { margin: 0 0 10px 0; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${logoUrl}" alt="CalistaLife" class="logo">
      <h1 style="margin: 15px 0 0 0; color: white; font-size: 24px;">Premium Fashion, Conscious Choices</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p><strong>CalistaLife</strong> - Where Quality Meets Sustainability</p>
      <p>
        <a href="${baseUrl}/profile" style="color: #3498db; text-decoration: none;">Manage Preferences</a> | 
        <a href="${baseUrl}/unsubscribe" style="color: #3498db; text-decoration: none;">Unsubscribe</a> | 
        <a href="${baseUrl}/support" style="color: #3498db; text-decoration: none;">Contact Us</a>
      </p>
      <p>Follow us: 
        <a href="https://instagram.com/calistalife" style="color: #3498db;">Instagram</a> | 
        <a href="https://facebook.com/calistalife" style="color: #3498db;">Facebook</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

// 1. Welcome Series Email Templates
export function renderWelcomeEmail(customer: CustomerData): { subject: string; html: string } {
  const firstName = customer.firstName || 'Fashion Lover';
  const baseUrl = config.CLIENT_URL.replace(/\/$/, '');
  
  const content = `
    <h2 style="color: #2c3e50; margin-bottom: 20px;">Welcome to CalistaLife, ${firstName}! 🌟</h2>
    
    <p>Thank you for joining our community of conscious fashion enthusiasts! We're thrilled to have you discover the perfect blend of premium quality and sustainable style.</p>
    
    <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #2c3e50;">What Makes CalistaLife Special?</h3>
      <ul style="padding-left: 20px;">
        <li><span class="quality-badge">Premium</span> Quality grading on every piece</li>
        <li><span class="sustainability-rating">🌱 Sustainability</span> ratings for conscious shopping</li>
        <li>Carefully curated collections from ethical brands</li>
        <li>Expert care guides to extend garment life</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${baseUrl}/collections?utm_source=email&utm_medium=welcome&utm_campaign=new_customer" class="button">
        Discover Your Style
      </a>
    </div>
    
    <p style="font-size: 14px; color: #6c757d; border-left: 3px solid #3498db; padding-left: 15px; margin: 20px 0;">
      <strong>Exclusive Welcome Offer:</strong> Use code <strong>WELCOME15</strong> for 15% off your first order of premium quality pieces!
    </p>
    
    <p>Ready to build a wardrobe that reflects your values? Start exploring our curated collections today.</p>
    
    <p>Best regards,<br>The CalistaLife Team</p>
  `;
  
  return {
    subject: `Welcome to CalistaLife, ${firstName}! Your premium fashion journey starts here ✨`,
    html: createBaseTemplate(content, `Discover premium fashion that aligns with your values. Welcome to CalistaLife!`)
  };
}

// 2. Abandoned Cart Recovery Email
export function renderAbandonedCartEmail(customer: CustomerData, cartItems: ProductData[]): { subject: string; html: string } {
  const firstName = customer.firstName || 'Fashion Lover';
  const baseUrl = config.CLIENT_URL.replace(/\/$/, '');
  
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price, 0);
  const qualityItems = cartItems.filter(item => item.quality_grade === 'Premium' || item.quality_grade === 'Luxury');
  
  const itemsHtml = cartItems.map(item => `
    <div class="product-card">
      ${item.image_url ? `<img src="${item.image_url}" alt="${item.name}" class="product-image">` : ''}
      <div>
        <h4 style="margin: 0 0 5px 0; color: #2c3e50;">${item.name}</h4>
        ${item.quality_grade ? `<span class="quality-badge">${item.quality_grade}</span>` : ''}
        ${item.sustainability_rating ? `<div class="sustainability-rating">🌱 Sustainability Score: ${item.sustainability_rating}/5</div>` : ''}
        <div style="font-weight: 600; color: #e74c3c; margin-top: 5px;">$${item.price.toFixed(2)}</div>
      </div>
    </div>
  `).join('');
  
  const content = `
    <h2 style="color: #2c3e50; margin-bottom: 20px;">Don't let your perfect pieces get away, ${firstName}!</h2>
    
    <p>You have excellent taste! The premium items in your cart are carefully selected for their quality and sustainability.</p>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #2c3e50;">Your Selected Items:</h3>
      ${itemsHtml}
      <div style="text-align: right; margin-top: 15px; padding-top: 15px; border-top: 1px solid #dee2e6;">
        <strong style="font-size: 18px; color: #2c3e50;">Total: $${cartTotal.toFixed(2)}</strong>
      </div>
    </div>
    
    ${qualityItems.length > 0 ? `
      <div style="background: linear-gradient(135deg, #27ae60, #2ecc71); color: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; font-weight: 600;">🌟 ${qualityItems.length} premium quality item${qualityItems.length > 1 ? 's' : ''} in your cart!</p>
        <p style="margin: 5px 0 0 0; font-size: 14px;">These pieces are rated for exceptional quality and longevity.</p>
      </div>
    ` : ''}
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${baseUrl}/cart?utm_source=email&utm_medium=abandoned_cart&utm_campaign=recovery" class="button">
        Complete Your Purchase
      </a>
    </div>
    
    <p style="font-size: 14px; color: #6c757d; text-align: center;">
      🚚 Free shipping on orders over $75 | 🔄 Easy 30-day returns
    </p>
    
    <p>Questions about any items? Reply to this email and our styling team will help you make the perfect choice.</p>
  `;
  
  return {
    subject: `${firstName}, your premium fashion finds are waiting! Complete your order now`,
    html: createBaseTemplate(content, `Complete your purchase of premium quality fashion pieces selected just for you.`)
  };
}

// 3. Order Confirmation Email
export function renderOrderConfirmationEmail(customer: CustomerData, order: OrderData): { subject: string; html: string } {
  const firstName = customer.firstName || 'Valued Customer';
  const baseUrl = config.CLIENT_URL.replace(/\/$/, '');
  
  const itemsHtml = order.items.map(item => `
    <div class="product-card">
      ${item.image_url ? `<img src="${item.image_url}" alt="${item.name}" class="product-image">` : ''}
      <div>
        <h4 style="margin: 0 0 5px 0; color: #2c3e50;">${item.name}</h4>
        <div>Quantity: ${item.quantity}</div>
        <div style="font-weight: 600; color: #e74c3c;">$${item.price.toFixed(2)}</div>
      </div>
    </div>
  `).join('');
  
  const content = `
    <h2 style="color: #2c3e50; margin-bottom: 20px;">Thank you for your order, ${firstName}! 🎉</h2>
    
    <div style="background: linear-gradient(135deg, #3498db, #2980b9); color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <h3 style="margin: 0 0 10px 0;">Order #${order.order_number}</h3>
      <p style="margin: 0; font-size: 18px; font-weight: 600;">Total: $${order.total.toFixed(2)}</p>
      ${order.estimated_delivery ? `<p style="margin: 10px 0 0 0; font-size: 14px;">📦 Estimated delivery: ${order.estimated_delivery}</p>` : ''}
    </div>
    
    <p>Your premium fashion pieces are being carefully prepared for shipment. We'll send you tracking information as soon as your order is on its way!</p>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #2c3e50;">Order Details:</h3>
      ${itemsHtml}
    </div>
    
    <div style="background: linear-gradient(135deg, #f39c12, #e67e22); color: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <h4 style="margin: 0 0 10px 0;">💡 Care Guide Coming Soon!</h4>
      <p style="margin: 0; font-size: 14px;">We'll send you personalized care instructions to help your new pieces last longer and look their best.</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${baseUrl}/orders/${order.order_number}?utm_source=email&utm_medium=order_confirmation" class="button">
        Track Your Order
      </a>
    </div>
    
    <p>Need help? Our customer service team is here for you at <a href="mailto:support@calistalife.com" style="color: #3498db;">support@calistalife.com</a></p>
    
    <p>Thank you for choosing CalistaLife!</p>
  `;
  
  return {
    subject: `Order confirmed! #${order.order_number} - Your premium fashion is on the way 🚚`,
    html: createBaseTemplate(content, `Your CalistaLife order #${order.order_number} has been confirmed and is being prepared for shipment.`)
  };
}

// 4. Care Guide Email (sent after delivery)
export function renderCareGuideEmail(customer: CustomerData, order: OrderData): { subject: string; html: string } {
  const firstName = customer.firstName || 'Fashion Enthusiast';
  const baseUrl = config.CLIENT_URL.replace(/\/$/, '');
  
  const content = `
    <h2 style="color: #2c3e50; margin-bottom: 20px;">Keep your CalistaLife pieces looking perfect, ${firstName}! 🌟</h2>
    
    <p>Congratulations on your recent purchase! Now let's make sure your premium fashion pieces stay beautiful for years to come.</p>
    
    <div style="background: linear-gradient(135deg, #27ae60, #2ecc71); color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin: 0 0 15px 0;">🧥 Premium Care Essentials</h3>
      <ul style="margin: 0; padding-left: 20px;">
        <li>Always check the care label first</li>
        <li>Use cold water for washing to preserve colors</li>
        <li>Air dry when possible to maintain fabric integrity</li>
        <li>Store garments properly on quality hangers</li>
      </ul>
    </div>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #2c3e50;">🌱 Sustainable Fashion Tips</h3>
      <p>Extend the life of your garments and reduce environmental impact:</p>
      <ul>
        <li><strong>Wash less often:</strong> Air out garments between wears</li>
        <li><strong>Spot clean:</strong> Address stains immediately to prevent full washing</li>
        <li><strong>Professional cleaning:</strong> For delicate or special occasion pieces</li>
        <li><strong>Proper storage:</strong> Keep away from direct sunlight and moisture</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${baseUrl}/care-guides?utm_source=email&utm_medium=care_guide&utm_campaign=post_purchase" class="button">
        View Detailed Care Guides
      </a>
    </div>
    
    <div style="background: linear-gradient(135deg, #9b59b6, #8e44ad); color: white; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <h4 style="margin: 0 0 10px 0;">💎 Premium Member Benefit</h4>
      <p style="margin: 0; font-size: 14px;">Get personalized care advice from our styling experts - just reply to this email!</p>
    </div>
    
    <p>Your investment in quality fashion deserves quality care. Follow these tips and your CalistaLife pieces will remain wardrobe staples for seasons to come.</p>
    
    <p>Happy styling!<br>The CalistaLife Care Team</p>
  `;
  
  return {
    subject: `${firstName}, make your premium pieces last forever! 🌟 Care guide inside`,
    html: createBaseTemplate(content, `Expert care tips to keep your CalistaLife premium fashion looking perfect for years.`)
  };
}

// 5. Re-engagement Email (for inactive customers)
export function renderReengagementEmail(customer: CustomerData): { subject: string; html: string } {
  const firstName = customer.firstName || 'Fashion Lover';
  const baseUrl = config.CLIENT_URL.replace(/\/$/, '');
  const lastPurchase = customer.lastPurchaseDate ? new Date(customer.lastPurchaseDate).toLocaleDateString() : 'a while';
  
  const content = `
    <h2 style="color: #2c3e50; margin-bottom: 20px;">We miss you, ${firstName}! ✨</h2>
    
    <p>It's been ${typeof lastPurchase === 'string' && lastPurchase !== 'a while' ? `since ${lastPurchase}` : lastPurchase} since you last shopped with us, and we wanted to check in!</p>
    
    <div style="background: linear-gradient(135deg, #e74c3c, #c0392b); color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <h3 style="margin: 0 0 15px 0;">🎁 We've Missed You!</h3>
      <p style="margin: 0; font-size: 18px; font-weight: 600;">20% OFF Your Return</p>
      <p style="margin: 10px 0 0 0; font-size: 14px;">Use code: <strong>WELCOME_BACK20</strong></p>
    </div>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #2c3e50;">🆕 What's New Since You've Been Away</h3>
      <ul style="padding-left: 20px;">
        <li><span class="quality-badge">New</span> Sustainable summer collection with 5-star quality ratings</li>
        <li>🌱 Enhanced sustainability scoring on all products</li>
        <li>💡 Personalized styling recommendations based on your preferences</li>
        <li>📱 Improved mobile shopping experience</li>
      </ul>
    </div>
    
    ${customer.preferredCategories && customer.preferredCategories.length > 0 ? `
      <div style="background: linear-gradient(135deg, #3498db, #2980b9); color: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h4 style="margin: 0 0 10px 0;">👗 New in Your Favorite Categories</h4>
        <p style="margin: 0; font-size: 14px;">Fresh arrivals in ${customer.preferredCategories.join(', ')} waiting for you!</p>
      </div>
    ` : ''}
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${baseUrl}/collections/new-arrivals?utm_source=email&utm_medium=reengagement&utm_campaign=win_back" class="button">
        Discover What's New
      </a>
    </div>
    
    <p style="font-size: 14px; color: #6c757d; text-align: center; margin: 20px 0;">
      Not interested? <a href="${baseUrl}/unsubscribe" style="color: #6c757d; text-decoration: underline;">Update your preferences</a> or let us know what you'd like to see.
    </p>
    
    <p>We'd love to help you find your next favorite piece. What can we help you discover today?</p>
    
    <p>Best regards,<br>The CalistaLife Team</p>
  `;
  
  return {
    subject: `${firstName}, we miss you! 20% off your return to CalistaLife 💙`,
    html: createBaseTemplate(content, `Come back to CalistaLife! 20% off plus new premium collections waiting for you.`)
  };
}

// 6. Review Request Email (post-purchase)
export function renderReviewRequestEmail(customer: CustomerData, order: OrderData): { subject: string; html: string } {
  const firstName = customer.firstName || 'Valued Customer';
  const baseUrl = config.CLIENT_URL.replace(/\/$/, '');
  
  const content = `
    <h2 style="color: #2c3e50; margin-bottom: 20px;">How are you loving your CalistaLife pieces, ${firstName}? ⭐</h2>
    
    <p>We hope you're absolutely in love with your recent purchase! Your experience helps other fashion enthusiasts make confident choices.</p>
    
    <div style="background: linear-gradient(135deg, #f39c12, #e67e22); color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <h3 style="margin: 0 0 15px 0;">📝 Share Your Experience</h3>
      <p style="margin: 0; font-size: 14px;">Help others discover quality fashion with your honest review</p>
    </div>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #2c3e50;">Your Recent Order #${order.order_number}</h3>
      <p>Rate your experience with:</p>
      <ul style="padding-left: 20px;">
        <li><strong>Quality:</strong> How do the materials and construction feel?</li>
        <li><strong>Fit:</strong> Does it fit as expected from the size guide?</li>
        <li><strong>Style:</strong> Does it match your expectations from the photos?</li>
        <li><strong>Value:</strong> Are you satisfied with the price-to-quality ratio?</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${baseUrl}/reviews/write/${order.order_number}?utm_source=email&utm_medium=review_request&utm_campaign=post_purchase" class="button">
        Write Your Review
      </a>
    </div>
    
    <div style="background: linear-gradient(135deg, #27ae60, #2ecc71); color: white; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <h4 style="margin: 0 0 10px 0;">🎁 Review Reward</h4>
      <p style="margin: 0; font-size: 14px;">Get 5% off your next order when you leave a detailed review!</p>
    </div>
    
    <p>Your feedback is invaluable in helping us maintain our commitment to premium quality and exceptional service.</p>
    
    <p style="font-size: 14px; color: #6c757d; text-align: center;">
      Having any issues with your order? <a href="mailto:support@calistalife.com" style="color: #3498db;">Contact our support team</a> - we're here to help!
    </p>
    
    <p>Thank you for being part of the CalistaLife community!</p>
    
    <p>With gratitude,<br>The CalistaLife Team</p>
  `;
  
  return {
    subject: `${firstName}, how was your CalistaLife experience? Share your review! ⭐`,
    html: createBaseTemplate(content, `Share your experience with your recent CalistaLife purchase and help other shoppers discover quality fashion.`)
  };
}

// Template ID mapping for Brevo API calls
export const BREVO_TEMPLATE_IDS = {
  WELCOME: 1,
  ABANDONED_CART: 2,
  ORDER_CONFIRMATION: 3,
  CARE_GUIDE: 4,
  REENGAGEMENT: 5,
  REVIEW_REQUEST: 6,
} as const;

// Helper function to get template by type
export function getEmailTemplate(type: keyof typeof BREVO_TEMPLATE_IDS, data: any) {
  switch (type) {
    case 'WELCOME':
      return renderWelcomeEmail(data.customer);
    case 'ABANDONED_CART':
      return renderAbandonedCartEmail(data.customer, data.cartItems);
    case 'ORDER_CONFIRMATION':
      return renderOrderConfirmationEmail(data.customer, data.order);
    case 'CARE_GUIDE':
      return renderCareGuideEmail(data.customer, data.order);
    case 'REENGAGEMENT':
      return renderReengagementEmail(data.customer);
    case 'REVIEW_REQUEST':
      return renderReviewRequestEmail(data.customer, data.order);
    default:
      throw new Error(`Unknown template type: ${type}`);
  }
}