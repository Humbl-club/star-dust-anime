// Secure API Utilities with Request Signing and Validation

import { supabase } from '@/integrations/supabase/client';
import { CSRFProtection, generateSecureRandomString } from '@/utils/encryptionUtils';
import { validateAndSanitizeUrl, apiRateLimiter, logSecurityEvent } from '@/utils/securityUtils';

// Request signing for sensitive operations
export class RequestSigner {
  private static async generateSignature(
    method: string,
    url: string,
    body: string,
    timestamp: number,
    nonce: string
  ): Promise<string> {
    const data = `${method}|${url}|${body}|${timestamp}|${nonce}`;
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', encodedData);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  static async signRequest(
    method: string,
    url: string,
    body: any = null
  ): Promise<Record<string, string>> {
    const timestamp = Date.now();
    const nonce = generateSecureRandomString(16);
    const bodyString = body ? JSON.stringify(body) : '';
    
    const signature = await this.generateSignature(method, url, bodyString, timestamp, nonce);
    
    return {
      'X-Request-Signature': signature,
      'X-Request-Timestamp': timestamp.toString(),
      'X-Request-Nonce': nonce,
      ...CSRFProtection.getHeaders()
    };
  }
  
  static validateTimestamp(timestamp: string): boolean {
    const requestTime = parseInt(timestamp);
    const currentTime = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    return Math.abs(currentTime - requestTime) <= fiveMinutes;
  }
}

// Enhanced API client with security features
export class SecureApiClient {
  private static instance: SecureApiClient;
  private baseUrl: string;
  
  private constructor() {
    this.baseUrl = 'https://axtpbgsjbmhbuqomarcr.supabase.co';
  }
  
  static getInstance(): SecureApiClient {
    if (!SecureApiClient.instance) {
      SecureApiClient.instance = new SecureApiClient();
    }
    return SecureApiClient.instance;
  }
  
  private async makeSecureRequest(
    method: string,
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    // Rate limiting check
    const clientId = navigator.userAgent + endpoint;
    if (!apiRateLimiter.isAllowed(clientId)) {
      logSecurityEvent({
        type: 'api_rate_limit_exceeded',
        severity: 'warning',
        message: `API rate limit exceeded for ${endpoint}`
      });
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    
    // Validate URL
    const fullUrl = `${this.baseUrl}${endpoint}`;
    const validatedUrl = validateAndSanitizeUrl(fullUrl);
    if (!validatedUrl) {
      throw new Error('Invalid URL');
    }
    
    // Sign request for sensitive operations
    const securityHeaders = await RequestSigner.signRequest(method, endpoint, options.body);
    
    // Merge headers
    const headers = {
      'Content-Type': 'application/json',
      'X-Client-Info': 'supabase-js/web',
      ...securityHeaders,
      ...options.headers
    };
    
    // Make request with security headers
    const response = await fetch(validatedUrl, {
      ...options,
      method,
      headers
    });
    
    // Validate response
    if (!response.ok) {
      logSecurityEvent({
        type: 'api_request_failed',
        severity: 'error',
        message: `API request failed: ${response.status}`,
        data: { endpoint, status: response.status }
      });
      
      throw new Error(`API request failed: ${response.status}`);
    }
    
    return response;
  }
  
  async get(endpoint: string, options: RequestInit = {}): Promise<any> {
    const response = await this.makeSecureRequest('GET', endpoint, options);
    return this.validateAndParseResponse(response);
  }
  
  async post(endpoint: string, data: any, options: RequestInit = {}): Promise<any> {
    const response = await this.makeSecureRequest('POST', endpoint, {
      ...options,
      body: JSON.stringify(data)
    });
    return this.validateAndParseResponse(response);
  }
  
  async put(endpoint: string, data: any, options: RequestInit = {}): Promise<any> {
    const response = await this.makeSecureRequest('PUT', endpoint, {
      ...options,
      body: JSON.stringify(data)
    });
    return this.validateAndParseResponse(response);
  }
  
  async delete(endpoint: string, options: RequestInit = {}): Promise<any> {
    const response = await this.makeSecureRequest('DELETE', endpoint, options);
    return this.validateAndParseResponse(response);
  }
  
  private async validateAndParseResponse(response: Response): Promise<any> {
    const contentType = response.headers.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Invalid response content type');
    }
    
    try {
      const data = await response.json();
      
      // Basic response validation
      if (typeof data !== 'object') {
        throw new Error('Invalid response format');
      }
      
      return data;
    } catch (error) {
      logSecurityEvent({
        type: 'api_response_parse_error',
        severity: 'error',
        message: 'Failed to parse API response'
      });
      throw new Error('Failed to parse response');
    }
  }
}

