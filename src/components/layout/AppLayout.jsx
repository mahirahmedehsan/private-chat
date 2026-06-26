import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'
import Toast from './Toast'

export default function AppLayout() {
  const location = useLocation()

  return (
    <div className="h-screen w-screen flex bg-dark-100 overflow-hidden has-mobile-nav">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 bg-gradient-to-br from-dark-300 to-dark-200">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="flex-1 flex flex-col min-w-0 min-h-0"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <MobileNav />
      <Toast />
    </div>
  )
}
