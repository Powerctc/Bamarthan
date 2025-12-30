'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import './globals.css';

export default function HomePage() {
  const [deviceID, setDeviceID] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [status, setStatus] = useState('Checking device access...');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAndroidTV, setIsAndroidTV] = useState(false);
  const router = useRouter();

  // 🔍 Detect Android TV / Android Box
  useEffect(() => {
    const checkAndroidTV = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isTV =
        userAgent.includes('android') &&
        (userAgent.includes('tv') ||
          userAgent.includes('box') ||
          userAgent.includes('set-top') ||
          screen.width >= 1280);
      setIsAndroidTV(isTV);
      if (isTV) {
        console.log('Android TV/Box detected:', {
          userAgent: navigator.userAgent,
          screen: `${screen.width}x${screen.height}`,
        });
      }
    };
    checkAndroidTV();
  }, []);

  // 🔢 Generate or retrieve 12-digit device ID
  const initDeviceID = () => {
    try {
      let id = localStorage.getItem('s4itmmdeviceid_12');
      if (!id || id.length !== 12 || !/^\d+$/.test(id)) {
        const raw =
          (navigator.userAgent || 'unknown') +
          (screen.width || 0) +
          (screen.height || 0) +
          Date.now() +
          Math.random();
        let hash = 0;
        for (let i = 0; i < raw.length; i++) {
          hash = (hash << 5) - hash + raw.charCodeAt(i);
        }
        id = Math.abs(hash).toString().padStart(12, '0').slice(0, 12);
        localStorage.setItem('s4itmmdeviceid_12', id);
      }
      setDeviceID(id);
      setStatus(`Device ID: ${id}`);
      return id;
    } catch (e) {
      const raw = 'fallback' + Date.now() + Math.random();
      let hash = 0;
      for (let i = 0; i < raw.length; i++) {
        hash = (hash << 5) - hash + raw.charCodeAt(i);
      }
      const id = Math.abs(hash).toString().padStart(12, '0').slice(0, 12);
      setDeviceID(id);
      return id;
    }
  };

  // 📅 Format date (English)
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return dateString;
    }
  };

  // 🇲🇲 Format date (Myanmar YYYY-MM-DD)
  const formatMyanmarDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    } catch (e) {
      return dateString;
    }
  };

  // 🔐 Check access from approved_users.json (array format)
  const checkAccess = async (id) => {
    try {
      const url = `https://m-sport-download.static.hf.space/approved_users.json?t=${Date.now()}`;
      const res = await fetch(url, {
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to load access list (${res.status})`);
      }

      let data;
      try {
        data = await res.json();
        if (!Array.isArray(data)) {
          throw new Error('Invalid JSON format: expected array');
        }
      } catch (parseErr) {
        throw new Error('Corrupted or invalid approved_users.json');
      }

      const user = data.find((u) => u.id === id);
      if (!user) {
        setError({
          title: 'Device Not Approved',
          message: 'Your device is not in the approved list. Please contact admin for access.',
        });
        setIsLoading(false);
        return;
      }

      // Check expiry
      const today = new Date();
      const expiry = new Date(user.expires);
      const daysRemaining = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

      setUserInfo({
        id: user.id,
        name: user.name || 'N/A',
        expires: user.expires,
        daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
      });

      if (expiry < today) {
        setError({
          title: 'Access Expired',
          message: `Your access expired on ${formatDate(user.expires)}. Please renew your subscription.`,
          userInfo: {
            id: user.id,
            name: user.name || 'N/A',
            expires: user.expires,
            expired: true,
          },
        });
        setIsLoading(false);
        return;
      }

      // ✅ Approved
      setStatus('✅ Access granted!');
      const redirectDelay = isAndroidTV ? 5000 : 1000;
      setTimeout(() => {
        router.push('/index.html'); // or '/home' if using Next.js route
      }, redirectDelay);
    } catch (err) {
      console.error('Access check error:', err);
      setError({
        title: 'Network Error',
        message: 'Cannot verify access. Please check your internet connection and try again.',
      });
      setIsLoading(false);
    }
  };

  // 📋 Copy device ID
  const copyDeviceId = () => {
    if (deviceID) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(deviceID).then(
          () => alert('Device ID copied to clipboard!'),
          () => fallbackCopy(deviceID)
        );
      } else {
        fallbackCopy(deviceID);
      }
    }
  };

  const fallbackCopy = (text) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    alert('Device ID copied to clipboard!');
  };

  // 🔄 Retry access check
  const retryCheck = () => {
    setError(null);
    setUserInfo(null);
    setStatus('Retrying access check...');
    setIsLoading(true);
    setTimeout(() => {
      const id = initDeviceID();
      checkAccess(id);
    }, 500);
  };

  // 🚀 Initialize on mount
  useEffect(() => {
    const id = initDeviceID();
    checkAccess(id);
  }, []);

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen p-4"
      style={{
        background: 'linear-gradient(135deg, #0f172a, #1e293b)',
        textAlign: 'center',
      }}
    >
      {/* Logo */}
      <div
        className="logo"
        style={{ fontSize: '2.5rem', color: '#ef4444', marginBottom: '20px' }}
      >
        <i className="fas fa-film" style={{ marginRight: '10px' }}></i>
        S4ITMM TV
      </div>

      {/* Android TV Indicator */}
      {isAndroidTV && (
        <div
          className="android-tv-indicator mb-4"
          style={{
            background: 'rgba(59, 130, 246, 0.2)',
            border: '1px solid #3b82f6',
            borderRadius: '20px',
            padding: '8px 16px',
            color: '#60a5fa',
            fontSize: '0.9rem',
          }}
        >
          📺 Android TV/Box Mode
        </div>
      )}

      {/* Loading Spinner */}
      {isLoading && (
        <div
          className="spinner"
          style={{
            width: '50px',
            height: '50px',
            border: '5px solid rgba(255,255,255,0.3)',
            borderRadius: '50%',
            borderTopColor: '#ef4444',
            animation: 'spin 1s linear infinite',
          }}
        ></div>
      )}

      {/* Approved User Info */}
      {userInfo && !error && (
        <div
          className="user-info-container"
          style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid #22c55e',
            borderRadius: '12px',
            padding: '20px',
            marginTop: '20px',
            maxWidth: '500px',
            width: '100%',
            textAlign: 'left',
          }}
        >
          <h3
            style={{
              color: '#22c55e',
              marginTop: 0,
              marginBottom: '15px',
              textAlign: 'center',
            }}
          >
            ✅ Access Approved
          </h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>User ID:</span>
              <span style={{ color: '#f8fafc', fontWeight: 'bold' }}>
                {userInfo.id}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>User Name:</span>
              <span style={{ color: '#f8fafc', fontWeight: 'bold' }}>
                {userInfo.name}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Expiry Date:</span>
              <span
                style={{
                  color: userInfo.daysRemaining <= 7 ? '#fbbf24' : '#22c55e',
                  fontWeight: 'bold',
                }}
              >
                {formatDate(userInfo.expires)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Days Remaining:</span>
              <span
                style={{
                  color: userInfo.daysRemaining <= 7 ? '#fbbf24' : '#22c55e',
                  fontWeight: 'bold',
                }}
              >
                {userInfo.daysRemaining} days
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>
                သက်တမ်းကုန်ဆုံးမည့်ရက်:
              </span>
              <span style={{ color: '#f8fafc', fontWeight: 'bold' }}>
                {formatMyanmarDate(userInfo.expires)}
              </span>
            </div>
          </div>

          {isAndroidTV && (
            <div
              style={{
                marginTop: '20px',
                padding: '10px',
                background: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '8px',
                textAlign: 'center',
              }}
            >
              <p style={{ color: '#60a5fa', margin: 0 }}>
                Redirecting to main page in 5 seconds...
              </p>
            </div>
          )}

          {!isAndroidTV && (
            <button
              onClick={() => router.push('/index.html')}
              style={{
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold',
                width: '100%',
                marginTop: '20px',
              }}
            >
              Enter S4ITMM TV →
            </button>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div
          className="error-bg p-4 rounded-lg mt-6"
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '100%',
          }}
        >
          <h3 style={{ marginTop: 0, color: '#f87171' }}>{error.title}</h3>
          <p style={{ margin: '10px 0', color: '#cbd5e1' }}>{error.message}</p>

          {error.userInfo && (
            <div
              style={{
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '8px',
                padding: '15px',
                margin: '15px 0',
                textAlign: 'left',
              }}
            >
              <h4 style={{ color: '#f8fafc', marginTop: 0 }}>
                User Information:
              </h4>
              <div style={{ display: 'grid', gap: '8px' }}>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <span style={{ color: '#94a3b8' }}>User ID:</span>
                  <span style={{ color: '#f8fafc' }}>{error.userInfo.id}</span>
                </div>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <span style={{ color: '#94a3b8' }}>User Name:</span>
                  <span style={{ color: '#f8fafc' }}>{error.userInfo.name}</span>
                </div>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <span style={{ color: '#94a3b8' }}>Expiry Date:</span>
                  <span style={{ color: '#f87171' }}>
                    {formatDate(error.userInfo.expires)}
                  </span>
                </div>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <span style={{ color: '#94a3b8' }}>
                    သက်တမ်းကုန်ဆုံးမည့်ရက်:
                  </span>
                  <span style={{ color: '#f87171' }}>
                    {formatMyanmarDate(error.userInfo.expires)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'center',
              marginTop: '15px',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={copyDeviceId}
              style={{
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '1rem',
                minWidth: '140px',
              }}
            >
              📋 Copy Device ID
            </button>
            <button
              onClick={retryCheck}
              style={{
                background: '#10b981',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '1rem',
                minWidth: '140px',
              }}
            >
              🔄 Retry Check
            </button>
          </div>
        </div>
      )}

      {/* Status Message */}
      {!userInfo && !error && (
        <div
          className="message"
          style={{
            marginTop: '20px',
            fontSize: '1rem',
            color: '#cbd5e1',
            maxWidth: '80%',
          }}
        >
          {status}
        </div>
      )}

      {/* Fallback for Old Devices */}
      <div
        className="mt-8 p-4"
        style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid #f59e0b',
          borderRadius: '8px',
          maxWidth: '500px',
          width: '100%',
        }}
      >
        <h4 style={{ color: '#f59e0b', marginBottom: '10px' }}>
          ဒီစာမျက်နှာမှာ id မပေါ်ပါကအောက်ပါ Button ကိုနှိပ်ပါ
        </h4>
        <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '15px' }}>
          If you're seeing the loading screen for too long or experiencing
          issues,
          <br />
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
            transition: 'all 0.3s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <i className="fas fa-tv"></i>
          Go to HTML Version (Old Devices)
        </a>
        <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
          This will load a simpler version that works better on older TVs
        </p>
      </div>

      {/* Contact Info */}
      <div
        className="contact mt-8"
        style={{ color: '#94a3b8', fontSize: '0.9rem' }}
      >
        <p>Need access? Contact us:</p>
        <p>
          📱 Telegram:{' '}
          <a
            href="tg://resolve?domain=S4MMTV"
            style={{ color: '#60a5fa', textDecoration: 'none' }}
            onClick={(e) => {
              e.preventDefault();
              window.location.href = 'tg://resolve?domain=S4MMTV';
            }}
          >
            @S4ITMM
          </a>
        </p>
        <p>
          📧 Email:{' '}
          <a
            href="mailto:support@s4itmm.com"
            style={{ color: '#60a5fa', textDecoration: 'none' }}
          >
            support@s4itmm.com
          </a>
        </p>
      </div>

      {/* Spinner Animation */}
      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
        }
