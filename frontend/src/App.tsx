import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, Suspense, lazy } from 'react';
import { NavigationAnimated, Footer, MiniCartDrawer, FreeShippingBar, ThemeShiftController } from './components';
import Toaster from './components/Toaster';
import { SmoothScrollProvider } from './components/SmoothScrollProvider';
import ProtectedRoute from './components/ProtectedRoute';
import { ColorGradeOverlay } from './components/ColorGradeOverlay';
import { analytics } from './lib/analytics';
import { utmTracker } from './lib/utm-tracker';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { AnalyticsTracker } from './components/AnalyticsTracker';
import { PageSkeleton } from './components/ui/PageLoader';
import { sentry } from './lib/sentry';
import { pwa } from './lib/pwa';
import { webVitals } from './lib/webVitals';
// Lazy load pages for better code splitting and performance
// Core pages (loaded immediately)
import { HomeAnimated } from './pages/HomeAnimated';

// Lazy loaded pages (loaded on demand)
const Collections = lazy(() => import('./pages/Collections'));
const Product = lazy(() => import('./pages/Product'));
const Cart = lazy(() => import('./pages/Cart'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
// Use Collections for category routes until Category component is created
const Category = Collections;

// Auth pages (lazy loaded)
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Profile = lazy(() => import('./pages/Profile'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));

// E-commerce flow (lazy loaded)
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const Orders = lazy(() => import('./pages/Orders'));
const OrderDetails = lazy(() => import('./pages/OrderDetails'));

// Admin pages (lazy loaded - rarely accessed)
const AdminLogin = lazy(() => import('./admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./admin/AdminDashboard'));
const ReviewsAdmin = lazy(() => import('./admin/reviews/ReviewsAdmin'));

const queryClient = new QueryClient();
const ADMIN_BASE = (import.meta as any).env?.VITE_ADMIN_BASE_PATH || 'cl-private-dashboard-2024';

function App() {
  // Initialize analytics and monitoring on app start
  useEffect(() => {
    // Initialize error tracking and monitoring
    sentry.init();
    
    // Initialize analytics services
    analytics.init();
    
    // Initialize PWA features
    pwa.init();
    
    // Initialize Web Vitals monitoring
    webVitals.init();
    
    // UTM tracker is initialized automatically
    console.log('📊 Marketing analytics initialized');
    console.log('🚀 PWA features initialized');
    console.log('⚡ Performance monitoring active');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <ErrorBoundary>
          <AnalyticsTracker>
            <SmoothScrollProvider>
              <div className="min-h-screen bg-white relative">
                <ColorGradeOverlay />
                <ThemeShiftController />
                <NavigationAnimated />
                <FreeShippingBar />
                <MiniCartDrawer />
                <Toaster />
                <main>
                  <Suspense fallback={<PageSkeleton />}>
                    <Routes>
                      <Route path="/" element={<HomeAnimated />} />
                      <Route path="/collections" element={<Collections />} />
                      <Route path="/collections/:slug" element={<Category />} />
                      <Route path="/category/:category" element={<Category />} />
                      <Route path="/product/:id" element={<Product />} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/wishlist" element={<Wishlist />} />
                      <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                      <Route path="/order-success" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />
                      <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                      <Route path="/orders/:id" element={<ProtectedRoute><OrderDetails /></ProtectedRoute>} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/reset-password" element={<ResetPassword />} />
                      <Route path="/verify-email" element={<VerifyEmail />} />
                      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                      <Route path="*" element={<Collections />} />
                    </Routes>
                  </Suspense>
                </main>
                <Footer />
              </div>
            </SmoothScrollProvider>
          </AnalyticsTracker>
        </ErrorBoundary>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
