import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { API_BASE_URL } from './authApi';

export default function SignUpPage({ onSignUpSuccess, onBackToLogin }) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Password strength requirements
  const passwordRequirements = {
    minLength: formData.password.length >= 8,
    hasUppercase: /[A-Z]/.test(formData.password),
    hasLowercase: /[a-z]/.test(formData.password),
    hasNumber: /[0-9]/.test(formData.password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password),
  };

  const isPasswordStrong = Object.values(passwordRequirements).every(req => req);
  const passwordsMatch = formData.password === formData.confirmPassword && formData.password !== '';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, underscore, and hyphen';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!isPasswordStrong) {
      newErrors.password = 'Password does not meet security requirements';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (!passwordsMatch) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username.trim(),
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ server: data.message || 'Registration failed' });
        return;
      }

      // Success
      setSuccessMessage(data.message || 'Registration submitted successfully. Please wait for admin approval.');

      // Reset form
      setFormData({ username: '', password: '', confirmPassword: '' });
      setErrors({});

      // Call callback after a delay
      setTimeout(() => {
        if (onSignUpSuccess) {
          onSignUpSuccess();
        }
      }, 2000);
    } catch (error) {
      console.error('Sign up error:', error);
      setErrors({ server: 'An error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'white' }}>
      <style>{`
        .branding-section {
          flex: 1;
          background: linear-gradient(135deg, #0d47a1 0%, #1565c0 20%, #0d7fa5 50%, #00897b 80%, #26a69a 100%);
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
          top: -50%;
          right: -10%;
          width: 150%;
          height: 150%;
          background:
            linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.08) 31%, rgba(255, 255, 255, 0.08) 33%, transparent 34%),
            linear-gradient(45deg, transparent 65%, rgba(255, 255, 255, 0.08) 66%, rgba(255, 255, 255, 0.08) 68%, transparent 69%),
            linear-gradient(135deg, transparent 25%, rgba(255, 255, 255, 0.1) 26%, rgba(255, 255, 255, 0.1) 28%, transparent 29%),
            linear-gradient(135deg, transparent 50%, rgba(255, 255, 255, 0.08) 51%, rgba(255, 255, 255, 0.08) 53%, transparent 54%);
          background-size: 300px 300px, 400px 400px, 350px 350px, 450px 450px;
          background-position: 0 0, 50px 50px, 100px 0, 150px 100px;
          z-index: 0;
          animation: drift 30s linear infinite;
        }

        .branding-section::after {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 100%;
          height: 100%;
          background:
            linear-gradient(120deg, transparent 0%, rgba(255, 255, 255, 0.05) 45%, rgba(255, 255, 255, 0.05) 50%, transparent 100%),
            linear-gradient(240deg, transparent 0%, rgba(255, 255, 255, 0.04) 45%, rgba(255, 255, 255, 0.04) 50%, transparent 100%);
          z-index: 0;
        }

        @keyframes drift {
          0% { background-position: 0 0, 50px 50px, 100px 0, 150px 100px; }
          100% { background-position: 300px 300px, 350px 350px, 400px 300px, 450px 400px; }
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
          text-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .branding-content p {
          font-size: 20px;
          color: rgba(255, 255, 255, 0.95);
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
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
          margin-bottom: 8px;
          display: block;
        }

        .helper-text {
          font-size: 13px;
          color: #6b7280;
          margin-top: 6px;
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
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }

        .input-field.error {
          border-color: #ef4444;
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

        .input-error {
          color: #dc2626;
          font-size: 13px;
          margin-top: 4px;
        }

        .requirements {
          background: #f0fdf4;
          border: 2px solid #bbf7d0;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
          display: none;
        }

        .requirements.show {
          display: block;
        }

        .requirements-title {
          font-size: 14px;
          font-weight: 600;
          color: #166534;
          margin-bottom: 12px;
        }

        .requirement-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          margin-bottom: 6px;
          color: #6b7280;
        }

        .requirement-item.met {
          color: #10b981;
        }

        .requirement-check {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          border-radius: 3px;
          background-color: #e5e7eb;
          font-size: 11px;
        }

        .requirement-item.met .requirement-check {
          background-color: #10b981;
          color: white;
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
          background-color: #10b981;
          color: white;
          box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2);
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #059669;
          box-shadow: 0 6px 12px rgba(16, 185, 129, 0.3);
        }

        .success-message {
          background-color: #dcfce7;
          border: 2px solid #86efac;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
          color: #166534;
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
          color: #10b981;
          text-decoration: none;
          font-weight: bold;
          transition: color 0.2s ease;
          cursor: pointer;
          background: none;
          border: none;
          padding: 0;
        }

        .footer-link:hover {
          color: #059669;
          text-decoration: underline;
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
          <h1>Daily Status Tracker</h1>
          <p>Track work, manage QA, stay organized</p>
        </div>
      </div>

      {/* FORM SECTION (RIGHT) */}
      <div className="form-section">
        <div className="form-container">
          {/* SUCCESS MESSAGE */}
          {successMessage && (
            <div style={{ marginBottom: '24px' }}>
              <div className="success-message">
                <div style={{ marginBottom: '12px', fontSize: '18px' }}>✅ Registration Submitted!</div>
                <div>{successMessage}</div>
              </div>
            </div>
          )}

          {!successMessage && (
            <div className="card">
              <h2 className="card-title">Create Account</h2>

              {/* ERROR MESSAGE */}
              {errors.server && (
                <div className="error-message">{errors.server}</div>
              )}

              {/* SIGNUP FORM */}
              <form onSubmit={handleSignUp}>
                {/* USERNAME FIELD */}
                <div className="form-group">
                  <label className="form-label">
                    Username <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Choose a unique username"
                    className={`input-field ${errors.username ? 'error' : ''}`}
                    disabled={loading}
                  />
                  {errors.username && (
                    <div className="input-error">{errors.username}</div>
                  )}
                  <p className="helper-text">3+ characters, letters/numbers/underscore/hyphen only</p>
                </div>

                {/* PASSWORD FIELD */}
                <div className="form-group">
                  <label className="form-label">
                    Password <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div className="password-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a strong password"
                      className={`input-field ${errors.password ? 'error' : ''}`}
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
                  {errors.password && (
                    <div className="input-error">{errors.password}</div>
                  )}
                </div>

                {/* PASSWORD REQUIREMENTS */}
                {formData.password.length > 0 && (
                  <div className={`requirements show`}>
                    <div className="requirements-title">Password Requirements</div>
                    <div className={`requirement-item ${passwordRequirements.minLength ? 'met' : ''}`}>
                      <span className="requirement-check">✓</span> At least 8 characters
                    </div>
                    <div className={`requirement-item ${passwordRequirements.hasUppercase ? 'met' : ''}`}>
                      <span className="requirement-check">✓</span> One uppercase letter
                    </div>
                    <div className={`requirement-item ${passwordRequirements.hasLowercase ? 'met' : ''}`}>
                      <span className="requirement-check">✓</span> One lowercase letter
                    </div>
                    <div className={`requirement-item ${passwordRequirements.hasNumber ? 'met' : ''}`}>
                      <span className="requirement-check">✓</span> One number
                    </div>
                    <div className={`requirement-item ${passwordRequirements.hasSpecialChar ? 'met' : ''}`}>
                      <span className="requirement-check">✓</span> One special character (!@#$%^&*)
                    </div>
                  </div>
                )}

                {/* CONFIRM PASSWORD FIELD */}
                <div className="form-group">
                  <label className="form-label">
                    Re-enter Password <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div className="password-wrapper">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Re-enter your password"
                      className={`input-field ${errors.confirmPassword ? 'error' : ''}`}
                      disabled={loading}
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="password-toggle"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <div className="input-error">{errors.confirmPassword}</div>
                  )}
                  {formData.confirmPassword && passwordsMatch && (
                    <div style={{ color: '#10b981', fontSize: '13px', marginTop: '4px', fontWeight: '600' }}>
                      ✓ Passwords match
                    </div>
                  )}
                </div>

                {/* SUBMIT BUTTON */}
                <button
                  type="submit"
                  disabled={loading || !isPasswordStrong}
                  className="btn btn-primary"
                >
                  ⭐ {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>

              {/* FOOTER */}
              <div className="footer">
                <p className="footer-text">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={onBackToLogin}
                    disabled={loading}
                    className="footer-link"
                  >
                    Back to Login
                  </button>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
