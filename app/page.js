'use client'

import { useState, useEffect } from 'react'

export default function HomePage() {
  const [deviceID, setDeviceID] = useState(null)
  const [userInfo, setUserInfo] = useState(null)
  const [status, setStatus] = useState('စနစ်ကို စတင်နေပါသည်...')
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAndroidTV, setIsAndroidTV] = useState(false)

  // ဦးမောင်ရဲ့ Hugging Face API Link
  const HF_BASE_URL = "https://livesportmm-s4itmmapprover.hf.space"; 

  // သတ်မှတ်ထားသော သက်တမ်းကုန်ဆုံးရက် (ရာသီအကုန် - ၂၀၂၆ မတ်လ ၃၁)
  const FIXED_EXPIRY_DATE = "2026-03-31T23:59:59Z";

  // 1. Device ID ထုတ်လုပ်ခြင်း Logic
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
      setStatus("စက်ပစ္စည်းကို စစ်ဆေးနေပါသည်...")
      
      // Hugging Face JSON ထဲသို့ ID သွားရေးမည် (Fixed Date ဖြင့်)
      // မှတ်ချက် - User ရှိပြီးသားဆိုရင် API က ပြန်မရေးတော့ဘဲ skip ပါလိမ့်မယ်
      await fetch(`${HF_BASE_URL}/add_user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: id,
          expires: FIXED_EXPIRY_DATE,
          name: "Season_Pass_User"
        })
      });

      // ခွင့်ပြုချက်စာရင်းကို ပြန်စစ်မည်
      setStatus("ဝင်ရောက်ခွင့်ကို အတည်ပြုနေပါသည်...")
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
      
      // ရက်ကျန်တွက်ချက်ခြင်း
      const diffTime = expiry - today
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      setUserInfo({
        ...user,
        daysRemaining: daysRemaining > 0 ? daysRemaining : 0
      })

      // သက်တမ်းကုန်မကုန်စစ်ဆေးခြင်း
      if (expiry < today) {
        setError({
          title: "Season Pass Expired",
          message: "Premier League ရာသီကုန် စမ်းသပ်ကာလ ကုန်ဆုံးသွားပါပြီ။",
          userInfo: user
        })
        setIsLoading(false)
      } else {
        setStatus('✅ ဝင်ရောက်ခွင့် ရရှိပါပြီ!')
        setTimeout(() => {
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
    const userAgent = navigator.userAgent.toLowerCase()
    const isTV = userAgent.includes('android') && 
                 (userAgent.includes('tv') || 
                  userAgent.includes('box') ||
                  window.screen.width >= 1280)
    setIsAndroidTV(isTV)

    const id = initDeviceID()
    if (id) autoRegisterAndCheck(id)
  }, [])

  const formatDate = (ds) => new Date(ds).toLocaleDateString('en-US', { 
    year: 'numeric', month: 'long', day: 'numeric' 
  })

  const copyDeviceId = () => {
    if (!deviceID) return;
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
      
      <div style={{ fontSize: '2.5rem', color: '#ef4444', marginBottom: '10px', fontWeight: 'bold' }}>
        S4ITMM TV
      </div>

      <div style={{ 
        background: 'rgba(239, 68, 68, 0.1)', 
        border: '1px solid #ef4444', 
        padding: '5px 15px', 
        borderRadius: '20px', 
        fontSize: '0.8rem', 
        marginBottom: '20px',
        color: '#f87171'
      }}>
        ⚽ Premier League Season Pass Free Trial
      </div>

      {isLoading && (
        <div style={{ margin: '30px auto' }}>
          <div className="loader"></div>
          <p style={{ marginTop: '20px', color: '#94a3b8' }}>{status}</p>
        </div>
      )}

      {userInfo && !error && (
        <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e', borderRadius: '15px', padding: '25px', marginTop: '20px', maxWidth: '450px', width: '100%', textAlign: 'left' }}>
          <h3 style={{ color: '#22c55e', textAlign: 'center', marginTop: 0 }}>✅ စမ်းသပ်ခွင့် ရရှိပါပြီ</h3>
          <div style={{ display: 'grid', gap: '10px', fontSize: '0.9rem' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Device ID:</span><span style={{fontWeight:'bold'}}>{userInfo.id}</span></div>
             <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>ရာသီကုန်ဆုံးရက်:</span><span>{formatDate(userInfo.expires)}</span></div>
             <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>ကျန်ရှိရက်:</span><span style={{color: '#22c55e', fontWeight:'bold'}}>{userInfo.daysRemaining} ရက်</span></div>
          </div>
          <p style={{textAlign:'center', color:'#60a5fa', fontSize:'0.75rem', marginTop:'20px'}}>ခေတ္တစောင့်ဆိုင်းပါ။ ပင်မစာမျက်နှာသို့ သွားနေပါသည်...</p>
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '15px', padding: '25px', marginTop: '20px', maxWidth: '450px', width: '100%', textAlign: 'left' }}>
          <h3 style={{ color: '#f87171', marginTop: 0 }}>{error.title}</h3>
          <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.6' }}>{error.message}</p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button onClick={copyDeviceId} style={{ flex: 1, background: '#3b82f6', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer' }}>Copy ID</button>
            <button onClick={() => window.location.reload()} style={{ flex: 1, background: '#10b981', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer' }}>Retry</button>
          </div>
        </div>
      )}

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
