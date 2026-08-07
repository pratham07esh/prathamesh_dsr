import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { API_BASE_URL } from './authApi';

export default function AdminLoginPage({ onAdminLoginSuccess, onBackToLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async (e) => {
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
      const response = await fetch(`${API_BASE_URL}/api/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Login failed:', data);
        setError(data.message || 'Admin login failed');
        return;
      }

      // Check if user has admin role
      if (data.user.role !== 'admin') {
        setError('You do not have admin privileges');
        return;
      }

      // Success - call the callback with user data and token
      if (onAdminLoginSuccess) {
        onAdminLoginSuccess(data.user, data.token);
      }
    } catch (error) {
      console.error('Admin login error:', error);
      console.error('Error details:', error.message);
      setError('Backend connection error. Make sure the server is running at http://localhost:3001');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'white' }}>
      <style>{`
        .branding-section {
          flex: 1;
          background: linear-gradient(180deg, #1a2942 0%, #0d1b2a 100%);
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
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(167, 139, 250, 0.15) 0%, transparent 70%);
          border-radius: 50%;
          top: -100px;
          right: -100px;
          animation: float1 8s ease-in-out infinite;
          z-index: 0;
        }

        .branding-section::after {
          content: '';
          position: absolute;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%);
          border-radius: 50%;
          bottom: -50px;
          left: -50px;
          animation: float2 10s ease-in-out infinite;
          z-index: 0;
        }

        @keyframes float1 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-30px) translateX(-20px); }
        }

        @keyframes float2 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(20px) translateX(20px); }
        }

        /* Base diagonal lines pattern */
        .branding-section {
          background:
            linear-gradient(45deg, transparent 45%, rgba(167, 139, 250, 0.05) 45%, rgba(167, 139, 250, 0.05) 55%, transparent 55%),
            linear-gradient(-45deg, transparent 45%, rgba(99, 102, 241, 0.04) 45%, rgba(99, 102, 241, 0.04) 55%, transparent 55%),
            linear-gradient(180deg, #1a2942 0%, #0d1b2a 100%);
          background-size: 60px 60px, 80px 80px, 100% 100%;
          background-position: 0 0, 20px 20px, 0 0;
        }

        .branding-content {
          position: relative;
          z-index: 1;
          text-align: center;
          color: white;
          max-width: 400px;
        }

        .shield-icon {
          width: 100px;
          height: 100px;
          margin: 0 auto 30px auto;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #a78bfa 0%, #6366f1 100%);
          border-radius: 16px;
          font-size: 50px;
        }

        .branding-content h1 {
          font-size: 48px;
          font-weight: bold;
          margin-bottom: 12px;
          text-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
          line-height: 1.2;
        }

        .branding-content .subtitle {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 24px;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          font-weight: 600;
        }

        .branding-content p {
          font-size: 15px;
          color: rgba(255, 255, 255, 0.75);
          line-height: 1.6;
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
          max-width: 450px;
        }

        .warning-banner {
          background-color: #fef3c7;
          border: 2px solid #fcd34d;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
          color: #92400e;
          font-weight: 600;
          font-size: 14px;
          text-align: center;
        }

        .card {
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 16px;
          padding: 48px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
          transition: box-shadow 0.3s ease;
        }

        .card:hover {
          box-shadow: 0 15px 50px rgba(0, 0, 0, 0.12);
        }

        .card-title {
          font-size: 30px;
          font-weight: bold;
          color: #7c3aed;
          text-align: center;
          margin-bottom: 32px;
        }

        .form-group {
          margin-bottom: 24px;
        }

        .form-label {
          font-size: 16px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
          display: block;
        }

        .input-field {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 16px;
          color: #000;
          transition: all 0.3s ease;
        }

        .input-field:focus {
          outline: none;
          border-color: #7c3aed;
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
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
          color: #9ca3af;
          font-size: 20px;
          transition: color 0.2s ease;
        }

        .password-toggle:hover {
          color: #6b7280;
        }

        .btn {
          width: 100%;
          padding: 14px 24px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: bold;
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
          background-color: #a78bfa;
          color: white;
          box-shadow: 0 4px 6px rgba(167, 139, 250, 0.2);
          border: 2px solid #a78bfa;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #9370db;
          box-shadow: 0 6px 12px rgba(167, 139, 250, 0.3);
        }

        .btn-secondary {
          background: white;
          color: #7c3aed;
          border: 2px solid #7c3aed;
          font-weight: 600;
        }

        .btn-secondary:hover:not(:disabled) {
          background-color: #f3e8ff;
        }

        .error-message {
          background-color: #fee2e2;
          border: 2px solid #fca5a5;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
          color: #991b1b;
          font-weight: 600;
          font-size: 14px;
        }

        .footer {
          text-align: center;
          margin-top: 24px;
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
        <div className="branding-content">
          <div className="shield-icon">🛡️</div>
          <h1>Admin Dashboard</h1>
          <p className="subtitle">Administrator Access Required</p>
          <p>This high-security access is restricted to authorized personnel for work progress tracking and quality assurance management. All activities are monitored and logged.</p>
        </div>
      </div>

      {/* FORM SECTION (RIGHT) */}
      <div className="form-section">
        <div className="form-container">
          {/* WARNING BANNER */}
          <div className="warning-banner">
            This section is restricted to administrators only. Unauthorized access attempts will be logged.
          </div>

          {/* LOGIN CARD */}
          <div className="card">
            <h2 className="card-title">Admin Login</h2>

            {/* ERROR MESSAGE */}
            {error && (
              <div className="error-message">{error}</div>
            )}

            {/* LOGIN FORM */}
            <form onSubmit={handleAdminLogin}>
              {/* USERNAME FIELD */}
              <div className="form-group">
                <label className="form-label">Admin Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter admin username"
                  className="input-field"
                  disabled={loading}
                />
              </div>

              {/* PASSWORD FIELD */}
              <div className="form-group">
                <label className="form-label">Admin Password</label>
                <div className="password-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
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

              {/* LOGIN BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
              >
                👑 {loading ? 'Verifying Credentials...' : 'Admin Login'}
              </button>
            </form>

            {/* FOOTER */}
            <div className="footer">
              <button
                type="button"
                onClick={onBackToLogin}
                disabled={loading}
                className="btn btn-secondary"
              >
                ← Back to User Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
