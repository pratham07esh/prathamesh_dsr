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
    <div style={{ display: 'flex', minHeight: '100vh', background: 'white' }}>
      <style>{`
        .branding-section {
          flex: 1;
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 30%, #3b82f6 60%, #7e22ce 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px;
          position: relative;
          overflow: hidden;
        }

        .branding-section::before {
          content: '';
          position: absolute;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(147, 112, 219, 0.15) 0%, transparent 70%);
          border-radius: 50%;
          top: -150px;
          right: -100px;
          animation: float1 12s ease-in-out infinite;
          z-index: 0;
        }

        .branding-section::after {
          content: '';
          position: absolute;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
          border-radius: 50%;
          bottom: -100px;
          left: -50px;
          animation: float2 15s ease-in-out infinite;
          z-index: 0;
        }

        @keyframes float1 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-40px) translateX(-30px); }
        }

        @keyframes float2 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(30px) translateX(40px); }
        }

        /* Add additional geometric pattern overlay */
        .branding-section {
          background:
            linear-gradient(45deg, transparent 30%, rgba(59, 130, 246, 0.05) 31%, rgba(59, 130, 246, 0.05) 33%, transparent 34%),
            linear-gradient(-45deg, transparent 30%, rgba(147, 112, 219, 0.05) 31%, rgba(147, 112, 219, 0.05) 33%, transparent 34%),
            linear-gradient(135deg, #1e3c72 0%, #2a5298 30%, #3b82f6 60%, #7e22ce 100%);
          background-size: 300px 300px, 350px 350px, 100% 100%;
          background-position: 0 0, 50px 50px, 0 0;
        }

        /* Floating Icons */
        .floating-icon {
          position: absolute;
          font-size: 40px;
          opacity: 0.15;
          z-index: 0;
          animation: float-icon 6s ease-in-out infinite;
        }

        .icon-1 { top: 10%; left: 10%; animation-delay: 0s; }
        .icon-2 { top: 20%; right: 15%; animation-delay: 1s; font-size: 50px; }
        .icon-3 { bottom: 20%; left: 15%; animation-delay: 2s; }
        .icon-4 { bottom: 10%; right: 10%; animation-delay: 3s; font-size: 45px; }
        .icon-5 { top: 40%; right: 5%; animation-delay: 1.5s; }
        .icon-6 { top: 50%; left: 5%; animation-delay: 2.5s; font-size: 48px; }

        @keyframes float-icon {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(10deg); }
        }

        .branding-content {
          position: relative;
          z-index: 1;
          text-align: center;
          color: white;
        }

        .branding-content h1 {
          font-size: 56px;
          font-weight: bold;
          margin-bottom: 16px;
          text-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .branding-content p {
          font-size: 20px;
          color: rgba(255, 255, 255, 0.9);
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .form-section {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          background: #f9fafb;
        }

        .form-container {
          width: 100%;
          max-width: 400px;
        }

        .card {
          background: white;
          border-radius: 16px;
          padding: 48px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
          transition: box-shadow 0.3s ease;
        }

        .card:hover {
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.12);
        }

        .card-title {
          font-size: 28px;
          font-weight: bold;
          color: #111827;
          text-align: center;
          margin-bottom: 32px;
        }

        .form-group {
          margin-bottom: 24px;
        }

        .form-label {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 12px;
          display: block;
        }

        .input-field {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #d1d5db;
          border-radius: 8px;
          font-size: 16px;
          color: #000;
          transition: all 0.3s ease;
        }

        .input-field:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .password-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .password-toggle {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          cursor: pointer;
          color: #6b7280;
          font-size: 20px;
          transition: color 0.2s ease;
        }

        .password-toggle:hover {
          color: #374151;
        }

        .forgot-password {
          text-align: right;
          margin-bottom: 24px;
        }

        .forgot-password-link {
          color: #2563eb;
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
          transition: color 0.2s ease;
        }

        .forgot-password-link:hover {
          color: #1d4ed8;
          text-decoration: underline;
        }

        .btn {
          width: 100%;
          padding: 16px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn:disabled {
          cursor: not-allowed;
          opacity: 0.7;
        }

        .btn-primary {
          background-color: #2563eb;
          color: white;
          box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #1d4ed8;
          box-shadow: 0 6px 12px rgba(37, 99, 235, 0.3);
        }

        .btn-secondary {
          background-color: #a855f7;
          color: white;
          box-shadow: 0 4px 6px rgba(168, 85, 247, 0.2);
          margin-bottom: 24px;
        }

        .btn-secondary:hover:not(:disabled) {
          background-color: #9333ea;
          box-shadow: 0 6px 12px rgba(168, 85, 247, 0.3);
        }

        .divider {
          display: flex;
          align-items: center;
          gap: 16px;
          margin: 32px 0;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background-color: #d1d5db;
        }

        .divider-text {
          color: #6b7280;
          font-weight: 600;
          font-size: 14px;
        }

        .footer {
          text-align: center;
          margin-top: 24px;
        }

        .footer-text {
          font-size: 14px;
          color: #4b5563;
          font-weight: 600;
        }

        .footer-link {
          color: #2563eb;
          text-decoration: none;
          font-weight: bold;
          transition: color 0.2s ease;
          cursor: pointer;
          background: none;
          border: none;
          padding: 0;
        }

        .footer-link:hover {
          color: #1d4ed8;
          text-decoration: underline;
        }

        @media (max-width: 1024px) {
          .branding-section {
            display: none;
          }
          .form-section {
            padding: 20px;
          }
        }
      `}</style>

      {/* BRANDING SECTION (LEFT) */}
      <div className="branding-section">
        {/* Floating Icons */}
        <div className="floating-icon icon-1">📊</div>
        <div className="floating-icon icon-2">✓</div>
        <div className="floating-icon icon-3">📋</div>
        <div className="floating-icon icon-4">⚙️</div>
        <div className="floating-icon icon-5">🎯</div>
        <div className="floating-icon icon-6">📈</div>

        <div className="branding-content">
          <h1>Daily Status Tracker</h1>
          <p>Track daily work progress and manage QA issues</p>
        </div>
      </div>

      {/* FORM SECTION (RIGHT) */}
      <div className="form-section">
        <div className="form-container">
          {/* Login Card */}
          <div className="card">
            <h2 className="card-title">User Login</h2>

            {/* Error Message */}
            {error && (
              <div style={{ backgroundColor: '#fee2e2', border: '2px solid #fca5a5', borderRadius: '8px', padding: '16px', marginBottom: '24px', color: '#991b1b', fontWeight: '600', fontSize: '14px' }}>
                {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin}>
              {/* Username Field */}
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="input-field"
                  disabled={loading}
                />
              </div>

              {/* Password Field */}
              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="password-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="input-field"
                    disabled={loading}
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="forgot-password">
                <a href="#" onClick={(e) => { e.preventDefault(); alert('Password reset feature coming soon'); }} className="forgot-password-link">
                  Forgot Password?
                </a>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
              >
                🔒 {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            {/* Divider */}
            <div className="divider">
              <div className="divider-line"></div>
              <span className="divider-text">or</span>
              <div className="divider-line"></div>
            </div>

            {/* Admin Login Button */}
            <button
              onClick={onAdminLoginClick}
              disabled={loading}
              className="btn btn-secondary"
            >
              👑 Admin Login
            </button>

            {/* Sign Up Link */}
            <div className="footer">
              <p className="footer-text">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={onSignUpClick}
                  disabled={loading}
                  className="footer-link"
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
