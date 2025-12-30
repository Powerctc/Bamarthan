idt'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import './globals.css'

export default function HomePage() {
  const router = useRouter()

  const [deviceID, setDeviceID] = useState('')
  const [userInfo, setUserInfo] = useState(null)
  const [status, setStatus] = useState('Checking device access...')
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAndroidTV, setIsAndroidTV] = useState(false)

  /* =============================
     ANDROID TV DETECT
  ============================= */
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase()
    const tv =
      ua.includes('android') &&
      (ua.includes('tv') ||
        ua.includes('box') ||
        ua.includes('smart-tv') ||
        screen.width >= 1280)

    setIsAndroidTV(tv)
  }, [])

  /* =============================
     DEVICE ID
  ============================= */
  const generateDeviceID = () => {
    let id = localStorage.getItem('s4itmmdeviceid_12')

    if (!id || id.length !== 12) {
      const raw =
        navigator.userAgent +
        screen.width +
        screen.height +
        Date.now() +
        Math.random()

      let hash = 0
      for (let i = 0; i < raw.length; i++) {
        hash = (hash << 5) - hash + raw.charCodeAt(i)
        hash |= 0
      }

      id = Math.abs(hash).toString().padStart(12, '0').slice(0, 12)
      localStorage.setItem('s4itmmdeviceid_12', id)
    }

    setDeviceID(id)
    return id
  }

  /* =============================
     CHECK ACCESS
  ============================= */
  const checkAccess = async (id) => {
    try {
      // 1️⃣ READ STATIC JSON
      const res = await fetch("/api/users?_t=' +
          Date.now(),
        { cache: 'no-store' }
      )

      if (res.ok) {
        const list = await res.json()
        const user = list.find((u) => u.id === id)

        if (user) {
          const today = new Date()
          const expiry = new Date(user.expires)
          const days = Math.max(
            0,
            Math.ceil((expiry - today) / 86400000)
          )

          if (expiry < today) {
            setError({
              title: 'Access Expired',
              message: `Expired on ${formatDate(user.expires)}`
            })
            setIsLoading(false)
            return
          }

          setUserInfo({
            id: user.id,
            name: user.name || 'N/A',
            expires: user.expires,
            daysRemaining: days
          })

          setStatus('Access granted')

          setTimeout(
            () => router.push('/index.html'),
            isAndroidTV ? 5000 : 1000
          )
          return
        }
      }

      // 2️⃣ AUTO APPROVE
      setStatus('Requesting auto approval...')
      const approve = await fetch(`/api/approve?id=${id}id
      const result = await approve.json()

      if (result?.status === 'success') {
        setStatus('Approved! Reloading...')
        setTimeout(() => location.reload(), 3000)
        return
      }

      setError({
        title: 'Approval Required',
        message: result?.msg || 'Contact admin'
      })
      setIsLoading(false)
    } catch (e) {
      setError({
        title: 'Network Error',
        message: 'Unable to verify access'
      })
      setIsLoading(false)
    }
  }

  /* =============================
     INIT
  ============================= */
  useEffect(() => {
    const id = generateDeviceID()
    checkAccess(id)
  }, [])

  /* =============================
     HELPERS
  ============================= */
  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

  const formatMMDate = (d) => {
    const date = new Date(d)
    return `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  const copyID = () => {
    navigator.clipboard.writeText(deviceID)
    alert('Device ID copied')
  }

  const retry = () => {
    setError(null)
    setUserInfo(null)
    setIsLoading(true)
    const id = generateDeviceID()
    checkAccess(id)
  }

  /* =============================
     UI
  ============================= */
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-slate-900 to-slate-800 text-center text-white">

      <h1 className="text-4xl text-red-500 mb-4">🎬 S4ITMM TV</h1>

      {isAndroidTV && (
        <div className="mb-4 px-4 py-2 rounded-full bg-blue-500/20 border border-blue-400 text-blue-300">
          📺 Android TV Mode
        </div>
      )}

      {isLoading && (
        <div className="w-12 h-12 border-4 border-white/30 border-t-red-500 rounded-full animate-spin" />
      )}

      {userInfo && !error && (
        <div className="mt-6 p-5 rounded-xl bg-green-500/10 border border-green-500 w-full max-w-md text-left">
          <h3 className="text-center text-green-400 mb-4">
            ✅ Access Approved
          </h3>

          <Info label="User ID" value={userInfo.id} />
          <Info label="Name" value={userInfo.name} />
          <Info label="Expiry" value={formatDate(userInfo.expires)} />
          <Info label="Days Left" value={`${userInfo.daysRemaining} days`} />
          <Info label="သက်တမ်းကုန်ဆုံး" value={formatMMDate(userInfo.expires)} />

          {isAndroidTV && (
            <p className="text-center text-blue-400 mt-3">
              Redirecting in 5 seconds…
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="mt-6 p-5 rounded-xl bg-red-500/10 border border-red-500 w-full max-w-md">
          <h3 className="text-red-400">{error.title}</h3>
          <p className="text-slate-300 mt-2">{error.message}</p>

          <div className="flex gap-3 mt-4 justify-center">
            <button onClick={copyID} className="btn-blue">
              Copy ID
            </button>
            <button onClick={retry} className="btn-green">
              Retry
            </button>
          </div>
        </div>
      )}

      <div className="mt-8 p-4 border border-yellow-400/50 bg-yellow-400/10 rounded-lg">
        <p className="text-yellow-400 mb-2">
          ID မပေါ်ပါက
        </p>
        <a href="/home.html" className="btn-yellow">
          Old HTML Version
        </a>
      </div>

      <p className="mt-8 text-slate-400 text-sm">
        Telegram: <a className="text-blue-400" href="tg://resolve?domain=S4ITMM">@S4ITMM</a>
      </p>
    </div>
  )
}

/* =============================
   SMALL COMPONENT
============================= */
function Info({ label, value }) {
  return (
    <div className="flex justify-between mb-2">
      <span className="text-slate-400">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
        }
