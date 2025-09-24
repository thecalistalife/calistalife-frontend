import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationAnimated, Footer, MiniCartDrawer, FreeShippingBar, ThemeShiftController } from './components';
import Toaster from './components/Toaster';
import { SmoothScrollProvider } from './components/SmoothScrollProvider';
import ProtectedRoute from './components/ProtectedRoute';
import { ColorGradeOverlay } from './components/ColorGradeOverlay';
import { HomeAnimated } from './pages/HomeAnimated';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import {
  Collections,
  Category,
  Product,
  Cart,
  Wishlist,
  Search,
  Checkout,
  OrderSuccess,
  Orders,
  OrderDetails,
  About,
  Contact,
  NotFound,
} from './pages';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <SmoothScrollProvider>
          <div className="min-h-screen bg-white relative">
            <ColorGradeOverlay />
            <ThemeShiftController />
            <NavigationAnimated />
            <FreeShippingBar />
            <MiniCartDrawer />
            <Toaster />
            <main>
              <Routes>
                <Route path="/" element={<HomeAnimated />} />
                <Route path="/collections" element={<Collections />} />
                <Route path="/collections/:slug" element={<Category />} />
                <Route path="/category/:category" element={<Category />} />
                <Route path="/product/:id" element={<Product />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/search" element={<Search />} />
                <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                <Route path="/order-success" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />
                <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                <Route path="/orders/:id" element={<ProtectedRoute><OrderDetails /></ProtectedRoute>} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </SmoothScrollProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
