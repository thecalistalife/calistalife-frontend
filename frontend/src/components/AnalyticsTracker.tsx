// Analytics tracker component for e-commerce events
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAnalytics } from '../lib/analytics';
import { useUTMTracking } from '../lib/utm-tracker';

interface AnalyticsTrackerProps {
  children: React.ReactNode;
}

export const AnalyticsTracker: React.FC<AnalyticsTrackerProps> = ({ children }) => {
  const location = useLocation();
  const { trackPageView } = useAnalytics();
  const { getCampaignPerformance } = useUTMTracking();

  // Track page views on route changes
  useEffect(() => {
    // Get page title from route or fallback
    const getPageTitle = (pathname: string) => {
      const titleMap: Record<string, string> = {
        '/': 'TheCalista - Premium Fashion & Quality',
        '/collections': 'Collections - Premium Fashion',
        '/about': 'About Us - Quality Craftsmanship',
        '/contact': 'Contact Us - TheCalista',
        '/cart': 'Shopping Cart',
        '/checkout': 'Checkout',
        '/wishlist': 'Wishlist',
        '/search': 'Search Products',
        '/orders': 'My Orders',
        '/profile': 'My Profile',
      };

      // Handle dynamic routes
      if (pathname.startsWith('/product/')) {
        return 'Product Details - TheCalista';
      }
      if (pathname.startsWith('/collections/')) {
        return 'Collection - Premium Fashion';
      }
      if (pathname.startsWith('/category/')) {
        return 'Category - Premium Fashion';
      }
      if (pathname.startsWith('/orders/')) {
        return 'Order Details';
      }

      return titleMap[pathname] || 'TheCalista - Premium Fashion';
    };

    const title = getPageTitle(location.pathname);
    
    // Track page view with campaign attribution
    trackPageView(location.pathname, title);

    // Log campaign performance for debugging
    if (import.meta.env.DEV) {
      const performance = getCampaignPerformance();
      if (performance.is_attributed_session) {
        console.log('📢 Campaign attribution active:', performance);
      }
    }
  }, [location, trackPageView, getCampaignPerformance]);

  return <>{children}</>;
};

export default AnalyticsTracker;