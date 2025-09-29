import { Link } from 'react-router-dom';
import { Instagram, Twitter, Facebook, Mail, MapPin, Phone } from 'lucide-react';
import { MarketingAPI } from '../lib/api';
import { trackBrevo } from '../lib/brevoTracker';

export const Footer = () => {
  return (
    <footer className="bg-gray-50 pt-16 pb-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tighter text-black mb-6">
              thecalista
            </h3>
            <p className="text-gray-600 mb-6">
              Redefining streetwear with minimalist design and contemporary aesthetics.
            </p>
            <div className="flex space-x-4">
              <a 
                href="#" 
                className="text-gray-600 hover:text-orange-500 transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a 
                href="#" 
                className="text-gray-600 hover:text-orange-500 transition-colors"
                aria-label="Twitter"
              >
                <Twitter size={20} />
              </a>
              <a 
                href="#" 
                className="text-gray-600 hover:text-orange-500 transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-lg font-bold text-black mb-6 uppercase tracking-wider">
              Shop
            </h4>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/collections" 
                  className="text-gray-600 hover:text-orange-500 transition-colors"
                >
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link 
                  to="/collections" 
                  className="text-gray-600 hover:text-orange-500 transition-colors"
                >
                  Best Sellers
                </Link>
              </li>
              <li>
                <Link 
                  to="/collections" 
                  className="text-gray-600 hover:text-orange-500 transition-colors"
                >
                  Collections
                </Link>
              </li>
              <li>
                <Link 
                  to="/collections" 
                  className="text-gray-600 hover:text-orange-500 transition-colors"
                >
                  Sale
                </Link>
              </li>
            </ul>
          </div>

          {/* Information */}
          <div>
            <h4 className="text-lg font-bold text-black mb-6 uppercase tracking-wider">
              Information
            </h4>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/about" 
                  className="text-gray-600 hover:text-orange-500 transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link 
                  to="/contact" 
                  className="text-gray-600 hover:text-orange-500 transition-colors"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link 
                  to="/shipping" 
                  className="text-gray-600 hover:text-orange-500 transition-colors"
                >
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link 
                  to="/returns" 
                  className="text-gray-600 hover:text-orange-500 transition-colors"
                >
                  Returns & Exchanges
                </Link>
              </li>
              <li>
                <Link 
                  to="/privacy" 
                  className="text-gray-600 hover:text-orange-500 transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-bold text-black mb-6 uppercase tracking-wider">
              Contact
            </h4>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start">
                <MapPin className="mr-3 mt-1 w-4 h-4 flex-shrink-0" />
                <span>123 Fashion Street, New York, NY 10001</span>
              </li>
              <li className="flex items-start">
                <Phone className="mr-3 mt-1 w-4 h-4 flex-shrink-0" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-start">
                <Mail className="mr-3 mt-1 w-4 h-4 flex-shrink-0" />
                <span>hello@thecalista.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="border-t border-gray-200 pt-8 mb-8">
          <div className="max-w-md mx-auto text-center">
            <h4 className="text-lg font-bold text-black mb-4">
              Subscribe to our newsletter
            </h4>
            <p className="text-gray-600 mb-6">
              Get the latest updates on new products and upcoming sales.
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget as HTMLFormElement;
                const input = form.querySelector('input[type="email"]') as HTMLInputElement | null;
                if (!input?.value) return;
                try {
                  await MarketingAPI.newsletterSubscribe({ email: input.value });
                  try { trackBrevo('newsletter_signup', { source: 'footer' }); } catch {}
                  input.value = '';
                  alert('Thanks for subscribing!');
                } catch (err: any) {
                  alert(err?.response?.data?.message || 'Subscription failed');
                }
              }}
              className="flex gap-2"
            >
              <input
                type="email"
                placeholder="Your email address"
                className="flex-grow px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                required
              />
              <button
                type="submit"
                className="px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-orange-500 transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-gray-200 text-center text-gray-600 text-sm">
          <p>&copy; 2023 TheCalista. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};