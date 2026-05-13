'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

// Configuration
const REDIRECT_DELAY = 5
const HF_BASE_URL = "https://livesportmm-s4itmmapprover.hf.space";
const APPROVED_USERS_URL = `${HF_BASE_URL}/Web/approved_users.json`;
const ADD_USER_API = `${HF_BASE_URL}/add_user`;
const DEFAULT_SEASON_PASS = "2026-12-31T23:59:59Z";

// Web Version Storage Keys
const ID_KEY = 'zetflix_device_id_web'; // Mobile နဲ့ မရောအောင် _web ပြောင်းထားတယ်
const APPROVED_KEY = 'zetflix_approved';

export default function Page() {
  const [deviceID, setDeviceID] = useState(null)
  const [expiryDate, setExpiryDate] = useState(null)
  const [userName, setUserName] = useState(null)
  const [status, setStatus] = useState('loading')
  const [isExpired, setIsExpired] = useState(false)
  const [countdown, setCountdown] = useState(REDIRECT_DELAY)
  const [copied, setCopied] = useState(false)
  const timerRef = useRef(null)

  // ၁။ Web-Specific Fingerprint Generator
  const generateFingerprintId = useCallback(() => {
    if (typeof window === 'undefined') return null;
    
    let id = localStorage.getItem(ID_KEY)
    if (id) return id;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = "alphabetic"; ctx.font = "14px Arial";
    // Web version အတွက် unique identifier ပြောင်းလိုက်တယ်
    ctx.fillText('S4ITMM-WEB-SURF-2026', 2, 15);
    
    const b64 = canvas.toDataURL().replace("data:image/png;base64,", "");
    let hash = 0;
    for (let i = 0; i < b64.length; i++) { hash = (hash << 5) - hash + b64.charCodeAt(i); hash |= 0; }
    
    const platformInfo = navigator.userAgent + screen.width + screen.height + navigator.language;
    let finalHash = hash;
    for (let j = 0; j < platformInfo.length; j++) { finalHash = (finalHash << 5) - finalHash + platformInfo.charCodeAt(j); }
    
    const finalID = Math.abs(finalHash).toString().padStart(12, "0").slice(0, 12) + "web";
    localStorage.setItem(ID_KEY, finalID);
    return finalID;
  }, [])

  // ၂။ Redirect Logic
  const redirect = (id, expires, name) => {
    localStorage.setItem(APPROVED_KEY, 'true');
    localStorage.setItem('zetflix_device_id', id);
    localStorage.setItem('zetflix_expiry', expires || '');
    if (name) localStorage.setItem('zetflix_user_name', name);
    // Web app route ပေါ်မူတည်ပြီး ပြောင်းနိုင်ပါတယ်
    window.location.href = '/home'; 
  }

  // ၃။ Access Check Logic
  const checkAccess = useCallback(async (id) => {
    try {
      const res = await fetch(`${APPROVED_USERS_URL}?_t=${Date.now()}`, { 
        cache: 'no-store',
        headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
      })
      const users = res.ok ? await res.json() : []
      let user = users.find(u => u.id === id)

      // Web User အဖြစ် Auto Register လုပ်ခြင်း
      if (!user) {
        const registerRes = await fetch(ADD_USER_API, {
          method: "POST", 
          headers: { "Content-Type": "application/json" },
          // type ကို "web" ဟု ပြောင်းလဲသတ်မှတ်ထားသည်
          body: JSON.stringify({ id, expires: DEFAULT_SEASON_PASS, name: "Web_Explorer", type: "web" })
        });
        if (registerRes.ok) user = { id, expires: DEFAULT_SEASON_PASS, name: "Web_Explorer" };
      }

      if (user) {
        setUserName(user.name);
        setExpiryDate(user.expires);

        const today = new Date();
        today.setHours(0, 0, 0, 0); 
        const expDate = new Date(user.expires);

        if (isNaN(expDate.getTime()) || expDate < today) {
          setIsExpired(true);
          setStatus('denied');
        } else {
          setIsExpired(false);
          setStatus('approved');
          if (timerRef.current) clearInterval(timerRef.current)
          timerRef.current = setInterval(() => {
            setCountdown(prev => {
              if (prev <= 1) { 
                clearInterval(timerRef.current); 
                redirect(id, user.expires, user.name); 
                return 0; 
              }
              return prev - 1;
            })
          }, 1000)
        }
      } else { setStatus('denied'); }
    } catch (e) { 
      console.error("Web Access Error:", e);
      setStatus('denied'); 
    }
  }, [])

  useEffect(() => {
    const id = generateFingerprintId(); 
    setDeviceID(id);
    if (id) checkAccess(id);
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [generateFingerprintId, checkAccess])

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(deviceID);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    }
  }

  // --- UI Rendering --- (Loading State)
  if (status === 'loading') {
    return (
      <div className="fixed inset-0 z-[999] bg-[#020617] flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="w-12 h-12 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin mb-6"></div>
        <h2 className="text-xl font-bold tracking-widest uppercase">FOTMOV WEB</h2>
        <p className="text-slate-500 text-[10px] mt-2 uppercase tracking-widest">Verifying Connection...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-4 selection:bg-sky-500/30">
      <div className="w-full max-w-lg bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[2rem] p-12 shadow-2xl shadow-black">
        
        {status === 'approved' ? (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Authenticated</h1>
            <p className="text-slate-400 mb-8 text-sm">Welcome back, <span className="text-sky-400 font-semibold">{userName}</span></p>
            
            <div className="mb-10 flex justify-center">
              <div className="relative flex items-center justify-center">
                <svg className="w-24 h-24 -rotate-90">
                  <circle cx="48" cy="48" r="44" className="stroke-white/5 fill-none" strokeWidth="4" />
                  <circle cx="48" cy="48" r="44" className="stroke-sky-500 fill-none transition-all duration-1000" strokeWidth="4" 
                    strokeDasharray="276" strokeDashoffset={276 - (276 * (countdown/REDIRECT_DELAY))} strokeLinecap="round" />
                </svg>
                <span className="absolute text-2xl font-mono font-bold text-white">{countdown}</span>
              </div>
            </div>

            <button onClick={() => redirect(deviceID, expiryDate, userName)} className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-sky-900/20">Launch Portal</button>
          </div>
        ) : (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-2">
              {isExpired ? "Access Revoked" : "Web Access Required"}
            </h1>
            <p className="text-slate-400 mb-8 text-sm leading-relaxed">
              {isExpired 
                ? "သင်၏ ဝဘ်ဆိုဒ်အသုံးပြုခွင့် သက်တမ်းကုန်ဆုံးသွားပါပြီ။" 
                : "ဤဝဘ်ဆိုဒ်ကို အသုံးပြုရန် အက်ဒမင်ထံမှ ခွင့်ပြုချက် လိုအပ်ပါသည်။"}
            </p>
            
            <div className="bg-black/20 rounded-2xl p-5 mb-8 border border-white/5 text-left">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Web Instance ID</span>
              <code className="text-sky-400 font-mono text-xs break-all block bg-sky-950/30 p-3 rounded-lg border border-sky-500/10">
                {deviceID}
              </code>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleCopy} className="py-3.5 rounded-xl font-bold text-[11px] uppercase transition-all bg-white/5 text-white border border-white/10 hover:bg-white/10">
                {copied ? "Copied!" : "Copy Identity"}
              </button>
              <button onClick={() => window.location.reload()} className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-3.5 rounded-xl text-[11px] uppercase shadow-lg shadow-sky-900/20">Re-verify</button>
            </div>
          </div>
        )}
      </div>

      <footer className="mt-8 text-[10px] text-slate-600 uppercase tracking-[0.3em]">
        FOTMOV TV &bull; Web Station v2.2
      </footer>
    </div>
  )
         }
         
