import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { API_BASE_URL } from './authApi';

export default function LoginPage({ onLoginSuccess, onSignUpClick, onAdminLoginClick }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.message === 'Your account is awaiting admin approval.') {
          setError(data.message);
        } else {
          setError(data.message || 'Login failed');
        }
        return;
      }

      // Success - call the callback with user data and token
      if (onLoginSuccess) {
        onLoginSuccess(data.user, data.token);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="py-8 px-8 text-center border-b-2 border-blue-200 bg-white shadow-sm">
        <h1 className="text-5xl font-bold text-gray-900">Daily Status Tracker</h1>
        <p className="text-lg text-gray-600 mt-2">Track daily work progress and manage QA issues</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Login Card */}
          <div className="bg-white border-2 border-blue-300 rounded-xl p-10 shadow-xl hover:shadow-2xl transition">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">User Login</h2>

            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-50 border-2 border-red-300 rounded-lg p-4">
                <p className="text-red-700 font-semibold text-sm">{error}</p>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Username Field */}
              <div>
                <label className="block text-gray-900 font-bold mb-3 text-lg">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder-gray-400 text-lg"
                  disabled={loading}
                />
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-gray-900 font-bold mb-3 text-lg">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder-gray-400 text-lg"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 transition"
                  >
                    {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400 disabled:cursor-not-allowed text-lg shadow-md hover:shadow-lg"
              >
                {loading ? 'Logging in...' : '🔓 Login'}
              </button>
            </form>

            {/* Divider */}
            <div className="my-8 flex items-center gap-4">
              <div className="flex-1 h-px bg-gray-300"></div>
              <span className="text-gray-600 font-semibold">or</span>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>

            {/* Admin Login Button */}
            <button
              onClick={onAdminLoginClick}
              disabled={loading}
              className="w-full bg-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-purple-700 transition disabled:bg-purple-400 disabled:cursor-not-allowed text-lg shadow-md hover:shadow-lg mb-4"
            >
              👑 Admin Login
            </button>

            {/* Sign Up Link */}
            <div className="mt-6 text-center">
              <p className="text-gray-700 font-semibold mb-2">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={onSignUpClick}
                  disabled={loading}
                  className="text-blue-600 hover:text-blue-800 font-bold underline disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Sign Up
                </button>
              </p>
            </div>
          </div>

          
        </div>
      </div>
    </div>
  );
}
