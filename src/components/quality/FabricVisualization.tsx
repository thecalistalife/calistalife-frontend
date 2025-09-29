import React, { useState, useRef, useEffect } from 'react';
import { Maximize, Minimize, RotateCw, ZoomIn, ZoomOut, Info } from 'lucide-react';

interface FabricVisualizationProps {
  fabricComposition: { [key: string]: number };
  threadCount: number;
  fabricWeight: number;
  stretch: string;
  productImages: string[];
  fabricTexture?: string;
}

const FabricVisualization: React.FC<FabricVisualizationProps> = ({
  fabricComposition,
  threadCount,
  fabricWeight,
  stretch,
  productImages,
  fabricTexture
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedView, setSelectedView] = useState<'product' | 'texture' | 'weave'>('product');
  const [rotation, setRotation] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Enhanced zoom controls
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 5));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.5, 0.5));
  };

  // Rotation control
  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Generate fabric weave pattern based on thread count
  const generateWeavePattern = () => {
    const density = Math.min(threadCount / 50, 8); // Convert thread count to visual density
    return {
      backgroundImage: `
        linear-gradient(0deg, rgba(0,0,0,0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
      `,
      backgroundSize: `${density}px ${density}px`
    };
  };

  // Fabric composition visualization
  const renderFabricComposition = () => {
    const colors = {
      cotton: '#8FBC8F',
      polyester: '#4682B4',
      elastane: '#FFB6C1',
      wool: '#DEB887',
      linen: '#F5DEB3',
      silk: '#FFF8DC',
      bamboo: '#90EE90',
      modal: '#E6E6FA'
    };

    return Object.entries(fabricComposition).map(([material, percentage], index) => {
      const color = colors[material.toLowerCase() as keyof typeof colors] || '#D3D3D3';
      const width = (percentage / 100) * 200; // Scale to container width
      
      return (
        <div key={material} className="mb-2">
          <div className="flex justify-between text-sm mb-1">
            <span className="capitalize font-medium">{material}</span>
            <span className="text-gray-600">{percentage}%</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ 
                backgroundColor: color, 
                width: `${percentage}%`,
                animation: `fillBar 1s ease-out ${index * 0.2}s both`
              }}
            />
          </div>
        </div>
      );
    });
  };

  // Quality indicators with visual feedback
  const renderQualityIndicators = () => {
    const getThreadCountGrade = (count: number) => {
      if (count >= 200) return { grade: 'Luxury', color: 'text-purple-600', bg: 'bg-purple-100' };
      if (count >= 150) return { grade: 'Premium', color: 'text-blue-600', bg: 'bg-blue-100' };
      if (count >= 100) return { grade: 'Standard', color: 'text-green-600', bg: 'bg-green-100' };
      return { grade: 'Basic', color: 'text-gray-600', bg: 'bg-gray-100' };
    };

    const getWeightDescription = (weight: number) => {
      if (weight >= 250) return 'Heavy-weight (Durable)';
      if (weight >= 180) return 'Medium-weight (Versatile)';
      if (weight >= 120) return 'Light-weight (Breathable)';
      return 'Ultra-light (Delicate)';
    };

    const threadGrade = getThreadCountGrade(threadCount);

    return (
      <div className="space-y-4">
        <div className={`p-3 rounded-lg ${threadGrade.bg}`}>
          <div className="flex items-center justify-between">
            <span className="font-semibold">Thread Count</span>
            <span className={`font-bold ${threadGrade.color}`}>{threadGrade.grade}</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {threadCount} threads per square inch
          </p>
        </div>

        <div className="p-3 bg-amber-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Fabric Weight</span>
            <span className="font-bold text-amber-600">{fabricWeight} GSM</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {getWeightDescription(fabricWeight)}
          </p>
        </div>

        <div className="p-3 bg-teal-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Stretch Level</span>
            <span className="font-bold text-teal-600 capitalize">{stretch}</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {stretch === 'none' && 'No stretch - maintains shape'}
            {stretch === 'light' && 'Light stretch - comfortable fit'}
            {stretch === 'medium' && 'Medium stretch - flexible movement'}
            {stretch === 'high' && 'High stretch - maximum comfort'}
          </p>
        </div>
      </div>
    );
  };

  return (
    <>
      <style jsx>{`
        @keyframes fillBar {
          from { width: 0%; }
          to { width: var(--final-width); }
        }
      `}</style>
      
      <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'relative'}`}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Fabric Analysis</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                title="Toggle details"
              >
                <Info className="w-4 h-4" />
              </button>
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* View selection tabs */}
          <div className="flex space-x-1 mt-4">
            {[
              { key: 'product', label: 'Product View' },
              { key: 'texture', label: 'Fabric Texture' },
              { key: 'weave', label: 'Weave Pattern' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedView(tab.key as any)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  selectedView === tab.key
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className={`grid ${isFullscreen ? 'grid-cols-2 h-screen' : 'grid-cols-1 lg:grid-cols-2'} gap-6 p-4`}>
          {/* Visual Panel */}
          <div className="relative">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {selectedView === 'product' && 'Product Image'}
                {selectedView === 'texture' && 'Fabric Close-up'}
                {selectedView === 'weave' && 'Weave Pattern Visualization'}
              </span>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleZoomOut}
                  className="p-1 rounded bg-gray-100 hover:bg-gray-200"
                  title="Zoom out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="px-2 py-1 text-xs bg-gray-100 rounded">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-1 rounded bg-gray-100 hover:bg-gray-200"
                  title="Zoom in"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={handleRotate}
                  className="p-1 rounded bg-gray-100 hover:bg-gray-200"
                  title="Rotate"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div 
              ref={containerRef}
              className="relative bg-gray-50 rounded-lg overflow-hidden border-2 border-gray-200"
              style={{ height: isFullscreen ? 'calc(100vh - 200px)' : '400px' }}
            >
              {selectedView === 'product' && (
                <img
                  ref={imageRef}
                  src={productImages[0] || '/api/placeholder/400/400'}
                  alt="Product detail"
                  className="w-full h-full object-contain transition-transform duration-200"
                  style={{ 
                    transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                    transformOrigin: 'center'
                  }}
                />
              )}

              {selectedView === 'texture' && (
                <div className="w-full h-full relative">
                  <div 
                    className="w-full h-full"
                    style={{
                      backgroundImage: fabricTexture ? `url(${fabricTexture})` : 
                        'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
                      backgroundSize: '20px 20px',
                      backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                      transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                      transformOrigin: 'center'
                    }}
                  />
                  {!fabricTexture && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <div className="text-sm mb-2">Simulated Fabric Texture</div>
                        <div className="text-xs">Based on material composition</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedView === 'weave' && (
                <div 
                  className="w-full h-full"
                  style={{
                    ...generateWeavePattern(),
                    backgroundColor: '#fafafa',
                    transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                    transformOrigin: 'center'
                  }}
                >
                  <div className="absolute inset-0 flex items-end justify-end p-4">
                    <div className="bg-white/90 p-2 rounded text-xs">
                      {threadCount} TPI
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Information Panel */}
          <div className="space-y-6">
            {/* Fabric Composition */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Fabric Composition</h4>
              {renderFabricComposition()}
            </div>

            {/* Quality Metrics */}
            {showDetails && (
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Quality Metrics</h4>
                {renderQualityIndicators()}
              </div>
            )}

            {/* Technical Specifications */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-3">Technical Specs</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Thread Count:</span>
                  <div className="font-medium">{threadCount} TPI</div>
                </div>
                <div>
                  <span className="text-gray-600">Weight:</span>
                  <div className="font-medium">{fabricWeight} GSM</div>
                </div>
                <div>
                  <span className="text-gray-600">Stretch:</span>
                  <div className="font-medium capitalize">{stretch}</div>
                </div>
                <div>
                  <span className="text-gray-600">Primary Material:</span>
                  <div className="font-medium capitalize">
                    {Object.keys(fabricComposition)[0] || 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Care Tips based on fabric */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Care Recommendations</h4>
              <div className="text-sm text-blue-700 space-y-1">
                {Object.keys(fabricComposition).includes('cotton') && (
                  <div>• Cotton: Machine wash in cold water to prevent shrinking</div>
                )}
                {Object.keys(fabricComposition).includes('polyester') && (
                  <div>• Polyester: Wrinkle-resistant, tumble dry on low heat</div>
                )}
                {Object.keys(fabricComposition).includes('elastane') && (
                  <div>• Elastane: Avoid high heat to maintain stretch</div>
                )}
                <div>• Turn inside out before washing to preserve color</div>
              </div>
            </div>
          </div>
        </div>

        {/* Fullscreen overlay close button */}
        {isFullscreen && (
          <button
            onClick={toggleFullscreen}
            className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
          >
            ✕
          </button>
        )}
      </div>
    </>
  );
};

export default FabricVisualization;