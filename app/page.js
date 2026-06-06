'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

const REDIRECT_DELAY = 5
const HF_BASE_URL = "https://livesportmm-s4itmmapprover.hf.space";
const APPROVED_USERS_URL = `${HF_BASE_URL}/Web/approved_users.json`;
const ADD_USER_API = `${HF_BASE_URL}/add_user`;
const DEFAULT_SEASON_PASS = "2026-12-31T23:59:59Z";
const ID_KEY = 'zetflix_device_id_web';

let memoryStorage = {};
const isStorageAvailable = (type) => {
  try {
    const storage = window[type];
    const x = '__storage_test__';
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (e) {
    return false;
  }
};

export default function Page() {
  const [deviceID, setDeviceID] = useState(null)
  const [expiryDate, setExpiryDate] = useState(null)
  const [userName, setUserName] = useState(null)
  const [status, setStatus] = useState('loading')
  const [isExpired, setIsExpired] = useState(false)
  const [countdown, setCountdown] = useState(REDIRECT_DELAY)
  const [copied, setCopied] = useState(false)
  const timerRef = useRef(null)

  const storageAvailable = typeof window !== 'undefined' && isStorageAvailable('localStorage');

  const safeGet = (key) => {
    return storageAvailable ? localStorage.getItem(key) : memoryStorage[key];
  }

  const safeSet = (key, value) => {
    if (storageAvailable) {
      localStorage.setItem(key, value);
    } else {
      memoryStorage[key] = value;
    }
  }

  const generateFingerprintId = useCallback(() => {
    let id = safeGet(ID_KEY);
    if (id) return id;

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.textBaseline = "top";
      ctx.font = "14px 'Arial'";
      ctx.fillText('S4ITMM-2026', 2, 2);
      const b64 = canvas.toDataURL();
      
      let hash = 0;
      for (let i = 0; i < b64.length; i++) {
        hash = ((hash << 5) - hash) + b64.charCodeAt(i);
        hash |= 0;
      }
      const finalID = Math.abs(hash).toString().substring(0, 10) + Math.floor(Math.random() * 99).toString() + "web";
      safeSet(ID_KEY, finalID);
      return finalID;
    } catch (e) {
      const fallbackID = "WEB-" + Math.random().toString(36).substr(2, 9).toUpperCase();
      safeSet(ID_KEY, fallbackID);
      return fallbackID;
    }
  }, []);

  const redirect = (id, expires, name) => {
    safeSet('zetflix_approved', 'true');
    window.location.replace('/index.html');
  }

  const checkAccess = useCallback(async (id) => {
    try {
      const res = await fetch(`${APPROVED_USERS_URL}?t=${Date.now()}`, { cache: 'no-store' });
      const users = res.ok ? await res.json() : [];
      let user = users.find(u => String(u.id) === String(id));

      if (!user) {
        await fetch(ADD_USER_API, {
          method: "POST", 
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, expires: DEFAULT_SEASON_PASS, name: "Web_User", type: "web" })
        });
        user = { id, expires: DEFAULT_SEASON_PASS, name: "Web_User" };
      }

      setUserName(user.name);
      setExpiryDate(user.expires);
      
      const expDate = new Date(user.expires);
      if (expDate < new Date()) {
        setStatus('denied');
        setIsExpired(true);
      } else {
        setStatus('approved');
      }
    } catch (e) {
      setStatus('denied');
    }
  }, []);

  useEffect(() => {
    const id = generateFingerprintId();
    setDeviceID(id);
    checkAccess(id);
  }, [generateFingerprintId, checkAccess]);

  useEffect(() => {
    if (status === 'approved') {
      timerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            redirect(deviceID, expiryDate, userName);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [status]);

  if (status === 'loading') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-blue-100">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-[-0.125em]" role="status">
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
          </div>
          <p className="mt-4 text-lg font-semibold text-blue-800">လုပ်ဆောင်နေပါသည်...</p>
        </div>
      </div>
    )
  }

  if (status === 'denied') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-red-100 p-6">
        <div className="rounded-lg bg-white p-8 shadow-md">
          <h2 className="mb-4 text-2xl font-bold text-red-600">ဝင်ရောက်ခွင့်မရှိပါ</h2>
          <p className="mb-6 text-gray-700">ဝဘ်ဆိုဒ်ကို အသုံးပြုရန် ခွင့်ပြုချက်မရှိပါ။ ကျေးဇူးပြု၍ အောက်ပါ ID ကို ကူးယူပြီး တာဝန်ရှိသူထံ ဆက်သွယ်ပါ။</p>
          <div className="mb-6 rounded-md bg-gray-100 p-4">
            <p className="break-all font-mono text-sm text-gray-800">{deviceID}</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => {
                navigator.clipboard.writeText(deviceID)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              {copied ? 'ကူးယူပြီးပါပြီ' : 'ID ကိုကူးယူရန်'}
            </button>
            <button
              onClick={() => window.location.reload()}
              className="rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
            >
              ပြန်လည်ကြိုးစားရန်
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    // Approved status UI, you can customize this part with your intended content
    <div className="flex h-screen w-screen items-center justify-center bg-green-100">
      <div className="text-center">
        <p className="text-xl font-bold text-green-800">Redirecting to home page in {countdown} seconds...</p>
      </div>
    </div>
  )
    }
      
