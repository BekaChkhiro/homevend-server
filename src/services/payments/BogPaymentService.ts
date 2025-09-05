import crypto from 'crypto';
import axios, { AxiosResponse } from 'axios';

export interface BogTokenManager {
  token: string | null;
  tokenExpiry: Date | null;
  clientId: string;
  clientSecret: string;
}

export interface BogOrderRequest {
  callback_url: string;
  external_order_id: string;
  purchase_units: {
    currency: string;
    total_amount: number;
    basket: BogBasketItem[];
  };
  redirect_urls: {
    success: string;
    fail: string;
  };
  ttl?: number;
  payment_method?: string[];
  application_type?: 'web' | 'mobile';
  buyer?: {
    full_name?: string;
    masked_email?: string;
    masked_phone?: string;
  };
  capture?: 'automatic' | 'manual';
  config?: {
    loan?: {
      type: string;
      month: number;
    };
    campaign?: {
      card: 'visa' | 'mc' | 'amex' | 'solo';
      type: 'restrict' | 'client_discount';
    };
    google_pay?: {
      google_pay_token?: string;
      external?: boolean;
    };
    apple_pay?: {
      external?: boolean;
    };
    account?: {
      tag?: string;
    };
  };
}

export interface BogBasketItem {
  product_id: string;
  description?: string;
  quantity: number;
  unit_price: number;
  unit_discount_price?: number;
  vat?: number;
  vat_percent?: number;
  total_price?: number;
  image?: string;
  package_code?: string;
  tin?: string;
  pinfl?: string;
  product_discount_id?: string;
}

export interface BogOrderResponse {
  id: string;  // Changed from order_id to id
  order_id?: string; // Keep for backward compatibility
  _links: {
    redirect: {
      href: string;
    };
    details?: {
      href: string;
    };
  };
}

export interface BogPaymentDetails {
  order_id: string;
  industry: string;
  capture: string;
  external_order_id: string;
  client: {
    id: string;
    brand_ka: string;
    brand_en: string;
    url: string;
  };
  zoned_create_date: string;
  zoned_expire_date: string;
  order_status: {
    key: 'created' | 'processing' | 'completed' | 'rejected' | 'refunded' | 'refunded_partially' | 'auth_requested' | 'blocked' | 'partial_completed';
    value: string;
  };
  buyer?: {
    full_name: string;
    email: string;
    phone_number: string;
  };
  purchase_units: {
    request_amount: string;
    transfer_amount: string;
    refund_amount: string;
    currency_code: string;
    items: Array<{
      external_item_id: string;
      description: string;
      quantity: string;
      unit_price: string;
      unit_discount_price: string;
      vat: string;
      vat_percent: string;
      total_price: string;
      package_code?: string;
      tin?: string;
      pinfl?: string;
    }>;
  };
  redirect_links: {
    success: string;
    fail: string;
  };
  payment_detail?: {
    transfer_method: {
      key: 'card' | 'google_pay' | 'apple_pay' | 'bog_p2p' | 'bog_loyalty' | 'bnpl' | 'bog_loan';
      value: string;
    };
    transaction_id: string;
    payer_identifier: string;
    payment_option: 'direct_debit' | 'recurrent' | 'subscription';
    card_type?: 'amex' | 'mc' | 'visa';
    card_expiry_date?: string;
    request_account_tag?: string;
    transfer_account_tag?: string;
    saved_card_type?: 'recurrent' | 'subscription';
    parent_order_id?: string;
    code: string;
    code_description: string;
    auth_code?: string;
  };
  discount?: {
    bank_discount_amount: string;
    bank_discount_desc: string;
    system_discount_amount: string;
    system_discount_desc: string;
    discounted_amount: string;
    original_order_amount: string;
  };
  actions?: Array<{
    action_id: string;
    request_channel: 'public_api' | 'business_manager' | 'support';
    action: 'authorize' | 'partial_authorize' | 'cancel_authorize' | 'refund' | 'partial_refund';
    status: 'completed' | 'rejected';
    zoned_action_date: string;
    amount: string;
  }>;
  lang: 'ka' | 'en';
  reject_reason?: string;
}

