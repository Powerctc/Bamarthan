Trialial််se client'

import { useState, useEffect } from 'react'

export default function HomePage() {
  const [deviceID, setDeviceID] = useState(null)
  const [userInfo, setUserInfo] = useState(null)
  const [status, setStatus] = useState('စနစ်ကို စတင်နေပါသည်...')
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAndroidTV, setIsAndroidTV] = useState(false)

  // မင်းရဲ့ Hugging Face API Link
  const HF_BASE_URL = "https://livesportmm-s4itmmapprover.hf.space"; 

  // 1. မင်းရဲ့ မူရင်း ID Generator Logic
  const initDeviceID = () => {
    try {
      if (typeof window === 'undefined') return null;
      let id = localStorage.getItem("s4itmmdeviceid_12")
      if (!id || id.length !== 12) {
        const raw = (navigator.userAgent || "unknown") + 
                    (window.screen.width || 0) + 
                    (window.screen.height || 0) + 
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
      const fallbackId = Math.random().toString().slice(2, 14)
      setDeviceID(fallbackId)
      return fallbackId
    }
  }

  // 2. Auto-Approval & Access Logic
  const autoRegisterAndCheck = async (id) => {
    try {
      //  Trial သတ်မှတ်ချက်
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 8စမ်းသပ်ကာလconst expiresStr = expiryDate.toISOString();

      setStatus("Device ကို မှတ်ပုံတင်နေပါသည်...")
      
      // Hugging Face JSON ထဲသို့ ID သွားရေးမည်
      await fetch(`${HF_BASE_URL}/add_user`, {
        method: "POST",
        headContent-Typeent-Type": "application/json" },
        body: JSON.stringify({
          id: id,
          expires: expiresStr,
          name: "Auto_Approved_User"
        })
      });

      // ခွင့်ပြုချက်စာရင်းကို ပြန်စစ်မည်
      setStatus("ဝင်ရောက်ခွင့်ကို စစ်ဆေးနေပါသည်...")
      const res = await fetch(`${HF_BASE_URL}/approved_users.json?_t=${Date.now()}`, {
        cache: "no-store"
      })
      
      if (!res.ok) throw new Error("Server communication failed");
      
      const approvedUsers = await res.json()
      const user = approvedUsers.find(u => u.id === id)

      if (!user) {
        throw new Error("Registration error. Please reload.");
      }

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
          message: "သင်၏စမ်းသပ်ကာလ ကုန်ဆုံးသွားပါပြီ။ ဆက်လက်ကြည့်ရှုရန် Admin ကို ဆက်သွယ်ပါ။",
          userInfo: user
        })
        setIsLoading(false)
      } else {
        setStatus('✅ ခွင့်ပြုချက် ရရှိပါပြီ!')
        setTimeout(() => {
          // အောင်မြင်ပါက မူရင်း Home စာမျက်နှာသို့ သွားမည်
          window.location.href = '/index.html'
        }, isAndroidTV ? 4000 : 2000)
      }

    } catch (err) {
      console.error("Logic Error:", err)
      setError({
        title: "ချိတ်ဆက်မှု အမှားအယွင်း",
        message: "ဆာဗာနှင့် ချိတ်ဆက်၍မရပါ။ အင်တာနက်ကို စစ်ဆေးပြီး ပြန်လည်ကြိုးစားပါ။"
      })
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Device အမျိုးအစား စစ်ဆေးခြင်း
    const userAgent = navigator.userAgent.toLowerCase()
    const isTV = userAgent.includes('android') && 
                 (userAgent.includes('tv') || 
                  userAgent.includes('box') ||
                  window.screen.width >= 1280)
    setIsAndroidTV(isTV)

    // စနစ်ကို စတင်ခြင်း
    const id = initDeviceID()
    if (id) autoRegisterAndCheck(id)
  }, [])

  // ရက်စွဲ ပြင်ဆင်မှုများ
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
    alert('Device ID ကို Copy ကူးပြီးပါပြီ!')
  }

  return (
    <div style={{ 
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
      minHeight: '100vh', padding: '20px', background: 'linear-gradient(135deg, #0f172a, #1e293b)', 
      textAlign: 'center', color: 'white', fontFamily: 'sans-serif' 
    }}>
      
      {/* LOGO */}
      <div style={{ fontSize: '2.5rem', color: '#ef4444', marginBottom: '10px', fontWeight: 'bold' }}>
        S4ITMM TV
      </div>

      {isAndroidTV && (
        <div style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6', borderRadius: '20px', padding: '6px 14px', color: '#60a5fa', fontSize: '0.8rem', marginBottom: '20px' }}>
          📺 Android TV/Box Mode
        </div>
      )}

      {/* LOADING */}
      {isLoading && (
        <div style={{ margin: '30px auto' }}>
          <div className="loader"></div>
          <p style={{ marginTop: '20px', color: '#94a3b8' }}>{status}</p>
        </div>
      )}

      {/* SUCCESS */}
      {userInfo && !error && (
        <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e', borderRadius: '15px', padding: '25px', marginTop: '20px', maxWidth: '450px', width: '100%', textAlign: 'left' }}>
          <h3 style={{ color: '#22c55e', textAlign: 'center', marginTop: 0 }}>✅ ဝင်ရောက်ခွင့် ရရှိပါပြီ</h3>
          <div style={{ display: 'grid', gap: '10px', fontSize: '0.9rem' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Device ID:</span><span style={{fontWeight:'bold'}}>{userInfo.id}</span></div>
             <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>သက်တမ်းကုန်ရက်:</span><span>{formatDate(userInfo.expires)}</span></div>
             <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>ကျန်ရှိရက်:</span><span style={{color: '#22c55e', fontWeight:'bold'}}>{userInfo.daysRemaining} Days</span></div>
          </div>
          <p style={{textAlign:'center', color:'#60a5fa', fontSize:'0.75rem', marginTop:'20px'}}>ခေတ္တစောင့်ဆိုင်းပါ။ ပင်မစာမျက်နှာသို့ သွားနေပါသည်...</p>
        </div>
      )}

      {/* ERROR / EXPIRED */}
      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '15px', padding: '25px', marginTop: '20px', maxWidth: '450px', width: '100%', textAlign: 'left' }}>
          <h3 style={{ color: '#f87171', marginTop: 0 }}>{error.title}</h3>
          <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.6' }}>{error.message}</p>
          
          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '15px', margin: '20px 0' }}>
            <p style={{ margin: '5px 0', fontSize: '0.8rem' }}>Device ID: <b>{deviceID}</b></p>
            {error.userInfo && <p style={{ margin: '5px 0', fontSize: '0.8rem' }}>သက်တမ်းကုန်သည့်ရက်: {formatDate(error.userInfo.expires)}</p>}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={copyDeviceId} style={{ flex: 1, background: '#3b82f6', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>📋 Copy ID</button>
            <button onClick={() => window.location.reload()} style={{ flex: 1, background: '#10b981', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>🔄 Retry</button>
          </div>
        </div>
      )}

      {/* REDIRECT BUTTON */}
      <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b', borderRadius: '12px', padding: '20px', maxWidth: '450px', width: '100%', marginTop: '40px' }}>
        <p style={{ color: '#f59e0b', margin: '0 0 15px 0', fontSize: '0.9rem' }}>ဒီစာမျက်နှာမှာ id မပေါ်ပါက သို့မဟုတ် အဆင်မပြေပါက အောက်ပါ Button ကိုနှိပ်ပါ</p>
        <a href="/home.html" style={{ 
          background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', padding: '14px', 
          borderRadius: '10px', fontWeight: 'bold', display: 'block', textDecoration: 'none', fontSize: '1rem' 
        }}>
          HTML Version (Old Devices)
        </a>
      </div>

      <div style={{ marginTop: '40px', color: '#64748b', fontSize: '0.85rem' }}>
        Telegram: <a href="https://t.me/S4ITMM" style={{ color: '#60a5fa', textDecoration: 'none' }}>@S4ITMM</a>
      </div>

      <style jsx>{`
        .loader {
          width: 45px; height: 45px;
          border: 4px solid rgba(255,255,255,0.1);
          border-top-color: #ef4444;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

                  
