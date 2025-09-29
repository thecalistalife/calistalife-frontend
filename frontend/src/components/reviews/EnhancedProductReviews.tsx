import { useEffect, useMemo, useState, useCallback } from 'react'
import { ReviewsAPI } from '../../lib/api'
import { useAuthStore } from '../../store/auth'
import { Star, ThumbsUp, ThumbsDown, Camera, Filter, Search } from 'lucide-react'

interface ReviewFormData {
  rating: number
  reviewTitle: string
  reviewText: string
  reviewerName: string
  reviewerEmail: string
  sizePurchased: string
  colorPurchased: string
  fitFeedback: 'too_small' | 'perfect' | 'too_large' | ''
  qualityRating: number
  comfortRating: number
  styleRating: number
}

const initialFormData: ReviewFormData = {
  rating: 5,
  reviewTitle: '',
  reviewText: '',
  reviewerName: '',
  reviewerEmail: '',
  sizePurchased: '',
  colorPurchased: '',
  fitFeedback: '',
  qualityRating: 5,
  comfortRating: 5,
  styleRating: 5,
}

interface ReviewSummary {
  total: number
  average: number
  counts: Record<number, number>
  verified: number
  avgQuality: number
  avgComfort: number
  avgStyle: number
  fitFeedback: Record<string, number>
}

interface Review {
  id: string
  rating: number
  review_title?: string
  review_text: string
  reviewer_name: string
  verified_purchase: boolean
  helpful_count: number
  unhelpful_count: number
  size_purchased?: string
  color_purchased?: string
  fit_feedback?: string
  quality_rating?: number
  comfort_rating?: number
  style_rating?: number
  created_at: string
  images?: any[]
  responses?: any[]
}

