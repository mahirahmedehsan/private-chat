import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  FiMoon,
  FiSun,
  FiBell,
  FiBellOff,
  FiShield,
  FiGlobe,
  FiVolume2,
  FiCloud,
  FiLogOut,
  FiTrash2,
  FiCheck,
  FiLoader,
  FiKey,
  FiEye,
  FiEyeOff,
  FiLock,
  FiDownloadCloud,
  FiAlertTriangle,
  FiUser,
  FiMail,
  FiSmartphone,
  FiDroplet,
  FiRefreshCw,
  FiChevronDown,
  FiMapPin,
  FiFileText,
  FiCalendar,
  FiHeart,
  FiSliders,
} from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { logout as logoutAction, setUser, setE2EEEnabled } from '../../store/slices/authSlice'
import { toggleSound, toggleDarkMode, toggleNotifications, toggleOnlineStatus, addToast } from '../../store/slices/uiSlice'
import { useT, useLocale } from '../../locales/i18n.jsx'
import { logoutUser } from '../../api/auth'
import { getMe, updateProfile } from '../../api/users'
import { setupDrive } from '../../api/drive'
import { deleteAccount, exportData } from '../../api/account'
import { disconnectSocket, getSocket } from '../../config/socket'
import { generateKeyPair, storeKeyPair, getKeyPair, hasKeyPair, deleteKeyPair } from '../../utils/encryption'
import TopBar from '../../components/layout/TopBar'
import Button from '../../components/ui/Button'
import Avatar from '../../components/ui/Avatar'
import Modal from '../../components/ui/Modal'

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={value}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent/50 shadow-sm ${value ? 'bg-gradient-to-r from-accent to-accent-light shadow-accent/20' : 'bg-dark-600'}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${value ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  )
}

