import './App.css'
import { useState, useEffect } from 'react'
import LoginPage from './features/auth/LoginPage'
import SignUpPage from './features/auth/SignUpPage'
import AdminLoginPage from './features/auth/AdminLoginPage'
import AdminDashboard from './features/auth/AdminDashboard'
import DailyStatusTracker from './components/DailyStatusTracker'
import { seedDefaultAdmin } from './features/auth/seedAdmin'

function App() {
  const [currentPage, setCurrentPage] = useState('login') // 'login', 'signup', 'admin-login', 'admin-dashboard', or 'tracker'
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize app and restore session on mount
  useEffect(() => {
    const initializeApp = async () => {
      // Seed default admin
      await seedDefaultAdmin()

      // Check for existing token in localStorage
      const token = localStorage.getItem('authToken')
      const currentUser = localStorage.getItem('currentUser')
      const isAdmin = localStorage.getItem('isAdmin')

      if (token && currentUser) {
        try {
          // Verify token is still valid by checking it can be parsed
          // In production, you might verify with backend /api/auth/me endpoint
          const userData = JSON.parse(currentUser)

          // Route to appropriate page based on user role
          if (isAdmin === 'true' || userData.role === 'admin') {
            setCurrentPage('admin-dashboard')
          } else {
            setCurrentPage('tracker')
          }
        } catch (error) {
          console.error('Error restoring session:', error)
          // Token is invalid, clear and go to login
          localStorage.removeItem('authToken')
          localStorage.removeItem('currentUser')
          localStorage.removeItem('isAdmin')
          setCurrentPage('login')
        }
      } else {
        setCurrentPage('login')
      }

      setIsInitialized(true)
    }

    initializeApp()
  }, [])

  const handleLoginSuccess = (user, token) => {
    localStorage.setItem('authToken', token)
    localStorage.setItem('currentUser', JSON.stringify(user))
    setCurrentPage('tracker')
  }

  const handleAdminLoginSuccess = (user, token) => {
    localStorage.setItem('authToken', token)
    localStorage.setItem('currentUser', JSON.stringify(user))
    localStorage.setItem('isAdmin', 'true')
    setCurrentPage('admin-dashboard')
  }

  const handleSignUpClick = () => {
    setCurrentPage('signup')
  }

  const handleAdminLoginClick = () => {
    setCurrentPage('admin-login')
  }

  const handleSignUpSuccess = () => {
    setCurrentPage('login')
  }

  const handleBackToLogin = () => {
    setCurrentPage('login')
  }

  const handleAdminLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('currentUser')
    localStorage.removeItem('isAdmin')
    setCurrentPage('login')
  }

  // Show loading while initializing
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-700 font-bold text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  if (currentPage === 'login') {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onSignUpClick={handleSignUpClick}
        onAdminLoginClick={handleAdminLoginClick}
      />
    )
  }

  if (currentPage === 'signup') {
    return (
      <SignUpPage
        onSignUpSuccess={handleSignUpSuccess}
        onBackToLogin={handleBackToLogin}
      />
    )
  }

  if (currentPage === 'admin-login') {
    return (
      <AdminLoginPage
        onAdminLoginSuccess={handleAdminLoginSuccess}
        onBackToLogin={handleBackToLogin}
      />
    )
  }

  if (currentPage === 'admin-dashboard') {
    return (
      <AdminDashboard
        onLogout={handleAdminLogout}
      />
    )
  }

  return <DailyStatusTracker />
}

export default App
