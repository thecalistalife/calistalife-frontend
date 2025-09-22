import { useState } from 'react';
import { useAuthStore } from '../store/auth';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, logout, updateProfile, changePassword, loading, error } = useAuthStore();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState('');
  const [savedMsg, setSavedMsg] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwMsg, setPwMsg] = useState('');

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMsg('');
    try {
      await updateProfile({ name, email, phone });
      setSavedMsg('Profile updated successfully');
    } catch {}
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg('');
    try {
      await changePassword({ currentPassword, newPassword });
      setPwMsg('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
    } catch {}
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
          {error && <div className="mb-4 text-red-600">{error}</div>}
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Info (editable) */}
            <div className="lg:col-span-2">
              <div className="bg-white border rounded-lg p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">Profile Information</h2>
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input value={name} onChange={(e)=>setName(e.target.value)} className="w-full border rounded p-3" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full border rounded p-3" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input value={phone} onChange={(e)=>setPhone(e.target.value)} className="w-full border rounded p-3" />
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="submit" disabled={loading} className="px-4 py-2 bg-black text-white rounded hover:bg-red-500 transition-colors disabled:opacity-50">
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                    {savedMsg && <span className="text-green-600 text-sm">{savedMsg}</span>}
                  </div>
                </form>
              </div>
              
              {/* Order History placeholder */}
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
                <h3 className="font-bold mb-4">Change Password</h3>
                <form onSubmit={handleChangePassword} className="space-y-3">
                  <input type="password" placeholder="Current password" value={currentPassword} onChange={(e)=>setCurrentPassword(e.target.value)} className="w-full border rounded p-3" required />
                  <input type="password" placeholder="New password" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} className="w-full border rounded p-3" required />
                  <button type="submit" disabled={loading} className="w-full px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 transition-colors disabled:opacity-50">{loading ? 'Updating...' : 'Update Password'}</button>
                  {pwMsg && <div className="text-green-600 text-sm">{pwMsg}</div>}
                </form>
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
