// device-id-system.js
// Universal Device ID & Access Control System for S4ITMM TV
// Include this file in ALL HTML pages: <script src="device-id-system.js"></script>

(function() {
  'use strict';
  
  // ============ CONFIGURATION ============
  const CONFIG = {
    APP_NAME: 'S4ITMM_TV',
    APP_VERSION: '3.0',
    API_BASE: 'https://tv-version-six.vercel.app/api',
    STORAGE_PREFIX: 's4tv_',
    COOKIE_EXPIRE_DAYS: 365,
    CACHE_DURATION: 30 * 60 * 1000, // 30 minutes
    VALID_PATHS: ['/', '/mmtv/', '/series/', '/live/', '/fight/', '/adults/']
  };
  
  // ============ GLOBAL STATE ============
  window.S4ITMM = window.S4ITMM || {
    deviceId: null,
    accessStatus: 'checking',
    userData: null,
    isInitialized: false,
    callbacks: []
  };
  
  // ============ DEVICE ID GENERATION ============
  function generateStableDeviceId() {
    console.log('[S4ITMM] Generating stable device ID...');
    
    // Priority 1: URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const urlId = urlParams.get('did');
    if (urlId && isValidDeviceId(urlId)) {
      console.log('[S4ITMM] Found ID in URL:', urlId);
      saveDeviceId(urlId);
      return urlId;
    }
    
    // Priority 2: localStorage
    try {
      const storedId = localStorage.getItem(CONFIG.STORAGE_PREFIX + 'device_id');
      if (storedId && isValidDeviceId(storedId)) {
        console.log('[S4ITMM] Found ID in localStorage:', storedId);
        return storedId;
      }
    } catch (e) {
      console.warn('[S4ITMM] localStorage not available');
    }
    
    // Priority 3: Cookies
    const cookieId = getCookie(CONFIG.STORAGE_PREFIX + 'device_id');
    if (cookieId && isValidDeviceId(cookieId)) {
      console.log('[S4ITMM] Found ID in cookies:', cookieId);
      saveDeviceId(cookieId);
      return cookieId;
    }
    
    // Priority 4: Generate new ID
    console.log('[S4ITMM] Generating new ID...');
    const newId = createNewDeviceId();
    saveDeviceId(newId);
    
    // Update URL
    updateUrlWithDeviceId(newId);
    
    return newId;
  }
  
  function createNewDeviceId() {
    // Create fingerprint
    const fingerprint = [
      navigator.userAgent || 'unknown',
      navigator.platform || 'unknown',
      (screen.width || 0) + 'x' + (screen.height || 0),
      navigator.language || 'en',
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || 'unknown',
      window.location.hostname
    ].join('|');
    
    // Hash it
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      hash = ((hash << 5) - hash) + fingerprint.charCodeAt(i);
      hash = hash & hash;
    }
    
    // Format: S4TV_XXXXXX_XXXX
    const dateCode = new Date().getDate().toString().padStart(2, '0') + 
                    (new Date().getMonth() + 1).toString().padStart(2, '0');
    const hashPart = Math.abs(hash).toString(36).substring(0, 6).toUpperCase();
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    return `S4TV_${hashPart}_${randomPart}`;
  }
  
  function isValidDeviceId(id) {
    return id && 
           typeof id === 'string' && 
           id.length >= 10 && 
           id.length <= 30 &&
           id.startsWith('S4TV_');
  }
  
  // ============ STORAGE MANAGEMENT ============
  function saveDeviceId(id) {
    if (!isValidDeviceId(id)) return false;
    
    console.log('[S4ITMM] Saving device ID:', id);
    
    // localStorage
    try {
      localStorage.setItem(CONFIG.STORAGE_PREFIX + 'device_id', id);
      localStorage.setItem(CONFIG.STORAGE_PREFIX + 'first_seen', new Date().toISOString());
    } catch (e) {}
    
    // Cookies (most reliable)
    setCookie(CONFIG.STORAGE_PREFIX + 'device_id', id, CONFIG.COOKIE_EXPIRE_DAYS);
    
    // IndexedDB backup
    saveToIndexedDB(id);
    
    return true;
  }
  
  function setCookie(name, value, days) {
    try {
      const d = new Date();
      d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
      const expires = "expires=" + d.toUTCString();
      document.cookie = name + "=" + encodeURIComponent(value) + ";" + expires + ";path=/;SameSite=Lax";
      return true;
    } catch (e) {
      return false;
    }
  }
  
  function getCookie(name) {
    try {
      const nameEQ = name + "=";
      const ca = document.cookie.split(';');
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1);
        if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length));
      }
      return null;
    } catch (e) {
      return null;
    }
  }
  
  function saveToIndexedDB(id) {
    if (!window.indexedDB) return;
    
    try {
      const request = indexedDB.open(CONFIG.STORAGE_PREFIX + 'db', 1);
      
      request.onupgradeneeded = function(e) {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('device')) {
          db.createObjectStore('device');
        }
      };
      
      request.onsuccess = function(e) {
        const db = e.target.result;
        const tx = db.transaction(['device'], 'readwrite');
        const store = tx.objectStore('device');
        store.put(id, 'device_id');
      };
    } catch (e) {}
  }
  
  function updateUrlWithDeviceId(id) {
    try {
      const url = new URL(window.location);
      if (!url.searchParams.has('did')) {
        url.searchParams.set('did', id);
        window.history.replaceState({}, '', url.toString());
      }
    } catch (e) {}
  }
  
  // ============ ACCESS CONTROL ============
  async function checkAccess() {
    if (!window.S4ITMM.deviceId) {
      window.S4ITMM.deviceId = generateStableDeviceId();
    }
    
    console.log('[S4ITMM] Checking access for:', window.S4ITMM.deviceId);
    
    // Check cache first
    const cached = getCachedAccess();
    if (cached && (Date.now() - cached.timestamp < CONFIG.CACHE_DURATION)) {
      console.log('[S4ITMM] Using cached access data');
      window.S4ITMM.accessStatus = cached.status;
      window.S4ITMM.userData = cached.data;
      notifyCallbacks();
      return cached;
    }
    
    // Call API
    try {
      const apiUrl = `${CONFIG.API_BASE}/check-access?deviceId=${encodeURIComponent(window.S4ITMM.deviceId)}&_t=${Date.now()}`;
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      
      // Update state
      window.S4ITMM.accessStatus = data.status || 'pending';
      window.S4ITMM.userData = data;
      
      // Cache the result
      cacheAccess(data);
      
      // Notify callbacks
      notifyCallbacks();
      
      return data;
      
    } catch (error) {
      console.error('[S4ITMM] Access check failed:', error);
      
      // Fallback to cache even if expired
      if (cached) {
        window.S4ITMM.accessStatus = cached.status;
        window.S4ITMM.userData = cached.data;
        notifyCallbacks();
        return cached;
      }
      
      // Default to pending if no cache
      window.S4ITMM.accessStatus = 'pending';
      window.S4ITMM.userData = { 
        message: 'Offline mode - Please check internet connection',
        deviceId: window.S4ITMM.deviceId 
      };
      notifyCallbacks();
      
      return window.S4ITMM.userData;
    }
  }
  
  function getCachedAccess() {
    try {
      const cached = localStorage.getItem(CONFIG.STORAGE_PREFIX + 'access_cache');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {}
    return null;
  }
  
  function cacheAccess(data) {
    try {
      const cacheData = {
        status: data.status,
        data: data,
        timestamp: Date.now()
      };
      localStorage.setItem(CONFIG.STORAGE_PREFIX + 'access_cache', JSON.stringify(cacheData));
    } catch (e) {}
  }
  
  // ============ CALLBACK SYSTEM ============
  function notifyCallbacks() {
    window.S4ITMM.callbacks.forEach(callback => {
      try {
        callback({
          deviceId: window.S4ITMM.deviceId,
          status: window.S4ITMM.accessStatus,
          data: window.S4ITMM.userData,
          isApproved: window.S4ITMM.accessStatus === 'approved'
        });
      } catch (e) {
        console.error('[S4ITMM] Callback error:', e);
      }
    });
  }
  
  // ============ PUBLIC API ============
  window.S4ITMM.init = function() {
    if (window.S4ITMM.isInitialized) return Promise.resolve();
    
    window.S4ITMM.deviceId = generateStableDeviceId();
    window.S4ITMM.isInitialized = true;
    
    console.log('[S4ITMM] System initialized with ID:', window.S4ITMM.deviceId);
    
    // Start access check
    return checkAccess();
  };
  
  window.S4ITMM.getDeviceId = function() {
    return window.S4ITMM.deviceId;
  };
  
  window.S4ITMM.getAccessStatus = function() {
    return {
      status: window.S4ITMM.accessStatus,
      data: window.S4ITMM.userData,
      isApproved: window.S4ITMM.accessStatus === 'approved'
    };
  };
  
  window.S4ITMM.refreshAccess = function() {
    return checkAccess();
  };
  
  window.S4ITMM.onAccessChange = function(callback) {
    if (typeof callback === 'function') {
      window.S4ITMM.callbacks.push(callback);
      
      // Immediately call with current state if initialized
      if (window.S4ITMM.isInitialized) {
        callback({
          deviceId: window.S4ITMM.deviceId,
          status: window.S4ITMM.accessStatus,
          data: window.S4ITMM.userData,
          isApproved: window.S4ITMM.accessStatus === 'approved'
        });
      }
    }
  };
  
  window.S4ITMM.copyDeviceId = function() {
    const deviceId = window.S4ITMM.deviceId;
    if (!deviceId) return false;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(deviceId).then(() => {
        showNotification('Device ID copied to clipboard');
        return true;
      }).catch(() => {
        return fallbackCopy(deviceId);
      });
    } else {
      return fallbackCopy(deviceId);
    }
  };
  
  function fallbackCopy(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      showNotification('Device ID copied to clipboard');
      return true;
    } catch (err) {
      showNotification('Failed to copy. Please select and copy manually.');
      return false;
    } finally {
      document.body.removeChild(textArea);
    }
  }
  
  function showNotification(message) {
    // Create a simple notification
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 99999;
      box-shadow: 0 5px 15px rgba(0,0,0,0.3);
      animation: s4itmmNotification 0.3s ease-out;
      font-family: Arial, sans-serif;
      font-size: 14px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 's4itmmNotificationOut 0.3s ease-in';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
  
  // Add notification styles
  if (!document.querySelector('#s4itmm-notification-styles')) {
    const style = document.createElement('style');
    style.id = 's4itmm-notification-styles';
    style.textContent = `
      @keyframes s4itmmNotification {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes s4itmmNotificationOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      window.S4ITMM.init();
    });
  } else {
    window.S4ITMM.init();
  }
  
  console.log('[S4ITMM] Device ID System loaded successfully');
})();
