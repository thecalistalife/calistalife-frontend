// UTM parameter tracking and influencer campaign management
import { analytics } from './analytics';

interface UTMParameters {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

interface CampaignAttribution {
  source: string;
  medium: string;
  campaign: string;
  term?: string;
  content?: string;
  timestamp: number;
  referrer: string;
  landing_page: string;
  user_agent: string;
}

interface InfluencerCampaign {
  influencer_id: string;
  influencer_name: string;
  platform: string;
  campaign_id: string;
  commission_rate: number;
  tracking_code: string;
  start_date: string;
  end_date: string;
}

class UTMTracker {
  private readonly STORAGE_KEY = 'calista_campaign_attribution';
  private readonly INFLUENCER_KEY = 'calista_influencer_tracking';
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.initializeTracking();
  }

  // Initialize tracking on page load
  private initializeTracking() {
    if (typeof window === 'undefined') return;

    // Track current UTM parameters
    this.trackCurrentUTM();
    
    // Track influencer codes
    this.trackInfluencerCode();
    
    // Set up attribution tracking
    this.setupAttributionTracking();
  }

  // Extract and track UTM parameters from current URL
  private trackCurrentUTM() {
    const urlParams = new URLSearchParams(window.location.search);
    const utmParams: UTMParameters = {};

    // Extract all UTM parameters
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(param => {
      const value = urlParams.get(param);
      if (value) {
        utmParams[param as keyof UTMParameters] = value;
      }
    });

    // If UTM parameters exist, store attribution
    if (Object.keys(utmParams).length > 0) {
      this.storeAttribution(utmParams);
      this.trackCampaignEvent(utmParams);
    }
  }

  // Track influencer-specific codes
  private trackInfluencerCode() {
    const urlParams = new URLSearchParams(window.location.search);
    const influencerCode = urlParams.get('ref') || urlParams.get('influencer') || urlParams.get('code');
    
    if (influencerCode) {
      this.trackInfluencerAttribution(influencerCode);
    }
  }

