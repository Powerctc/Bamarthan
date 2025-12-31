'use client'

import { useState, useEffect } from 'react'

export default function HomePage() {
  const [deviceID, setDeviceID] = useState(null)
  const [userInfo, setUserInfo] = useState(null)
  const [status, setStatus] = useState('Checking device access...')
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAndroidTV, setIsAndroidTV] = useState(false)

  // 1. YOUR ORIGINAL STYLE: Device ID Generator
  const initDeviceID = () => {
    try {
      let id = localStorage.getItem("s4itmmdeviceid_12")
      if (!id || id.length !== 12) {
        const raw = (navigator.userAgent || "unknown") + 
                    (screen.width || 0) + 
                    (screen.height || 0) + 
                    Date.now() + 
                    Math.random()
        let hash = 0
        for (let i = 0; i < raw.length; i++) {
          hash = (hash << 5) - hash + raw.charCodeAt(i)
        }
        id = Math.abs(hash).toString().padStart(12, "0").slice(0, 12)
        localStorage.setItem("s4itmmdeviceid_12", id)
      }
      setDeviceID(id)
      return id
    } catch (e) {
      const id = Math.random().toString().slice(2, 14)
      setDeviceID(id)
      return id
    }
  }

  // 2. YOUR ORIGINAL STYLE: Detection
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase()
    const isTV = userAgent.includes('android') && 
                 (userAgent.includes('tv') || 
                  userAgent.includes('box') ||
                  screen.width >= 1280)
    setIsAndroidTV(isTV)

    const id = initDeviceID()
    checkAccess(id)
  }, [])

  // 3. COMBINED LOGIC: JSON Check + Auto-Approval
  const checkAccess = async (id) => {
    try {
      // Step A: Check your hosted JSON first
      const res = await fetch("https://m-sport-download.static.hf.space/approved_users.json?_t=" + Date.now(), {
        cache: "no-store"
      })
      
      let approvedUsers = []
      if (res.ok) {
        approvedUsers = await res.json()
      }
      
      const officialUser = approvedUsers.find(u => u.id === id)

      if (officialUser) {
        // User is officially in your JSON list
        validateUser(officialUser)
      } else {
        // Step B: AUTO-APPROVAL LOGIC (Trial)
        let joinDateStr = localStorage.getItem("s4itmm_trial_start")
        if (!joinDateStr) {
          joinDateStr = new Date().toISOString()
          localStorage.setItem("s4itmm_trial_start", joinDateStr)
        }

        const expiryDate = new Date(joinDateStr)
        expiryDate.setDate(expiryDate.getDate() + 7) // 7 DAY TRIAL

        const trialUser = {
          id: id,
          name: 'Trial User',
          expires: expiryDate.toISOString()
        }
        validateUser(trialUser)
      }
    } catch (err) {
      console.error("Fetch error, falling back to local trial:", err)
      // Fallback if JSON fetch fails
      const joinDateStr = localStorage.getItem("s4itmm_trial_start") || new Date().toISOString()
      const expiryDate = new Date(joinDateStr)
      expiryDate.setDate(expiryDate.getDate() + 7)
      validateUser({ id, name: 'Offline Trial', expires: expiryDate.toISOString() })
    }
  }

  const validateUser = (user) => {
    const today = new Date()
    const expiry = new Date(user.expires)
    const diffTime = expiry - today
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    setUserInfo({
      ...user,
      daysRemaining: daysRemaining > 0 ? daysRemaining : 0
    })

    if (expiry < today) {
      setError({
        title: "Access Expired (သက်တမ်းကုန်ဆုံးပါပြီ)",
        message: "သင်၏ ၇ ရက် အခမဲ့ စမ်းသပ်ကာလ ကုန်ဆုံးသွားပါပြီ။ ဆက်လက်ကြည့်ရှုရန် Admin ကို ဆက်သွယ်ပါ။",
        userInfo: user
      })
      setIsLoading(false)
    } else {
      setStatus('✅ Access granted!')
      setTimeout(() => {
        window.location.href = '/index.html'
      }, isAndroidTV ? 5000 : 2000)
    }
  }

  // YOUR ORIGINAL STYLE: Formatters
  const formatDate = (ds) => new Date(ds).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const formatMyanmarDate = (ds) => {
    const d = new Date(ds);
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
  }

  const copyDeviceId = () => {
    const textArea = document.createElement('textarea')
    textArea.value = deviceID
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    alert('Device ID copied to clipboard!')
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4" 
         style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', textAlign: 'center', color: 'white' }}>
      
      {/* YOUR ORIGINAL LOGO */}
      <div style={{ fontSize: '2.5rem', color: '#ef4444', marginBottom: '20px', fontWeight: 'bold' }}>
        S4ITMM TV
      </div>

      {isAndroidTV && (
        <div style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6', borderRadius: '20px', padding: '8px 16px', color: '#60a5fa', fontSize: '0.9rem', marginBottom: '15px' }}>
          📺 Android TV/Box Mode
        </div>
      )}

      {isLoading && (
        <div style={{ width: '50px', height: '50px', border: '5px solid rgba(255,255,255,0.1)', borderRadius: '50%', borderTopColor: '#ef4444', animation: 'spin 1s linear infinite' }}></div>
      )}

      {userInfo && !error && (
        <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e', borderRadius: '12px', padding: '20px', marginTop: '20px', maxWidth: '500px', width: '100%', textAlign: 'left' }}>
          <h3 style={{ color: '#22c55e', marginTop: 0, marginBottom: '15px', textAlign: 'center' }}>✅ Access Approved</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>User ID:</span><span style={{fontWeight:'bold'}}>{userInfo.id}</span></div>
             <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Expiry Date:</span><span>{formatDate(userInfo.expires)}</span></div>
             <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Days Left:</span><span style={{color: '#22c55e'}}>{userInfo.daysRemaining} days</span></div>
             <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>သက်တမ်းကုန်ရက်:</span><span>{formatMyanmarDate(userInfo.expires)}</span></div>
          </div>
          <p style={{textAlign:'center', color:'#60a5fa', fontSize:'0.8rem', marginTop:'15px'}}>Redirecting to main page...</p>
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '12px', padding: '20px', marginTop: '20px', maxWidth: '500px', width: '100%', textAlign: 'left' }}>
          <h3 style={{ color: '#f87171', marginTop: 0 }}>{error.title}</h3>
          <p style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>{error.message}</p>
          <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '15px', margin: '15px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize:'0.8rem' }}><span>Device ID:</span><span>{error.userInfo.id}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize:'0.8rem' }}><span>Expired:</span><span>{formatDate(error.userInfo.expires)}</span></div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={copyDeviceId} style={{ flex:1, background: '#3b82f6', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer' }}>📋 Copy ID</button>
            <button onClick={() => window.location.reload()} style={{ flex:1, background: '#10b981', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer' }}>🔄 Retry</button>
          </div>
        </div>
      )}

      {!userInfo && !error && <div style={{ marginTop: '20px', color: '#cbd5e1' }}>{status}</div>}

      {/* YOUR ORIGINAL: Static Button Section */}
      <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b', borderRadius: '8px', padding: '15px', maxWidth: '500px', width: '100%', marginTop: '30px' }}>
        <h4 style={{ color: '#f59e0b', margin: '0 0 10px 0' }}>ဒီစာမျက်နှာမှာ id မပေါ်ပါကအောက်ပါ Button ကိုနှိပ်ပါ</h4>
        <a href="/home.html" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', padding: '12px', borderRadius: '8px', fontWeight: 'bold', display: 'block', textDecoration: 'none' }}>
          Go to HTML Version (Old Devices)
        </a>
      </div>

      <div style={{ marginTop: '30px', color: '#94a3b8', fontSize: '0.8rem' }}>
        Telegram: <a href="tg://resolve?domain=S4ITMM" style={{ color: '#60a5fa' }}>@S4ITMM</a>
      </div>

      <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

