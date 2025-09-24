import { useEffect } from 'react'

export function useNoIndex(title?: string) {
  useEffect(() => {
    if (title) document.title = title
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    return () => {
      document.head.removeChild(meta)
    }
  }, [title])
}
