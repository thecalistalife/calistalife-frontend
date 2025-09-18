import { Link } from 'react-router-dom';

export { Home } from './Home';
export { Collections } from './Collections';
export { Product } from './Product';

// Simple placeholder pages
export const Category = () => <Collections />;

export const Cart = () => (
  <div className="pt-16 lg:pt-20 min-h-screen">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
      <p>Cart functionality would be implemented here.</p>
    </div>
  </div>
);

export const Wishlist = () => (
  <div className="pt-16 lg:pt-20 min-h-screen">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">Wishlist</h1>
      <p>Wishlist functionality would be implemented here.</p>
    </div>
  </div>
);

export const Search = () => <Collections />;

export const Checkout = () => (
  <div className="pt-16 lg:pt-20 min-h-screen">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      <p>Checkout functionality would be implemented here.</p>
    </div>
  </div>
);

export const OrderSuccess = () => (
  <div className="pt-16 lg:pt-20 min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-3xl font-bold mb-4 text-green-600">Order Successful!</h1>
      <p className="mb-8">Thank you for your purchase.</p>
      <Link to="/" className="px-8 py-4 bg-black text-white font-bold uppercase tracking-wider hover:bg-orange-500 transition-colors">
        Continue Shopping
      </Link>
    </div>
  </div>
);

export const About = () => (
  <div className="pt-16 lg:pt-20">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">About TheCalista</h1>
        <div className="prose prose-lg">
          <p>We are a contemporary streetwear brand focused on minimalist design and quality craftsmanship.</p>
        </div>
      </div>
    </div>
  </div>
);

export const Contact = () => (
  <div className="pt-16 lg:pt-20">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Contact Us</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-bold mb-4">Get in Touch</h2>
            <p className="mb-4">Email: hello@thecalista.com</p>
            <p className="mb-4">Phone: +1 (555) 123-4567</p>
          </div>
          <div>
            <form className="space-y-4">
              <input type="text" placeholder="Name" className="w-full p-3 border rounded" />
              <input type="email" placeholder="Email" className="w-full p-3 border rounded" />
              <textarea placeholder="Message" className="w-full p-3 border rounded"></textarea>
              <button type="submit" className="px-8 py-3 bg-black text-white font-medium rounded hover:bg-orange-500 transition-colors">
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const NotFound = () => (
  <div className="pt-16 lg:pt-20 min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-xl mb-8">Page not found</p>
      <Link to="/" className="px-8 py-4 bg-black text-white font-bold uppercase tracking-wider hover:bg-orange-500 transition-colors">
        Go Home
      </Link>
    </div>
  </div>
);
