import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { addToast } from '../store/slices/uiSlice'

export function useToast() {
  const dispatch = useDispatch()

  const toast = useCallback(({ type = 'info', title, message, duration }) => {
    dispatch(addToast({ type, title, message, duration }))
  }, [dispatch])

  return { toast }
}
