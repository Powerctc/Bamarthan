'use client'

import { useState, useEffect } from 'react'

export default function HomePage() {
  const [deviceID, setDeviceID] = useState(null)
  const [userInfo, setUserInfo] = useState(null)
  const [status, setStatus] = useState('စနစ်ကို စတင်နေပါသည်...')
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const HF_BASE_URL = "https://livesportmm-s4itmmapprover.hf.space"; 
  const SEASON_EXPIRY = "2026-05-31";

  // 1. Device ID Generator
  const initDeviceID = () => {
    try {
      if (typeof window === 'undefined') return null;
      let id = localStorage.getItem("s4itmmdeviceid_12");
      if (!id || id.length !== 12) {
        const raw = (navigator.userAgent || "unknown") + Date.now().toString() + Math.random().toString();
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
      const fallbackId = "0000" + Math.floor(Math.random() * 100000000);
      setDeviceID(fallbackId);
      return fallbackId;
    }
  }

  // 2. Access Logic
  const checkAccess = async (id) => {
    try {
      setStatus("ဝင်ရောက်ခွင့်ကို စစ်ဆေးနေပါသည်...");
      
      // Register New User
      await fetch(HF_BASE_URL + "/add_user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: id,
          expires: SEASON_EXPIRY,
          name: "Season_Pass_User"
        })
      });

      // Fetch User List
      const res = await fetch(HF_BASE_URL + "/approved_users.json?_t=" + Date.now(), {
        cache: "no-store"
      });
      
      if (!res.ok) throw new Error("Server communication failed");
      
      const approvedUsers = await res.json();
      const user = approvedUsers.find(function(u) { return u.id === id; });

      if (!user) throw new Error("Registration failed");

      const today = new Date();
      const expiry = new Date(user.expires);
      const diffTime = expiry.getTime() - today.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (expiry > today) {
        setUserInfo({
          id: user.id,
          expires: user.expires,
          daysRemaining: daysRemaining
        });
        setStatus('✅ ဝင်ရောက်ခွင့် ရရှိပါပြီ!');
        setTimeout(function() {
          window.location.href = '/index.html';
        }, 3000);
      } else {
        setError({
          title: "Access Expired",
          message: "စမ်းသပ်ကာလ ကုန်ဆုံးသွားပါပြီ။"
        });
        setIsLoading(false);
      }

    } catch (err) {
      setError({
        title: "Connection Error",
        message: "ဆာဗာနှင့် ချိတ်ဆက်၍မရပါ။ အင်တာနက် စစ်ဆေးပါ။"
      });
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const id = initDeviceID();
    if (id) checkAccess(id);
  }, []);

  return (
    <div style={{ 
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
      minHeight: '100vh', padding: '20px', background: '#0f172a', color: 'white', textAlign: 'center' 
    }}>
      <h1 style={{ color: '#ef4444', marginBottom: '10px' }}>S4ITMM TV</h1>
      
      <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: '5px 15px', borderRadius: '20px', fontSize: '0.8rem', marginBottom: '20px', color: '#f87171' }}>
        ⚽ Premier League Season Pass
      </div>

      {isLoading && (
        <div>
          <div className="loader"></div>
          <p style={{ marginTop: '20px', color: '#94a3b8' }}>{status}</p>
        </div>
      )}

      {userInfo && !error && (
        <div style={{ background: '#1e293b', border: '1px solid #22c55e', borderRadius: '15px', padding: '20px', width: '100%', maxWidth: '400px', textAlign: 'left' }}>
          <p>Device ID: <b style={{ float: 'right' }}>{userInfo.id}</b></p>
          <p>ကျန်ရှိရက်: <b style={{ float: 'right', color: '#22c55e' }}>{userInfo.daysRemaining} ရက်</b></p>
          <p style={{ textAlign: 'center', color: '#60a5fa', fontSize: '0.75rem', marginTop: '15px' }}>ပင်မစာမျက်နှာသို့ သွားနေပါသည်...</p>
        </div>
      )}

      {error && (
        <div style={{ background: '#1e293b', border: '1px solid #ef4444', borderRadius: '15px', padding: '20px', width: '100%', maxWidth: '400px' }}>
          <h3 style={{ color: '#f87171' }}>{error.title}</h3>
          <p style={{ fontSize: '0.9rem' }}>{error.message}</p>
          <button onClick={function() { window.location.reload(); }} style={{ width: '100%', padding: '12px', background: '#ef4444', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', marginTop: '10px' }}>Retry</button>
        </div>
      )}

      <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b', borderRadius: '12px', padding: '20px', maxWidth: '400px', width: '100%', marginTop: '30px' }}>
        <p style={{ color: '#f59e0b', margin: '0 0 15px 0', fontSize: '0.85rem' }}>အဆင်မပြေပါက သို့မဟုတ် Old Device များအတွက် အောက်ပါခလုတ်ကို နှိပ်ပါ</p>
        <a href="/home.html" style={{ background: '#f59e0b', color: 'white', padding: '12px', borderRadius: '8px', display: 'block', textDecoration: 'none', fontWeight: 'bold' }}>HTML Version</a>
      </div>

      <style jsx>{`
        .loader { width: 40px; height: 40px; border: 4px solid #334155; border-top-color: #ef4444; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

        
