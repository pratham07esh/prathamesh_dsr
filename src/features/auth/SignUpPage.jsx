import React, { useState } from 'react';
import { Eye, EyeOff, Check, X } from 'lucide-react';

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
      const response = await fetch('http://localhost:3001/api/auth/register', {
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
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <div className="py-8 px-8 text-center border-b-2 border-green-200 bg-white shadow-sm">
        <h1 className="text-5xl font-bold text-gray-900">Daily Status Tracker</h1>
        <p className="text-lg text-gray-600 mt-2">Create your account to get started</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          {/* Success Message */}
          {successMessage && (
            <div className="mb-8 bg-green-50 border-2 border-green-300 rounded-xl p-6 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="text-3xl">✅</div>
                <div>
                  <h3 className="text-xl font-bold text-green-900 mb-2">Registration Submitted!</h3>
                  <p className="text-green-700 font-semibold">{successMessage}</p>
                  <button
                    onClick={onBackToLogin}
                    className="mt-4 text-green-700 hover:text-green-900 font-bold underline"
                  >
                    Return to Login →
                  </button>
                </div>
              </div>
            </div>
          )}

          {!successMessage && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Sign Up Form */}
              <div className="lg:col-span-2">
                <div className="bg-white border-2 border-green-300 rounded-xl p-10 shadow-xl">
                  <h2 className="text-3xl font-bold text-gray-900 mb-8">Create Account</h2>

                  {/* Server Error */}
                  {errors.server && (
                    <div className="mb-6 bg-red-50 border-2 border-red-300 rounded-lg p-4">
                      <p className="text-red-700 font-semibold text-sm">{errors.server}</p>
                    </div>
                  )}

                  <form onSubmit={handleSignUp} className="space-y-6">
                    {/* Username Field */}
                    <div>
                      <label className="block text-gray-900 font-bold mb-3 text-lg">
                        Username <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="Choose a unique username"
                        className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-black placeholder-gray-400 text-lg transition ${
                          errors.username ? 'border-red-500' : 'border-gray-300'
                        }`}
                        disabled={loading}
                      />
                      {errors.username && (
                        <p className="text-red-600 font-semibold text-sm mt-2">{errors.username}</p>
                      )}
                      <p className="text-gray-500 text-sm mt-2">3+ characters, letters/numbers/underscore/hyphen only</p>
                    </div>

                    {/* Password Field */}
                    <div>
                      <label className="block text-gray-900 font-bold mb-3 text-lg">
                        Password <span className="text-red-600">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Create a strong password"
                          className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-black placeholder-gray-400 text-lg transition ${
                            errors.password ? 'border-red-500' : 'border-gray-300'
                          }`}
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
                      {errors.password && (
                        <p className="text-red-600 font-semibold text-sm mt-2">{errors.password}</p>
                      )}
                    </div>

                    {/* Confirm Password Field */}
                    <div>
                      <label className="block text-gray-900 font-bold mb-3 text-lg">
                        Re-enter Password <span className="text-red-600">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="Re-enter your password"
                          className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-black placeholder-gray-400 text-lg transition ${
                            errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                          }`}
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 transition"
                        >
                          {showConfirmPassword ? <EyeOff size={24} /> : <Eye size={24} />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-red-600 font-semibold text-sm mt-2">{errors.confirmPassword}</p>
                      )}
                      {formData.confirmPassword && passwordsMatch && (
                        <p className="text-green-600 font-semibold text-sm mt-2 flex items-center gap-2">
                          <Check size={18} /> Passwords match
                        </p>
                      )}
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading || !isPasswordStrong}
                      className="w-full bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition disabled:bg-green-400 disabled:cursor-not-allowed text-lg shadow-md hover:shadow-lg mt-8"
                    >
                      {loading ? 'Creating Account...' : '✨ Create Account'}
                    </button>
                  </form>

                  {/* Back to Login */}
                  <div className="mt-6 text-center">
                    <button
                      onClick={onBackToLogin}
                      disabled={loading}
                      className="text-green-600 hover:text-green-800 font-bold underline disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      ← Back to Login
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Requirements Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-white border-2 border-amber-300 rounded-xl p-6 shadow-lg sticky top-8">
                  <h3 className="text-xl font-bold text-amber-900 mb-4 flex items-center gap-2">
                    🔐 Password Requirements
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      {passwordRequirements.minLength ? (
                        <Check size={20} className="text-green-600" />
                      ) : (
                        <X size={20} className="text-gray-400" />
                      )}
                      <span className={`text-sm font-semibold ${passwordRequirements.minLength ? 'text-green-600' : 'text-gray-600'}`}>
                        At least 8 characters
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordRequirements.hasUppercase ? (
                        <Check size={20} className="text-green-600" />
                      ) : (
                        <X size={20} className="text-gray-400" />
                      )}
                      <span className={`text-sm font-semibold ${passwordRequirements.hasUppercase ? 'text-green-600' : 'text-gray-600'}`}>
                        One uppercase letter (A-Z)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordRequirements.hasLowercase ? (
                        <Check size={20} className="text-green-600" />
                      ) : (
                        <X size={20} className="text-gray-400" />
                      )}
                      <span className={`text-sm font-semibold ${passwordRequirements.hasLowercase ? 'text-green-600' : 'text-gray-600'}`}>
                        One lowercase letter (a-z)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordRequirements.hasNumber ? (
                        <Check size={20} className="text-green-600" />
                      ) : (
                        <X size={20} className="text-gray-400" />
                      )}
                      <span className={`text-sm font-semibold ${passwordRequirements.hasNumber ? 'text-green-600' : 'text-gray-600'}`}>
                        One number (0-9)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordRequirements.hasSpecialChar ? (
                        <Check size={20} className="text-green-600" />
                      ) : (
                        <X size={20} className="text-gray-400" />
                      )}
                      <span className={`text-sm font-semibold ${passwordRequirements.hasSpecialChar ? 'text-green-600' : 'text-gray-600'}`}>
                        One special character (!@#$%^&*, etc)
                      </span>
                    </div>
                  </div>

                  {/* Password Match Status */}
                  {formData.confirmPassword && (
                    <div className="mt-6 pt-6 border-t-2 border-gray-200">
                      <div className="flex items-center gap-2">
                        {passwordsMatch ? (
                          <Check size={20} className="text-green-600" />
                        ) : (
                          <X size={20} className="text-red-600" />
                        )}
                        <span className={`text-sm font-semibold ${passwordsMatch ? 'text-green-600' : 'text-red-600'}`}>
                          Passwords match
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
