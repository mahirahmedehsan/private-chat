import { useSelector } from 'react-redux'

export function useAuth() {
  const { user, token, isAuthenticated, loading, error } = useSelector((s) => s.auth)
  return { user, token, isAuthenticated, loading, error }
}