export interface BogCallbackData {
  event: 'order_payment';
  zoned_request_time: string;
  body: BogPaymentDetails;
}

export interface BogRefundRequest {
  amount?: number;
}

export interface BogErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      issue: string;
    }>;
  };
}

export class BogPaymentService {
  private tokenManager: BogTokenManager;
  private baseUrl: string;
  private authUrl: string;
  private publicKey: string;

  constructor() {
    this.tokenManager = {
      token: null,
      tokenExpiry: null,
      clientId: process.env.BOG_CLIENT_ID!,
      clientSecret: process.env.BOG_SECRET_KEY! || process.env.BOG_CLIENT_SECRET!
    };

    this.baseUrl = process.env.BOG_API_URL || 'https://api.bog.ge/payments/v1';
    this.authUrl = process.env.BOG_AUTH_URL || 'https://oauth2.bog.ge/auth/realms/bog/protocol/openid-connect/token';
    
    // BOG public key for signature verification
    this.publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAu4RUyAw3+CdkS3ZNILQh
zHI9Hemo+vKB9U2BSabppkKjzjjkf+0Sm76hSMiu/HFtYhqWOESryoCDJoqffY0Q
1VNt25aTxbj068QNUtnxQ7KQVLA+pG0smf+EBWlS1vBEAFbIas9d8c9b9sSEkTrr
TYQ90WIM8bGB6S/KLVoT1a7SnzabjoLc5Qf/SLDG5fu8dH8zckyeYKdRKSBJKvhx
tcBuHV4f7qsynQT+f2UYbESX/TLHwT5qFWZDHZ0YUOUIvb8n7JujVSGZO9/+ll/g
4ZIWhC1MlJgPObDwRkRd8NFOopgxMcMsDIZIoLbWKhHVq67hdbwpAq9K9WMmEhPn
PwIDAQAB
-----END PUBLIC KEY-----`;

    if (!this.tokenManager.clientId || !this.tokenManager.clientSecret) {
      throw new Error('BOG client ID and client secret are required');
    }
  }

  /**
   * Generate UUID v4 for idempotency key
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Get OAuth 2.0 access token
   */
  private async getAccessToken(): Promise<string> {
    const credentials = Buffer.from(`${this.tokenManager.clientId}:${this.tokenManager.clientSecret}`).toString('base64');
    
    console.log('🔐 BOG Auth Debug:');
    console.log('- Client ID:', this.tokenManager.clientId);
    console.log('- Auth URL:', this.authUrl);
    console.log('- Base64 credentials:', credentials);
    
    try {
      const formData = new URLSearchParams();
      formData.append('grant_type', 'client_credentials');
      
      const response = await axios.post(this.authUrl, formData, {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        timeout: 30000
      });

      console.log('✅ BOG OAuth Response:', typeof response.data, response.data);
      
      // Check if response is HTML instead of JSON
      if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
        throw new Error('OAuth endpoint returned HTML page instead of JSON token');
      }
      
      if (!response.data.access_token) {
        throw new Error('OAuth response missing access_token');
      }
      
      return response.data.access_token;
    } catch (error: any) {
      console.error('❌ BOG OAuth Error Details:');
      console.error('- Status:', error.response?.status);
      console.error('- Status Text:', error.response?.statusText);
      console.error('- Response Data:', JSON.stringify(error.response?.data, null, 2));
      console.error('- Request Config:', {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      });
      throw new Error('Failed to obtain access token from BOG');
    }
  }

  /**
   * Get valid access token with automatic refresh
   */
  private async getValidToken(): Promise<string> {
    if (!this.tokenManager.token || !this.tokenManager.tokenExpiry || new Date() >= this.tokenManager.tokenExpiry) {
      await this.refreshToken();
    }
    return this.tokenManager.token!;
  }

  /**
   * Refresh OAuth token
   */
  private async refreshToken(): Promise<void> {
    this.tokenManager.token = await this.getAccessToken();
    // Set expiry to 55 minutes from now (5 minutes buffer)
    this.tokenManager.tokenExpiry = new Date(Date.now() + 55 * 60 * 1000);
  }

  /**
   * Verify callback signature from BOG
   */
  public verifySignature(signature: string, body: any): boolean {
    if (!signature) return false;
    
    try {
      const verifier = crypto.createVerify('SHA256');
      verifier.update(JSON.stringify(body));
      verifier.end();
      
      return verifier.verify(this.publicKey, signature, 'base64');
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  /**
   * Create payment order with BOG
   */
  async createOrder(params: {
    orderId: string;
    amount: number;
    currency?: string;
    description: string;
    callbackUrl: string;
    successUrl: string;
    failUrl: string;
    paymentMethods?: string[];
    ttl?: number;
    buyer?: {
      fullName?: string;
      email?: string;
      phone?: string;
    };
    capture?: 'automatic' | 'manual';
  }): Promise<BogOrderResponse> {
    // Try OAuth first, then fall back to Basic Auth if needed
    let authHeader = '';
    
    try {
      console.log('🔑 Attempting OAuth token...');
      const token = await this.getValidToken();
      authHeader = `Bearer ${token}`;
      console.log('✅ Using OAuth token');
    } catch (oauthError) {
      console.log('❌ OAuth failed, falling back to Basic Auth');
      const credentials = Buffer.from(`${this.tokenManager.clientId}:${this.tokenManager.clientSecret}`).toString('base64');
      authHeader = `Basic ${credentials}`;
    }
    
    const orderData: BogOrderRequest = {
      callback_url: params.callbackUrl,
      external_order_id: params.orderId,
      purchase_units: {
        currency: params.currency || 'GEL',
        total_amount: params.amount,
        basket: [{
          product_id: 'balance_topup',
          description: params.description,
          quantity: 1,
          unit_price: params.amount,
          total_price: params.amount
        }]
      },
      redirect_urls: {
        success: params.successUrl,
        fail: params.failUrl
      },
      ttl: params.ttl || 15,
      payment_method: params.paymentMethods || ['card'],  // Only use basic card payments
      application_type: 'web'
    };

    // Add buyer information if provided
    if (params.buyer) {
      orderData.buyer = {
        full_name: params.buyer.fullName,
        masked_email: params.buyer.email,
        masked_phone: params.buyer.phone
      };
    }

    // Add capture mode
    if (params.capture) {
      orderData.capture = params.capture;
    }

    const idempotencyKey = this.generateUUID();

    console.log('🔄 BOG Order Request Details:');
    console.log('- URL:', `${this.baseUrl}/ecommerce/orders`);
    console.log('- Auth Header:', authHeader.substring(0, 20) + '...');
    console.log('- Order Data:', JSON.stringify(orderData, null, 2));
    console.log('- Idempotency Key:', idempotencyKey);

    try {
      const response: AxiosResponse<BogOrderResponse> = await axios.post(
        `${this.baseUrl}/ecommerce/orders`,
        orderData,
        {
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Accept-Language': 'ka',
            'Theme': 'light',
            'Idempotency-Key': idempotencyKey
          },
          timeout: 30000
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('🚫 BOG Create Order Error Details:');
      console.error('- Status:', error.response?.status);
      console.error('- Status Text:', error.response?.statusText);
      console.error('- Headers:', error.response?.headers);
      console.error('- Response Data:', JSON.stringify(error.response?.data, null, 2));
      console.error('- Request URL:', error.config?.url);
      console.error('- Request Method:', error.config?.method);
      console.error('- Request Headers:', error.config?.headers);
      console.error('- Error Message:', error.message);
      
      if (error.response?.data?.error) {
        const errorData: BogErrorResponse = error.response.data;
        throw new Error(`BOG API Error: ${errorData.error.message} (${errorData.error.code})`);
      }
      
      if (error.response?.status === 401) {
        throw new Error('BOG Authentication failed - check credentials and domain authorization');
      }
      
      throw new Error(`Failed to create payment order with BOG: ${error.message}`);
    }
  }

  /**
   * Get payment details by order ID
   */
  async getPaymentDetails(orderId: string): Promise<BogPaymentDetails> {
    const token = await this.getValidToken();

    try {
      const response: AxiosResponse<BogPaymentDetails> = await axios.get(
        `${this.baseUrl}/receipt/${orderId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('BOG Get Payment Details Error:', error.response?.data || error.message);
      
      if (error.response?.status === 404) {
        throw new Error('Payment order not found');
      }
      
      throw new Error('Failed to get payment details from BOG');
    }
  }

