import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiMail, FiLock, FiUser, FiMessageSquare, FiEye, FiEyeOff } from 'react-icons/fi'

import {
  signInWithPopup,
  googleProvider,
  createUserWithEmailAndPassword,
  auth,
  GoogleAuthProvider,
} from '../../config/firebase'
import { loginWithGoogle, registerUser } from '../../api/auth'
import { setupDrive } from '../../api/drive'
import { setCredentials, setLoading, setError } from '../../store/slices/authSlice'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

export default function Signup() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading } = useSelector((s) => s.auth)

  const [form, setForm] = useState({ email: '', password: '', name: '' })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
  }

  const handleEmailSignup = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.email) errs.email = 'Required'
    if (!form.password) errs.password = 'Required'
    if (!form.name) errs.name = 'Required'
    if (Object.keys(errs).length) { setErrors(errs); return }

    dispatch(setLoading(true))
    try {
      const { user: fbUser } = await createUserWithEmailAndPassword(auth, form.email, form.password)
      const idToken = await fbUser.getIdToken()
      const { token, user } = await registerUser({ idToken, name: form.name })
      dispatch(setCredentials({ token, user }))
      navigate('/chat')
    } catch (err) {
      dispatch(setError(err.response?.data?.error?.message || err.message || 'Registration failed'))
    }
  }

  const handleGoogleSignup = async () => {
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
      dispatch(setError(err.response?.data?.error?.message || err.message || 'Google signup failed'))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-auth">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 14, stiffness: 280, delay: 0.1 }}
            className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mx-auto mb-4 shadow-xl shadow-accent/20"
          >
            <FiMessageSquare className="h-6 w-6 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Create account</h1>
          <p className="text-text-secondary mt-1.5 text-sm">Join PrivateChat today</p>
        </div>

        <div className="bg-dark-100 border border-dark-400 rounded-xl p-5 space-y-4">
          <form onSubmit={handleEmailSignup} className="space-y-4">
            <Input
              label="Display Name"
              type="text"
              name="name"
              placeholder="Your name"
              icon={FiUser}
              value={form.name}
              onChange={handleChange}
              error={errors.name}
            />
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
                placeholder="Create a password"
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
            <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>
              Create Account
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-dark-400" /></div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-dark-100 text-text-muted">or continue with</span>
            </div>
          </div>

          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={handleGoogleSignup}
            loading={loading}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Google
          </Button>
        </div>

        <p className="text-center mt-5 text-sm text-text-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-accent-light hover:text-accent font-semibold transition-colors">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
