// Email and SMS marketing campaign management
import { analytics } from './analytics';

interface CampaignData {
  campaign_id: string;
  campaign_type: 'email' | 'sms' | 'push';
  template_id?: string;
  subject?: string;
  message: string;
  recipient: string;
  metadata?: Record<string, any>;
}

interface AbandonedCartData {
  cart_id: string;
  user_email: string;
  user_phone?: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image_url?: string;
  }>;
  cart_value: number;
  abandoned_at: string;
}

interface OrderData {
  order_id: string;
  user_email: string;
  user_phone?: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    quality_grade?: string;
  }>;
  total_value: number;
  shipping_address: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  order_date: string;
}

class MarketingCampaigns {
  private readonly apiBaseUrl: string;
  private readonly clientTrackingKey: string;

  constructor() {
    this.apiBaseUrl = import.meta.env.VITE_API_URL || '/api';
    this.clientTrackingKey = import.meta.env.VITE_BREVO_CLIENT_KEY || '';
    
    // SECURITY: Never use BREVO_API_KEY on frontend - all email sending goes through backend API
    console.warn('MarketingCampaigns: Using backend API proxy for secure email operations');
  }

  // Send welcome email to new subscribers
  async sendWelcomeEmail(userEmail: string, userData: {
    firstName?: string;
    lastName?: string;
    preferences?: string[];
  }) {
    const campaignData: CampaignData = {
      campaign_id: 'welcome_series_001',
      campaign_type: 'email',
      template_id: 'welcome_premium_quality',
      subject: 'Welcome to TheCalista - Where Quality Meets Style',
      message: 'Welcome to our premium quality fashion community',
      recipient: userEmail,
      metadata: {
        user_data: userData,
        campaign_source: 'registration',
        quality_focus: true,
      }
    };

    try {
      // Send email via secure backend API
      const response = await fetch(`${this.apiBaseUrl}/email/welcome`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: userEmail,
          firstName: userData.firstName || 'Valued Customer',
          lastName: userData.lastName || '',
          preferences: userData.preferences || [],
          campaignId: campaignData.campaign_id
        })
      });

      analytics.trackCustomEvent('welcome_email_sent', {
        recipient: userEmail,
        template: campaignData.template_id,
        campaign_id: campaignData.campaign_id,
      });

      return response;
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      throw error;
    }
  }

  // Send abandoned cart recovery campaign
  async sendAbandonedCartCampaign(cartData: AbandonedCartData) {
    const timeSinceAbandonment = Date.now() - new Date(cartData.abandoned_at).getTime();
    const hoursAbandoned = timeSinceAbandonment / (1000 * 60 * 60);

    // Determine which stage of abandonment recovery to send
    let campaignStage = 1;
    if (hoursAbandoned > 24) campaignStage = 3;
    else if (hoursAbandoned > 4) campaignStage = 2;

    const campaignData: CampaignData = {
      campaign_id: `cart_recovery_stage_${campaignStage}`,
      campaign_type: 'email',
      template_id: `cart_abandonment_${campaignStage}`,
      subject: this.getAbandonedCartSubject(campaignStage),
      message: 'Complete your purchase of quality fashion items',
      recipient: cartData.user_email,
      metadata: {
        cart_data: cartData,
        stage: campaignStage,
        hours_abandoned: Math.round(hoursAbandoned),
      }
    };

    try {
      // Send email via secure backend API
      const response = await fetch(`${this.apiBaseUrl}/email/abandoned-cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartData,
          campaignStage,
          hoursAbandoned: Math.round(hoursAbandoned),
          campaignId: campaignData.campaign_id
        })
      });

      // Send SMS for stage 2 and 3 if phone number available
      if (cartData.user_phone && campaignStage > 1) {
        await this.sendAbandonedCartSMS(cartData, campaignStage);
      }

      analytics.trackCustomEvent('abandoned_cart_campaign_sent', {
        cart_id: cartData.cart_id,
        stage: campaignStage,
        cart_value: cartData.cart_value,
        hours_abandoned: Math.round(hoursAbandoned),
        has_phone: !!cartData.user_phone,
      });

      return { success: true, stage: campaignStage };
    } catch (error) {
      console.error('Failed to send abandoned cart campaign:', error);
      throw error;
    }
  }

  // Send order confirmation with quality information
  async sendOrderConfirmation(orderData: OrderData) {
    const qualityItems = orderData.items.filter(item => item.quality_grade);
    const sustainableItems = orderData.items.filter(item => 
      item.name.toLowerCase().includes('sustainable') || 
      item.name.toLowerCase().includes('organic')
    );

    const campaignData: CampaignData = {
      campaign_id: 'order_confirmation_quality',
      campaign_type: 'email',
      template_id: 'order_confirmation_premium',
      subject: `Order Confirmed - Quality Fashion from TheCalista (#${orderData.order_id})`,
      message: 'Your premium quality order has been confirmed',
      recipient: orderData.user_email,
      metadata: {
        order_data: orderData,
        quality_items: qualityItems.length,
        sustainable_items: sustainableItems.length,
      }
    };

    try {
      // Send order confirmation via secure backend API
      const response = await fetch(`${this.apiBaseUrl}/email/order-confirmation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderData,
          qualityItemsCount: qualityItems.length,
          sustainableItemsCount: sustainableItems.length,
          campaignId: campaignData.campaign_id
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to send order confirmation: ${response.status}`);
      }

      // Send personalized email with quality focus
      await this.sendBrevoEmail({
        to: [{ email: orderData.user_email }],
        templateId: 5, // Order confirmation template
        params: {
          ORDER_ID: orderData.order_id,
          QUALITY_MESSAGE: 'Thank you for choosing quality fashion',
          SUSTAINABILITY_MESSAGE: sustainableItems.length > 0 ?
            `You've made ${sustainableItems.length} sustainable choices!` : '',
          CARE_INSTRUCTIONS_URL: `${window.location.origin}/care-guide`,
          TRACK_ORDER_URL: `${window.location.origin}/orders/${orderData.order_id}`,
        }
      });

      // Send SMS confirmation if phone number available
      if (orderData.user_phone) {
        await this.sendOrderConfirmationSMS(orderData);
      }

      analytics.trackCustomEvent('order_confirmation_sent', {
        order_id: orderData.order_id,
        order_value: orderData.total_value,
        quality_items: qualityItems.length,
        sustainable_items: sustainableItems.length,
        has_phone: !!orderData.user_phone,
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to send order confirmation:', error);
      throw error;
    }
  }

  // Send quality care guide after purchase
  async sendQualityCareGuide(userEmail: string, purchasedItems: Array<{
    id: string;
    name: string;
    category: string;
    material?: string;
    quality_grade?: string;
  }>) {
    const campaignData: CampaignData = {
      campaign_id: 'quality_care_guide',
      campaign_type: 'email',
      template_id: 'care_instructions_premium',
      subject: 'Caring for Your Quality Fashion - Premium Care Guide',
      message: 'Keep your quality pieces looking beautiful',
      recipient: userEmail,
      metadata: {
        items: purchasedItems,
        care_focus: true,
      }
    };

    try {
      // Generate care tips based on purchased items
      const careTypes = [...new Set(purchasedItems.map(item => item.category))];
      const materialTypes = [...new Set(purchasedItems.map(item => item.material).filter(Boolean))];

      await this.sendBrevoEmail({
        to: [{ email: userEmail }],
        templateId: 6, // Care guide template
        params: {
          CARE_CATEGORIES: careTypes.join(', '),
          MATERIAL_TYPES: materialTypes.join(', '),
          PREMIUM_CARE_TIPS: 'Professional cleaning recommended for best results',
          STORAGE_TIPS: 'Store in breathable garment bags to maintain quality',
          CARE_GUIDE_URL: `${window.location.origin}/care-guide`,
          VIDEO_GUIDE_URL: `${window.location.origin}/video-care-guide`,
        }
      });

      analytics.trackCustomEvent('care_guide_sent', {
        recipient: userEmail,
        item_categories: careTypes,
        material_types: materialTypes,
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to send care guide:', error);
      throw error;
    }
  }

  // Send re-engagement campaign for inactive users
  async sendReEngagementCampaign(userEmail: string, userData: {
    lastPurchase?: string;
    favoriteCategories?: string[];
    qualityPreference?: string;
  }) {
    const daysSinceLastPurchase = userData.lastPurchase ? 
      Math.floor((Date.now() - new Date(userData.lastPurchase).getTime()) / (1000 * 60 * 60 * 24)) : 
      null;

    const campaignData: CampaignData = {
      campaign_id: 'reengagement_quality_focus',
      campaign_type: 'email',
      template_id: 'reengagement_premium',
      subject: 'New Quality Arrivals - Discover Premium Fashion',
      message: 'Discover our latest quality fashion arrivals',
      recipient: userEmail,
      metadata: {
        user_data: userData,
        days_inactive: daysSinceLastPurchase,
      }
    };

    try {
      await this.sendBrevoEmail({
        to: [{ email: userEmail }],
        templateId: 7, // Re-engagement template
        params: {
          FAVORITE_CATEGORIES: userData.favoriteCategories?.join(', ') || 'premium fashion',
          QUALITY_FOCUS: userData.qualityPreference || 'premium',
          SPECIAL_OFFER: 'COMEBACK20',
          NEW_ARRIVALS_URL: `${window.location.origin}/collections/new-arrivals`,
          QUALITY_COLLECTION_URL: `${window.location.origin}/collections/premium`,
        }
      });

      analytics.trackCustomEvent('reengagement_campaign_sent', {
        recipient: userEmail,
        days_inactive: daysSinceLastPurchase,
        favorite_categories: userData.favoriteCategories,
        quality_preference: userData.qualityPreference,
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to send re-engagement campaign:', error);
      throw error;
    }
  }

  // Helper method to send Brevo email
  private async sendBrevoEmail(emailData: {
    to: Array<{ email: string; name?: string }>;
    templateId: number;
    params: Record<string, any>;
  }) {
    if (!this.brevoApiKey) {
      console.warn('Brevo API key not configured');
      return { success: false };
    }

    const response = await fetch(`${this.brevoBaseUrl}/smtp/email`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': this.brevoApiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        to: emailData.to,
        templateId: emailData.templateId,
        params: emailData.params,
      }),
    });

    if (!response.ok) {
      throw new Error(`Brevo API error: ${response.statusText}`);
    }

    return response.json();
  }

  // Send abandoned cart SMS
  private async sendAbandonedCartSMS(cartData: AbandonedCartData, stage: number) {
    const messages = {
      2: `Hi! You left ${cartData.items.length} quality item(s) in your cart (${cartData.cart_value.toFixed(2)}). Complete your purchase: ${window.location.origin}/cart`,
      3: `Last chance! Save 10% on your cart with code SAVE10NOW. Quality fashion awaits: ${window.location.origin}/cart`,
    };

    try {
      // This would integrate with your SMS service (Twilio, etc.)
      console.log('SMS would be sent:', {
        phone: cartData.user_phone,
        message: messages[stage as keyof typeof messages],
      });

      analytics.trackCustomEvent('abandoned_cart_sms_sent', {
        cart_id: cartData.cart_id,
        stage: stage,
        phone: cartData.user_phone,
      });
    } catch (error) {
      console.error('Failed to send SMS:', error);
    }
  }

  // Send order confirmation SMS
  private async sendOrderConfirmationSMS(orderData: OrderData) {
    const message = `Order confirmed! #${orderData.order_id} - $${orderData.total_value.toFixed(2)}. Track your quality fashion: ${window.location.origin}/orders/${orderData.order_id}`;

    try {
      // This would integrate with your SMS service
      console.log('SMS would be sent:', {
        phone: orderData.user_phone,
        message: message,
      });

      analytics.trackCustomEvent('order_confirmation_sms_sent', {
        order_id: orderData.order_id,
        phone: orderData.user_phone,
      });
    } catch (error) {
      console.error('Failed to send SMS:', error);
    }
  }

  // Helper methods
  private getAbandonedCartSubject(stage: number): string {
    const subjects = {
      1: 'You left something beautiful behind...',
      2: 'Still thinking about those quality pieces?',
      3: 'Last chance - Save 10% on your quality fashion',
    };
    return subjects[stage as keyof typeof subjects];
  }

  private formatShippingAddress(address: OrderData['shipping_address']): string {
    return `${address.street}, ${address.city}, ${address.state} ${address.zip}, ${address.country}`;
  }
}

// Create singleton instance
export const marketingCampaigns = new MarketingCampaigns();

export default marketingCampaigns;