  /**
   * Verify payment status (use when callback is not received)
   */
  async verifyPaymentStatus(orderId: string): Promise<{
    status: string;
    amount: string;
    transactionId?: string;
    paymentMethod?: string;
  }> {
    try {
      const paymentDetails = await this.getPaymentDetails(orderId);
      
      return {
        status: paymentDetails.order_status.key,
        amount: paymentDetails.purchase_units.transfer_amount,
        transactionId: paymentDetails.payment_detail?.transaction_id,
        paymentMethod: paymentDetails.payment_detail?.transfer_method.key
      };
    } catch (error) {
      console.error('Payment verification error:', error);
      throw error;
    }
  }

  /**
   * Process full refund
   */
  async fullRefund(orderId: string): Promise<any> {
    const token = await this.getValidToken();
    const idempotencyKey = this.generateUUID();

    try {
      const response = await axios.post(
        `${this.baseUrl}/payment/refund/${orderId}`,
        {}, // Empty body for full refund
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey
          },
          timeout: 30000
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('BOG Full Refund Error:', error.response?.data || error.message);
      throw new Error('Failed to process full refund with BOG');
    }
  }

  /**
   * Process partial refund
   */
  async partialRefund(orderId: string, amount: number): Promise<any> {
    const token = await this.getValidToken();
    const idempotencyKey = this.generateUUID();

    const refundData: BogRefundRequest = {
      amount: amount
    };

    try {
      const response = await axios.post(
        `${this.baseUrl}/payment/refund/${orderId}`,
        refundData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey
          },
          timeout: 30000
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('BOG Partial Refund Error:', error.response?.data || error.message);
      throw new Error('Failed to process partial refund with BOG');
    }
  }

