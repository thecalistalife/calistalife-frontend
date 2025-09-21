import { useAuthStore } from '../store/auth';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (!user) {
    return (
      <div className="pt-16 lg:pt-20 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Not logged in</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 lg:pt-20 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">My Account</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Info */}
            <div className="lg:col-span-2">
              <div className="bg-white border rounded-lg p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">Profile Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <div className="text-gray-900">{user.name}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <div className="text-gray-900">{user.email}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <div className="text-gray-900 capitalize">{user.role || 'customer'}</div>
                  </div>
                </div>
                <div className="mt-6">
                  <button className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 transition-colors">
                    Edit Profile
                  </button>
                </div>
              </div>
              
              {/* Order History */}
              <div className="bg-white border rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Order History</h2>
                <div className="text-gray-500 text-center py-8">
                  <p>No orders yet</p>
                  <p className="text-sm mt-2">Start shopping to see your orders here!</p>
                </div>
              </div>
            </div>
            
            {/* Actions Sidebar */}
            <div className="space-y-4">
              <div className="bg-white border rounded-lg p-6">
                <h3 className="font-bold mb-4">Account Actions</h3>
                <div className="space-y-2">
                  <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 transition-colors">
                    Change Password
                  </button>
                  <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 transition-colors">
                    Manage Addresses
                  </button>
                  <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 transition-colors">
                    Payment Methods
                  </button>
                </div>
              </div>
              
              <div className="bg-white border rounded-lg p-6">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}