'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

// Configuration
const REDIRECT_DELAY = 5
const HF_BASE_URL = "https://livesportmm-s4itmmapprover.hf.space";
const APPROVED_USERS_URL = `${HF_BASE_URL}/Web/approved_users.json`;
const ADD_USER_API = `${HF_BASE_URL}/add_user`;
const DEFAULT_SEASON_PASS = "2026-12-31T23:59:59Z";

export default function Page() {
  const [deviceID, setDeviceID] = useState(null)
  const [expiryDate, setExpiryDate] = useState(null)
  const [userName, setUserName] = useState(null)
  const [status, setStatus] = useState('loading')
  const [isExpired, setIsExpired] = useState(false)
  const [countdown, setCountdown] = useState(REDIRECT_DELAY)
  const [copied, setCopied] = useState(false)
  const timerRef = useRef(null)

  // ၁။ Device ID Generator (Stable ID)
  const generateFingerprintId = useCallback(() => {
    if (typeof window === 'undefined') return null;
    let id = localStorage.getItem('zetflix_device_id_mob')
    if (id) return id;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = "alphabetic"; ctx.font = "14px Arial";
    ctx.fillText('S4ITMM-MOBILE-2026', 2, 15);
    const b64 = canvas.toDataURL().replace("data:image/png;base64,", "");
    let hash = 0;
    for (let i = 0; i < b64.length; i++) { hash = (hash << 5) - hash + b64.charCodeAt(i); hash |= 0; }
    const platformInfo = navigator.userAgent + screen.width + screen.height;
    let finalHash = hash;
    for (let j = 0; j < platformInfo.length; j++) { finalHash = (finalHash << 5) - finalHash + platformInfo.charCodeAt(j); }
    const finalID = Math.abs(finalHash).toString().padStart(12, "0").slice(0, 12) + "mob";
    localStorage.setItem('zetflix_device_id_mob', finalID);
    return finalID;
  }, [])

  // ၂။ Redirect Logic
  const redirect = (id, expires, name) => {
    localStorage.setItem('zetflix_approved', 'true');
    localStorage.setItem('zetflix_device_id', id);
    localStorage.setItem('zetflix_expiry', expires || '');
    if (name) localStorage.setItem('zetflix_user_name', name);
    window.location.href = '/index.html';
  }

  // ၃။ Access Check (ဦးမောင် ပြင်လိုက်တဲ့ JSON Date ကို အဓိက စစ်ဆေးမည့်အပိုင်း)
  const checkAccess = useCallback(async (id) => {
    try {
      const res = await fetch(`${APPROVED_USERS_URL}?_t=${Date.now()}`, { 
        cache: 'no-store',
        headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
      })
      const users = res.ok ? await res.json() : []
      let user = users.find(u => u.id === id)

      // အကယ်၍ User မရှိသေးရင် Auto Register လုပ်မယ်
      if (!user) {
        const registerRes = await fetch(ADD_USER_API, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, expires: DEFAULT_SEASON_PASS, name: "Mobile_User", type: "phone" })
        });
        if (registerRes.ok) user = { id, expires: DEFAULT_SEASON_PASS, name: "Mobile_User" };
      }

      if (user) {
        setUserName(user.name);
        setExpiryDate(user.expires);

        // --- Date Comparison Engine (ဦးမောင်အတွက် အဓိကပြင်ထားသောအပိုင်း) ---
        const today = new Date();
        today.setHours(0, 0, 0, 0); // ဒီနေ့ မနက် 00:00:00

        // JSON ထဲက Date ကို Parse လုပ်ခြင်း
        const expStr = user.expires;
        const expDate = new Date(expStr);

        // Date Format စစ်ဆေးခြင်း
        const isValidDate = !isNaN(expDate.getTime());

        if (!isValidDate || expDate < today) {
          // Date format မှားနေရင် (သို့) ဒီနေ့ထက် ငယ်နေရင် (Expired)
          setIsExpired(true);
          setStatus('denied');
        } else {
          // Date မှန်ပြီး သက်တမ်းရှိနေရင်
          setIsExpired(false);
          setStatus('approved');
          if (timerRef.current) clearInterval(timerRef.current)
          timerRef.current = setInterval(() => {
            setCountdown(prev => {
              if (prev <= 1) { clearInterval(timerRef.current); redirect(id, user.expires, user.name); return 0; }
              return prev - 1;
            })
          }, 1000)
        }
      } else { setStatus('denied'); }
    } catch (e) { 
      console.error("Critical Error:", e);
      setStatus('denied'); 
    }
  }, [])

  useEffect(() => {
    const id = generateFingerprintId(); setDeviceID(id);
    if (id) checkAccess(id);
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [generateFingerprintId, checkAccess])

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(deviceID);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    }
  }

  // --- UI Loading ---
  if (status === 'loading') {
    return (
      <div className="fixed inset-0 z-[999] bg-[#0f172a] flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-6"></div>
        <h2 className="text-2xl font-black tracking-widest uppercase">FOTMOV TV</h2>
        <p className="text-slate-400 text-xs mt-3 uppercase tracking-widest font-medium">Checking Access...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl relative">
        
        {status === 'approved' ? (
          <div className="text-center relative z-10">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Access Granted</h1>
            <p className="text-slate-400 mb-8">Hello, <span className="text-green-400 font-bold">{userName}</span></p>
            <div className="relative w-32 h-32 mx-auto mb-10">
              <svg className="w-full h-full -rotate-90">
                <circle cx="64" cy="64" r="60" className="stroke-white/10 fill-none" strokeWidth="6" />
                <circle cx="64" cy="64" r="60" className="stroke-green-500 fill-none transition-all duration-1000" strokeWidth="6" 
                  strokeDasharray="377" strokeDashoffset={377 - (377 * (countdown/REDIRECT_DELAY))} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-4xl font-black text-white">{countdown}</span>
            </div>
            <button onClick={() => redirect(deviceID, expiryDate, userName)} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-5 rounded-2xl transition-all shadow-xl shadow-blue-600/20">Enter Now</button>
          </div>
        ) : (
          <div className="text-center relative z-10">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30 text-red-500 flex items-center justify-center">
               <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0-8v4m-9 5h18c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2H3c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2z"></path></svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
              {isExpired ? "Access Expired" : "Unauthorized"}
            </h1>
            <p className="text-slate-400 mb-8 leading-relaxed px-4">
              {isExpired 
                ? "သင်၏ သက်တမ်းကုန်ဆုံးသွားပါပြီ။ ကျေးဇူးပြု၍ သက်တမ်းတိုးပေးပါ။" 
                : "အသုံးပြုရန် ခွင့်ပြုချက် ရယူရန် လိုအပ်ပါသည်။"}
            </p>
            
            <div className="bg-black/40 rounded-3xl p-6 mb-8 border border-white/5 text-left">
              <div className="flex justify-between items-center mb-3 text-[10px] font-black uppercase tracking-widest">
                <span className="text-slate-500">Device Identity</span>
                <span className="text-red-500 bg-red-500/10 px-2 py-1 rounded-md">Status: Expired</span>
              </div>
              <p className="text-blue-400 font-mono text-sm break-all bg-blue-500/5 p-3 rounded-xl border border-blue-500/20">{deviceID}</p>
            </div>

            <div className="space-y-4 mb-8">
              <a href="https://t.me/S4ITMM" target="_blank" className="flex items-center justify-center gap-3 bg-[#0088cc]/10 hover:bg-[#0088cc]/20 text-[#0088cc] py-4 rounded-2xl border border-[#0088cc]/30 transition-all">
                <span className="font-bold">Contact Admin to Renew</span>
              </a>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button onClick={handleCopy} className={`py-4 rounded-2xl font-bold transition-all text-xs uppercase ${copied ? 'bg-green-600 text-white' : 'bg-white/10 text-white border border-white/10'}`}>
                {copied ? "Copied!" : "Copy ID"}
              </button>
              <button onClick={checkAccess.bind(null, deviceID)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all text-xs uppercase shadow-lg shadow-blue-600/20">Retry</button>
            </div>
          </div>
        )}
      </div>

      <footer className="mt-12 text-center opacity-30 text-[9px] text-white uppercase tracking-[0.4em] font-bold">
        S4ITMM Mobile Control v2.1
      </footer>
    </div>
  )
         }
         