  /**
   * Confirm pre-authorization (for manual capture)
   */
  async confirmPreAuth(orderId: string, amount?: number): Promise<any> {
    const token = await this.getValidToken();

    const authData = amount ? { amount } : {};

    try {
      const response = await axios.post(
        `${this.baseUrl}/payment/authorize/${orderId}`,
        authData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('BOG Confirm Pre-Auth Error:', error.response?.data || error.message);
      throw new Error('Failed to confirm pre-authorization with BOG');
    }
  }

  /**
   * Cancel pre-authorization
   */
  async cancelPreAuth(orderId: string): Promise<any> {
    const token = await this.getValidToken();

    try {
      const response = await axios.post(
        `${this.baseUrl}/payment/cancel/${orderId}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('BOG Cancel Pre-Auth Error:', error.response?.data || error.message);
      throw new Error('Failed to cancel pre-authorization with BOG');
    }
  }

  /**
   * Safe refund with validation
   */
  async safeRefund(orderId: string, amount?: number): Promise<any> {
    try {
      // First verify payment status
      const payment = await this.getPaymentDetails(orderId);
      
      if (payment.order_status.key !== 'completed') {
        throw new Error('Cannot refund non-completed payment');
      }
      
      const transferAmount = parseFloat(payment.purchase_units.transfer_amount);
      const refundedAmount = parseFloat(payment.purchase_units.refund_amount || '0');
      const availableForRefund = transferAmount - refundedAmount;
      
      if (amount && amount > availableForRefund) {
        throw new Error(`Refund amount exceeds available: ${availableForRefund}`);
      }
      
      return amount ? 
        await this.partialRefund(orderId, amount) : 
        await this.fullRefund(orderId);
        
    } catch (error: any) {
      console.error('Safe refund failed:', error);
      throw error;
    }
  }
}