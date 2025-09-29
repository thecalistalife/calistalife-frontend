import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ProductCard } from '../ProductCard'
import { ProductsAPI } from '../../lib/api'
import { ArrowRight } from 'lucide-react'

interface RecommendationProps {
  productId: string
  type?: 'similar' | 'frequently_bought_together' | 'trending' | 'recently_viewed'
  maxItems?: number
  title?: string
}

interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  images: string[]
  brand?: string
  rating: number
  reviews: number
  inStock: boolean
  sizes: string[]
  colors: string[]
  isNew?: boolean
  isBestSeller?: boolean
  isOnSale?: boolean
  isFeatured?: boolean
}

export function ProductRecommendations({ 
  productId, 
  type = 'similar', 
  maxItems = 4, 
  title 
}: RecommendationProps) {
  const [recommendations, setRecommendations] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const getRecommendationTitle = (type: string) => {
    switch (type) {
      case 'similar': return 'You Might Also Like'
      case 'frequently_bought_together': return 'Frequently Bought Together'
      case 'trending': return 'Trending Now'
      case 'recently_viewed': return 'Recently Viewed'
      default: return 'Recommended Products'
    }
  }

  const loadRecommendations = useCallback(async () => {
    try {
      setLoading(true)
      
      // For now, we'll use similar products from the same category
      // In a real implementation, this would use ML algorithms or collaborative filtering
      const currentProduct = await ProductsAPI.get(productId)
      if (currentProduct.data?.success) {
        const product = currentProduct.data.data
        
        // Get products from the same category, excluding the current product
        const similarProducts = await ProductsAPI.list({
          category: product.category,
          limit: maxItems + 5, // Get more to filter out current product
        })
        
        if (similarProducts.data?.success) {
          const filtered = similarProducts.data.data
            .filter((p: Product) => p.id !== productId)
            .slice(0, maxItems)
          
          setRecommendations(filtered)
        }
      }
    } catch (error) {
      console.error('Failed to load recommendations:', error)
      
      // Fallback: load featured products
      try {
        const featured = await ProductsAPI.list({ 
          sortBy: 'featured',
          limit: maxItems 
        })
        
        if (featured.data?.success) {
          const filtered = featured.data.data
            .filter((p: Product) => p.id !== productId)
            .slice(0, maxItems)
          
          setRecommendations(filtered)
        }
      } catch (fallbackError) {
        console.error('Fallback recommendation loading failed:', fallbackError)
      }
    } finally {
      setLoading(false)
    }
  }, [productId, maxItems])

  useEffect(() => {
    if (productId) {
      loadRecommendations()
    }
  }, [productId, loadRecommendations])

  if (loading) {
    return (
      <div className="py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            {title || getRecommendationTitle(type)}
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {Array.from({ length: maxItems }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-gray-200 h-64 rounded-lg mb-4"></div>
              <div className="bg-gray-200 h-4 rounded mb-2"></div>
              <div className="bg-gray-200 h-4 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (recommendations.length === 0) {
    return null
  }

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {title || getRecommendationTitle(type)}
        </h2>
        {recommendations.length >= maxItems && (
          <Link 
            to="/collections" 
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black transition-colors"
          >
            View All
            <ArrowRight size={16} />
          </Link>
        )}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {recommendations.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      
      {type === 'frequently_bought_together' && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-1">Bundle these items together</h3>
              <p className="text-sm text-gray-600">
                Save 15% when you buy these products together
              </p>
            </div>
            <button className="px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors">
              Add Bundle to Cart
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Recently viewed products hook
export function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([])

  const addToRecentlyViewed = (product: Product) => {
    const stored = JSON.parse(localStorage.getItem('recentlyViewed') || '[]')
    const filtered = stored.filter((p: Product) => p.id !== product.id)
    const updated = [product, ...filtered].slice(0, 10) // Keep last 10 items
    
    localStorage.setItem('recentlyViewed', JSON.stringify(updated))
    setRecentlyViewed(updated)
  }

  const loadRecentlyViewed = () => {
    const stored = JSON.parse(localStorage.getItem('recentlyViewed') || '[]')
    setRecentlyViewed(stored)
  }

  useEffect(() => {
    loadRecentlyViewed()
  }, [])

  return { recentlyViewed, addToRecentlyViewed, loadRecentlyViewed }
}

// Recently viewed products component
export function RecentlyViewedProducts() {
  const { recentlyViewed } = useRecentlyViewed()

  if (recentlyViewed.length === 0) {
    return null
  }

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Recently Viewed</h2>
        <button 
          onClick={() => {
            localStorage.removeItem('recentlyViewed')
            window.location.reload()
          }}
          className="text-sm text-gray-600 hover:text-black transition-colors"
        >
          Clear All
        </button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {recentlyViewed.slice(0, 6).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}