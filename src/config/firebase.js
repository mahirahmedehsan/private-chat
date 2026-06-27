import { initializeApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
} from 'firebase/auth'
import { getDatabase, ref, push, set, onChildAdded, off, query, limitToLast, orderByChild } from 'firebase/database'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const rtdb = getDatabase(app)

const googleProvider = new GoogleAuthProvider()
googleProvider.addScope('https://www.googleapis.com/auth/drive.file')
googleProvider.setCustomParameters({ access_type: 'offline' })

const driveProvider = new GoogleAuthProvider()
driveProvider.addScope('https://www.googleapis.com/auth/drive.file')
driveProvider.setCustomParameters({ access_type: 'offline', prompt: 'consent' })

const DRIVE_SCOPES = ['https://www.googleapis.com/auth/drive.file']

export {
  auth,
  rtdb,
  googleProvider,
  driveProvider,
  DRIVE_SCOPES,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  fbSignOut,
  GoogleAuthProvider,
  getDatabase,
  ref,
  push,
  set,
  onChildAdded,
  off,
  query,
  limitToLast,
  orderByChild,
}
export default app
