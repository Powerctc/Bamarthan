'use client'

import { useState, useEffect } from 'react'

export default function HomePage() {
  const [deviceID, setDeviceID] = useState(null)
  const [userInfo, setUserInfo] = useState(null)
  const [status, setStatus] = useState('စနစ်ကို စတင်နေပါသည်...')
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // API URL နှင့် သက်တမ်းကုန်ရက် သတ်မှတ်ချက်
  const HF_BASE_URL = "https://livesportmm-s4itmmapprover.hf.space"; 
  const DEFAULT_SEASON_PASS = "2026-05-31T23:59:59Z";

  // ၁။ Stable Device ID Generator
  const generateStableID = () => {
    try {
      if (typeof window === 'undefined') return null;
      
      let storedId = localStorage.getItem("fotlive_stable_id");
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const txt = 'FOTLIVE-MOVIES-ID-2026'; // Unique String ပြောင်းလိုက်သည်
      ctx.textBaseline = "top";
      ctx.font = "14px 'Arial'";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "#f60";
      ctx.fillRect(125,1,62,20);
      ctx.fillStyle = "#069";
      ctx.fillText(txt, 2, 15);
      ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
      ctx.fillText(txt, 4, 17);
      
      const b64 = canvas.toDataURL().replace("data:image/png;base64,", "");
      let hash = 0;
      for (let i = 0; i < b64.length; i++) {
        hash = (hash << 5) - hash + b64.charCodeAt(i);
        hash = hash & hash;
      }
      
      const screenInfo = window.screen.width + "x" + window.screen.height;
      const platform = navigator.platform || "unknown";
      const finalRaw = Math.abs(hash).toString() + platform + screenInfo;
      
      let finalHash = 0;
      for (let j = 0; j < finalRaw.length; j++) {
        finalHash = (finalHash << 5) - finalHash + finalRaw.charCodeAt(j);
      }
      const finalID = Math.abs(finalHash).toString().padStart(12, "0").slice(0, 12);

      if (!storedId) {
        localStorage.setItem("fotlive_stable_id", finalID);
      }
      
      setDeviceID(finalID);
      return finalID;
    } catch (e) {
      console.error("ID Generation Error", e);
      return "000000000000";
    }
  }

  const checkAccess = async (id) => {
    try {
      setStatus("ဝင်ရောက်ခွင့်ကို အတည်ပြုနေပါသည်...");
      
      const res = await fetch(HF_BASE_URL + "/approved_users.json?_t=" + Date.now(), {
        cache: "no-store"
      });
      
      if (!res.ok) throw new Error("Server error");
      const approvedUsers = await res.json();
      let user = approvedUsers.find(u => u.id === id);

      if (!user) {
        setStatus("အသုံးပြုသူအသစ်အဖြစ် မှတ်ပုံတင်နေပါသည်...");
        await fetch(HF_BASE_URL + "/add_user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: id,
            expires: DEFAULT_SEASON_PASS,
            name: "Fotlive_User"
          })
        });
        user = { id: id, expires: DEFAULT_SEASON_PASS };
      }

      const today = new Date();
      const expiry = new Date(user.expires);
      const diffTime = expiry.getTime() - today.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (expiry > today) {
        setUserInfo({ id: user.id, expires: user.expires, daysRemaining: daysRemaining });
        setStatus('✅ ဝင်ရောက်ခွင့် အတည်ပြုပြီးပါပြီ!');
        // ၂.၅ စက္ကန့်အကြာတွင် ပင်မစာမျက်နှာသို့ သွားမည်
        setTimeout(() => { window.location.href = '/index.html'; }, 2500);
      } else {
        setError({ title: "Access Expired", message: "သင်၏ သက်တမ်းကုန်ဆုံးသွားပါပြီ။" });
        setIsLoading(false);
      }

    } catch (err) {
      setError({ title: "Error", message: "ဆာဗာနှင့် ချိတ်ဆက်၍မရပါ။" });
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const id = generateStableID();
    if (id) checkAccess(id);
  }, []);

  const formatDate = (ds) => {
    return new Date(ds).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px', background: '#0f172a', color: 'white', textAlign: 'center' }}>
      {/* နာမည်အသစ်သို့ ပြောင်းလဲခြင်း */}
      <h1 style={{ color: '#ef4444', fontSize: '2.5rem', fontWeight: 'bold' }}>Fotlivemovies</h1>
      
      {isLoading && (
        <div style={{ margin: '30px 0' }}>
          <div className="loader" style={{ border: '4px solid #1e293b', borderTop: '4px solid #ef4444', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
          <p style={{ marginTop: '20px', color: '#94a3b8' }}>{status}</p>
        </div>
      )}

      {userInfo && !error && (
        <div style={{ background: '#1e293b', border: '1px solid #22c55e', borderRadius: '15px', padding: '20px', width: '100%', maxWidth: '400px', textAlign: 'left' }}>
          <h3 style={{ color: '#22c55e', textAlign: 'center' }}>✅ အတည်ပြုပြီး</h3>
          <p>Device ID: <b style={{ float: 'right' }}>{userInfo.id}</b></p>
          <p>သက်တမ်းကုန်ရက်: <b style={{ float: 'right' }}>{formatDate(userInfo.expires)}</b></p>
          <p>ကျန်ရှိရက်: <b style={{ float: 'right', color: '#22c55e' }}>{userInfo.daysRemaining} ရက်</b></p>
        </div>
      )}

      {error && (
        <div style={{ background: '#1e293b', border: '1px solid #ef4444', borderRadius: '15px', padding: '20px', width: '100%', maxWidth: '400px' }}>
          <h3 style={{ color: '#f87171' }}>{error.title}</h3>
          <p>{error.message}</p>
          <button onClick={() => window.location.reload()} style={{ width: '100%', padding: '12px', background: '#ef4444', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', marginTop: '10px' }}>Retry</button>
        </div>
      )}

      {/* Special section for old devices */}
      <div className="mt-8 p-4" style={{ 
        background: 'rgba(245, 158, 11, 0.1)', 
        border: '1px solid #f59e0b',
        borderRadius: '8px',
        maxWidth: '500px',
        width: '100%',
        marginTop: '20px'
      }}>
        <h4 style={{ color: '#f59e0b', marginBottom: '10px' }}>ဒီစာမျက်နှာမှာ id မပေါ်ပါက အောက်ပါ Button ကိုနှိပ်ပါ</h4>
        <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '15px' }}>
          If you're seeing the loading screen for too long or experiencing issues,<br />
          <strong>Click the button below to use Static Html</strong>
        </p>
        <a
          href="/home.html"
          style={{
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold',
            width: '100%',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            textDecoration: 'none',
            transition: 'all 0.3s'
          }}
        >
          <i className="fas fa-tv"></i>
          Go to HTML Version (Old Devices)
        </a>
      </div>

      {/* Contact info Updated */}
      <div className="contact mt-8" style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '20px' }}>
        <p>Need access? Contact us:</p>
        <p>📱 Telegram: <a 
          href="tg://resolve?domain=Fotlivemovies" 
          style={{ color: '#60a5fa', textDecoration: 'none' }}
        >
          @Fotlivemovies
        </a></p>
        <p>📧 Email: <a 
          href="mailto:support@fotlivemovies.com" 
          style={{ color: '#60a5fa', textDecoration: 'none' }}
        >
          support@fotlivemovies.com
        </a></p>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
        }
        
