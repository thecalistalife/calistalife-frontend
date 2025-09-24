import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '../utils'

export interface CarouselItem {
  id: string
  image: string
  title?: string
  subtitle?: string
  href?: string
}

interface CarouselProps {
  items: CarouselItem[]
  autoPlay?: boolean
  interval?: number
  className?: string
}

export const Carousel = ({ items, autoPlay = true, interval = 5000, className }: CarouselProps) => {
  const [index, setIndex] = useState(0)
  const timerRef = useRef<number | null>(null)

  const next = () => setIndex((i) => (i + 1) % items.length)
  const prev = () => setIndex((i) => (i - 1 + items.length) % items.length)

  useEffect(() => {
    if (!autoPlay || items.length <= 1) return
    timerRef.current && window.clearInterval(timerRef.current)
    // Use setInterval to cycle slides
    timerRef.current = window.setInterval(next, interval)
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [index, autoPlay, interval, items.length])

  if (items.length === 0) return null

  return (
    <div className={cn('relative group', className)}>
      <div className="overflow-hidden rounded-2xl shadow-2xl">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={items[index].id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            {items[index].href ? (
              <Link to={items[index].href!}>
                <img
                  src={items[index].image}
                  alt={items[index].title || ''}
                  className="w-full h-[420px] md:h-[520px] object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = `https://placehold.co/1000x600?text=${encodeURIComponent(items[index].title || 'Slide')}&bg=111827&color=FFFFFF`
                  }}
                />
              </Link>
            ) : (
              <img
                src={items[index].image}
                alt={items[index].title || ''}
                className="w-full h-[420px] md:h-[520px] object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = `https://placehold.co/1000x600?text=${encodeURIComponent(items[index].title || 'Slide')}&bg=111827&color=FFFFFF`
                }}
              />
            )}

            {(items[index].title || items[index].subtitle) && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            )}

            {(items[index].title || items[index].subtitle) && (
              <div className="absolute bottom-6 left-6 right-6 text-white">
                {items[index].title && (
                  <h3 className="text-2xl md:text-3xl font-bold mb-1">{items[index].title}</h3>
                )}
                {items[index].subtitle && (
                  <p className="text-sm md:text-base opacity-90">{items[index].subtitle}</p>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {items.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 hover:bg-white shadow-lg opacity-0 group-hover:opacity-100 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 hover:bg-white shadow-lg opacity-0 group-hover:opacity-100 transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={cn(
                  'w-2.5 h-2.5 rounded-full transition-all',
                  i === index ? 'bg-white w-6' : 'bg-white/60 hover:bg-white/80'
                )}
              />)
            )}
          </div>
        </>
      )}
    </div>
  )
}
