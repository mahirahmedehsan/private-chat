import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiMail, FiLock, FiMessageSquare, FiEye, FiEyeOff } from 'react-icons/fi'
import { FcGoogle } from 'react-icons/fc'
import { signInWithPopup, googleProvider, signInWithEmailAndPassword, auth, GoogleAuthProvider } from '../../config/firebase'
import { loginWithGoogle, loginUser } from '../../api/auth'
import { setupDrive } from '../../api/drive'
import { setCredentials, setLoading, setError } from '../../store/slices/authSlice'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

export default function Login() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading } = useSelector((s) => s.auth)

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
  }

  const handleEmailLogin = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      setErrors({ email: !form.email ? 'Required' : '', password: !form.password ? 'Required' : '' })
      return
    }
    dispatch(setLoading(true))
    try {
      const { user: fbUser } = await signInWithEmailAndPassword(auth, form.email, form.password)
      const idToken = await fbUser.getIdToken()
      const { token, user } = await loginUser({ idToken })
      dispatch(setCredentials({ token, user }))
      navigate('/chat')
    } catch (err) {
      dispatch(setError(err.response?.data?.error?.message || err.message || 'Login failed'))
    }
  }

  const handleGoogleLogin = async () => {
    dispatch(setLoading(true))
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const idToken = await result.user.getIdToken()
      const credential = GoogleAuthProvider.credentialFromResult(result)
      const googleAccessToken = credential?.accessToken
      const { token, user, googleAccessToken: returnedToken } = await loginWithGoogle(idToken, googleAccessToken)

      dispatch(setCredentials({ token, user, googleAccessToken: returnedToken || googleAccessToken }))
      navigate('/chat')
      if (returnedToken || googleAccessToken) {
        setupDrive().catch((e) => console.warn('Drive setup:', e.message))
      }
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        dispatch(setError(null))
        return
      }
      dispatch(setError(err.response?.data?.error?.message || err.message || 'Google login failed'))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden gradient-auth">
      <div className="absolute top-1/3 -left-48 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/3 -right-48 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/[0.015] rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm relative"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 14, stiffness: 280, delay: 0.1 }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent via-accent-hover to-blue-500 flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-accent/25"
          >
            <FiMessageSquare className="h-8 w-8 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold gradient-text tracking-tight">Welcome back</h1>
          <p className="text-text-secondary mt-2 text-sm">Sign in to continue to PrivateChat</p>
        </div>

        <div className="bg-dark-150/70 backdrop-blur-2xl border border-border/60 rounded-2xl p-6 shadow-elevated space-y-5">
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <Input
              label="Email"
              type="email"
              name="email"
              placeholder="you@example.com"
              icon={FiMail}
              value={form.email}
              onChange={handleChange}
              error={errors.email}
            />
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Enter your password"
                icon={FiLock}
                value={form.password}
                onChange={handleChange}
                error={errors.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[34px] text-text-muted hover:text-text-primary transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
              </button>
            </div>
            <Button type="submit" variant="gradient" size="lg" className="w-full" loading={loading}>
              Sign In
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-dark-150 text-text-muted">or continue with</span>
            </div>
          </div>

          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            icon={FcGoogle}
            onClick={handleGoogleLogin}
            loading={loading}
          >
            Google
          </Button>
        </div>

        <p className="text-center mt-6 text-sm text-text-muted">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="text-accent-light hover:text-accent font-semibold transition-colors">
            Create one
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
