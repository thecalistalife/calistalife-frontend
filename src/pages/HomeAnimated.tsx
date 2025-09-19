import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { HeroAnimated } from '../components/HeroAnimated';
import { Carousel } from '../components/index';
import { products, collections } from '../data/index';
import { handleImageError } from '../utils/index';
import { ArrowRight, Star, TrendingUp, Award, Heart } from 'lucide-react';

export const HomeAnimated = () => {
  const newArrivals = products.filter(product => product.isNew).slice(0, 4);
  const bestSellers = products.filter(product => product.isBestSeller).slice(0, 4);

  // Scroll animations for sections
  const featuredRef = useRef(null);
  const newArrivalsRef = useRef(null);
  const bestSellersRef = useRef(null);
  const aboutRef = useRef(null);

  const featuredInView = useInView(featuredRef, { once: true, amount: 0.3 });
  const newArrivalsInView = useInView(newArrivalsRef, { once: true, amount: 0.2 });
  const bestSellersInView = useInView(bestSellersRef, { once: true, amount: 0.2 });
  const aboutInView = useInView(aboutRef, { once: true, amount: 0.3 });

  // Parallax scroll for newsletter section
  const { scrollYProgress } = useScroll();
  const newsletterY = useTransform(scrollYProgress, [0.7, 1], [100, 0]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className="pt-16 lg:pt-20 overflow-hidden">
      {/* Hero Section with animations */}
      <HeroAnimated />

      {/* Featured Collections with scroll animations */}
      <motion.section 
        ref={featuredRef}
        className="py-32 bg-gradient-to-b from-gray-50 via-white to-gray-50 relative"
      >
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-orange-200/30 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-purple-200/30 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={featuredInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <motion.div
              initial={{ width: 0 }}
              animate={featuredInView ? { width: '100px' } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="h-1 bg-gradient-to-r from-red-600 to-red-500 mx-auto mb-8"
            />
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter text-black mb-6">
              Featured Collections
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Discover our curated collections of contemporary streetwear, 
              each piece carefully designed to elevate your style
            </p>
          </motion.div>
          
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate={featuredInView ? "visible" : "hidden"}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
          >
            {collections.slice(0, 3).map((collection) => (
              <motion.div 
                key={collection.id}
                variants={cardVariants}
                whileHover={{ y: -10 }}
                className="group cursor-pointer"
              >
                <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                    className="relative"
                  >
                    <img
                      src={collection.image}
                      alt={collection.name}
                      className="w-full h-96 object-cover"
                      onError={(e) => handleImageError(e, collection.name)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileHover={{ opacity: 1, y: 0 }}
                    className="absolute inset-0 bg-black/60 flex items-center justify-center"
                  >
                    <Link
                      to={`/collections/${collection.slug}`}
                      className="px-8 py-3 bg-white text-black font-bold uppercase tracking-wider hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
                    >
                      View Collection <ArrowRight className="w-4 h-4" />
                    </Link>
                  </motion.div>

                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h3 className="text-2xl font-bold mb-2">{collection.name}</h3>
                    <p className="text-sm opacity-90">{collection.productCount} Products</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Lookbook Slider */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-black mb-4">
              Lookbook
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Explore highlights from our latest collections
            </p>
          </div>
          <Carousel
            items={collections.map((c) => ({
              id: c.id,
              image: c.image,
              title: c.name,
              subtitle: `${c.productCount} Products`,
              href: `/collections/${c.slug}`,
            }))}
            autoPlay
            interval={4000}
          />
        </div>
      </section>

      {/* New Arrivals with advanced animations */}
      <motion.section 
        ref={newArrivalsRef}
        className="py-32 bg-white relative"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={newArrivalsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <motion.div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 rounded-full mb-6">
              <TrendingUp className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium text-red-700">Just Dropped</span>
            </motion.div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter text-black mb-6">
              New Arrivals
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Fresh designs, innovative materials, and cutting-edge style
            </p>
          </motion.div>
          
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate={newArrivalsInView ? "visible" : "hidden"}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {newArrivals.map((product, index) => (
              <motion.div
                key={product.id}
                variants={itemVariants}
                custom={index}
                whileHover={{ y: -10, transition: { duration: 0.2 } }}
                className="group"
              >
                <div className="relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300">
                  <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => handleImageError(e, product.name)}
                    />
                  </div>
                  
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-4"
                  >
                    <div className="text-white">
                      <h3 className="font-bold text-lg">{product.name}</h3>
                      <p className="text-sm opacity-90">${product.price}</p>
                    </div>
                  </motion.div>

                  {product.isNew && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold"
                    >
                      NEW
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={newArrivalsInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.8 }}
            className="text-center mt-16"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/collections"
                className="inline-flex items-center gap-3 px-10 py-5 font-bold uppercase tracking-wider bg-black text-white hover:bg-red-500 transition-all group"
              >
                View All Products 
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Best Sellers with rating animations */}
      <motion.section 
        ref={bestSellersRef}
        className="py-32 bg-gradient-to-b from-gray-50 to-white"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={bestSellersInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <motion.div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 rounded-full mb-6">
              <Award className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-700">Customer Favorites</span>
            </motion.div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter text-black mb-6">
              Best Sellers
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The pieces our community can't get enough of
            </p>
          </motion.div>
          
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate={bestSellersInView ? "visible" : "hidden"}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {bestSellers.map((product) => (
              <motion.div
                key={product.id}
                variants={itemVariants}
                whileHover={{ y: -10 }}
                className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                <div className="relative overflow-hidden rounded-t-xl">
                  <div className="aspect-square bg-gray-100">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                      onError={(e) => handleImageError(e, product.name)}
                    />
                  </div>
                  
                  {product.isBestSeller && (
                    <div className="absolute top-4 left-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <Star className="w-3 h-3 fill-white" /> BEST SELLER
                    </div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-red-500 hover:text-white transition-colors"
                  >
                    <Heart className="w-5 h-5" />
                  </motion.button>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                      >
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      </motion.div>
                    ))}
                    <span className="text-sm text-gray-600 ml-2">(4.9)</span>
                  </div>
                  <h3 className="font-bold text-lg mb-2">{product.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">${product.price}</span>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-orange-500 transition-colors"
                    >
                      Add to Cart
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* About Section with parallax */}
      <motion.section 
        ref={aboutRef}
        className="py-32 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-purple-50" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-7xl mx-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={aboutInView ? { opacity: 1 } : {}}
              className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
            >
              <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={aboutInView ? { x: 0, opacity: 1 } : {}}
                transition={{ duration: 0.8 }}
              >
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter text-black mb-8">
                  Our Philosophy
                </h2>
                <div className="space-y-6 text-gray-600 text-lg leading-relaxed">
                  <p>
                    At TheCalista, we believe that true style comes from the intersection 
                    of comfort, quality, and contemporary design. Founded with a vision to 
                    redefine streetwear, we create pieces that speak to the modern individual 
                    who values both form and function.
                  </p>
                  <p>
                    Every piece in our collection is thoughtfully designed and ethically 
                    produced, ensuring that you not only look good but feel good about 
                    your choices.
                  </p>
                </div>
                
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-block mt-10"
                >
                  <Link
                    to="/about"
                    className="inline-flex items-center gap-3 px-8 py-4 font-bold uppercase tracking-wider bg-gradient-to-r from-orange-500 to-red-500 text-white hover:shadow-2xl transition-all"
                  >
                    Learn More About Us
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ x: 100, opacity: 0 }}
                animate={aboutInView ? { x: 0, opacity: 1 } : {}}
                transition={{ duration: 0.8 }}
                className="relative"
              >
                <motion.div 
                  className="bg-white rounded-2xl p-10 shadow-2xl relative z-10"
                  whileHover={{ y: -5 }}
                >
                  <h3 className="text-3xl font-bold text-black mb-8">Our Values</h3>
                  <ul className="space-y-6">
                    {[
                      { icon: '🌱', text: 'Sustainable fashion practices' },
                      { icon: '✨', text: 'Ethical manufacturing' },
                      { icon: '🎨', text: 'Minimalist design approach' },
                      { icon: '💎', text: 'Quality over quantity' },
                      { icon: '🤝', text: 'Inclusive sizing' }
                    ].map((value, index) => (
                      <motion.li
                        key={index}
                        initial={{ x: -20, opacity: 0 }}
                        animate={aboutInView ? { x: 0, opacity: 1 } : {}}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        className="flex items-center gap-4 group"
                      >
                        <motion.span 
                          className="text-2xl"
                          whileHover={{ scale: 1.2, rotate: 360 }}
                          transition={{ duration: 0.5 }}
                        >
                          {value.icon}
                        </motion.span>
                        <span className="text-gray-700 text-lg group-hover:text-black transition-colors">
                          {value.text}
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
                
                {/* Decorative floating element */}
                <motion.div
                  className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-orange-400 to-red-400 rounded-full blur-3xl opacity-30"
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 180, 360]
                  }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Newsletter with parallax */}
      <motion.section 
        style={{ y: newsletterY }}
        className="py-32 bg-gradient-to-br from-black via-gray-900 to-black text-white relative overflow-hidden"
      >
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="inline-block mb-6"
            >
              <div className="px-6 py-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                <span className="text-sm font-medium uppercase tracking-wider">Newsletter</span>
              </div>
            </motion.div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter mb-6">
              Join Our Community
            </h2>
            <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
              Subscribe to our newsletter for exclusive offers, new arrivals, and style inspiration 
              delivered straight to your inbox.
            </p>
            
            <motion.form 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto"
            >
              <motion.input
                whileFocus={{ scale: 1.02 }}
                type="email"
                placeholder="Enter your email address"
                className="flex-grow px-6 py-4 text-black rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-500/50 transition-all"
                required
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="px-10 py-4 font-bold uppercase tracking-wider bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:shadow-2xl transition-all"
              >
                Subscribe
              </motion.button>
            </motion.form>

            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              viewport={{ once: true }}
              className="mt-6 text-sm text-gray-400"
            >
              Join 50,000+ subscribers. No spam, unsubscribe anytime.
            </motion.p>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
};