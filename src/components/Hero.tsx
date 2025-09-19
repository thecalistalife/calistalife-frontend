import { Link } from 'react-router-dom';

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center bg-gradient-to-br from-gray-50 to-gray-100 pt-16 lg:pt-20">
      {/* Background Image */}
      <div className="absolute inset-0 overflow-hidden">
        <img 
          src="/src/assets/hero-fashion.jpg" 
          alt="TheCalista Fashion Collection" 
          className="w-full h-full object-cover opacity-90"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-white/60 to-white/40"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center lg:text-left">
            <div className="animate-fade-in">
              <h1 className="text-6xl sm:text-7xl lg:text-8xl xl:text-9xl font-black uppercase tracking-tighter leading-none mb-6">
                the
                <br />
                <span className="text-orange-500">calista</span>
              </h1>
              
              <p className="text-xl lg:text-2xl text-gray-700 mb-8 max-w-2xl leading-relaxed">
                Redefining streetwear with minimalist design and contemporary aesthetics. 
                Where comfort meets style.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  to="/collections"
                  className="px-8 py-4 text-lg font-bold uppercase tracking-wider bg-black text-white hover:bg-orange-500 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg text-center"
                >
                  Explore Collection
                </Link>
                
                <Link
                  to="/about"
                  className="px-8 py-4 text-lg font-medium uppercase tracking-wider border-2 border-black text-black bg-transparent hover:bg-black hover:text-white transition-all duration-300 text-center"
                >
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-black rounded-full flex justify-center">
          <div className="w-1 h-3 bg-black rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};