// device-id-system.js - COMPLETE FIXED VERSION
// Universal Device ID System for S4ITMM TV
// Updated: 2025-01-20 - Fixed all issues

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
    CHECK_INTERVAL: 60 * 60 * 1000  // 1 hour
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
    
    // Priority 1: Check localStorage first (most reliable)
    try {
      const storedId = localStorage.getItem(CONFIG.STORAGE_PREFIX + 'device_id');
      if (storedId && isValidDeviceId(storedId)) {
        console.log('[S4ITMM] Found ID in localStorage:', storedId);
        return storedId;
      }
    } catch (e) {
      console.warn('[S4ITMM] localStorage access error:', e.message);
    }
    
    // Priority 2: URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const urlId = urlParams.get('did');
    if (urlId && isValidDeviceId(urlId)) {
      console.log('[S4ITMM] Found ID in URL:', urlId);
      saveDeviceId(urlId);
      return urlId;
    }
    
    // Priority 3: Cookies
    const cookieId = getCookie(CONFIG.STORAGE_PREFIX + 'device_id');
    if (cookieId && isValidDeviceId(cookieId)) {
      console.log('[S4ITMM] Found ID in cookies:', cookieId);
      saveDeviceId(cookieId);
      return cookieId;
    }
    
    // Priority 4: Generate new ID
    console.log('[S4ITMM] Generating new device ID...');
    const newId = createNewDeviceId();
    saveDeviceId(newId);
    
    return newId;
  }
  
  function createNewDeviceId() {
    // Collect browser fingerprint data
    const fingerprintData = [];
    
    try {
      fingerprintData.push(navigator.userAgent || 'unknown');
      fingerprintData.push(navigator.platform || 'unknown');
      fingerprintData.push('' + (screen.width || 0) + 'x' + (screen.height || 0));
      fingerprintData.push(navigator.language || 'en');
      fingerprintData.push('' + new Date().getTimezoneOffset());
      fingerprintData.push(navigator.hardwareConcurrency || 'unknown');
      fingerprintData.push(window.location.hostname || 'localhost');
      fingerprintData.push('' + Date.now());
      fingerprintData.push(Math.random().toString(36).substring(2, 15));
    } catch (e) {
      console.warn('[S4ITMM] Error collecting fingerprint:', e);
      fingerprintData.push('fallback_' + Date.now());
    }
    
    // Create hash from fingerprint
    const fingerprintString = fingerprintData.join('|');
    let hash = 0;
    
    for (let i = 0; i < fingerprintString.length; i++) {
      const char = fingerprintString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Format: S4TV_XXXXXX_XXXX
    const hashPart = Math.abs(hash).toString(36).substring(0, 6).toUpperCase();
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const deviceId = `S4TV_${hashPart}_${randomPart}`;
    
    console.log('[S4ITMM] Generated new ID:', deviceId);
    return deviceId;
  }
  
  function isValidDeviceId(id) {
    if (!id || typeof id !== 'string') return false;
    if (id.length < 10 || id.length > 30) return false;
    if (!id.startsWith('S4TV_')) return false;
    return true;
  }
  
  // ============ STORAGE MANAGEMENT ============
  function saveDeviceId(id) {
    if (!isValidDeviceId(id)) {
      console.error('[S4ITMM] Invalid device ID for saving:', id);
      return false;
    }
    
    console.log('[S4ITMM] Saving device ID:', id);
    
    // Save to localStorage
    try {
      localStorage.setItem(CONFIG.STORAGE_PREFIX + 'device_id', id);
      localStorage.setItem(CONFIG.STORAGE_PREFIX + 'first_seen', new Date().toISOString());
      console.log('[S4ITMM] Saved to localStorage');
    } catch (e) {
      console.warn('[S4ITMM] Failed to save to localStorage:', e.message);
    }
    
    // Save to cookies (for browser persistence)
    try {
      setCookie(CONFIG.STORAGE_PREFIX + 'device_id', id, CONFIG.COOKIE_EXPIRE_DAYS);
      console.log('[S4ITMM] Saved to cookies');
    } catch (e) {
      console.warn('[S4ITMM] Failed to save to cookies:', e.message);
    }
    
    // Save to sessionStorage as backup
    try {
      sessionStorage.setItem(CONFIG.STORAGE_PREFIX + 'session_id', id);
    } catch (e) {}
    
    // Update URL with device ID (for refresh persistence)
    updateUrlWithDeviceId(id);
    
    return true;
  }
  
  function updateUrlWithDeviceId(id) {
    try {
      const url = new URL(window.location);
      if (!url.searchParams.has('did')) {
        url.searchParams.set('did', id);
        window.history.replaceState({}, '', url.toString());
        console.log('[S4ITMM] Updated URL with device ID');
      }
    } catch (e) {
      console.warn('[S4ITMM] Could not update URL:', e.message);
    }
  }
  
  function setCookie(name, value, days) {
    try {
      const expires = new Date();
      expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
      document.cookie = name + "=" + encodeURIComponent(value) + 
                       ";expires=" + expires.toUTCString() + 
                       ";path=/;SameSite=Lax";
      return true;
    } catch (e) {
      return false;
    }
  }
  
  function getCookie(name) {
    try {
      const nameEQ = name + "=";
      const cookies = document.cookie.split(';');
      
      for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i];
        while (cookie.charAt(0) === ' ') {
          cookie = cookie.substring(1);
        }
        if (cookie.indexOf(nameEQ) === 0) {
          return decodeURIComponent(cookie.substring(nameEQ.length));
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  }
  
  // ============ ACCESS CONTROL ============
  async function checkAccess() {
    if (!window.S4ITMM.deviceId) {
      window.S4ITMM.deviceId = generateStableDeviceId();
    }
    
    console.log('[S4ITMM] Checking access for:', window.S4ITMM.deviceId);
    
    // Update status to checking
    window.S4ITMM.accessStatus = 'checking';
    notifyCallbacks();
    
    // Try to get cached access data first
    const cachedData = getCachedAccess();
    if (cachedData && cachedData.timestamp && 
        (Date.now() - cachedData.timestamp < CONFIG.CACHE_DURATION)) {
      console.log('[S4ITMM] Using cached access data');
      updateAccessState(cachedData);
      return cachedData;
    }
    
    // Call API for fresh data
    try {
      const apiUrl = `${CONFIG.API_BASE}/check-access?deviceId=${encodeURIComponent(window.S4ITMM.deviceId)}&_t=${Date.now()}`;
      console.log('[S4ITMM] Calling API:', apiUrl);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: { 
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('[S4ITMM] API Response:', data);
      
      // Cache the response
      cacheAccess(data);
      
      // Update state
      updateAccessState(data);
      
      return data;
      
    } catch (error) {
      console.error('[S4ITMM] Access check failed:', error.message);
      
      // Use cached data even if expired
      if (cachedData) {
        console.log('[S4ITMM] Using expired cache as fallback');
        updateAccessState(cachedData);
        return cachedData;
      }
      
      // No cache available - set to pending
      const fallbackData = {
        status: 'pending',
        deviceId: window.S4ITMM.deviceId,
        message: 'Cannot connect to server. Please check internet connection.',
        timestamp: Date.now()
      };
      
      updateAccessState(fallbackData);
      return fallbackData;
    }
  }
  
  function updateAccessState(data) {
    window.S4ITMM.accessStatus = data.status || 'pending';
    window.S4ITMM.userData = data;
    notifyCallbacks();
  }
  
  function getCachedAccess() {
    try {
      const cached = localStorage.getItem(CONFIG.STORAGE_PREFIX + 'access_cache');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.warn('[S4ITMM] Failed to read cache:', e.message);
    }
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
    } catch (e) {
      console.warn('[S4ITMM] Failed to cache access data:', e.message);
    }
  }
  
  // ============ CALLBACK SYSTEM ============
  function notifyCallbacks() {
    const state = {
      deviceId: window.S4ITMM.deviceId,
      status: window.S4ITMM.accessStatus,
      data: window.S4ITMM.userData,
      isApproved: window.S4ITMM.accessStatus === 'approved',
      isExpired: window.S4ITMM.accessStatus === 'expired',
      isPending: window.S4ITMM.accessStatus === 'pending'
    };
    
    console.log('[S4ITMM] Notifying callbacks with state:', state);
    
    window.S4ITMM.callbacks.forEach((callback, index) => {
      try {
        if (typeof callback === 'function') {
          callback(state);
        }
      } catch (e) {
        console.error('[S4ITMM] Callback error:', e);
      }
    });
    
    // Dispatch global event
    try {
      window.dispatchEvent(new CustomEvent('s4itmm-access-update', { detail: state }));
      
      if (state.isApproved) {
        window.dispatchEvent(new CustomEvent('s4itmm-access-granted', { detail: state }));
      } else if (state.isExpired) {
        window.dispatchEvent(new CustomEvent('s4itmm-access-expired', { detail: state }));
      } else if (state.isPending) {
        window.dispatchEvent(new CustomEvent('s4itmm-access-pending', { detail: state }));
      }
    } catch (e) {
      console.warn('[S4ITMM] Event dispatch error:', e);
    }
  }
  
  // ============ PUBLIC API ============
  window.S4ITMM.init = function(options = {}) {
    if (window.S4ITMM.isInitialized) {
      console.log('[S4ITMM] Already initialized');
      return Promise.resolve(window.S4ITMM.getAccessStatus());
    }
    
    // Merge options
    if (options.API_BASE) CONFIG.API_BASE = options.API_BASE;
    if (options.APP_NAME) CONFIG.APP_NAME = options.APP_NAME;
    
    console.log('[S4ITMM] Initializing with config:', CONFIG);
    
    // Generate device ID
    window.S4ITMM.deviceId = generateStableDeviceId();
    window.S4ITMM.isInitialized = true;
    
    console.log('[S4ITMM] System initialized with ID:', window.S4ITMM.deviceId);
    
    // Start access check
    return checkAccess().then(result => {
      console.log('[S4ITMM] Initial access check completed:', result.status);
      return result;
    });
  };
  
  window.S4ITMM.getDeviceId = function() {
    if (!window.S4ITMM.deviceId) {
      window.S4ITMM.deviceId = generateStableDeviceId();
    }
    return window.S4ITMM.deviceId;
  };
  
  window.S4ITMM.getAccessStatus = function() {
    return {
      deviceId: window.S4ITMM.deviceId,
      status: window.S4ITMM.accessStatus,
      data: window.S4ITMM.userData,
      isApproved: window.S4ITMM.accessStatus === 'approved',
      isExpired: window.S4ITMM.accessStatus === 'expired',
      isPending: window.S4ITMM.accessStatus === 'pending'
    };
  };
  
  window.S4ITMM.refreshAccess = function() {
    console.log('[S4ITMM] Manual refresh requested');
    return checkAccess();
  };
  
  window.S4ITMM.onAccessChange = function(callback) {
    if (typeof callback !== 'function') {
      console.error('[S4ITMM] onAccessChange requires a function');
      return;
    }
    
    window.S4ITMM.callbacks.push(callback);
    
    // Call immediately with current state if available
    if (window.S4ITMM.isInitialized) {
      try {
        callback(window.S4ITMM.getAccessStatus());
      } catch (e) {
        console.error('[S4ITMM] Initial callback error:', e);
      }
    }
    
    // Return unsubscribe function
    return function() {
      const index = window.S4ITMM.callbacks.indexOf(callback);
      if (index > -1) {
        window.S4ITMM.callbacks.splice(index, 1);
      }
    };
  };
  
  window.S4ITMM.copyDeviceId = function() {
    const deviceId = window.S4ITMM.getDeviceId();
    
    if (!deviceId) {
      showNotification('No device ID available', 'error');
      return false;
    }
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(deviceId)
        .then(() => {
          showNotification('Device ID copied to clipboard!', 'success');
          return true;
        })
        .catch(err => {
          console.warn('[S4ITMM] Clipboard API failed:', err);
          return fallbackCopy(deviceId);
        });
    } else {
      return fallbackCopy(deviceId);
    }
  };
  
  function fallbackCopy(text) {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        showNotification('Device ID copied to clipboard!', 'success');
        return true;
      } else {
        showNotification('Failed to copy. Please select and copy manually.', 'error');
        return false;
      }
    } catch (err) {
      console.error('[S4ITMM] Fallback copy failed:', err);
      showNotification('Copy failed. Please copy manually: ' + text, 'error');
      return false;
    }
  }
  
  function showNotification(message, type = 'info') {
    // Remove existing notification
    const existing = document.getElementById('s4itmm-notification');
    if (existing) existing.remove();
    
    // Create notification element
    const notification = document.createElement('div');
    notification.id = 's4itmm-notification';
    
    // Set styles based on type
    let backgroundColor = '#3b82f6'; // blue for info
    if (type === 'success') backgroundColor = '#10b981'; // green
    if (type === 'error') backgroundColor = '#ef4444'; // red
    if (type === 'warning') backgroundColor = '#f59e0b'; // yellow
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${backgroundColor};
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      z-index: 99999;
      box-shadow: 0 5px 15px rgba(0,0,0,0.3);
      animation: s4itmmNotificationIn 0.3s ease-out;
      font-family: Arial, sans-serif;
      font-size: 14px;
      max-width: 400px;
      word-break: break-word;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 's4itmmNotificationOut 0.3s ease-in';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
  
  // Add notification styles if not already present
  function addNotificationStyles() {
    if (!document.querySelector('#s4itmm-notification-styles')) {
      const style = document.createElement('style');
      style.id = 's4itmm-notification-styles';
      style.textContent = `
        @keyframes s4itmmNotificationIn {
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
  }
  
  // ============ AUTO-INITIALIZATION ============
  function initialize() {
    addNotificationStyles();
    
    // Initialize immediately if DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        window.S4ITMM.init();
      });
    } else {
      window.S4ITMM.init();
    }
    
    // Set up periodic checks
    setInterval(() => {
      if (window.S4ITMM.isInitialized) {
        checkAccess();
      }
    }, CONFIG.CHECK_INTERVAL);
    
    // Handle online/offline events
    window.addEventListener('online', () => {
      console.log('[S4ITMM] Browser is online, refreshing access...');
      if (window.S4ITMM.isInitialized) {
        checkAccess();
      }
    });
    
    window.addEventListener('offline', () => {
      console.log('[S4ITMM] Browser is offline');
      showNotification('You are offline. Some features may not work.', 'warning');
    });
  }
  
  // Start initialization
  initialize();
  
  console.log('[S4ITMM] Device ID System loaded successfully');
})();
