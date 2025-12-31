'use client'

import { useState, useEffect } from 'react'

export default function HomePage() {
  const [deviceID, setDeviceID] = useState(null)
  const [userInfo, setUserInfo] = useState(null)
  const [status, setStatus] = useState('စနစ်ကို စတင်နေပါသည်...')
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // ဦးမောင်ရဲ့ Hugging Face API Link
  const HF_BASE_URL = "https://livesportmm-s4itmmapprover.hf.space"; 

  // သတ်မှတ်ထားသော သက်တမ်းကုန်ဆုံးရက် (ရာသီအကုန် - ၂၀၂၆ မတ်လ ၃၁)
  const SEASON_EXPIRY = "2026-03-31T23:59:59Z";

  // 1. Device ID ထုတ်လုပ်ခြင်း
  const initDeviceID = () => {
    try {
      if (typeof window === 'undefined') return null;
      let id = localStorage.getItem("s4itmmdeviceid_12")
      if (!id || id.length !== 12) {
        const raw = (navigator.userAgent || "unknown") + Date.now() + Math.random();
        let hash = 0;
        for (let i = 0; i < raw.length; i++) {
          hash = (hash << 5) - hash + raw.charCodeAt(i);
        }
        id = Math.abs(hash).toString().padStart(12, "0").slice(0, 12);
        localStorage.setItem("s4itmmdeviceid_12", id);
      }
      setDeviceID(id);
      return id;
    } catch (e) {
      const fallbackId = Math.random().toString().slice(2, 14);
      setDeviceID(fallbackId);
      return fallbackId;
    }
  }

  // 2. Register & Check Logic
  const checkAccess = async (id) => {
    try {
      setStatus("ဝင်ရောက်ခွင့်ကို စစ်ဆေးနေပါသည်...")
      
      // ပထမဆုံး အသုံးပြုသူအသစ်ဖြစ်ပါက Register လုပ်မည်
      await fetch(`${HF_BASE_URL}/add_user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: id,
          expires: SEASON_EXPIRY,
          name: "Season_Pass_User"
        })
      });

      // API ထံမှ data ကို ပြန်ဖတ်မည်
      const res = await fetch(`${HF_BASE_URL}/approved_users.json?_t=${Date.now()}`, {
        cache: "no-store"
      });
      
      if (!res.ok) throw new Error("Server communication failed");
      
      const approvedUsers = await res.json();
      const user = approvedUsers.find(u => u.id === id);

      if (!user) throw new Error("Registration failed");

      const today = new Date();
      const expiry = new Date(user.expires);
      const diffTime = expiry - today;
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // အကယ်၍ Expiry က အနာဂတ်မှာရှိရင် Error မပြရပါ
      if (expiry > today) {
        setUserInfo({
          ...user,
          daysRemaining: daysRemaining
        });
        setStatus('✅ ဝင်ရောက်ခွင့် ရရှိပါပြီ!');
        setTimeout(() => {
          window.location.href = '/index.html';
        }, 2000);
      } else {
        setError({
          title: "သက်တမ်းကုန်ဆုံးပါပြီ",
          message: "Premier League ရာသီကုန် စမ်းသပ်ကာလ ကုန်ဆုံးသွားပါပြီ။",
          userInfo: user
        });
        setIsLoading(false);
      }

    } catch (err) {
      setError({
        title: "ချိတ်ဆက်မှု အမှား",
        message: "Server နှင့် ချိတ်ဆက်၍မရပါ။ အင်တာနက်ကို စစ်ဆေးပါ။"
      });
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const id = initDeviceID();
    if (id) checkAccess(id);
  }, []);

  const formatDate = (ds) => new Date(ds).toLocaleDateString('en-GB', { 
    day: 'numeric', month: 'short', year: 'numeric' 
  });

  return (
    <div style={{ 
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
      minHeight: '100vh', padding: '20px', background: '#0f172a', color: 'white', fontFamily: 'sans-serif' 
    }}>
      <h1 style={{ color: '#ef4444', marginBottom: '5px' }}>S4ITMM TV</h1>
      <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '30px' }}>Season Pass Mode</p>

      {isLoading && (
        <div style={{ textAlign: 'center' }}>
          <div className="loader"></div>
          <p style={{ marginTop: '20px', color: '#94a3b8' }}>{status}</p>
        </div>
      )}

      {userInfo && !error && (
        <div style={{ background: '#1e293b', border: '1px solid #22c55e', borderRadius: '15px', padding: '20px', width: '100%', maxWidth: '400px' }}>
          <h3 style={{ color: '#22c55e', marginTop: 0 }}>✅ အောင်မြင်ပါသည်</h3>
          <p style={{ fontSize: '0.85rem', margin: '5px 0' }}>Device ID: <b>{userInfo.id}</b></p>
          <p style={{ fontSize: '0.85rem', margin: '5px 0' }}>Exp: <b>{formatDate(userInfo.expires)}</b></p>
          <p style={{ fontSize: '0.85rem', margin: '5px 0' }}>ကျန်ရှိရက်: <b style={{ color: '#22c55e' }}>{userInfo.daysRemaining} ရက်</b></p>
        </div>
      )}

      {error && (
        <div style={{ background: '#1e293b', border: '1px solid #ef4444', borderRadius: '15px', padding: '20px', width: '100%', maxWidth: '400px' }}>
          <h3 style={{ color: '#f87171', marginTop: 0 }}>{error.title}</h3>
          <p style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>{error.message}</p>
          <button onClick={() => window.location.reload()} style={{ width: '100%', padding: '10px', background: '#ef4444', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', marginTop: '15px', cursor: 'pointer' }}>ပြန်လည်ကြိုးစားမည်</button>
        </div>
      )}

      <style jsx>{`
        .loader { width: 40px; height: 40px; border: 4px solid #334155; border-top-color: #ef4444; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

      
