'use client'

import { useState, useEffect } from 'react'

export default function HomePage() {
  const [deviceID, setDeviceID] = useState(null)
  const [userInfo, setUserInfo] = useState(null)
  const [status, setStatus] = useState('Checking device access...')
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAndroidTV, setIsAndroidTV] = useState(false)

  // 1. Detect TV/Box/Mobile
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userAgent = navigator.userAgent?.toLowerCase() || ''
      const isTV = userAgent.includes('android') && 
                   (userAgent.includes('tv') || 
                    userAgent.includes('box') ||
                    window.screen.width >= 1280)
      setIsAndroidTV(isTV)
    }
  }, [])

  // 2. Logic: Auto-Approval (7 Days)
  const checkAutoApproval = () => {
    try {
      if (typeof window === 'undefined') return;

      // Get or Create Device ID (Unique per device)
      let id = localStorage.getItem("s4itmm_device_v3")
      if (!id) {
        id = 'S4-' + Math.random().toString(36).substr(2, 6).toUpperCase()
        localStorage.setItem("s4itmm_device_v3", id)
      }
      setDeviceID(id)

      // Get or Create First Join Date (The moment they first open the app)
      let joinDateStr = localStorage.getItem("s4itmm_join_date")
      let isNewUser = false

      if (!joinDateStr) {
        joinDateStr = new Date().toISOString()
        localStorage.setItem("s4itmm_join_date", joinDateStr)
        isNewUser = true
      }

      const joinDate = new Date(joinDateStr)
      const today = new Date()
      
      // Calculate Expiry (7 Days from first run)
      const expiryDate = new Date(joinDate)
      expiryDate.setDate(joinDate.getDate() + 7)

      // Calculate Remaining Days
      const diffTime = expiryDate - today
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      const currentInfo = {
        id: id,
        name: isNewUser ? "Trial User (New)" : "Trial Member",
        expires: expiryDate.toISOString(),
        daysRemaining: diffDays > 0 ? diffDays : 0,
      }

      setUserInfo(currentInfo)

      // Check if trial is over
      if (today > expiryDate) {
        setError({
          title: "Access Expired (သက်တမ်းကုန်ဆုံးပါပြီ)",
          message: "သင်၏ ၇ ရက် အခမဲ့ စမ်းသပ်ကာလ ကုန်ဆုံးသွားပါပြီ။ ဆက်လက်ကြည့်ရှုရန် Admin ကို ဆက်သွယ်ပါ။",
          userInfo: currentInfo
        })
        setIsLoading(false)
      } else {
        setStatus('✅ Access Granted (Trial Active)')
        setTimeout(() => {
          setIsLoading(false)
        }, 2000)
      }

    } catch (e) {
      console.error("Local Storage Error:", e)
      setError({ title: "System Error", message: "Storage Access Denied. Please enable cookies/local storage." })
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Small delay to show brand logo/loading
    const timer = setTimeout(() => {
      checkAutoApproval()
    }, 1200)
    return () => clearTimeout(timer)
  }, [])

  // Helper: Format Date for Display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    })
  }

  // Helper: Format Myanmar Style Date
  const formatMyanmarDate = (dateString) => {
    const date = new Date(dateString)
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
  }

  // Action: Copy Device ID
  const copyDeviceId = () => {
    if (deviceID) {
      const el = document.createElement('textarea');
      el.value = deviceID;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      alert("Device ID Copied to clipboard!");
    }
  }

  // Action: Proceed to app
  const handleEnter = () => {
    window.location.href = '/index.html'; // Adjust this to your content page
  }

  return (
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      textAlign: 'center',
      color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      
      {/* Header Logo */}
      <div style={{ fontSize: '2.8rem', color: '#ef4444', marginBottom: '10px', fontWeight: '900', letterSpacing: '-1px' }}>
        S4ITMM<span style={{ color: '#fff' }}>TV</span>
      </div>

      {isAndroidTV && (
        <div style={{ 
          background: 'rgba(59, 130, 246, 0.15)', 
          border: '1px solid #3b82f6', 
          borderRadius: '30px', 
          padding: '6px 16px', 
          color: '#60a5fa', 
          fontSize: '0.75rem', 
          marginBottom: '20px',
          fontWeight: 'bold'
        }}>
          📺 ANDROID TV OPTIMIZED
        </div>
      )}

      {/* Main Content Area */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '20px' }}>
          <div className="loader"></div>
          <p style={{ marginTop: '20px', color: '#94a3b8', fontSize: '1rem' }}>{status}</p>
        </div>
      ) : error ? (
        <div style={{ 
          background: 'rgba(239, 68, 68, 0.08)', 
          border: '1px solid #ef4444', 
          borderRadius: '20px', 
          padding: '30px', 
          maxWidth: '450px', 
          width: '100%', 
          boxSizing: 'border-box',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
        }}>
          <h3 style={{ color: '#f87171', marginTop: 0, fontSize: '1.4rem' }}>{error.title}</h3>
          <p style={{ fontSize: '0.95rem', color: '#cbd5e1', lineHeight: '1.6', margin: '15px 0' }}>{error.message}</p>
          
          <div style={{ background: 'rgba(0,0,0,0.4)', padding: '15px', borderRadius: '12px', textAlign: 'left' }}>
            <p style={{ margin: '8px 0', fontSize: '0.85rem', color: '#94a3b8' }}>Device ID: <span style={{ color: '#fff', fontWeight: 'bold' }}>{error.userInfo.id}</span></p>
            <p style={{ margin: '8px 0', fontSize: '0.85rem', color: '#94a3b8' }}>Expired On: <span style={{ color: '#f87171', fontWeight: 'bold' }}>{formatDate(error.userInfo.expires)}</span></p>
          </div>

          <button onClick={copyDeviceId} style={{ 
            background: '#3b82f6', 
            color: 'white', 
            border: 'none', 
            padding: '14px', 
            borderRadius: '12px', 
            marginTop: '25px', 
            width: '100%', 
            cursor: 'pointer', 
            fontWeight: 'bold',
            fontSize: '1rem',
            transition: 'transform 0.2s'
          }}>
            📋 Copy ID & Contact Admin
          </button>
        </div>
      ) : (
        <div style={{ 
          background: 'rgba(34, 197, 94, 0.08)', 
          border: '1px solid #22c55e', 
          borderRadius: '20px', 
          padding: '30px', 
          maxWidth: '450px', 
          width: '100%', 
          textAlign: 'left', 
          boxSizing: 'border-box',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
        }}>
          <h3 style={{ color: '#22c55e', textAlign: 'center', marginTop: 0, fontSize: '1.4rem' }}>
            ✅ ၇ ရက် အခမဲ့ စမ်းသပ်ခွင့်
          </h3>
          
          <div style={{ marginTop: '25px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: '#94a3b8' }}>ကျန်ရှိရက်:</span>
              <span style={{ color: '#22c55e', fontWeight: 'bold', fontSize: '1.1rem' }}>{userInfo.daysRemaining} Days</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: '#94a3b8' }}>သက်တမ်းကုန်ရက်:</span>
              <span style={{ color: '#fff', fontWeight: '500' }}>{formatMyanmarDate(userInfo.expires)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Device ID:</span>
              <span style={{ color: '#fff', fontSize: '0.85rem' }}>{userInfo.id}</span>
            </div>
          </div>

          <button 
            onClick={handleEnter}
            style={{ 
              background: 'linear-gradient(to right, #22c55e, #16a34a)', 
              color: 'white', 
              border: 'none', 
              padding: '18px', 
              borderRadius: '14px', 
              marginTop: '30px', 
              width: '100%', 
              cursor: 'pointer', 
              fontWeight: 'bold', 
              fontSize: '1.2rem',
              boxShadow: '0 4px 15px rgba(34, 197, 94, 0.3)'
            }}>
            အခုပဲကြည့်မယ် →
          </button>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: '50px', fontSize: '0.85rem', color: '#64748b' }}>
        <p>Support Telegram: <span style={{ color: '#94a3b8' }}>@S4ITMM</span></p>
      </div>

      <style jsx>{`
        .loader {
          width: 45px;
          height: 45px;
          border: 4px solid rgba(255,255,255,0.05);
          border-top-color: #ef4444;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

        
