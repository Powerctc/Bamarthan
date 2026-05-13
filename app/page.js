'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

const REDIRECT_DELAY = 5
const HF_BASE_URL = "https://livesportmm-s4itmmapprover.hf.space";
const APPROVED_USERS_URL = `${HF_BASE_URL}/Web/approved_users.json`;
const ADD_USER_API = `${HF_BASE_URL}/add_user`;
const DEFAULT_SEASON_PASS = "2026-12-31T23:59:59Z";

const ID_KEY = 'zetflix_device_id_web';

export default function Page() {
  const [deviceID, setDeviceID] = useState(null)
  const [expiryDate, setExpiryDate] = useState(null)
  const [userName, setUserName] = useState(null)
  const [status, setStatus] = useState('loading')
  const [isExpired, setIsExpired] = useState(false)
  const [countdown, setCountdown] = useState(REDIRECT_DELAY)
  const [copied, setCopied] = useState(false)
  const timerRef = useRef(null)

  const generateFingerprintId = useCallback(() => {
    if (typeof window === 'undefined') return null;
    let id = localStorage.getItem(ID_KEY)
    if (id) return id;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = "alphabetic"; ctx.font = "14px Arial";
    ctx.fillText('S4ITMM-WEB-SURF-2026', 2, 15);
    const b64 = canvas.toDataURL().replace("data:image/png;base64,", "");
    let hash = 0;
    for (let i = 0; i < b64.length; i++) { hash = (hash << 5) - hash + b64.charCodeAt(i); hash |= 0; }
    const platformInfo = navigator.userAgent + screen.width + screen.height;
    let finalHash = hash;
    for (let j = 0; j < platformInfo.length; j++) { finalHash = (finalHash << 5) - finalHash + platformInfo.charCodeAt(j); }
    const finalID = Math.abs(finalHash).toString().padStart(12, "0").slice(0, 12) + "web";
    localStorage.setItem(ID_KEY, finalID);
    return finalID;
  }, [])

  const redirect = (id, expires, name) => {
    localStorage.setItem('zetflix_approved', 'true');
    localStorage.setItem('zetflix_device_id', id);
    localStorage.setItem('zetflix_expiry', expires || '');
    if (name) localStorage.setItem('zetflix_user_name', name);
    window.location.href = '/index.html';
  }

  const checkAccess = useCallback(async (id) => {
    try {
      const res = await fetch(`${APPROVED_USERS_URL}?_t=${Date.now()}`, { 
        cache: 'no-store',
        headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
      })
      const users = res.ok ? await res.json() : []
      let user = users.find(u => u.id === id)

      if (!user) {
        const registerRes = await fetch(ADD_USER_API, {
          method: "POST", 
          headers: { "Content-Type": "application/json" },
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
              if (prev <= 1) { clearInterval(timerRef.current); redirect(id, user.expires, user.name); return 0; }
              return prev - 1;
            })
          }, 1000)
        }
      } else { setStatus('denied'); }
    } catch (e) { 
      console.error("Access Error:", e);
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

  if (status === 'loading') {
    return (
      <div className="fixed inset-0 z-[999] bg-[#020617] flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="w-12 h-12 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin mb-6"></div>
        <h2 className="text-xl font-bold tracking-widest uppercase">FOTMOV WEB</h2>
        <p className="text-slate-500 text-[10px] mt-2 uppercase tracking-widest">Checking Permission...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-12 shadow-2xl relative">
        {status === 'approved' ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
              <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Web Access Granted</h1>
            <p className="text-slate-400 mb-8">User: <span className="text-sky-400 font-bold">{userName}</span></p>
            <div className="relative w-24 h-24 mx-auto mb-10">
              <svg className="w-full h-full -rotate-90">
                <circle cx="48" cy="48" r="44" className="stroke-white/5 fill-none" strokeWidth="4" />
                <circle cx="48" cy="48" r="44" className="stroke-sky-500 fill-none transition-all duration-1000" strokeWidth="4" 
                  strokeDasharray="276" strokeDashoffset={276 - (276 * (countdown/REDIRECT_DELAY))} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-2xl font-black text-white">{countdown}</span>
            </div>
            <button onClick={() => redirect(deviceID, expiryDate, userName)} className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-4 rounded-xl transition-all shadow-xl shadow-sky-900/20 uppercase tracking-widest">Launch Portal</button>
          </div>
        ) : (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4 tracking-tight">
              {isExpired ? "Access Expired" : "Unauthorized Web Access"}
            </h1>
            <p className="text-slate-400 mb-8 leading-relaxed px-4 text-sm">
              {isExpired 
                ? "သင်၏ Web သက်တမ်းကုန်ဆုံးသွားပါပြီ။" 
                : "ဝဘ်ဆိုဒ်ကို အသုံးပြုရန် ခွင့်ပြုချက် ရယူရန် လိုအပ်ပါသည်။"}
            </p>
            <div className="bg-black/40 rounded-3xl p-6 mb-8 border border-white/5 text-left">
              <span className="text-slate-500 text-[10px] uppercase font-black tracking-widest block mb-2">Instance ID (Web)</span>
              <p className="text-sky-400 font-mono text-xs break-all bg-sky-500/5 p-3 rounded-xl border border-sky-500/20">{deviceID}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={handleCopy} className={`py-4 rounded-2xl font-bold transition-all text-xs uppercase ${copied ? 'bg-emerald-600 text-white' : 'bg-white/5 text-white border border-white/10'}`}>
                {copied ? "Copied!" : "Copy ID"}
              </button>
              <button onClick={() => window.location.reload()} className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-4 rounded-2xl transition-all text-xs uppercase shadow-lg shadow-sky-900/20">Retry</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
          }
         
