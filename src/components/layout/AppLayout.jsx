import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'
import Toast from './Toast'

export default function AppLayout() {
  const location = useLocation()

  return (
    <div className="h-screen w-screen flex overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 bg-dark-100/50 has-mobile-nav">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