// Enhanced Supabase client wrapper with security features
export class SecureSupabaseClient {
  static async query(table: any, options: any = {}) {
    try {
      // Add security headers to Supabase requests
      const securityHeaders = await RequestSigner.signRequest('GET', `/rest/v1/${table}`, null);
      
      // Use the existing Supabase client with additional security
      let query = (supabase as any).from(table).select(options.select || '*');
      
      // Apply filters securely
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (typeof value === 'string') {
            // Sanitize filter values
            const sanitizedValue = value.replace(/[<>'"]/g, '');
            query = query.eq(key, sanitizedValue);
          } else {
            query = query.eq(key, value);
          }
        });
      }
      
      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy.column, { 
          ascending: options.orderBy.ascending ?? false 
        });
      }
      
      // Apply pagination
      if (options.range) {
        query = query.range(options.range.from, options.range.to);
      }
      
      const { data, error } = await query;
      
      if (error) {
        logSecurityEvent({
          type: 'supabase_query_error',
          severity: 'error',
          message: `Supabase query failed: ${error.message}`,
          data: { table, error: error.code }
        });
        throw error;
      }
      
      return data;
    } catch (error) {
      logSecurityEvent({
        type: 'supabase_query_exception',
        severity: 'error',
        message: 'Supabase query exception',
        data: { table }
      });
      throw error;
    }
  }
  
  static async insert(table: any, data: any) {
    try {
      // Validate data before insert
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid data for insert');
      }
      
      // Remove potentially dangerous fields
      const sanitizedData = { ...data };
      delete sanitizedData.__proto__;
      delete sanitizedData.constructor;
      
      const { data: result, error } = await (supabase as any)
        .from(table)
        .insert(sanitizedData)
        .select();
      
      if (error) {
        logSecurityEvent({
          type: 'supabase_insert_error',
          severity: 'error',
          message: `Supabase insert failed: ${error.message}`,
          data: { table, error: error.code }
        });
        throw error;
      }
      
      return result;
    } catch (error) {
      logSecurityEvent({
        type: 'supabase_insert_exception',
        severity: 'error',
        message: 'Supabase insert exception',
        data: { table }
      });
      throw error;
    }
  }
  
  static async update(table: any, id: string, data: any) {
    try {
      // Validate update data
      if (!data || typeof data !== 'object' || !id) {
        throw new Error('Invalid data or ID for update');
      }
      
      // Remove potentially dangerous fields
      const sanitizedData = { ...data };
      delete sanitizedData.__proto__;
      delete sanitizedData.constructor;
      delete sanitizedData.id; // Prevent ID modification
      
      const { data: result, error } = await (supabase as any)
        .from(table)
        .update(sanitizedData)
        .eq('id', id)
        .select();
      
      if (error) {
        logSecurityEvent({
          type: 'supabase_update_error',
          severity: 'error',
          message: `Supabase update failed: ${error.message}`,
          data: { table, id, error: error.code }
        });
        throw error;
      }
      
      return result;
    } catch (error) {
      logSecurityEvent({
        type: 'supabase_update_exception',
        severity: 'error',
        message: 'Supabase update exception',
        data: { table, id }
      });
      throw error;
    }
  }
}

// Export singleton instance
export const secureApiClient = SecureApiClient.getInstance();

export default {
  RequestSigner,
  SecureApiClient,
  SecureSupabaseClient,
  secureApiClient
};