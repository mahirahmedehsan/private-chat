import { useEffect } from 'react'

export function useKeyboardNav(items, currentId, onNavigate) {
  useEffect(() => {
    function handler(e) {
      if (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.isContentEditable
      ) return

      const num = parseInt(e.key)
      if (num >= 1 && num <= items.length) {
        e.preventDefault()
        onNavigate(items[num - 1])
        return
      }

      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault()
        const curIdx = items.findIndex((item) => item.id === currentId)
        if (curIdx === -1) return
        const delta = e.key === 'ArrowLeft' ? -1 : 1
        onNavigate(items[(curIdx + delta + items.length) % items.length])
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [items, currentId, onNavigate])
}
