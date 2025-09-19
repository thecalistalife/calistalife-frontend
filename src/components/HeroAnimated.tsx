import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export const HeroAnimated = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);

  useEffect(() => {
    // Add mouse parallax effect
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      
      const xPos = (clientX / innerWidth - 0.5) * 20;
      const yPos = (clientY / innerHeight - 0.5) * 20;
      
      const elements = containerRef.current.querySelectorAll('.parallax-element');
      elements.forEach((el, index) => {
        const depth = (index + 1) * 0.5;
        (el as HTMLElement).style.transform = `translate(${xPos * depth}px, ${yPos * depth}px)`;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const titleVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        staggerChildren: 0.1
      }
    }
  };

  const letterVariants = {
    hidden: { opacity: 0, y: 50, rotateX: -90 },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: {
        duration: 0.8
      }
    }
  };

  return (
    <section ref={containerRef} className="relative min-h-screen flex items-center overflow-hidden">
      {/* Animated gradient background */}
      <motion.div 
        className="absolute inset-0 animate-gradient"
        style={{ scale }}
      />
      
      {/* Floating shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          className="absolute top-20 left-10 w-64 h-64 bg-red-500/20 rounded-full blur-3xl parallax-element"
          animate={{ 
            y: [0, -20, 0],
            x: [0, 10, 0]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl parallax-element"
          animate={{ 
            y: [0, 20, 0],
            x: [0, -10, 0]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl parallax-element"
          animate={{ 
            rotate: 360
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      {/* Main content */}
      <motion.div 
        className="relative z-10 w-full"
        style={{ y, opacity }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto text-center">
            {/* Animated sparkles */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 mb-8 bg-white/10 backdrop-blur-md rounded-full border border-white/20"
            >
              <Sparkles className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium text-gray-800">New Collection Available</span>
            </motion.div>

            {/* Animated title */}
            <motion.div
              variants={titleVariants}
              initial="hidden"
              animate="visible"
              className="mb-8"
            >
              <motion.h1 className="text-7xl sm:text-8xl lg:text-9xl xl:text-[10rem] font-black uppercase tracking-tighter leading-none text-black">
                <motion.span 
                  className="block"
                  variants={letterVariants}
                >
                  {"THE".split("").map((letter, index) => (
                    <motion.span
                      key={`the-${index}`}
                      variants={letterVariants}
                      className="inline-block hover:text-red-600 transition-colors cursor-default"
                      whileHover={{ scale: 1.2, rotate: [-5, 5, -5, 0] }}
                    >
                      {letter}
                    </motion.span>
                  ))}
                </motion.span>
                <motion.span 
                  className="block"
                  variants={letterVariants}
                >
                  {"CALISTA".split("").map((letter, index) => (
                    <motion.span
                      key={index}
                      variants={letterVariants}
                      className="inline-block relative cursor-default bg-clip-text text-transparent"
                      whileHover={{ 
                        scale: 1.2, 
                        rotate: [-5, 5, -5, 0],
                        transition: { duration: 0.3 }
                      }}
                      style={{
                        background: 'linear-gradient(45deg, #dc2626, #ef4444, #b91c1c)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}
                    >
                      <span className="relative z-10">{letter}</span>
                      <motion.span
                        className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300"
                        style={{
                          background: 'linear-gradient(45deg, #b91c1c, #ef4444, #dc2626)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text'
                        }}
                      >
                        {letter}
                      </motion.span>
                    </motion.span>
                  ))}
                </motion.span>
              </motion.h1>
            </motion.div>

            {/* Tagline */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="mb-6"
            >
              <span className="inline-block uppercase tracking-[0.3em] text-red-600 font-black">LIVE LIFE IN COLOURS</span>
            </motion.div>

            {/* Animated subtitle */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="text-xl lg:text-2xl text-gray-700 mb-12 max-w-3xl mx-auto leading-relaxed"
            >
              Redefining streetwear with minimalist design and contemporary aesthetics. 
              Where comfort meets style in perfect harmony.
            </motion.p>

            {/* Animated buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-6 justify-center"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/collections"
                  className="group relative px-10 py-5 text-lg font-bold uppercase tracking-wider bg-black text-white overflow-hidden block"
                >
                  <span className="relative z-10">Explore Collection</span>
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-500"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </Link>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/about"
                  className="group px-10 py-5 text-lg font-medium uppercase tracking-wider border-2 border-black text-black hover:bg-black hover:text-white transition-all duration-300 block glass"
                >
                  Learn More
                </Link>
              </motion.div>
            </motion.div>

            {/* Animated stats */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.8 }}
              className="mt-20 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
            >
              {[
                { number: "500+", label: "Products" },
                { number: "50K+", label: "Customers" },
                { number: "95%", label: "Satisfaction" }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4 + index * 0.1, duration: 0.5 }}
                  whileHover={{ scale: 1.1 }}
                  className="text-center"
                >
                  <motion.div 
                    className="text-3xl font-black text-black"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1.5 + index * 0.1, type: "spring", stiffness: 200 }}
                  >
                    {stat.number}
                  </motion.div>
                  <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Animated scroll indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="flex flex-col items-center gap-2 cursor-pointer"
          onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
        >
          <span className="text-xs uppercase tracking-widest text-gray-600">Scroll to explore</span>
          <div className="w-6 h-10 border-2 border-black rounded-full flex justify-center">
            <motion.div 
              className="w-1 h-3 bg-black rounded-full mt-2"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};