function VisToggle({ value, onChange }) {
  const opts = [
    { key: 'public', label: 'Public' },
    { key: 'friends', label: 'Friends' },
    { key: 'only_me', label: 'Only Me' },
  ]
  return (
    <div className="flex items-center gap-1 bg-dark-400/60 rounded-lg p-0.5">
      {opts.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all whitespace-nowrap ${
            value === o.key ? 'bg-accent text-white shadow-sm' : 'text-text-muted hover:text-text-primary'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function SectionCard({ icon: Icon, label, description, children, className = '', accent = false }) {
  return (
    <div className={`group flex items-center justify-between px-4 py-3.5 hover:bg-dark-300/40 transition-colors ${className}`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
          accent ? 'bg-gradient-to-br from-accent/15 to-accent/5' : 'bg-dark-400/80 group-hover:bg-dark-500/80'
        }`}>
          {Icon && <Icon className={`h-4 w-4 ${accent ? 'text-accent-light' : 'text-text-muted'}`} />}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">{label}</p>
          {description && <p className="text-xs text-text-muted truncate leading-relaxed">{description}</p>}
        </div>
      </div>
      <div className="shrink-0 ml-3">{children}</div>
    </div>
  )
}

function SectionGroup({ icon: Icon, title, delay = 0, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-accent/15 to-accent/5 flex items-center justify-center">
          <Icon className="h-3 w-3 text-accent-light" />
        </div>
        <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest">{title}</h2>
      </div>
      <div className="glass-card rounded-xl overflow-hidden divide-y divide-border shadow-card">
        {children}
      </div>
    </motion.div>
  )
}

const languages = [
  { code: 'en', label: 'English' },
  { code: 'bn', label: 'বাংলা' },
]

export default function Settings() {
  const t = useT()
  const { locale, setLocale } = useLocale()
  const [langOpen, setLangOpen] = useState(false)
  const langRef = useRef(null)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const soundEnabled = useSelector((s) => s.ui.soundEnabled)
  const darkMode = useSelector((s) => s.ui.darkMode)
  const notificationsEnabled = useSelector((s) => s.ui.notificationsEnabled)
  const onlineStatusVisible = useSelector((s) => s.ui.onlineStatusVisible)
  const user = useSelector((s) => s.auth.user)
  const e2eeEnabled = useSelector((s) => s.auth.e2eeEnabled)
  const [driveBusy, setDriveBusy] = useState(false)
  const [keyBusy, setKeyBusy] = useState(false)
  const [e2eeKeysExist, setE2EEKeysExist] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [exportBusy, setExportBusy] = useState(false)
  const [emailVis, setEmailVis] = useState('public')
  const [bioVis, setBioVis] = useState('public')
  const [addressVis, setAddressVis] = useState('public')
  const [birthdayVis, setBirthdayVis] = useState('public')
  const [genderVis, setGenderVis] = useState('public')

  useEffect(() => {
    if (!user) return
    setEmailVis(user.emailVisibility || 'public')
    setBioVis(user.bioVisibility || 'public')
    setAddressVis(user.addressVisibility || 'public')
    setBirthdayVis(user.birthdayVisibility || 'public')
    setGenderVis(user.genderVisibility || 'public')
    getMe().then((data) => {
      if (!data) return
      setEmailVis(data.emailVisibility || 'public')
      setBioVis(data.bioVisibility || 'public')
      setAddressVis(data.addressVisibility || 'public')
      setBirthdayVis(data.birthdayVisibility || 'public')
      setGenderVis(data.genderVisibility || 'public')
      dispatch(setUser(data))
    }).catch(() => {})
  }, [user?.uid])

  useEffect(() => {
    if (user?.uid) {
      hasKeyPair(user.uid).then(setE2EEKeysExist)
    }
  }, [user?.uid])

  useEffect(() => {
    if (!langOpen) return
    const handler = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [langOpen])

  const handleLogout = async () => {
    try { await logoutUser() } catch {}
    disconnectSocket()
    dispatch(logoutAction())
    navigate('/login')
  }

  const handleDriveSetup = async () => {
    setDriveBusy(true)
    try {
      const driveResult = await setupDrive()
      if (driveResult?.appFolderId) {
        const updated = await getMe()
        dispatch(setUser(updated))
        dispatch(addToast({ type: 'success', title: t('settings.toast.drive.connected'), message: t('settings.toast.drive.connected.desc') }))
      } else if (driveResult?.error === 'Drive API not enabled') {
        dispatch(addToast({ type: 'error', title: t('settings.toast.drive.api.off'), message: t('settings.toast.drive.api.off.desc') }))
      } else {
        dispatch(addToast({ type: 'error', title: t('settings.toast.drive.failed'), message: t('settings.toast.drive.failed.desc') }))
      }
    } catch (err) {
      dispatch(addToast({ type: 'error', title: t('settings.toast.drive.failed'), message: err.response?.data?.error?.message || t('settings.toast.server.error') }))
    }
    setDriveBusy(false)
  }

  const handleOnlineStatusToggle = () => {
    dispatch(toggleOnlineStatus())
    updateProfile({ hideOnlineStatus: onlineStatusVisible }).catch(() => {})
  }

  const handleVisChange = async (field, value) => {
    try {
      const updated = await updateProfile({ [field]: value })
      if (updated) {
        dispatch(setUser(updated))
        queryClient.invalidateQueries({ queryKey: ['users', 'me'] })
      }
    } catch {}
  }

  const handleGenerateKeys = async () => {
    setKeyBusy(true)
    try {
      const keyPair = generateKeyPair()
      await storeKeyPair(user.uid, keyPair)
      await updateProfile({ publicKey: keyPair.publicKey, encKeyVersion: 1 })
      const socket = getSocket()
      if (socket?.connected) {
        socket.emit('e2ee:key-update', { publicKey: keyPair.publicKey, version: 1 })
      }
      setE2EEKeysExist(true)
      dispatch(setE2EEEnabled(true))
      dispatch(addToast({ type: 'success', title: t('settings.toast.keys.generated'), message: t('settings.toast.keys.generated.desc') }))
    } catch (err) {
      dispatch(addToast({ type: 'error', title: t('settings.toast.keys.failed'), message: err.message }))
    }
    setKeyBusy(false)
  }

  const handleDeleteKeys = async () => {
    if (!user?.uid) return
    await deleteKeyPair(user.uid)
    await updateProfile({ publicKey: null })
    setE2EEKeysExist(false)
    dispatch(setE2EEEnabled(false))
    dispatch(addToast({ type: 'info', title: t('settings.toast.keys.deleted'), message: t('settings.toast.keys.deleted.desc') }))
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE MY DATA') return
    setDeleteBusy(true)
    try {
      await deleteAccount(deleteConfirmation)
      await deleteKeyPair(user.uid)
      dispatch(addToast({ type: 'success', title: t('settings.toast.account.deleted'), message: t('settings.toast.account.deleted.desc') }))
      disconnectSocket()
      dispatch(logoutAction())
      navigate('/login')
    } catch (err) {
      dispatch(addToast({ type: 'error', title: t('settings.toast.delete.failed'), message: err.response?.data?.error?.message || err.message }))
    }
    setDeleteBusy(false)
    setShowDeleteModal(false)
  }

  const handleExportData = async () => {
    setExportBusy(true)
    try {
      const data = await exportData()
      dispatch(addToast({ type: 'success', title: t('settings.toast.exported'), message: t('settings.toast.exported.desc', { messages: data.messageCount, friends: data.friendCount, notes: data.noteCount }) }))
    } catch (err) {
      dispatch(addToast({ type: 'error', title: t('settings.toast.export.failed'), message: err.message }))
    }
    setExportBusy(false)
  }

  const isDriveConfigured = !!user?.driveFolderId

  return (
    <>
      <TopBar title={t('nav.settings')} />
      <div className="flex-1 overflow-y-auto scrollbar-gutter">
        <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">

          {/* ── Profile Summary ── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-5 flex items-center gap-4 card-shadow"
          >
            <div className="relative shrink-0">
              <Avatar src={user?.photoURL} name={user?.displayName} size="lg" status="online" className="ring-2 ring-accent/30" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-text-primary truncate">
                {user?.displayName || t('nav.profile')}
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <FiMail className="h-3 w-3 text-text-muted" />
                <p className="text-xs text-text-muted truncate">{user?.email || '-'}</p>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                </span>
                <span className="text-[11px] text-text-muted">{t('common.online')}</span>
              </div>
            </div>
          </motion.div>

          {/* ── Preferences ── */}
          <SectionGroup icon={FiSliders} title={t('settings.preferences')} delay={0.05}>
            <SectionCard accent icon={darkMode ? FiMoon : FiSun} label={t('settings.dark.mode')} description={t('settings.dark.mode.desc')}>
              <Toggle value={darkMode} onChange={() => dispatch(toggleDarkMode())} />
            </SectionCard>
            <SectionCard accent icon={notificationsEnabled ? FiBell : FiBellOff} label={t('settings.notifications')} description={t('settings.notifications.desc')}>
              <Toggle value={notificationsEnabled} onChange={() => dispatch(toggleNotifications())} />
            </SectionCard>
            <SectionCard accent icon={FiVolume2} label={t('settings.sound')} description={t('settings.sound.desc')}>
              <Toggle value={soundEnabled} onChange={() => dispatch(toggleSound())} />
            </SectionCard>
            <SectionCard accent icon={FiGlobe} label={t('settings.language')} description={t('settings.language.desc')}>
              <div className="relative" ref={langRef}>
                <button
                  onClick={() => setLangOpen(!langOpen)}
                  className="flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text-primary transition-colors"
                >
                  <span>{languages.find((l) => l.code === locale)?.label || 'English'}</span>
                  <FiChevronDown className={`h-3.5 w-3.5 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
                </button>
                {langOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-36 bg-dark-200 border border-border rounded-xl shadow-2xl py-1 z-50 backdrop-blur-md">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => { setLocale(lang.code); setLangOpen(false) }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                          locale === lang.code
                            ? 'text-accent-light bg-accent-bg'
                            : 'text-text-primary hover:bg-dark-400'
                        }`}
                      >
                        <span>{lang.label}</span>
                        {locale === lang.code && <FiCheck className="h-3.5 w-3.5 ml-auto" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </SectionCard>
          </SectionGroup>

          {/* ── Privacy & Security ── */}
          <SectionGroup icon={FiShield} title={t('settings.privacy')} delay={0.1}>
            <SectionCard accent icon={FiShield} label={t('settings.encryption')} description={t('settings.encryption.desc')}>
              <span className={`text-sm font-medium ${e2eeEnabled ? 'text-success' : 'text-text-muted'}`}>
                {e2eeEnabled ? t('settings.encryption.active') : t('settings.encryption.not.configured')}
              </span>
            </SectionCard>
            <SectionCard
              accent
              icon={onlineStatusVisible ? FiEye : FiEyeOff}
              label={t('settings.online.status')}
              description={t('settings.online.status.desc')}
            >
              <Toggle value={onlineStatusVisible} onChange={handleOnlineStatusToggle} />
            </SectionCard>
          </SectionGroup>

          {/* ── Profile Visibility ── */}
          <SectionGroup icon={FiEye} title="Profile Visibility" delay={0.12}>
            <SectionCard icon={FiMail} label="Email" description="Control who can see your email">
              <VisToggle value={emailVis} onChange={(v) => { setEmailVis(v); handleVisChange('emailVisibility', v) }} />
            </SectionCard>
            <SectionCard icon={FiFileText} label="Bio" description="Control who can see your bio">
              <VisToggle value={bioVis} onChange={(v) => { setBioVis(v); handleVisChange('bioVisibility', v) }} />
            </SectionCard>
            <SectionCard icon={FiMapPin} label="Address" description="Control who can see your address">
              <VisToggle value={addressVis} onChange={(v) => { setAddressVis(v); handleVisChange('addressVisibility', v) }} />
            </SectionCard>
            <SectionCard icon={FiCalendar} label="Birthday" description="Control who can see your birthday">
              <VisToggle value={birthdayVis} onChange={(v) => { setBirthdayVis(v); handleVisChange('birthdayVisibility', v) }} />
            </SectionCard>
            <SectionCard icon={FiHeart} label="Gender" description="Control who can see your gender">
              <VisToggle value={genderVis} onChange={(v) => { setGenderVis(v); handleVisChange('genderVisibility', v) }} />
            </SectionCard>
          </SectionGroup>

          {/* ── Encryption Keys ── */}
          <SectionGroup icon={FiLock} title={t('settings.e2ee')} delay={0.15}>
            <SectionCard
              accent
              icon={FiKey}
              label={t('settings.e2ee.keys')}
              description={e2eeKeysExist ? t('settings.e2ee.keys.desc.ready') : t('settings.e2ee.keys.desc.notready')}
            >
              <div className="flex items-center gap-2">
                {e2eeKeysExist && (
                  <button
                    onClick={handleDeleteKeys}
                    className="text-xs text-text-muted hover:text-danger transition-colors underline underline-offset-2"
                  >
                    {t('settings.e2ee.remove')}
                  </button>
                )}
                <button
                  onClick={e2eeKeysExist ? undefined : handleGenerateKeys}
                  disabled={keyBusy || e2eeKeysExist}
                  className={`flex items-center gap-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${e2eeKeysExist ? 'text-success cursor-default' : 'text-accent hover:text-accent-light cursor-pointer'}`}
                >
                  {keyBusy ? (
                    <FiLoader className="h-3.5 w-3.5 animate-spin" />
                  ) : e2eeKeysExist ? (
                    <FiCheck className="h-3.5 w-3.5" />
                  ) : (
                    <FiRefreshCw className="h-3.5 w-3.5" />
                  )}
                  {e2eeKeysExist ? t('settings.e2ee.keys.ready') : keyBusy ? t('settings.e2ee.keys.generating') : t('settings.e2ee.keys.generate')}
                </button>
              </div>
            </SectionCard>
          </SectionGroup>

          {/* ── Storage & Data ── */}
          <SectionGroup icon={FiCloud} title={t('settings.storage')} delay={0.2}>
            <SectionCard
              accent
              icon={FiCloud}
              label={t('settings.drive.backup')}
              description={isDriveConfigured ? t('settings.drive.backup.desc.on') : t('settings.drive.backup.desc.off')}
            >
              <button
                onClick={handleDriveSetup}
                disabled={driveBusy}
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${isDriveConfigured ? 'text-success cursor-default' : 'text-accent hover:text-accent-light cursor-pointer'}`}
              >
                {driveBusy ? (
                  <FiLoader className="h-3.5 w-3.5 animate-spin" />
                ) : isDriveConfigured ? (
                  <FiCheck className="h-3.5 w-3.5" />
                ) : null}
                {driveBusy ? t('settings.drive.connecting') : isDriveConfigured ? t('settings.drive.connected') : t('settings.drive.connect')}
              </button>
            </SectionCard>
            <SectionCard
              accent
              icon={FiDownloadCloud}
              label={t('settings.export')}
              description={t('settings.export.desc')}
            >
              <button
                onClick={handleExportData}
                disabled={exportBusy}
                className="flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-light transition-colors disabled:opacity-50 cursor-pointer"
              >
                {exportBusy ? <FiLoader className="h-3.5 w-3.5 animate-spin" /> : null}
                {exportBusy ? t('settings.export.progress') : t('settings.export.action')}
              </button>
            </SectionCard>
          </SectionGroup>

          {/* ── Account ── */}
          <SectionGroup icon={FiUser} title={t('settings.account')} delay={0.25}>
            <SectionCard accent icon={FiSmartphone} label={t('settings.user.id')} description={t('settings.user.id.desc')}>
              <code className="text-xs text-text-muted bg-dark-400 px-2 py-1 rounded-md font-mono">
                {user?.uid ? `${user.uid.slice(0, 12)}...` : '-'}
              </code>
            </SectionCard>
            <SectionCard accent icon={FiCloud} label={t('settings.drive.folder')} description={t('settings.drive.folder.desc')}>
              <span className={`text-sm font-medium ${user?.driveFolderId ? 'text-success' : 'text-text-muted'}`}>
                {user?.driveFolderId ? t('settings.drive.folder.on') : t('settings.drive.folder.off')}
              </span>
            </SectionCard>
          </SectionGroup>

          {/* ── Actions ── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-3 pt-2"
          >
            <Button variant="danger" size="lg" className="w-full" icon={FiLogOut} onClick={handleLogout}>
              {t('settings.sign.out')}
            </Button>

            <div className="glass-card rounded-xl overflow-hidden border-danger/20 card-shadow">
              <div className="px-4 py-3 bg-danger/5 border-b border-danger/10">
                <div className="flex items-center gap-2">
                  <FiAlertTriangle className="h-4 w-4 text-danger" />
                  <span className="text-sm font-semibold text-danger">{t('settings.danger.zone')}</span>
                </div>
                <p className="text-xs text-text-muted mt-1">
                  {t('settings.danger.desc')}
                </p>
              </div>
              <div className="p-3">
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-danger bg-danger/10 hover:bg-danger/20 border border-danger/20 rounded-lg transition-colors cursor-pointer"
                >
                  <FiTrash2 className="h-4 w-4" />
                  {t('settings.delete.account')}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setDeleteConfirmation('') }}
        title={t('settings.delete.modal.title')}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-danger/10 rounded-xl border border-danger/20">
            <FiAlertTriangle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-danger">{t('settings.delete.modal.warning')}</p>
              <p className="text-xs text-text-muted mt-1">
                {t('settings.delete.modal.desc')}
              </p>
            </div>
          </div>

          <p className="text-sm text-text-primary">
            {t('settings.delete.modal.confirm', { text: 'DELETE MY DATA' })}
          </p>

          <input
            type="text"
            value={deleteConfirmation}
            onChange={(e) => setDeleteConfirmation(e.target.value)}
            placeholder="DELETE MY DATA"
            className="w-full bg-dark-400/80 border border-border-light rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-danger/40"
          />

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="md"
              className="flex-1"
              onClick={() => { setShowDeleteModal(false); setDeleteConfirmation('') }}
            >
              {t('settings.delete.modal.cancel')}
            </Button>
            <Button
              variant="danger"
              size="md"
              className="flex-1"
              disabled={deleteConfirmation !== 'DELETE MY DATA' || deleteBusy}
              onClick={handleDeleteAccount}
            >
              {deleteBusy ? <FiLoader className="h-4 w-4 animate-spin" /> : t('settings.delete.modal.delete')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
