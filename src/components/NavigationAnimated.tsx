import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ShoppingCart, Heart, Search, User, ChevronDown } from 'lucide-react';
import { useCartStore } from '../store';
import clsx from 'clsx';

export const NavigationAnimated = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const [visible, setVisible] = useState(true);
  const location = useLocation();
  const cartItems = useCartStore((state) => state.items);
  const cartItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.scrollY;
      const isVisible = prevScrollPos > currentScrollPos || currentScrollPos < 10;
      
      setScrolled(currentScrollPos > 50);
      setVisible(isVisible);
      setPrevScrollPos(currentScrollPos);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [prevScrollPos]);

  const navVariants = {
    hidden: { y: -100, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: {
        duration: 0.3
      }
    }
  };

  const menuVariants = {
    closed: {
      x: 500,
      transition: {
        duration: 0.3
      }
    },
    open: {
      x: 0,
      transition: {
        duration: 0.3
      }
    }
  };

  const linkVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.3
      }
    })
  };

  const navLinks = [
    { name: 'Collections', path: '/collections', hasDropdown: true },
    { name: 'New Arrivals', path: '/collections?sort=newest' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' }
  ];

  return (
    <motion.nav
      variants={navVariants}
      initial="visible"
      animate={visible ? "visible" : "hidden"}
      className={clsx(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled ? 'bg-white/95 backdrop-blur-lg shadow-lg' : 'bg-transparent'
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link to="/" className="flex items-center">
              <motion.h1 
                className={clsx(
                  "text-2xl lg:text-3xl font-black uppercase tracking-tighter transition-colors",
                  scrolled ? "text-black" : "text-black"
                )}
              >
                <span className="mr-1">THE</span>
                <motion.span
                  className="ml-1 gradient-text-red"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  CALISTA
                </motion.span>
              </motion.h1>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link, index) => (
              <motion.div
                key={`${link.path}-${link.name}`}
                custom={index}
                initial="hidden"
                animate="visible"
                variants={linkVariants}
                className="relative group"
              >
                <Link
                  to={link.path}
                  className={clsx(
                    "font-medium uppercase tracking-wide transition-all hover:text-red-600",
                    location.pathname === link.path ? "text-red-600" : scrolled ? "text-gray-900" : "text-gray-900"
                  )}
                >
                  <span className="relative">
                    {link.name}
                    {link.hasDropdown && <ChevronDown className="inline w-4 h-4 ml-1" />}
                    <motion.span
                      className="absolute -bottom-1 left-0 h-0.5 bg-red-600"
                      initial={{ width: 0 }}
                      whileHover={{ width: "100%" }}
                      transition={{ duration: 0.3 }}
                    />
                  </span>
                </Link>

                {/* Dropdown menu */}
                {link.hasDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    whileHover={{ opacity: 1, y: 0 }}
                    className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-xl overflow-hidden invisible group-hover:visible"
                  >
                    <Link to="/collections/streetwear" className="block px-4 py-3 hover:bg-red-50 transition-colors">
                      Streetwear
                    </Link>
                    <Link to="/collections/basics" className="block px-4 py-3 hover:bg-red-50 transition-colors">
                      Basics
                    </Link>
                    <Link to="/collections/accessories" className="block px-4 py-3 hover:bg-red-50 transition-colors">
                      Accessories
                    </Link>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={clsx(
                "p-2 transition-colors",
                scrolled ? "hover:text-red-600" : "hover:text-red-600"
              )}
            >
              <Search className="w-5 h-5" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={clsx(
                "p-2 transition-colors",
                scrolled ? "hover:text-red-600" : "hover:text-red-600"
              )}
            >
              <User className="w-5 h-5" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={clsx(
                "p-2 transition-colors",
                scrolled ? "hover:text-red-600" : "hover:text-red-600"
              )}
            >
              <Heart className="w-5 h-5" />
            </motion.button>

            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="relative"
            >
              <button
                onClick={() => useCartStore.getState().toggleCart()}
                className={clsx(
                  "p-2 block transition-colors relative",
                  scrolled ? "hover:text-red-600" : "hover:text-red-600"
                )}
                aria-label="Open cart"
              >
                <ShoppingCart className="w-5 h-5" />
{cartItemsCount > 0 && (
                  <motion.span
                    key={cartItemsCount}
                    initial={{ scale: 0 }}
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.4 }}
                    className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
                  >
                    {cartItemsCount}
                  </motion.span>
                )}
              </button>
            </motion.div>

            {/* Mobile menu toggle */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={menuVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="fixed top-0 right-0 h-screen w-full sm:w-96 bg-white shadow-2xl lg:hidden z-50"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black uppercase">Menu</h2>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsOpen(false)}
                  className="p-2"
                >
                  <X className="w-6 h-6" />
                </motion.button>
              </div>

              <div className="space-y-6">
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.path}
                    custom={index}
                    initial="hidden"
                    animate="visible"
                    variants={linkVariants}
                  >
                    <Link
                      to={link.path}
                      onClick={() => setIsOpen(false)}
                      className="block text-lg font-medium uppercase tracking-wide hover:text-orange-500 transition-colors"
                    >
                      {link.name}
                    </Link>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-12 pt-8 border-t"
              >
                <div className="flex gap-4">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="flex-1 py-3 bg-black text-white font-bold uppercase tracking-wider hover:bg-orange-500 transition-colors"
                  >
                    Sign In
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="flex-1 py-3 border-2 border-black font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-all"
                  >
                    Sign Up
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm lg:hidden z-40"
          />
        )}
      </AnimatePresence>
    </motion.nav>
  );
};