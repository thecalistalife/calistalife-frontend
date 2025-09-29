// Marketing analytics and conversion tracking for CalistaLife.com
import { trackEcommerce } from './sentry';

// Google Analytics 4 configuration
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
    fbq: (...args: any[]) => void;
    _fbq?: any;
  }
}

interface ProductData {
  item_id: string;
  item_name: string;
  category: string;
  quantity: number;
  price: number;
  currency?: string;
  item_brand?: string;
  item_variant?: string;
}

interface PurchaseData {
  transaction_id: string;
  value: number;
  currency: string;
  items: ProductData[];
  coupon?: string;
  shipping?: number;
  tax?: number;
}

class AnalyticsManager {
  private isInitialized = false;
  private isDebug = false;
  
  constructor() {
    this.isDebug = import.meta.env.DEV;
  }

  // Initialize all analytics services
  init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    
    this.initGoogleAnalytics();
    this.initFacebookPixel();
    this.initGoogleAds();
    
    this.isInitialized = true;
    
    if (this.isDebug) {
      console.log('🎯 Analytics initialized:', {
        ga4: !!import.meta.env.VITE_GA4_MEASUREMENT_ID,
        fbPixel: !!import.meta.env.VITE_FACEBOOK_PIXEL_ID,
        googleAds: !!import.meta.env.VITE_GOOGLE_ADS_ID,
      });
    }
  }

  // Initialize Google Analytics 4
  private initGoogleAnalytics() {
    const measurementId = import.meta.env.VITE_GA4_MEASUREMENT_ID;
    if (!measurementId) return;

    // Load Google Analytics script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    window.gtag = function(...args) {
      window.dataLayer.push(arguments);
    };

    // Configure Google Analytics
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      page_title: 'TheCalista - Premium Fashion',
      page_location: window.location.href,
      custom_map: {
        custom_parameter_1: 'quality_grade',
        custom_parameter_2: 'sustainability_rating',
      },
      // Enhanced e-commerce settings
      send_page_view: true,
      transport_type: 'beacon',
      // Privacy settings
      anonymize_ip: true,
      cookie_flags: 'secure;samesite=lax',
    });

    // Track initial page view
    this.trackPageView();
  }

  // Initialize Facebook Pixel
  private initFacebookPixel() {
    const pixelId = import.meta.env.VITE_FACEBOOK_PIXEL_ID;
    if (!pixelId) return;

    // Facebook Pixel Code
    (function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
      if (f.fbq) return;
      n = f.fbq = function() {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

    window.fbq('init', pixelId);
    window.fbq('track', 'PageView');

    // Add noscript fallback
    const noscript = document.createElement('noscript');
    noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1" />`;
    document.head.appendChild(noscript);
  }

  // Initialize Google Ads conversion tracking
  private initGoogleAds() {
    const googleAdsId = import.meta.env.VITE_GOOGLE_ADS_ID;
    if (!googleAdsId) return;

    // Google Ads conversion tracking
    window.gtag('config', googleAdsId);
  }

  // Track page views
  trackPageView(pagePath?: string, pageTitle?: string) {
    if (!this.isInitialized) return;

    const path = pagePath || window.location.pathname;
    const title = pageTitle || document.title;

    // Google Analytics
    if (window.gtag) {
      window.gtag('config', import.meta.env.VITE_GA4_MEASUREMENT_ID, {
        page_path: path,
        page_title: title,
      });
    }

    // Facebook Pixel
    if (window.fbq) {
      window.fbq('track', 'PageView');
    }

    if (this.isDebug) {
      console.log('📄 Page view tracked:', { path, title });
    }
  }

  // Track product view
  trackProductView(product: {
    id: string;
    name: string;
    category: string;
    price: number;
    brand?: string;
    quality_grade?: string;
    sustainability_rating?: string;
  }) {
    if (!this.isInitialized) return;

    // Google Analytics Enhanced Ecommerce
    if (window.gtag) {
      window.gtag('event', 'view_item', {
        currency: 'USD',
        value: product.price,
        items: [{
          item_id: product.id,
          item_name: product.name,
          category: product.category,
          price: product.price,
          item_brand: product.brand || 'TheCalista',
          custom_parameter_1: product.quality_grade,
          custom_parameter_2: product.sustainability_rating,
        }],
      });
    }

    // Facebook Pixel
    if (window.fbq) {
      window.fbq('track', 'ViewContent', {
        content_type: 'product',
        content_ids: [product.id],
        content_name: product.name,
        content_category: product.category,
        value: product.price,
        currency: 'USD',
      });
    }

    // Custom tracking for quality focus
    this.trackCustomEvent('product_quality_viewed', {
      product_id: product.id,
      quality_grade: product.quality_grade,
      sustainability_rating: product.sustainability_rating,
      price_tier: this.getPriceTier(product.price),
    });

    if (this.isDebug) {
      console.log('👁️ Product view tracked:', product.name);
    }
  }

  // Track add to cart
  trackAddToCart(product: ProductData) {
    if (!this.isInitialized) return;

    // Google Analytics
    if (window.gtag) {
      window.gtag('event', 'add_to_cart', {
        currency: product.currency || 'USD',
        value: product.price * product.quantity,
        items: [product],
      });
    }

    // Facebook Pixel
    if (window.fbq) {
      window.fbq('track', 'AddToCart', {
        content_type: 'product',
        content_ids: [product.item_id],
        content_name: product.item_name,
        value: product.price * product.quantity,
        currency: product.currency || 'USD',
      });
    }

    if (this.isDebug) {
      console.log('🛒 Add to cart tracked:', product.item_name);
    }
  }

  // Track begin checkout
  trackBeginCheckout(items: ProductData[], value: number) {
    if (!this.isInitialized) return;

    // Google Analytics
    if (window.gtag) {
      window.gtag('event', 'begin_checkout', {
        currency: 'USD',
        value: value,
        items: items,
      });
    }

    // Facebook Pixel
    if (window.fbq) {
      window.fbq('track', 'InitiateCheckout', {
        content_type: 'product',
        content_ids: items.map(item => item.item_id),
        value: value,
        currency: 'USD',
        num_items: items.length,
      });
    }

    if (this.isDebug) {
      console.log('💳 Begin checkout tracked:', { value, items: items.length });
    }
  }

  // Track purchase conversion
  trackPurchase(purchaseData: PurchaseData) {
    if (!this.isInitialized) return;

    // Google Analytics Enhanced Ecommerce
    if (window.gtag) {
      window.gtag('event', 'purchase', {
        transaction_id: purchaseData.transaction_id,
        value: purchaseData.value,
        currency: purchaseData.currency,
        items: purchaseData.items,
        coupon: purchaseData.coupon,
        shipping: purchaseData.shipping,
        tax: purchaseData.tax,
      });

      // Google Ads conversion tracking
      const googleAdsId = import.meta.env.VITE_GOOGLE_ADS_ID;
      const conversionLabel = import.meta.env.VITE_GOOGLE_ADS_CONVERSION_LABEL;
      
      if (googleAdsId && conversionLabel) {
        window.gtag('event', 'conversion', {
          send_to: `${googleAdsId}/${conversionLabel}`,
          value: purchaseData.value,
          currency: purchaseData.currency,
          transaction_id: purchaseData.transaction_id,
        });
      }
    }

    // Facebook Pixel
    if (window.fbq) {
      window.fbq('track', 'Purchase', {
        content_type: 'product',
        content_ids: purchaseData.items.map(item => item.item_id),
        value: purchaseData.value,
        currency: purchaseData.currency,
        num_items: purchaseData.items.length,
      });
    }

    // Track quality-focused conversion metrics
    this.trackQualityConversion(purchaseData);

    if (this.isDebug) {
      console.log('💰 Purchase tracked:', {
        transaction_id: purchaseData.transaction_id,
        value: purchaseData.value,
        items: purchaseData.items.length,
      });
    }
  }

  // Track search
  trackSearch(searchTerm: string, results: number = 0) {
    if (!this.isInitialized) return;

    // Google Analytics
    if (window.gtag) {
      window.gtag('event', 'search', {
        search_term: searchTerm,
        custom_parameter_3: results, // Number of results
      });
    }

    // Facebook Pixel
    if (window.fbq) {
      window.fbq('track', 'Search', {
        search_string: searchTerm,
        content_type: 'product',
      });
    }

    if (this.isDebug) {
      console.log('🔍 Search tracked:', { searchTerm, results });
    }
  }

  // Track custom events
  trackCustomEvent(eventName: string, parameters: Record<string, any> = {}) {
    if (!this.isInitialized) return;

    // Google Analytics
    if (window.gtag) {
      window.gtag('event', eventName, {
        ...parameters,
        event_category: 'custom',
        event_label: 'quality_focus',
      });
    }

    // Send to Sentry for business intelligence
    trackEcommerce(eventName, parameters);

    if (this.isDebug) {
      console.log('📊 Custom event tracked:', { eventName, parameters });
    }
  }

  // Track quality-specific conversions
  private trackQualityConversion(purchaseData: PurchaseData) {
    const qualityMetrics = this.analyzeQualityMetrics(purchaseData.items);
    
    this.trackCustomEvent('quality_conversion', {
      transaction_id: purchaseData.transaction_id,
      total_value: purchaseData.value,
      average_quality_grade: qualityMetrics.avgQualityScore,
      sustainability_products: qualityMetrics.sustainableCount,
      premium_products: qualityMetrics.premiumCount,
      quality_value_ratio: qualityMetrics.qualityValueRatio,
    });
  }

  // Analyze quality metrics from items
  private analyzeQualityMetrics(items: ProductData[]) {
    let totalQualityScore = 0;
    let sustainableCount = 0;
    let premiumCount = 0;
    let totalValue = 0;

    items.forEach(item => {
      const qualityScore = this.getQualityScore(item.item_variant);
      totalQualityScore += qualityScore;
      totalValue += item.price * item.quantity;

      if (item.item_variant?.includes('sustainable') || item.item_variant?.includes('organic')) {
        sustainableCount++;
      }
      if (item.item_variant?.includes('premium') || item.item_variant?.includes('luxury')) {
        premiumCount++;
      }
    });

    return {
      avgQualityScore: items.length > 0 ? totalQualityScore / items.length : 0,
      sustainableCount,
      premiumCount,
      qualityValueRatio: totalValue / Math.max(totalQualityScore, 1),
    };
  }

  // Get numeric quality score from quality grade
  private getQualityScore(variant?: string): number {
    if (!variant) return 0;
    
    if (variant.includes('luxury')) return 10;
    if (variant.includes('premium')) return 8;
    if (variant.includes('standard')) return 6;
    if (variant.includes('basic')) return 4;
    return 5; // default
  }

  // Get price tier for segmentation
  private getPriceTier(price: number): string {
    if (price >= 150) return 'luxury';
    if (price >= 100) return 'premium';
    if (price >= 50) return 'mid-range';
    return 'budget';
  }

  // Set user properties for better segmentation
  setUserProperties(properties: {
    customer_lifetime_value?: number;
    preferred_quality_grade?: string;
    sustainability_focus?: boolean;
    avg_order_value?: number;
    total_orders?: number;
  }) {
    if (!this.isInitialized) return;

    // Google Analytics user properties
    if (window.gtag) {
      window.gtag('config', import.meta.env.VITE_GA4_MEASUREMENT_ID, {
        user_properties: {
          quality_preference: properties.preferred_quality_grade,
          sustainability_focused: properties.sustainability_focus,
          customer_segment: this.getCustomerSegment(properties),
        },
      });
    }

    if (this.isDebug) {
      console.log('👤 User properties set:', properties);
    }
  }

  // Determine customer segment
  private getCustomerSegment(properties: any): string {
    if (properties.customer_lifetime_value > 500) return 'vip';
    if (properties.avg_order_value > 100) return 'premium';
    if (properties.sustainability_focus) return 'eco_conscious';
    if (properties.total_orders > 5) return 'loyal';
    return 'new';
  }

  // Track campaign performance
  trackCampaign(campaignData: {
    source: string;
    medium: string;
    campaign: string;
    term?: string;
    content?: string;
  }) {
    if (!this.isInitialized) return;

    // Google Analytics campaign tracking
    if (window.gtag) {
      window.gtag('config', import.meta.env.VITE_GA4_MEASUREMENT_ID, {
        campaign_source: campaignData.source,
        campaign_medium: campaignData.medium,
        campaign_name: campaignData.campaign,
        campaign_term: campaignData.term,
        campaign_content: campaignData.content,
      });
    }

    this.trackCustomEvent('campaign_tracked', campaignData);

    if (this.isDebug) {
      console.log('📢 Campaign tracked:', campaignData);
    }
  }

  // Get current user ID for cross-platform tracking
  getUserId(): string | null {
    try {
      return localStorage.getItem('user_id') || 
             sessionStorage.getItem('anonymous_id') ||
             this.generateAnonymousId();
    } catch {
      return null;
    }
  }

  // Generate anonymous user ID
  private generateAnonymousId(): string {
    const id = 'anon_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    try {
      sessionStorage.setItem('anonymous_id', id);
    } catch {
      // Storage not available
    }
    return id;
  }
}

// Create singleton instance
export const analytics = new AnalyticsManager();

// React hook for analytics
export const useAnalytics = () => {
  return {
    trackPageView: analytics.trackPageView.bind(analytics),
    trackProductView: analytics.trackProductView.bind(analytics),
    trackAddToCart: analytics.trackAddToCart.bind(analytics),
    trackBeginCheckout: analytics.trackBeginCheckout.bind(analytics),
    trackPurchase: analytics.trackPurchase.bind(analytics),
    trackSearch: analytics.trackSearch.bind(analytics),
    trackCustomEvent: analytics.trackCustomEvent.bind(analytics),
    setUserProperties: analytics.setUserProperties.bind(analytics),
  };
};

export default analytics;