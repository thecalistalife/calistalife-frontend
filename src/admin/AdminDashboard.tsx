import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNoIndex } from '../hooks/useNoIndex'

export default function AdminDashboard({ base }: { base: string }) {
  useNoIndex('Store Management')
  const nav = useNavigate()

  useEffect(() => {
    // verify session
    const run = async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/${base}/auth/session`, { credentials: 'include' })
      if (!res.ok) {
        // Render generic 404 by redirecting to base (which shows nothing special)
        nav(`/${base}`)
      }
    }
    run()
  }, [])

  return (
    <div className="pt-16 lg:pt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold mb-6">Store Management</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <a href={`/${base}/users`} className="border rounded-lg p-6 hover:bg-gray-50">
            <div className="font-semibold">Users</div>
            <div className="text-sm text-gray-600">Manage admin users</div>
          </a>
          <a href={`/${base}/products`} className="border rounded-lg p-6 hover:bg-gray-50">
            <div className="font-semibold">Products</div>
            <div className="text-sm text-gray-600">Manage products</div>
          </a>
          <a href={`/orders`} className="border rounded-lg p-6 hover:bg-gray-50">
            <div className="font-semibold">Orders</div>
            <div className="text-sm text-gray-600">View orders</div>
          </a>
        </div>
      </div>
    </div>
  )
}
