'use client'

import { useState, useEffect } from 'react'

export default function HomePage() {
  const [deviceID, setDeviceID] = useState(null)
  const [userInfo, setUserInfo] = useState(null)
  const [status, setStatus] = useState('စနစ်ကို စတင်နေပါသည်...')
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const HF_BASE_URL = "https://livesportmm-s4itmmapprover.hf.space"; 
  
  // ဦးမောင် သတ်မှတ်ချင်သော ရက်စွဲ (ဥပမာ - မေလကုန်)
  const MY_SEASON_EXPIRY = "2026-05-31T23:59:59Z";

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
      return "000000000000";
    }
  }

  const checkAccess = async (id) => {
    try {
      setStatus("ဝင်ရောက်ခွင့်ကို အတည်ပြုနေပါသည်...");
      
      // Force update user information with current expiry date
      await fetch(HF_BASE_URL + "/add_user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: id,
          expires: MY_SEASON_EXPIRY,
          name: "Season_Pass_User"
        })
      });

      const res = await fetch(HF_BASE_URL + "/approved_users.json?_t=" + Date.now(), {
        cache: "no-store"
      });
      
      const approvedUsers = await res.json();
      const user = approvedUsers.find(function(u) { return u.id === id; });

      if (!user) throw new Error("စနစ်အတွင်းသို့ ဝင်ရောက်ရန် အမှားအယွင်းရှိနေပါသည်။");

      const today = new Date();
      const expiry = new Date(MY_SEASON_EXPIRY);
      const diffTime = expiry.getTime() - today.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      setUserInfo({
        id: user.id,
        expires: MY_SEASON_EXPIRY,
        daysRemaining: daysRemaining
      });

      setStatus('✅ ဝင်ရောက်ခွင့် အတည်ပြုပြီးပါပြီ!');
      setTimeout(function() {
        window.location.href = '/index.html';
      }, 3000);

    } catch (err) {
      setError({ 
        title: "ချိတ်ဆက်မှု အမှားအယွင်း", 
        message: "ဆာဗာနှင့် ချိတ်ဆက်၍မရပါ။ အင်တာနက်ကို စစ်ဆေးပြီး ပြန်လည်ကြိုးစားပါ။" 
      });
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const id = initDeviceID();
    if (id) checkAccess(id);
  }, []);

  const formatDate = (ds) => {
    const d = new Date(ds);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div style={{ 
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
      minHeight: '100vh', padding: '20px', background: 'radial-gradient(circle, #1e293b 0%, #0f172a 100%)', 
      color: 'white', textAlign: 'center', fontFamily: 'sans-serif' 
    }}>
      
      <h1 style={{ color: '#ef4444', fontSize: '2.5rem', marginBottom: '5px', fontWeight: 'bold' }}>S4ITMM TV</h1>
      
      <div style={{ 
        background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', 
        padding: '5px 15px', borderRadius: '20px', fontSize: '0.85rem', 
        marginBottom: '20px', color: '#f87171' 
      }}>
        ⚽ Premier League Season Pass Free Trial
      </div>

      {isLoading && (
        <div style={{ margin: '30px 0' }}>
          <div className="loader"></div>
          <p style={{ marginTop: '20px', color: '#94a3b8', fontSize: '1rem' }}>{status}</p>
        </div>
      )}

      {userInfo && !error && (
        <div style={{ 
          background: '#1e293b', border: '1px solid #22c55e', borderRadius: '15px', 
          padding: '25px', width: '100%', maxWidth: '400px', textAlign: 'left', 
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)' 
        }}>
          <h3 style={{ color: '#22c55e', textAlign: 'center', marginTop: 0 }}>✅ စစ်ဆေးမှု အောင်မြင်ပါသည်</h3>
          <div style={{ fontSize: '0.95rem', lineHeight: '1.8' }}>
            <p style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0' }}>
              <span>စက်ပစ္စည်းနံပါတ်:</span> <b style={{ color: '#f1f5f9' }}>{userInfo.id}</b>
            </p>
            <p style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0' }}>
              <span>သက်တမ်းကုန်ရက်:</span> <b style={{ color: '#f1f5f9' }}>{formatDate(userInfo.expires)}</b>
            </p>
            <p style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0' }}>
              <span>ကျန်ရှိသောရက်:</span> <b style={{ color: '#22c55e', fontSize: '1.1rem' }}>{userInfo.daysRemaining} ရက်</b>
            </p>
          </div>
          <p style={{ textAlign: 'center', color: '#60a5fa', fontSize: '0.8rem', marginTop: '20px', borderTop: '1px solid #334155', paddingTop: '10px' }}>
            ခေတ္တစောင့်ဆိုင်းပါ။ ပင်မစာမျက်နှာသို့ အလိုအလျောက် သွားနေပါသည်...
          </p>
        </div>
      )}

      {error && (
        <div style={{ background: '#1e293b', border: '1px solid #ef4444', borderRadius: '15px', padding: '25px', width: '100%', maxWidth: '400px' }}>
          <h3 style={{ color: '#f87171', marginTop: 0 }}>{error.title}</h3>
          <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.6' }}>{error.message}</p>
          <button onClick={() => window.location.reload()} style={{ 
            width: '100%', padding: '12px', background: '#ef4444', border: 'none', 
            borderRadius: '8px', color: 'white', fontWeight: 'bold', marginTop: '15px', cursor: 'pointer' 
          }}>
            ပြန်လည်ကြိုးစားမည်
          </button>
        </div>
      )}

      {/* Legacy Support Section - ရှင်းလင်းသော ညွှန်ကြားချက်များ */}
      <div style={{ 
        background: 'rgba(245, 158, 11, 0.05)', border: '1px dashed #f59e0b', 
        borderRadius: '15px', padding: '20px', maxWidth: '420px', width: '100%', marginTop: '40px' 
      }}>
        <h4 style={{ color: '#f59e0b', marginTop: 0, marginBottom: '10px', fontSize: '1rem' }}>⚠️ အဆင်မပြေမှုရှိပါက ဖတ်ရန်</h4>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.6', marginBottom: '15px', textAlign: 'justify' }}>
          ဤစာမျက်နှာတွင် အကြာကြီး ရပ်တန့်နေပါက သို့မဟုတ် Android Version နိမ့်သော Smart TV / TV Box များ အသုံးပြုနေပါက အောက်ပါ "HTML Version" ခလုတ်ကို နှိပ်၍ အသုံးပြုနိုင်ပါသည်။
        </p>
        <a href="/home.html" style={{ 
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white', 
          padding: '14px', borderRadius: '10px', fontWeight: 'bold', display: 'block', 
          textDecoration: 'none', fontSize: '1rem', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)' 
        }}>
          HTML Version ဖြင့် ဝင်ရောက်ရန်
        </a>
      </div>

      <div style={{ marginTop: '40px', color: '#475569', fontSize: '0.8rem' }}>
        Telegram Support: <a href="https://t.me/S4ITMM" style={{ color: '#60a5fa', textDecoration: 'none' }}>@S4ITMM</a>
      </div>

      <style jsx>{`
        .loader { 
          width: 45px; height: 45px; border: 4px solid #334155; 
          border-top-color: #ef4444; border-radius: 50%; 
          animation: spin 1s linear infinite; margin: 0 auto; 
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

