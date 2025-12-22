// device-id-system.js
(function() {
  'use strict';
  
  // Check if already loaded
  if (window.S4ITMM_LOADED) {
    console.log('[S4ITMM] Already loaded, skipping...');
    return;
  }
  
  window.S4ITMM_LOADED = true;
  
  // ============ CONFIGURATION ============
  const CONFIG = {
    APP_NAME: 'S4ITMM_TV',
    APP_VERSION: '3.0',
    API_BASE: 'https://tv-version-six.vercel.app/api',
    STORAGE_PREFIX: 's4tv_',
    COOKIE_EXPIRE_DAYS: 365,
    CACHE_DURATION: 30 * 60 * 1000,
    REFRESH_INTERVAL: 30 * 60 * 1000, // 30 minutes
    INITIAL_RETRY_DELAY: 5000, // 5 seconds
    MAX_RETRIES: 3
  };
  
  // ============ GLOBAL STATE ============
  window.S4ITMM = {
    deviceId: null,
    accessStatus: 'checking',
    userData: null,
    isInitialized: false,
    callbacks: [],
    retryCount: 0,
    isOffline: false,
    
    // Public API methods
    init: function() {
      if (this.isInitialized) return Promise.resolve();
      
      this.deviceId = this._generateStableDeviceId();
      this.isInitialized = true;
      
      console.log('[S4ITMM] Initialized with ID:', this.deviceId);
      
      // Check if device was previously approved
      this._loadCachedAccess();
      
      return this._checkAccess();
    },
    
    getDeviceId: function() {
      if (!this.deviceId) {
        this.deviceId = this._generateStableDeviceId();
      }
      return this.deviceId;
    },
    
    getAccessStatus: function() {
      return {
        deviceId: this.deviceId,
        status: this.accessStatus,
        data: this.userData,
        isApproved: this.accessStatus === 'approved',
        isExpired: this.accessStatus === 'expired',
        isPending: this.accessStatus === 'pending',
        isChecking: this.accessStatus === 'checking',
        isOffline: this.isOffline,
        timestamp: new Date().toISOString()
      };
    },
    
    refreshAccess: function(force = false) {
      console.log('[S4ITMM] Refreshing access...', force ? '(forced)' : '');
      
      if (force) {
        // Clear cache if forced refresh
        this._clearCache();
      }
      
      return this._checkAccess();
    },
    
    onAccessChange: function(callback) {
      if (typeof callback === 'function') {
        this.callbacks.push(callback);
        
        // Call immediately if initialized
        if (this.isInitialized) {
          setTimeout(() => {
            try {
              callback(this.getAccessStatus());
            } catch (e) {
              console.error('[S4ITMM] Initial callback error:', e);
            }
          }, 100);
        }
        
        // Return unsubscribe function
        return () => {
          const index = this.callbacks.indexOf(callback);
          if (index > -1) this.callbacks.splice(index, 1);
        };
      }
    },
    
    copyDeviceId: function() {
      const deviceId = this.getDeviceId();
      if (!deviceId) {
        this._showNotification('No device ID available', 'error');
        return Promise.resolve(false);
      }
      
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(deviceId)
          .then(() => {
            this._showNotification('✅ Device ID copied!', 'success');
            return true;
          })
          .catch(err => {
            console.warn('[S4ITMM] Clipboard failed:', err);
            return this._fallbackCopy(deviceId);
          });
      } else {
        return Promise.resolve(this._fallbackCopy(deviceId));
      }
    },
    
    clearData: function() {
      try {
        localStorage.removeItem(CONFIG.STORAGE_PREFIX + 'device_id');
        localStorage.removeItem(CONFIG.STORAGE_PREFIX + 'first_seen');
        localStorage.removeItem(CONFIG.STORAGE_PREFIX + 'access_cache');
        this.deviceId = null;
        this.userData = null;
        this.accessStatus = 'checking';
        this.isInitialized = false;
        this.retryCount = 0;
        
        // Re-initialize
        setTimeout(() => this.init(), 100);
        
        this._showNotification('Data cleared. New ID will be generated.', 'info');
        return true;
      } catch (e) {
        console.error('[S4ITMM] Clear data failed:', e);
        return false;
      }
    },
    
    // ============ PRIVATE METHODS ============
    _generateStableDeviceId: function() {
      console.log('[S4ITMM] Generating device ID...');
      
      // Try localStorage first
      try {
        const storedId = localStorage.getItem(CONFIG.STORAGE_PREFIX + 'device_id');
        if (storedId && this._isValidDeviceId(storedId)) {
          console.log('[S4ITMM] Found in localStorage:', storedId);
          return storedId;
        }
      } catch (e) {
        console.warn('[S4ITMM] localStorage error:', e.message);
      }
      
      // Generate new ID with better fingerprinting
      const fingerprintData = {
        ua: navigator.userAgent || 'unknown',
        platform: navigator.platform || 'unknown',
        screen: (screen.width || 0) + 'x' + (screen.height || 0),
        language: navigator.language || 'en',
        timezone: new Date().getTimezoneOffset(),
        hardwareConcurrency: navigator.hardwareConcurrency || 0,
        deviceMemory: navigator.deviceMemory || 0,
        timestamp: Date.now()
      };
      
      const fingerprintString = JSON.stringify(fingerprintData);
      
      // Simple hash function
      let hash = 0;
      for (let i = 0; i < fingerprintString.length; i++) {
        const char = fingerprintString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      
      const hashPart = Math.abs(hash).toString(36).substring(0, 6).toUpperCase();
      const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
      const timestampPart = Date.now().toString(36).substring(4, 8).toUpperCase();
      const newId = `S4TV_${hashPart}_${randomPart}_${timestampPart}`;
      
      console.log('[S4ITMM] Generated new ID:', newId);
      
      // Save it
      this._saveDeviceId(newId);
      return newId;
    },
    
    _isValidDeviceId: function(id) {
      if (!id || typeof id !== 'string') return false;
      
      // Check format: S4TV_XXXXXX_XXXX_XXXXX
      const pattern = /^S4TV_[A-Z0-9]{6}_[A-Z0-9]{4}_[A-Z0-9]{5,8}$/;
      return pattern.test(id);
    },
    
    _saveDeviceId: function(id) {
      if (!this._isValidDeviceId(id)) return;
      
      try {
        localStorage.setItem(CONFIG.STORAGE_PREFIX + 'device_id', id);
        localStorage.setItem(CONFIG.STORAGE_PREFIX + 'first_seen', new Date().toISOString());
      } catch (e) {
        console.warn('[S4ITMM] Failed to save device ID:', e.message);
      }
    },
    
    _saveAccessCache: function(data) {
      try {
        const cacheData = {
          data: data,
          timestamp: Date.now(),
          status: data.status
        };
        localStorage.setItem(CONFIG.STORAGE_PREFIX + 'access_cache', JSON.stringify(cacheData));
      } catch (e) {
        console.warn('[S4ITMM] Failed to save cache:', e.message);
      }
    },
    
    _loadCachedAccess: function() {
      try {
        const cached = localStorage.getItem(CONFIG.STORAGE_PREFIX + 'access_cache');
        if (cached) {
          const cacheData = JSON.parse(cached);
          const age = Date.now() - cacheData.timestamp;
          
          // Use cache if less than 1 hour old
          if (age < 60 * 60 * 1000) {
            this.accessStatus = cacheData.status;
            this.userData = cacheData.data;
            console.log('[S4ITMM] Loaded from cache:', this.accessStatus);
            this._notifyCallbacks();
          }
        }
      } catch (e) {
        console.warn('[S4ITMM] Cache load error:', e.message);
      }
    },
    
    _clearCache: function() {
      try {
        localStorage.removeItem(CONFIG.STORAGE_PREFIX + 'access_cache');
      } catch (e) {
        console.warn('[S4ITMM] Cache clear error:', e.message);
      }
    },
    
    _checkAccess: async function() {
      const deviceId = this.getDeviceId();
      console.log('[S4ITMM] Checking access for:', deviceId);
      
      // Update status to checking
      this.accessStatus = 'checking';
      this.isOffline = false;
      this._notifyCallbacks();
      
      try {
        // Call API with timeout
        const apiUrl = `${CONFIG.API_BASE}/check-access?deviceId=${encodeURIComponent(deviceId)}&_t=${Date.now()}`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: { 
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
            'X-Device-ID': deviceId,
            'X-App-Version': CONFIG.APP_VERSION
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('[S4ITMM] API response:', data);
        
        // Reset retry count on success
        this.retryCount = 0;
        
        // Update state
        this.accessStatus = data.status || 'pending';
        this.userData = data;
        
        // Cache successful response
        if (this.accessStatus === 'approved' || this.accessStatus === 'expired') {
          this._saveAccessCache(data);
        }
        
      } catch (error) {
        console.error('[S4ITMM] Access check failed:', error.message);
        
        // Network error detection
        this.isOffline = error.name === 'AbortError' || 
                        error.message.includes('Failed to fetch') ||
                        error.message.includes('NetworkError');
        
        // Increment retry count
        this.retryCount++;
        
        // Use cached data if available and we're offline
        try {
          const cached = localStorage.getItem(CONFIG.STORAGE_PREFIX + 'access_cache');
          if (cached && this.isOffline) {
            const cacheData = JSON.parse(cached);
            this.accessStatus = cacheData.status;
            this.userData = cacheData.data;
            console.log('[S4ITMM] Using cached data (offline mode)');
          } else {
            // Fallback to pending status
            this.accessStatus = 'pending';
            this.userData = {
              deviceId: deviceId,
              message: this.isOffline 
                ? 'Cannot connect to server. Please check your internet connection.' 
                : 'Service temporarily unavailable. Please try again.',
              offline: this.isOffline,
              error: error.message
            };
          }
        } catch (cacheError) {
          console.warn('[S4ITMM] Cache error:', cacheError);
          this.accessStatus = 'pending';
        }
        
        // Schedule retry if needed
        if (this.retryCount < CONFIG.MAX_RETRIES) {
          const retryDelay = CONFIG.INITIAL_RETRY_DELAY * Math.pow(2, this.retryCount - 1);
          console.log(`[S4ITMM] Retry ${this.retryCount}/${CONFIG.MAX_RETRIES} in ${retryDelay}ms`);
          
          setTimeout(() => {
            if (this.isInitialized) {
              this._checkAccess();
            }
          }, retryDelay);
        }
      }
      
      // Notify all callbacks
      this._notifyCallbacks();
      
      return this.getAccessStatus();
    },
    
    _notifyCallbacks: function() {
      const state = this.getAccessStatus();
      console.log('[S4ITMM] Notifying callbacks:', state.status);
      
      // Call registered callbacks
      this.callbacks.forEach(callback => {
        try {
          if (typeof callback === 'function') {
            callback(state);
          }
        } catch (e) {
          console.error('[S4ITMM] Callback error:', e);
        }
      });
      
      // Dispatch global events
      try {
        window.dispatchEvent(new CustomEvent('s4itmm-access-update', { detail: state }));
        
        if (state.isApproved) {
          window.dispatchEvent(new CustomEvent('s4itmm-access-granted', { detail: state }));
        } else if (state.isExpired) {
          window.dispatchEvent(new CustomEvent('s4ITMM-access-expired', { detail: state }));
        } else if (state.isPending) {
          window.dispatchEvent(new CustomEvent('s4itmm-access-pending', { detail: state }));
        }
      } catch (e) {
        console.warn('[S4ITMM] Event dispatch error:', e);
      }
    },
    
    _fallbackCopy: function(text) {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (success) {
          this._showNotification('✅ Device ID copied!', 'success');
          return true;
        }
      } catch (e) {
        console.error('[S4ITMM] Fallback copy failed:', e);
      }
      
      this._showNotification('❌ Copy failed. Please copy manually.', 'error');
      return false;
    },
    
    _showNotification: function(message, type = 'info') {
      // Remove existing notification
      const existing = document.getElementById('s4itmm-notification');
      if (existing) existing.remove();
      
      // Create notification
      const notification = document.createElement('div');
      notification.id = 's4itmm-notification';
      
      // Set style based on type
      let bgColor = '#3b82f6'; // blue
      if (type === 'success') bgColor = '#10b981'; // green
      if (type === 'error') bgColor = '#ef4444'; // red
      if (type === 'warning') bgColor = '#f59e0b'; // yellow
      
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 99999;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        animation: s4itmmNotificationIn 0.3s ease-out;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        max-width: 400px;
        word-break: break-word;
        pointer-events: none;
      `;
      
      notification.textContent = message;
      document.body.appendChild(notification);
      
      // Auto remove after 3 seconds
      setTimeout(() => {
        if (notification.parentNode) {
          notification.style.animation = 's4itmmNotificationOut 0.3s ease-in';
          setTimeout(() => {
            if (notification.parentNode) {
              notification.parentNode.removeChild(notification);
            }
          }, 300);
        }
      }, 3000);
    }
  };
  
  // Add notification styles
  if (!document.querySelector('#s4itmm-notification-styles')) {
    const style = document.createElement('style');
    style.id = 's4itmm-notification-styles';
    style.textContent = `
      @keyframes s4itmmNotificationIn {
        from { transform: translateX(100%) translateY(-20px); opacity: 0; }
        to { transform: translateX(0) translateY(0); opacity: 1; }
      }
      @keyframes s4itmmNotificationOut {
        from { transform: translateX(0) translateY(0); opacity: 1; }
        to { transform: translateX(100%) translateY(-20px); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Auto-initialize when DOM is ready
  function initialize() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        window.S4ITMM.init();
      });
    } else {
      setTimeout(() => window.S4ITMM.init(), 100);
    }
    
    // Periodic refresh
    setInterval(() => {
      if (window.S4ITMM.isInitialized) {
        window.S4ITMM.refreshAccess();
      }
    }, CONFIG.REFRESH_INTERVAL);
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      console.log('[S4ITMM] Network online, refreshing access...');
      if (window.S4ITMM.isInitialized && window.S4ITMM.isOffline) {
        setTimeout(() => window.S4ITMM.refreshAccess(true), 1000);
      }
    });
    
    window.addEventListener('offline', () => {
      console.log('[S4ITMM] Network offline');
      if (window.S4ITMM.isInitialized) {
        window.S4ITMM.isOffline = true;
        window.S4ITMM._notifyCallbacks();
      }
    });
  }
  
  // Start initialization
  initialize();
  
  console.log('[S4ITMM] Device ID System v' + CONFIG.APP_VERSION + ' loaded successfully');
})();
