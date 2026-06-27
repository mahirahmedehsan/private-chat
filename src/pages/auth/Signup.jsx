import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiMail, FiLock, FiUser, FiMessageSquare } from 'react-icons/fi'
import { FcGoogle } from 'react-icons/fc'
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
        setupDrive().catch(() => {})
      }
    } catch (err) {
      dispatch(setError(err.response?.data?.error?.message || err.message || 'Google signup failed'))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-50 p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.08),transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.06),transparent_60%)] pointer-events-none" />
      <div className="absolute top-1/4 -left-32 w-64 h-64 bg-accent/3 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-blue-500/3 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm relative"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-blue-500 flex items-center justify-center mx-auto mb-5 shadow-xl shadow-accent/20">
            <FiMessageSquare className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold gradient-text tracking-tight">Create account</h1>
          <p className="text-text-secondary mt-2 text-sm">Join PrivateChat today</p>
        </div>

        <div className="bg-dark-150 border border-border rounded-2xl p-6 card-shadow space-y-5">
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
            <Input
              label="Password"
              type="password"
              name="password"
              placeholder="Create a password"
              icon={FiLock}
              value={form.password}
              onChange={handleChange}
              error={errors.password}
            />
            <Button type="submit" variant="gradient" size="lg" className="w-full" loading={loading}>
              Create Account
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
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
            onClick={handleGoogleSignup}
            loading={loading}
          >
            Google
          </Button>
        </div>

        <p className="text-center mt-6 text-sm text-text-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-accent-light hover:text-accent font-semibold transition-colors">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
