// Data Encryption and Secure Storage Utilities

// Simple encryption for client-side storage (not suitable for highly sensitive data)
class ClientEncryption {
  private key: string;
  
  constructor() {
    // Generate or retrieve encryption key from secure storage
    this.key = this.getOrCreateKey();
  }
  
  private getOrCreateKey(): string {
    const storedKey = localStorage.getItem('__app_enc_key');
    if (storedKey) {
      return storedKey;
    }
    
    // Generate new key
    const key = this.generateKey();
    localStorage.setItem('__app_enc_key', key);
    return key;
  }
  
  private generateKey(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  private simpleEncrypt(text: string): string {
    if (!text) return '';
    
    // Simple XOR encryption with the key
    let encrypted = '';
    for (let i = 0; i < text.length; i++) {
      const keyChar = this.key.charCodeAt(i % this.key.length);
      const textChar = text.charCodeAt(i);
      encrypted += String.fromCharCode(textChar ^ keyChar);
    }
    
    // Base64 encode the result
    return btoa(encrypted);
  }
  
  private simpleDecrypt(encryptedText: string): string {
    if (!encryptedText) return '';
    
    try {
      // Base64 decode
      const encrypted = atob(encryptedText);
      
      // XOR decrypt
      let decrypted = '';
      for (let i = 0; i < encrypted.length; i++) {
        const keyChar = this.key.charCodeAt(i % this.key.length);
        const encryptedChar = encrypted.charCodeAt(i);
        decrypted += String.fromCharCode(encryptedChar ^ keyChar);
      }
      
      return decrypted;
    } catch {
      return '';
    }
  }
  
  // Public methods
  encrypt(data: any): string {
    try {
      const jsonString = JSON.stringify(data);
      return this.simpleEncrypt(jsonString);
    } catch {
      return '';
    }
  }
  
  decrypt(encryptedData: string): any {
    try {
      const decryptedString = this.simpleDecrypt(encryptedData);
      if (!decryptedString) return null;
      return JSON.parse(decryptedString);
    } catch {
      return null;
    }
  }
}

// Global encryption instance
const encryption = new ClientEncryption();

// Secure localStorage wrapper
export class SecureStorage {
  private static prefix = '__sec_';
  
  static setItem(key: string, value: any): void {
    try {
      const encrypted = encryption.encrypt(value);
      localStorage.setItem(this.prefix + key, encrypted);
    } catch (error) {
      console.error('Failed to store encrypted data:', error);
    }
  }
  
  static getItem<T = any>(key: string): T | null {
    try {
      const encrypted = localStorage.getItem(this.prefix + key);
      if (!encrypted) return null;
      return encryption.decrypt(encrypted);
    } catch (error) {
      console.error('Failed to retrieve encrypted data:', error);
      return null;
    }
  }
  
  static removeItem(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }
  
  static clear(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }
  
  static has(key: string): boolean {
    return localStorage.getItem(this.prefix + key) !== null;
  }
}

// Secure sessionStorage wrapper
export class SecureSessionStorage {
  private static prefix = '__sec_sess_';
  
  static setItem(key: string, value: any): void {
    try {
      const encrypted = encryption.encrypt(value);
      sessionStorage.setItem(this.prefix + key, encrypted);
    } catch (error) {
      console.error('Failed to store encrypted session data:', error);
    }
  }
  
  static getItem<T = any>(key: string): T | null {
    try {
      const encrypted = sessionStorage.getItem(this.prefix + key);
      if (!encrypted) return null;
      return encryption.decrypt(encrypted);
    } catch (error) {
      console.error('Failed to retrieve encrypted session data:', error);
      return null;
    }
  }
  
  static removeItem(key: string): void {
    sessionStorage.removeItem(this.prefix + key);
  }
  
  static clear(): void {
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        sessionStorage.removeItem(key);
      }
    });
  }
}

// CSRF token management
export class CSRFProtection {
  private static tokenKey = 'csrf_token';
  private static token: string | null = null;
  
  static generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    
    this.token = token;
    SecureSessionStorage.setItem(this.tokenKey, token);
    return token;
  }
  
  static getToken(): string | null {
    if (this.token) return this.token;
    
    this.token = SecureSessionStorage.getItem(this.tokenKey);
    if (!this.token) {
      this.token = this.generateToken();
    }
    
    return this.token;
  }
  
  static validateToken(token: string): boolean {
    const storedToken = this.getToken();
    return storedToken === token && token.length === 64;
  }
  
  static clearToken(): void {
    this.token = null;
    SecureSessionStorage.removeItem(this.tokenKey);
  }
  
  static getHeaders(): Record<string, string> {
    return {
      'X-CSRF-Token': this.getToken() || ''
    };
  }
}

// Password hashing utilities (for client-side validation only)
export const hashPassword = async (password: string, salt?: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + (salt || 'default_salt'));
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
};

// Secure random string generation
export const generateSecureRandomString = (length: number = 32): string => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Session token management
export class SessionManager {
  private static readonly SESSION_KEY = 'user_session';
  private static readonly ACTIVITY_KEY = 'last_activity';
  private static readonly TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
  
  static createSession(userData: any): string {
    const sessionToken = generateSecureRandomString(64);
    const sessionData = {
      token: sessionToken,
      user: userData,
      createdAt: Date.now(),
      lastActivity: Date.now()
    };
    
    SecureStorage.setItem(this.SESSION_KEY, sessionData);
    this.updateActivity();
    
    return sessionToken;
  }
  
  static validateSession(): boolean {
    const sessionData = SecureStorage.getItem(this.SESSION_KEY);
    if (!sessionData) return false;
    
    const now = Date.now();
    const lastActivity = sessionData.lastActivity;
    
    // Check if session has expired
    if (now - lastActivity > this.TIMEOUT_MS) {
      this.clearSession();
      return false;
    }
    
    return true;
  }
  
  static updateActivity(): void {
    const sessionData = SecureStorage.getItem(this.SESSION_KEY);
    if (sessionData) {
      sessionData.lastActivity = Date.now();
      SecureStorage.setItem(this.SESSION_KEY, sessionData);
    }
  }
  
  static getSession(): any {
    if (!this.validateSession()) return null;
    
    const sessionData = SecureStorage.getItem(this.SESSION_KEY);
    this.updateActivity();
    
    return sessionData?.user || null;
  }
  
  static clearSession(): void {
    SecureStorage.removeItem(this.SESSION_KEY);
    CSRFProtection.clearToken();
  }
  
  static getRemainingTime(): number {
    const sessionData = SecureStorage.getItem(this.SESSION_KEY);
    if (!sessionData) return 0;
    
    const elapsed = Date.now() - sessionData.lastActivity;
    return Math.max(0, this.TIMEOUT_MS - elapsed);
  }
}

// Clear all sensitive data
export const clearAllSensitiveData = (): void => {
  SecureStorage.clear();
  SecureSessionStorage.clear();
  CSRFProtection.clearToken();
  
  // Clear any remaining sensitive localStorage items
  const sensitiveKeys = [
    'justSignedUp',
    'pendingEmail',
    'user_preferences',
    'auth_token',
    'refresh_token'
  ];
  
  sensitiveKeys.forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
};

export default {
  SecureStorage,
  SecureSessionStorage,
  CSRFProtection,
  SessionManager,
  hashPassword,
  generateSecureRandomString,
  clearAllSensitiveData
};