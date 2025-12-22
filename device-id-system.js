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
    CACHE_DURATION: 30 * 60 * 1000
  };
  
  // ============ GLOBAL STATE ============
  window.S4ITMM = {
    deviceId: null,
    accessStatus: 'checking',
    userData: null,
    isInitialized: false,
    callbacks: [],
    
    // Public API methods
    init: function() {
      if (this.isInitialized) return Promise.resolve();
      
      this.deviceId = this._generateStableDeviceId();
      this.isInitialized = true;
      
      console.log('[S4ITMM] Initialized with ID:', this.deviceId);
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
        isPending: this.accessStatus === 'pending'
      };
    },
    
    refreshAccess: function() {
      console.log('[S4ITMM] Refreshing access...');
      return this._checkAccess();
    },
    
    onAccessChange: function(callback) {
      if (typeof callback === 'function') {
        this.callbacks.push(callback);
        
        // Call immediately if initialized
        if (this.isInitialized) {
          setTimeout(() => callback(this.getAccessStatus()), 100);
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
      
      // Generate new ID
      const fingerprint = [
        navigator.userAgent || 'unknown',
        navigator.platform || 'unknown',
        (screen.width || 0) + 'x' + (screen.height || 0),
        navigator.language || 'en',
        new Date().getTimezoneOffset().toString(),
        Date.now().toString()
      ].join('|');
      
      let hash = 0;
      for (let i = 0; i < fingerprint.length; i++) {
        hash = ((hash << 5) - hash) + fingerprint.charCodeAt(i);
        hash = hash & hash;
      }
      
      const hashPart = Math.abs(hash).toString(36).substring(0, 6).toUpperCase();
      const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
      const newId = `S4TV_${hashPart}_${randomPart}`;
      
      console.log('[S4ITMM] Generated new ID:', newId);
      
      // Save it
      this._saveDeviceId(newId);
      return newId;
    },
    
    _isValidDeviceId: function(id) {
      return id && 
             typeof id === 'string' && 
             id.length >= 10 && 
             id.length <= 30 &&
             id.startsWith('S4TV_');
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
    
    _checkAccess: async function() {
      const deviceId = this.getDeviceId();
      console.log('[S4ITMM] Checking access for:', deviceId);
      
      // Update status to checking
      this.accessStatus = 'checking';
      this._notifyCallbacks();
      
      try {
        // Call API
        const apiUrl = `${CONFIG.API_BASE}/check-access?deviceId=${encodeURIComponent(deviceId)}&_t=${Date.now()}`;
        console.log('[S4ITMM] Calling API:', apiUrl);
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: { 
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('[S4ITMM] API response:', data);
        
        // Update state
        this.accessStatus = data.status || 'pending';
        this.userData = data;
        
      } catch (error) {
        console.error('[S4ITMM] Access check failed:', error.message);
        
        // Fallback to pending status
        this.accessStatus = 'pending';
        this.userData = {
          deviceId: deviceId,
          message: 'Cannot connect to server. Please check internet.',
          offline: true
        };
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
          window.dispatchEvent(new CustomEvent('s4itmm-access-expired', { detail: state }));
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
  };
  
  // Add notification styles
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
  
  // Auto-initialize when DOM is ready
  function initialize() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        window.S4ITMM.init();
      });
    } else {
      window.S4ITMM.init();
    }
    
    // Periodic refresh (every 30 minutes)
    setInterval(() => {
      if (window.S4ITMM.isInitialized) {
        window.S4ITMM.refreshAccess();
      }
    }, 30 * 60 * 1000);
  }
  
  // Start initialization
  initialize();
  
  console.log('[S4ITMM] Device ID System loaded successfully');
})();