export default function EnhancedProductReviews({ productId }: { productId: string }) {
  const user = useAuthStore(s => s.user as any)
  const [summary, setSummary] = useState<ReviewSummary | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [sort, setSort] = useState<'newest' | 'helpful'>('helpful')
  const [filters, setFilters] = useState<{ 
    photosOnly?: boolean
    verifiedOnly?: boolean
    minRating?: number
    fit?: 'too_small' | 'perfect' | 'too_large'
    search?: string
  }>({})

  const [showReviewForm, setShowReviewForm] = useState(false)
  const [form, setForm] = useState<ReviewFormData>(() => ({
    ...initialFormData,
    reviewerName: user?.name || '',
    reviewerEmail: user?.email || '',
  }))
  const [images, setImages] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSummary = useCallback(async () => {
    try {
      const r = await ReviewsAPI.summary(productId)
      if (r.data?.success) {
        const summaryData = r.data.data as any
        
        // Calculate additional metrics
        const allReviews = await ReviewsAPI.list(productId, { limit: 1000 })
        if (allReviews.data?.success) {
          const reviewsData = allReviews.data.data as Review[]
          
          const qualityRatings = reviewsData.filter(r => r.quality_rating).map(r => r.quality_rating!)
          const comfortRatings = reviewsData.filter(r => r.comfort_rating).map(r => r.comfort_rating!)
          const styleRatings = reviewsData.filter(r => r.style_rating).map(r => r.style_rating!)
          
          const fitCounts = reviewsData.reduce((acc, r) => {
            if (r.fit_feedback) {
              acc[r.fit_feedback] = (acc[r.fit_feedback] || 0) + 1
            }
            return acc
          }, {} as Record<string, number>)
          
          setSummary({
            ...summaryData,
            avgQuality: qualityRatings.length ? qualityRatings.reduce((a, b) => a + b, 0) / qualityRatings.length : 0,
            avgComfort: comfortRatings.length ? comfortRatings.reduce((a, b) => a + b, 0) / comfortRatings.length : 0,
            avgStyle: styleRatings.length ? styleRatings.reduce((a, b) => a + b, 0) / styleRatings.length : 0,
            fitFeedback: fitCounts,
          })
        } else {
          setSummary(summaryData)
        }
      }
    } catch (e) {
      console.error('Failed to load review summary:', e)
    }
  }, [productId])

  const loadReviews = useCallback(async () => {
    try {
      const r = await ReviewsAPI.list(productId, { page, limit, sort, ...filters })
      if (r.data?.success) {
        setReviews(r.data.data as Review[])
      }
    } catch (e) {
      console.error('Failed to load reviews:', e)
    }
  }, [productId, page, limit, sort, filters])

  useEffect(() => {
    loadSummary()
  }, [productId])

  useEffect(() => {
    loadReviews()
  }, [productId, page, limit, sort, filters.photosOnly, filters.verifiedOnly, filters.minRating, filters.fit, filters.search])

  const onSubmit = async () => {
    setSubmitting(true)
    setError(null)
    
    try {
      let uploaded: string[] = []
      if (images.length) {
        const ur = await ReviewsAPI.uploadImages(images)
        uploaded = ur.data?.data?.urls || []
      }
      
      const payload = { ...form, productId, imageUrls: uploaded }
      const cr = await ReviewsAPI.create(payload)
      
      if (!cr.data?.success) {
        throw new Error(cr.data?.message || 'Failed to submit review')
      }
      
      setForm({ ...initialFormData, reviewerName: user?.name || '', reviewerEmail: user?.email || '' })
      setImages([])
      setShowReviewForm(false)
      await Promise.all([loadSummary(), loadReviews()])
      alert('Thank you for your review! It helps other customers make informed decisions.')
    } catch (e: any) {
      setError(e?.message || 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  const onVote = async (reviewId: string, helpful: boolean) => {
    try {
      const r = await ReviewsAPI.vote(reviewId, helpful)
      if (r.data?.success) {
        setReviews(prev => prev.map(review => 
          review.id === reviewId 
            ? { 
                ...review, 
                helpful_count: r.data.data.helpful, 
                unhelpful_count: r.data.data.unhelpful 
              }
            : review
        ))
      }
    } catch (e) {
      console.error('Failed to vote:', e)
    }
  }

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'sm') => {
    const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6'
    const stars = []
    
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`${sizeClass} ${i <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
        />
      )
    }
    
    return <div className="flex items-center gap-1">{stars}</div>
  }

  const renderRatingBreakdown = () => {
    if (!summary) return null

    const maxCount = Math.max(...Object.values(summary.counts))
    
    return (
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map(rating => (
          <div key={rating} className="flex items-center gap-3">
            <span className="text-sm text-gray-600 w-8">{rating} ★</span>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-yellow-400 h-2 rounded-full" 
                style={{ width: `${maxCount > 0 ? (summary.counts[rating] / maxCount) * 100 : 0}%` }}
              />
            </div>
            <span className="text-sm text-gray-600 w-8">{summary.counts[rating] || 0}</span>
          </div>
        ))}
      </div>
    )
  }

  const filteredReviews = useMemo(() => {
    let filtered = reviews

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(review => 
        review.review_text.toLowerCase().includes(searchTerm) ||
        (review.review_title?.toLowerCase().includes(searchTerm))
      )
    }

    return filtered
  }, [reviews, filters.search])

  return (
    <section className="mt-12 bg-white rounded-lg border p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Customer Reviews</h2>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              {renderStars(summary?.average || 0, 'md')}
              <span className="font-medium">{summary?.average?.toFixed(1) || '0.0'} out of 5</span>
            </div>
            <span>•</span>
            <span>{summary?.total || 0} reviews</span>
            {summary?.verified && (
              <>
                <span>•</span>
                <span>{summary.verified} verified purchases</span>
              </>
            )}
          </div>
        </div>
        
        <button
          onClick={() => setShowReviewForm(!showReviewForm)}
          className="px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          Write a Review
        </button>
      </div>

      {/* Enhanced Summary Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 p-4 bg-gray-50 rounded-lg">
        <div>
          <h3 className="font-semibold mb-3">Rating Breakdown</h3>
          {renderRatingBreakdown()}
        </div>
        
        {(summary?.avgQuality || summary?.avgComfort || summary?.avgStyle) && (
          <div>
            <h3 className="font-semibold mb-3">Detailed Ratings</h3>
            <div className="space-y-2">
              {summary?.avgQuality && (
                <div className="flex justify-between items-center">
                  <span className="text-sm">Quality</span>
                  <div className="flex items-center gap-2">
                    {renderStars(summary.avgQuality)}
                    <span className="text-sm font-medium">{summary.avgQuality.toFixed(1)}</span>
                  </div>
                </div>
              )}
              {summary?.avgComfort && (
                <div className="flex justify-between items-center">
                  <span className="text-sm">Comfort</span>
                  <div className="flex items-center gap-2">
                    {renderStars(summary.avgComfort)}
                    <span className="text-sm font-medium">{summary.avgComfort.toFixed(1)}</span>
                  </div>
                </div>
              )}
              {summary?.avgStyle && (
                <div className="flex justify-between items-center">
                  <span className="text-sm">Style</span>
                  <div className="flex items-center gap-2">
                    {renderStars(summary.avgStyle)}
                    <span className="text-sm font-medium">{summary.avgStyle.toFixed(1)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {summary?.fitFeedback && Object.keys(summary.fitFeedback).length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">Fit Feedback</h3>
            <div className="space-y-2">
              {Object.entries(summary.fitFeedback).map(([fit, count]) => (
                <div key={fit} className="flex justify-between items-center">
                  <span className="text-sm capitalize">{fit.replace('_', ' ')}</span>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Review Form */}
      {showReviewForm && (
        <div className="mb-8 p-6 border rounded-lg bg-gray-50">
          <h3 className="text-xl font-semibold mb-4">Share Your Experience</h3>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              className="border rounded-lg p-3 focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="Your name"
              value={form.reviewerName}
              onChange={e => setForm({ ...form, reviewerName: e.target.value })}
            />
            <input
              type="email"
              className="border rounded-lg p-3 focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="Your email"
              value={form.reviewerEmail}
              onChange={e => setForm({ ...form, reviewerEmail: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Overall Rating</label>
              <select
                className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-black focus:border-transparent"
                value={form.rating}
                onChange={e => setForm({ ...form, rating: Number(e.target.value) })}
              >
                {[5, 4, 3, 2, 1].map(n => (
                  <option key={n} value={n}>{n} star{n !== 1 ? 's' : ''} - {
                    n === 5 ? 'Excellent' :
                    n === 4 ? 'Good' :
                    n === 3 ? 'Average' :
                    n === 2 ? 'Poor' : 'Terrible'
                  }</option>
                ))}
              </select>
            </div>
            <input
              className="border rounded-lg p-3 focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="Review title (optional)"
              value={form.reviewTitle}
              onChange={e => setForm({ ...form, reviewTitle: e.target.value })}
            />
          </div>

          <textarea
            className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-black focus:border-transparent mb-4"
            rows={4}
            placeholder="Tell us about your experience with this product. How's the quality, fit, and style?"
            value={form.reviewText}
            onChange={e => setForm({ ...form, reviewText: e.target.value })}
          />

          {/* Detailed Ratings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Quality Rating</label>
              <select
                className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-black focus:border-transparent"
                value={form.qualityRating}
                onChange={e => setForm({ ...form, qualityRating: Number(e.target.value) })}
              >
                {[5, 4, 3, 2, 1].map(n => (
                  <option key={n} value={n}>{n} star{n !== 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Comfort Rating</label>
              <select
                className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-black focus:border-transparent"
                value={form.comfortRating}
                onChange={e => setForm({ ...form, comfortRating: Number(e.target.value) })}
              >
                {[5, 4, 3, 2, 1].map(n => (
                  <option key={n} value={n}>{n} star{n !== 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Style Rating</label>
              <select
                className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-black focus:border-transparent"
                value={form.styleRating}
                onChange={e => setForm({ ...form, styleRating: Number(e.target.value) })}
              >
                {[5, 4, 3, 2, 1].map(n => (
                  <option key={n} value={n}>{n} star{n !== 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Purchase Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              className="border rounded-lg p-3 focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="Size purchased (optional)"
              value={form.sizePurchased}
              onChange={e => setForm({ ...form, sizePurchased: e.target.value })}
            />
            <input
              className="border rounded-lg p-3 focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="Color purchased (optional)"
              value={form.colorPurchased}
              onChange={e => setForm({ ...form, colorPurchased: e.target.value })}
            />
            <select
              className="border rounded-lg p-3 focus:ring-2 focus:ring-black focus:border-transparent"
              value={form.fitFeedback}
              onChange={e => setForm({ ...form, fitFeedback: e.target.value as any })}
            >
              <option value="">How does it fit?</option>
              <option value="too_small">Too small</option>
              <option value="perfect">Perfect fit</option>
              <option value="too_large">Too large</option>
            </select>
          </div>

          {/* Image Upload */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Camera size={16} />
              Add Photos (Optional)
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={e => setImages(Array.from(e.target.files || []).slice(0, 4))}
              className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-black focus:border-transparent"
            />
            {images.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                {images.length} image{images.length !== 1 ? 's' : ''} selected (max 4)
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowReviewForm(false)}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={submitting || !form.reviewText.trim() || !form.reviewerName.trim() || !form.reviewerEmail.trim()}
              className="flex-1 px-4 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <Search size={16} className="text-gray-500" />
          <input
            type="text"
            placeholder="Search reviews..."
            value={filters.search || ''}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
            className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-transparent"
          />
        </div>

        <select
          className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-transparent"
          value={sort}
          onChange={e => setSort(e.target.value as any)}
        >
          <option value="helpful">Most Helpful</option>
          <option value="newest">Newest First</option>
        </select>

        <select
          className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-transparent"
          value={String(filters.minRating || '')}
          onChange={e => setFilters({ ...filters, minRating: e.target.value ? Number(e.target.value) : undefined })}
        >
          <option value="">All ratings</option>
          <option value="5">5 stars</option>
          <option value="4">4+ stars</option>
          <option value="3">3+ stars</option>
          <option value="2">2+ stars</option>
          <option value="1">1+ stars</option>
        </select>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!filters.verifiedOnly}
            onChange={e => setFilters({ ...filters, verifiedOnly: e.target.checked || undefined })}
            className="rounded border-gray-300 text-black focus:ring-black"
          />
          Verified purchases only
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!filters.photosOnly}
            onChange={e => setFilters({ ...filters, photosOnly: e.target.checked || undefined })}
            className="rounded border-gray-300 text-black focus:ring-black"
          />
          With photos
        </label>
      </div>

      {/* Review List */}
      <div className="space-y-6">
        {filteredReviews.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No reviews found matching your criteria.</p>
            <p>Be the first to share your experience!</p>
          </div>
        ) : (
          filteredReviews.map(review => (
            <div key={review.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold">{review.reviewer_name}</span>
                    {review.verified_purchase && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                        Verified Purchase
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    {renderStars(review.rating)}
                    {(review.quality_rating || review.comfort_rating || review.style_rating) && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        {review.quality_rating && <span>Quality: {review.quality_rating}/5</span>}
                        {review.comfort_rating && <span>Comfort: {review.comfort_rating}/5</span>}
                        {review.style_rating && <span>Style: {review.style_rating}/5</span>}
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>

              {review.review_title && (
                <h4 className="font-semibold mb-2">{review.review_title}</h4>
              )}

              <p className="text-gray-800 mb-4 whitespace-pre-wrap">{review.review_text}</p>

              {/* Purchase Details */}
              {(review.size_purchased || review.color_purchased || review.fit_feedback) && (
                <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
                  {review.size_purchased && <span>Size: {review.size_purchased}</span>}
                  {review.color_purchased && <span>Color: {review.color_purchased}</span>}
                  {review.fit_feedback && (
                    <span className="capitalize">Fit: {review.fit_feedback.replace('_', ' ')}</span>
                  )}
                </div>
              )}

              {/* Review Images */}
              {review.images && review.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                  {review.images.map((image: any, idx: number) => (
                    <img
                      key={idx}
                      src={image.image_url}
                      alt={image.image_alt || 'Review photo'}
                      className="w-full h-24 object-cover rounded-lg border"
                    />
                  ))}
                </div>
              )}

              {/* Official Responses */}
              {review.responses && review.responses.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  {review.responses.map((response: any) => (
                    <div key={response.id}>
                      <div className="font-semibold text-blue-900 mb-1">{response.responder_name}:</div>
                      <p className="text-blue-800">{response.response_text}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Helpfulness Voting */}
              <div className="flex items-center gap-4 pt-4 border-t">
                <span className="text-sm text-gray-600">Was this helpful?</span>
                <button
                  onClick={() => onVote(review.id, true)}
                  className="flex items-center gap-1 px-3 py-1 border rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  <ThumbsUp size={14} />
                  Yes ({review.helpful_count || 0})
                </button>
                <button
                  onClick={() => onVote(review.id, false)}
                  className="flex items-center gap-1 px-3 py-1 border rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  <ThumbsDown size={14} />
                  No ({review.unhelpful_count || 0})
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {reviews.length === limit && (
        <div className="flex items-center gap-2 mt-6 justify-center">
          <button
            className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">Page {page}</span>
          <button
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </section>
  )
}