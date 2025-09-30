import { Loader2 } from 'lucide-react';

interface PageLoaderProps {
  message?: string;
  className?: string;
}

export const PageLoader: React.FC<PageLoaderProps> = ({ 
  message = "Loading...", 
  className = "" 
}) => {
  return (
    <div className={`min-h-screen flex items-center justify-center bg-gray-50 ${className}`}>
      <div className="flex flex-col items-center space-y-4 p-8">
        <Loader2 
          className="h-8 w-8 animate-spin text-blue-600" 
          aria-hidden="true" 
        />
        <p className="text-gray-600 text-sm font-medium" role="status" aria-live="polite">
          {message}
        </p>
      </div>
    </div>
  );
};

// Lightweight skeleton loader for faster perceived performance
export const PageSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-white animate-pulse" role="status" aria-label="Loading page content">
      {/* Header skeleton */}
      <div className="h-16 bg-gray-100 border-b"></div>
      
      {/* Content skeleton */}
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded h-48"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageLoader;