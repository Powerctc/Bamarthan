'use client'

import { useState, useEffect } from 'react'

// Firebase config (you can also use process.env.NEXT_PUBLIC_FIREBASE_CONFIG)
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG || '{}')

const appId = typeof __app_id !== 'undefined' ? __app_id : 's4itmm-tv-nextjs'

export default function HomePage() {
  const [user, setUser] = useState(null)
  const [deviceID, setDeviceID] = useState(null)
  const [userInfo, setUserInfo] = useState(null)
  const [status, setStatus] = useState('Initializing S4ITMM TV...')
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAndroidTV, setIsAndroidTV] = useState(false)

  // 1. Device & Android TV Detection
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase()
    const isTV = userAgent.includes('android') && 
                 (userAgent.includes('tv') || userAgent.includes('box') || screen.width >= 1280)
    setIsAndroidTV(isTV)

    let id = localStorage.getItem("s4itmm_device_v2")
    if (!id || id.length !== 12) {
      const raw = (navigator.userAgent || "unknown") + Date.now() + Math.random()
      let hash = 0
      for (let i = 0; i < raw.length; i++) {
        hash = (hash << 5) - hash + raw.charCodeAt(i)
      }
      id = Math.abs(hash).toString().padStart(12, "0").slice(0, 12)
      localStorage.setItem("s4itmm_device_v2", id)
    }
    setDeviceID(id)
  }, [])

  // 2. Load Firebase from /public/firebase/*.js
  useEffect(() => {
    if (typeof window === 'undefined') return

    let firebaseInitialized = false

    const initFirebase = async () => {
      try {
        // Load Firebase modules dynamically from public folder
        if (!window.firebaseApp) {
          setStatus('Loading local Firebase SDK...')

          // Load in order
          await import('/firebase/firebase-app.js')
          await import('/firebase/firebase-auth.js')
          await import('/firebase/firebase-firestore.js')

          const { initializeApp } = await import('/firebase/firebase-app.js')
          window.firebaseApp = initializeApp(firebaseConfig)
        }

        const { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } = await import('/firebase/firebase-auth.js')
        const { getFirestore, doc, getDoc, setDoc, onSnapshot, Timestamp } = await import('/firebase/firebase-firestore.js')

        const app = window.firebaseApp
        const auth = getAuth(app)
        const db = getFirestore(app)

        // Auth init
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token)
        } else {
          await signInAnonymously(auth)
        }

        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
          setUser(user)
        })

        // Watch Firestore registration
        const watchFirestore = () => {
          if (!user || !deviceID) return null

          const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'registrations', deviceID)

          const unsub = onSnapshot(docRef, async (snap) => {
            try {
              if (snap.exists()) {
                validateAccess(snap.data())
              } else {
                setStatus('New device found. Activating 3-day trial...')
                const expiryDate = new Date()
                expiryDate.setDate(expiryDate.getDate() + 3)

                await setDoc(docRef, {
                  id: deviceID,
                  name: `Guest_${deviceID.slice(-4)}`,
                  expires: Timestamp.fromDate(expiryDate),
                  status: 'trial',
                  createdAt: Timestamp.now()
                })
              }
            } catch (err) {
              console.error("Firestore Error:", err)
              setError({ title: "Database Error", message: "Failed to sync user data." })
              setIsLoading(false)
            }
          }, (err) => {
            console.error("Snapshot error:", err)
            setError({ title: "Connection Error", message: "Lost connection to approval server." })
            setIsLoading(false)
          })

          return unsub
        }

        let firestoreUnsub = null

        const handleUserDeviceChange = () => {
          if (user && deviceID && !firestoreUnsub) {
            firestoreUnsub = watchFirestore()
          } else if ((!user || !deviceID) && firestoreUnsub) {
            firestoreUnsub()
            firestoreUnsub = null
          }
        }

        handleUserDeviceChange()

        return () => {
          unsubscribeAuth()
          if (firestoreUnsub) firestoreUnsub()
        }
      } catch (err) {
        console.error("Firebase init error:", err)
        setError({ title: "Startup Failed", message: "Could not load TV system. Try again or use /home.html" })
        setIsLoading(false)
      }
    }

    initFirebase()
  }, [deviceID, user])

  // Validation logic
  const validateAccess = (data) => {
    const today = new Date()
    const expires = data.expires?.toDate ? data.expires.toDate() : new Date(data.expires)
    const diffDays = Math.ceil((expires - today) / (1000 * 60 * 60 * 24))

    setUserInfo({ ...data, daysRemaining: Math.max(0, diffDays) })

    if (expires < today) {
      setError({
        title: "Access Expired",
        message: "Your trial or subscription has ended. Contact @S4ITMM for renewal.",
        userInfo: data
      })
      setIsLoading(false)
    } else {
      setStatus('✅ Access Verified')
      setIsLoading(false)
    }
  }

  const copyId = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(deviceID).then(() => {
        setStatus("ID Copied to Clipboard!")
        setTimeout(() => setStatus("Checking access..."), 2000)
      })
    } else {
      const el = document.createElement('textarea')
      el.value = deviceID
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setStatus("ID Copied!")
      setTimeout(() => setStatus("Checking access..."), 2000)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-[#0a0f1e] text-slate-100">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-red-600 italic tracking-tighter">
            S4ITMM<span className="text-white not-italic">TV</span>
          </h1>
          <div className="h-1 w-20 bg-red-600 mx-auto mt-2 rounded-full"></div>
        </div>

        <div className="bg-[#161d31] border border-slate-700/50 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-600/10 rounded-full blur-3xl"></div>

          {isLoading ? (
            <div className="text-center py-6">
              <div className="inline-block w-12 h-12 border-4 border-slate-700 border-t-red-600 rounded-full animate-spin mb-6"></div>
              <p className="text-slate-400 font-medium animate-pulse">{status}</p>
            </div>
          ) : error ? (
            <div className="text-center">
              <div className="bg-red-500/10 text-red-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">!</div>
              <h2 className="text-xl font-bold mb-2">{error.title}</h2>
              <p className="text-slate-400 text-sm mb-6">{error.message}</p>
              
              {error.userInfo && (
                <div className="bg-black/20 rounded-xl p-4 mb-6 text-sm text-left border border-slate-800">
                  <div className="flex justify-between mb-1"><span className="text-slate-500">Device ID:</span><span>{error.userInfo.id}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Expired On:</span><span className="text-red-400">{new Date(error.userInfo.expires.toDate?.() || error.userInfo.expires).toLocaleDateString()}</span></div>
                </div>
              )}

              <button onClick={copyId} className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-all active:scale-95">
                Copy Device ID
              </button>
            </div>
          ) : (
            <div className="text-center">
              <div className="bg-green-500/10 text-green-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
              <h2 className="text-xl font-bold text-green-400 mb-1">Access Approved</h2>
              <p className="text-slate-500 text-xs uppercase tracking-widest mb-6">Device Verified</p>

              <div className="space-y-3 mb-8">
                <div className="flex justify-between p-3 bg-black/20 rounded-xl">
                  <span className="text-slate-400 text-sm">Days Remaining:</span>
                  <span className="text-green-400 font-bold">{userInfo.daysRemaining} Days</span>
                </div>
                <div className="flex justify-between p-3 bg-black/20 rounded-xl">
                  <span className="text-slate-400 text-sm">Expired Date:</span>
                  <span className="text-slate-200 text-sm">{new Date(userInfo.expires.toDate?.() || userInfo.expires).toLocaleDateString()}</span>
                </div>
              </div>

              <button 
                onClick={() => window.location.href = '/main'} 
                className="w-full py-4 bg-red-600 hover:bg-red-700 rounded-2xl font-black text-lg shadow-lg shadow-red-900/20 transition-all hover:scale-[1.02] active:scale-95"
              >
                START WATCHING
              </button>
            </div>
          )}
        </div>

        <div className="mt-8 space-y-4 text-center">
          {isAndroidTV && (
            <div className="text-xs text-blue-400/80 bg-blue-500/5 py-2 rounded-lg border border-blue-500/10">
              Optimal TV Display Mode Enabled
            </div>
          )}
          
          <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-2xl">
            <p className="text-amber-500 text-xs font-bold mb-2">ဒီစာမျက်နှာမှာ id မပေါ်ပါက</p>
            <a href="/home.html" className="text-slate-400 hover:text-white text-xs underline">
              Use Simple HTML Version (Old TV Fix)
            </a>
          </div>

          <div className="text-slate-500 text-xs">
            Telegram: <span className="text-slate-300">@S4ITMM</span>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        body {
          background-color: #0a0f1e;
        }
      `}</style>
    </div>
  )
        }