  // Store campaign attribution data
  private storeAttribution(utmParams: UTMParameters) {
    const attribution: CampaignAttribution = {
      source: utmParams.utm_source || 'direct',
      medium: utmParams.utm_medium || 'none',
      campaign: utmParams.utm_campaign || 'none',
      term: utmParams.utm_term,
      content: utmParams.utm_content,
      timestamp: Date.now(),
      referrer: document.referrer || 'direct',
      landing_page: window.location.pathname,
      user_agent: navigator.userAgent,
    };

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(attribution));
      sessionStorage.setItem(this.STORAGE_KEY + '_session', JSON.stringify(attribution));
    } catch (error) {
      console.warn('Unable to store campaign attribution:', error);
    }
  }

  // Track influencer attribution
  private trackInfluencerAttribution(code: string) {
    const influencerData = this.getInfluencerByCode(code);
    
    if (influencerData) {
      try {
        localStorage.setItem(this.INFLUENCER_KEY, JSON.stringify({
          ...influencerData,
          timestamp: Date.now(),
          landing_page: window.location.pathname,
        }));
        
        // Track as custom event
        analytics.trackCustomEvent('influencer_attribution', {
          influencer_id: influencerData.influencer_id,
          influencer_name: influencerData.influencer_name,
          platform: influencerData.platform,
          tracking_code: code,
          commission_rate: influencerData.commission_rate,
        });
      } catch (error) {
        console.warn('Unable to store influencer attribution:', error);
      }
    }
  }

  // Set up attribution tracking for conversions
  private setupAttributionTracking() {
    // Listen for purchase events to attribute conversions
    window.addEventListener('calista-purchase', (event: any) => {
      this.attributeConversion(event.detail);
    });
  }

  // Get stored campaign attribution
  getAttribution(): CampaignAttribution | null {
    try {
      // First try session storage (current session)
      const sessionData = sessionStorage.getItem(this.STORAGE_KEY + '_session');
      if (sessionData) {
        const attribution = JSON.parse(sessionData);
        if (this.isAttributionValid(attribution)) {
          return attribution;
        }
      }

      // Fall back to localStorage (longer retention)
      const storedData = localStorage.getItem(this.STORAGE_KEY);
      if (storedData) {
        const attribution = JSON.parse(storedData);
        if (this.isAttributionValid(attribution)) {
          return attribution;
        }
      }
    } catch (error) {
      console.warn('Error retrieving campaign attribution:', error);
    }
    return null;
  }

  // Check if attribution is still valid (within session timeout)
  private isAttributionValid(attribution: CampaignAttribution): boolean {
    const now = Date.now();
    const age = now - attribution.timestamp;
    return age < this.SESSION_TIMEOUT;
  }

  // Get influencer attribution
  getInfluencerAttribution(): any {
    try {
      const storedData = localStorage.getItem(this.INFLUENCER_KEY);
      if (storedData) {
        return JSON.parse(storedData);
      }
    } catch (error) {
      console.warn('Error retrieving influencer attribution:', error);
    }
    return null;
  }

  // Track campaign event
  private trackCampaignEvent(utmParams: UTMParameters) {
    analytics.trackCampaign({
      source: utmParams.utm_source || 'direct',
      medium: utmParams.utm_medium || 'none', 
      campaign: utmParams.utm_campaign || 'none',
      term: utmParams.utm_term,
      content: utmParams.utm_content,
    });

    // Track specific campaign types
    if (utmParams.utm_source) {
      this.trackCampaignSource(utmParams.utm_source, utmParams);
    }
  }

  // Track specific campaign sources
  private trackCampaignSource(source: string, utmParams: UTMParameters) {
    const sourceMap: Record<string, string> = {
      'instagram': 'social_media',
      'facebook': 'social_media',
      'tiktok': 'social_media',
      'youtube': 'social_media',
      'pinterest': 'social_media',
      'google': 'paid_search',
      'bing': 'paid_search',
      'email': 'email_marketing',
      'influencer': 'influencer_marketing',
      'affiliate': 'affiliate_marketing',
      'pr': 'public_relations',
    };

    const campaignType = sourceMap[source.toLowerCase()] || 'other';

    analytics.trackCustomEvent('campaign_source_tracked', {
      campaign_type: campaignType,
      source: source,
      medium: utmParams.utm_medium,
      campaign: utmParams.utm_campaign,
      is_quality_focused: this.isQualityFocusedCampaign(utmParams),
    });
  }

  // Check if campaign is quality-focused
  private isQualityFocusedCampaign(utmParams: UTMParameters): boolean {
    const qualityKeywords = ['quality', 'premium', 'luxury', 'sustainable', 'craftsmanship', 'artisan'];
    const campaignText = [
      utmParams.utm_campaign,
      utmParams.utm_content,
      utmParams.utm_term
    ].join(' ').toLowerCase();

    return qualityKeywords.some(keyword => campaignText.includes(keyword));
  }

  // Attribute conversion to campaign
  attributeConversion(purchaseData: any) {
    const attribution = this.getAttribution();
    const influencerAttribution = this.getInfluencerAttribution();

    if (attribution || influencerAttribution) {
      analytics.trackCustomEvent('attributed_conversion', {
        transaction_id: purchaseData.transaction_id,
        value: purchaseData.value,
        attribution_source: attribution?.source || 'direct',
        attribution_medium: attribution?.medium || 'none',
        attribution_campaign: attribution?.campaign || 'none',
        influencer_id: influencerAttribution?.influencer_id,
        influencer_name: influencerAttribution?.influencer_name,
        days_to_conversion: attribution ? Math.floor((Date.now() - attribution.timestamp) / (1000 * 60 * 60 * 24)) : 0,
      });

      // Calculate influencer commission if applicable
      if (influencerAttribution) {
        this.trackInfluencerCommission(influencerAttribution, purchaseData);
      }
    }
  }

  // Track influencer commission
  private trackInfluencerCommission(influencerData: any, purchaseData: any) {
    const commission = purchaseData.value * (influencerData.commission_rate / 100);

    analytics.trackCustomEvent('influencer_commission_earned', {
      influencer_id: influencerData.influencer_id,
      influencer_name: influencerData.influencer_name,
      platform: influencerData.platform,
      order_value: purchaseData.value,
      commission_rate: influencerData.commission_rate,
      commission_amount: commission,
      transaction_id: purchaseData.transaction_id,
    });

    // Store commission data for payout tracking
    this.storeCommissionData(influencerData, purchaseData, commission);
  }

  // Store commission data for payout
  private storeCommissionData(influencerData: any, purchaseData: any, commission: number) {
    try {
      const commissionsKey = 'calista_pending_commissions';
      const existingCommissions = JSON.parse(localStorage.getItem(commissionsKey) || '[]');
      
      existingCommissions.push({
        influencer_id: influencerData.influencer_id,
        transaction_id: purchaseData.transaction_id,
        commission_amount: commission,
        order_date: new Date().toISOString(),
        status: 'pending',
      });

      localStorage.setItem(commissionsKey, JSON.stringify(existingCommissions));
    } catch (error) {
      console.warn('Unable to store commission data:', error);
    }
  }

  // Get influencer data by tracking code
  private getInfluencerByCode(code: string): InfluencerCampaign | null {
    // This would typically come from an API, but for now using static data
    const influencers: Record<string, InfluencerCampaign> = {
      'SARAH2024': {
        influencer_id: 'inf_sarah_johnson',
        influencer_name: 'Sarah Johnson',
        platform: 'instagram',
        campaign_id: 'spring_quality_2024',
        commission_rate: 8,
        tracking_code: 'SARAH2024',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
      },
      'EMMA_STYLE': {
        influencer_id: 'inf_emma_chen',
        influencer_name: 'Emma Chen',
        platform: 'tiktok',
        campaign_id: 'sustainable_fashion',
        commission_rate: 10,
        tracking_code: 'EMMA_STYLE',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
      },
      'QUALITY20': {
        influencer_id: 'inf_mike_torres',
        influencer_name: 'Mike Torres',
        platform: 'youtube',
        campaign_id: 'quality_focus_campaign',
        commission_rate: 12,
        tracking_code: 'QUALITY20',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
      },
    };

    return influencers[code.toUpperCase()] || null;
  }

  // Generate UTM URL for campaigns
  static generateUTMUrl(baseUrl: string, utmParams: UTMParameters): string {
    const url = new URL(baseUrl);
    
    Object.entries(utmParams).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value);
      }
    });

    return url.toString();
  }

  // Generate influencer tracking URL
  static generateInfluencerUrl(baseUrl: string, influencerCode: string, utmParams?: UTMParameters): string {
    const url = new URL(baseUrl);
    url.searchParams.set('ref', influencerCode);
    
    if (utmParams) {
      Object.entries(utmParams).forEach(([key, value]) => {
        if (value) {
          url.searchParams.set(key, value);
        }
      });
    }

    return url.toString();
  }

  // Get campaign performance data
  getCampaignPerformance() {
    const attribution = this.getAttribution();
    const influencerAttribution = this.getInfluencerAttribution();

    return {
      current_attribution: attribution,
      influencer_attribution: influencerAttribution,
      attribution_age_minutes: attribution ? Math.floor((Date.now() - attribution.timestamp) / (1000 * 60)) : null,
      is_attributed_session: !!(attribution || influencerAttribution),
    };
  }

  // Clear attribution data (for testing)
  clearAttribution() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.INFLUENCER_KEY);
      sessionStorage.removeItem(this.STORAGE_KEY + '_session');
    } catch (error) {
      console.warn('Unable to clear attribution data:', error);
    }
  }
}

// Create singleton instance
export const utmTracker = new UTMTracker();

// React hook for UTM tracking
export const useUTMTracking = () => {
  return {
    getAttribution: utmTracker.getAttribution.bind(utmTracker),
    getInfluencerAttribution: utmTracker.getInfluencerAttribution.bind(utmTracker),
    getCampaignPerformance: utmTracker.getCampaignPerformance.bind(utmTracker),
    attributeConversion: utmTracker.attributeConversion.bind(utmTracker),
  };
};

export default utmTracker;