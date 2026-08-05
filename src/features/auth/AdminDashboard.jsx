import React, { useState, useEffect } from 'react';
import { Shield, Trash2, Star, LogOut, RefreshCw, ChevronDown } from 'lucide-react';
import { updateUserPermissions, API_BASE_URL } from './authApi';

export default function AdminDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'approved', 'admins'
  const [pendingUsers, setPendingUsers] = useState([]);
  const [approvedUsers, setApprovedUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  // Get current user info from localStorage
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    setCurrentUser(user);
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('authToken');

      // Fetch all users
      const response = await fetch('${API_BASE_URL}/api/auth/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to fetch users');
        return;
      }

      // Separate users by status and role
      const pending = data.users.filter(u => u.status === 'pending');
      const approved = data.users.filter(u => u.status === 'approved' && !u.isSystemAdmin);
      const adminList = data.users.filter(u => u.role === 'admin');

      setPendingUsers(pending);
      setApprovedUsers(approved);
      setAdmins(adminList);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('An error occurred while fetching users');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId, username) => {
    if (!window.confirm(`Approve user "${username}"?`)) return;

    try {
      const token = localStorage.getItem('authToken');

      const response = await fetch('${API_BASE_URL}/api/auth/approve', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to approve user');
        return;
      }

      setSuccessMessage(`✅ User "${username}" approved successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchUsers();
    } catch (error) {
      console.error('Error approving user:', error);
      setError('An error occurred while approving the user');
    }
  };

  const handleRejectUser = async (userId, username) => {
    if (!window.confirm(`Reject user "${username}"?`)) return;

    try {
      const token = localStorage.getItem('authToken');

      const response = await fetch('${API_BASE_URL}/api/auth/reject', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to reject user');
        return;
      }

      setSuccessMessage(`❌ User "${username}" rejected successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchUsers();
    } catch (error) {
      console.error('Error rejecting user:', error);
      setError('An error occurred while rejecting the user');
    }
  };

  const handlePromoteToAdmin = async (userId, username) => {
    if (!window.confirm(`Promote "${username}" to Admin?`)) return;

    try {
      const token = localStorage.getItem('authToken');

      const response = await fetch('${API_BASE_URL}/api/auth/role', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, newRole: 'admin' }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to promote user');
        return;
      }

      setSuccessMessage(`👑 User "${username}" promoted to Admin!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchUsers();
    } catch (error) {
      console.error('Error promoting user:', error);
      setError('An error occurred while promoting the user');
    }
  };

  const handleDemoteAdmin = async (userId, username) => {
    if (!window.confirm(`Remove admin privileges from "${username}"?`)) return;

    try {
      const token = localStorage.getItem('authToken');

      const response = await fetch('${API_BASE_URL}/api/auth/role', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, newRole: 'user' }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to demote admin');
        return;
      }

      setSuccessMessage(`📉 Admin "${username}" demoted to User!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchUsers();
    } catch (error) {
      console.error('Error demoting admin:', error);
      setError('An error occurred while demoting the admin');
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Delete user "${username}"? This cannot be undone.`)) return;

    try {
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${API_BASE_URL}/api/auth/user/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to delete user');
        return;
      }

      setSuccessMessage(`🗑️ User "${username}" deleted!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('An error occurred while deleting the user');
    }
  };

  const handlePermissionToggle = async (userId, username, permissionType, currentValue) => {
    try {
      const user = approvedUsers.find(u => u.id === userId);
      const newPermissions = {
        ...user.permissions,
        [permissionType]: !currentValue,
      };

      // Update local state immediately for instant UI feedback
      setApprovedUsers(prev =>
        prev.map(u =>
          u.id === userId ? { ...u, permissions: newPermissions } : u
        )
      );

      // Call API in background
      const result = await updateUserPermissions(userId, newPermissions);

      if (!result.success) {
        setError(result.message || 'Failed to update permissions');
        // Revert local state if API fails
        fetchUsers();
        return;
      }

      setSuccessMessage(`✅ Permissions updated for "${username}"!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating permissions:', error);
      setError('An error occurred while updating permissions');
      // Revert on error
      fetchUsers();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Header */}
      <div className="py-6 px-8 border-b-2 border-purple-200 bg-white shadow-md flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Shield size={40} className="text-purple-600" />
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage users and system access</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400 flex items-center gap-2"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
          <div className="bg-gradient-to-r from-purple-100 to-indigo-100 px-4 py-2 rounded-lg border border-purple-300">
            <p className="text-purple-900 font-bold text-sm">👤 {currentUser?.username}</p>
          </div>
          <button
            onClick={onLogout}
            className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition flex items-center gap-2"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="m-6 bg-red-50 border-2 border-red-300 rounded-xl p-4">
          <p className="text-red-700 font-semibold">❌ {error}</p>
        </div>
      )}

      {successMessage && (
        <div className="m-6 bg-green-50 border-2 border-green-300 rounded-xl p-4">
          <p className="text-green-700 font-semibold">{successMessage}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="px-8 pt-6 flex gap-4">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-6 py-3 font-bold rounded-lg transition ${
            activeTab === 'pending'
              ? 'bg-yellow-600 text-white shadow-lg'
              : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-yellow-400'
          }`}
        >
          📋 Pending Users ({pendingUsers.length})
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          className={`px-6 py-3 font-bold rounded-lg transition ${
            activeTab === 'approved'
              ? 'bg-green-600 text-white shadow-lg'
              : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-green-400'
          }`}
        >
          ✅ Approved Users ({approvedUsers.length})
        </button>
        <button
          onClick={() => setActiveTab('admins')}
          className={`px-6 py-3 font-bold rounded-lg transition ${
            activeTab === 'admins'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-purple-400'
          }`}
        >
          👑 Manage Admins ({admins.length})
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-8">
        {/* Pending Users Tab */}
        {activeTab === 'pending' && (
          <div className="bg-white border-2 border-yellow-300 rounded-xl p-8 shadow-lg">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              📋 Pending User Registrations
            </h2>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin">⏳</div>
                <p className="text-gray-600 font-semibold mt-4">Loading users...</p>
              </div>
            ) : pendingUsers.length === 0 ? (
              <div className="text-center py-12 bg-yellow-50 rounded-lg">
                <p className="text-gray-600 font-semibold text-lg">✨ No pending users. All registrations have been reviewed!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white">
                      <th className="px-4 py-3 text-left font-bold">Username</th>
                      <th className="px-4 py-3 text-left font-bold">Registration Date</th>
                      <th className="px-4 py-3 text-left font-bold">Status</th>
                      <th className="px-4 py-3 text-center font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingUsers.map((user, idx) => (
                      <tr key={user.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-yellow-50'} hover:bg-yellow-100 transition border-b-2 border-gray-200`}>
                        <td className="px-4 py-4 text-black font-bold">{user.username}</td>
                        <td className="px-4 py-4 text-black text-sm">
                          {new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-block px-3 py-1 bg-yellow-200 text-yellow-900 font-bold rounded-full text-sm">
                            ⏳ Pending
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleApproveUser(user.id, user.username)}
                              className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition text-sm"
                            >
                              ✅ Approve
                            </button>
                            <button
                              onClick={() => handleRejectUser(user.id, user.username)}
                              className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition text-sm"
                            >
                              ❌ Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Approved Users Tab */}
        {activeTab === 'approved' && (
          <div className="bg-white border-2 border-green-300 rounded-xl p-8 shadow-lg">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              ✅ Approved Users
            </h2>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin">⏳</div>
                <p className="text-gray-600 font-semibold mt-4">Loading users...</p>
              </div>
            ) : approvedUsers.length === 0 ? (
              <div className="text-center py-12 bg-green-50 rounded-lg">
                <p className="text-gray-600 font-semibold text-lg">No approved regular users found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {approvedUsers.map((user) => (
                  <div key={user.id} className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{user.username}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePromoteToAdmin(user.id, user.username)}
                          className="bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-700 transition text-sm flex items-center gap-1"
                        >
                          <Star size={16} /> Promote
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id, user.username)}
                          className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition text-sm flex items-center gap-1"
                        >
                          <Trash2 size={16} /> Delete
                        </button>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 border-2 border-green-100">
                      <h4 className="text-sm font-bold text-gray-700 mb-3">📋 Entry Permissions</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={user.permissions?.canAdd || false}
                            onChange={() => handlePermissionToggle(user.id, user.username, 'canAdd', user.permissions?.canAdd || false)}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <span className="text-sm font-semibold text-gray-700">➕ Can Add</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={user.permissions?.canEdit || false}
                            onChange={() => handlePermissionToggle(user.id, user.username, 'canEdit', user.permissions?.canEdit || false)}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <span className="text-sm font-semibold text-gray-700">✏️ Can Edit</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={user.permissions?.canDelete || false}
                            onChange={() => handlePermissionToggle(user.id, user.username, 'canDelete', user.permissions?.canDelete || false)}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <span className="text-sm font-semibold text-gray-700">🗑️ Can Delete</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Manage Admins Tab */}
        {activeTab === 'admins' && (
          <div className="bg-white border-2 border-purple-300 rounded-xl p-8 shadow-lg">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              👑 Admin Management
            </h2>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin">⏳</div>
                <p className="text-gray-600 font-semibold mt-4">Loading admins...</p>
              </div>
            ) : admins.length === 0 ? (
              <div className="text-center py-12 bg-purple-50 rounded-lg">
                <p className="text-gray-600 font-semibold text-lg">No admins found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {admins.map((admin) => (
                  <div key={admin.id} className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-lg p-6 hover:shadow-lg transition">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-purple-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg">
                          {admin.username.charAt(0).toUpperCase()}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">{admin.username}</h3>
                      </div>
                      {admin.isSystemAdmin && (
                        <div className="bg-yellow-200 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold">
                          🔐 System Admin
                        </div>
                      )}
                    </div>

                    <div className="mb-4 space-y-2">
                      <p className="text-gray-700 text-sm">
                        <span className="font-bold">Approved:</span>{' '}
                        {new Date(admin.approvedAt).toLocaleDateString('en-IN')}
                      </p>
                      <p className="text-gray-700 text-sm">
                        <span className="font-bold">Approved By:</span> {admin.approvedBy || 'N/A'}
                      </p>
                    </div>

                    {!admin.isSystemAdmin && (
                      <button
                        onClick={() => handleDemoteAdmin(admin.id, admin.username)}
                        className="w-full bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition text-sm flex items-center justify-center gap-2"
                      >
                        <Trash2 size={16} /> Remove Admin Privileges
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
