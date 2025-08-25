import crypto from 'crypto';
import axios from 'axios';

export interface FlittOrderRequest {
  merchant_id: string;
  order_id: string;
  amount: string;
  currency: string;
  order_desc: string;
  server_callback_url: string;
  response_url: string;
}

export interface FlittOrderResponse {
  response_status: 'success' | 'failure';
  checkout_url?: string;
  token?: string;
  payment_id?: string;
  error_message?: string;
  error_code?: string;
}

export interface FlittCallbackData {
  merchant_id: string;
  order_id: string;
  amount: string;
  currency: string;
  order_status: string;
  payment_id: string;
  signature: string;
  [key: string]: any;
}

export class FlittPaymentService {
  private merchantId: string;
  private secretKey: string;
  private baseUrl: string;

  constructor() {
    this.merchantId = process.env.FLITT_MERCHANT_ID!;
    this.secretKey = process.env.FLITT_SECRET_KEY!;
    this.baseUrl = process.env.FLITT_BASE_URL || 'https://checkout.flitt.com';
    
    if (!this.merchantId || !this.secretKey) {
      throw new Error('Flitt merchant ID and secret key are required');
    }
  }

  /**
   * Generate signature for Flitt API requests
   */
  private generateSignature(params: Record<string, any>): string {
    // Remove empty parameters and signature itself
    const filteredParams: Record<string, string> = {};
    
    Object.keys(params).forEach(key => {
      const value = params[key];
      if (value !== null && value !== undefined && value !== '' && key !== 'signature') {
        filteredParams[key] = String(value);
      }
    });

    // Sort parameters alphabetically and create string
    const sortedKeys = Object.keys(filteredParams).sort();
    const signatureString = [this.secretKey, ...sortedKeys.map(key => filteredParams[key])].join('|');
    
    // Generate SHA1 hash and return lowercase
    return crypto.createHash('sha1').update(signatureString, 'utf8').digest('hex').toLowerCase();
  }

  /**
   * Verify signature from Flitt callback
   */
  public verifySignature(callbackData: FlittCallbackData): boolean {
    const receivedSignature = callbackData.signature;
    const calculatedSignature = this.generateSignature(callbackData);
    
    return receivedSignature === calculatedSignature;
  }

  /**
   * Create payment order with Flitt
   */
  async createOrder(params: {
    orderId: string;
    amount: number;
    description: string;
    callbackUrl: string;
    responseUrl: string;
  }): Promise<FlittOrderResponse> {
    const orderData: FlittOrderRequest = {
      merchant_id: this.merchantId,
      order_id: params.orderId,
      amount: params.amount.toFixed(2),
      currency: 'GEL',
      order_desc: params.description,
      server_callback_url: params.callbackUrl,
      response_url: params.responseUrl
    };

    // Generate signature
    const signature = this.generateSignature(orderData);
    const requestData = { ...orderData, signature };

    try {
      const response = await axios.post(
        `${this.baseUrl}/api/checkout/url`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 30000
        }
      );

      return response.data as FlittOrderResponse;
    } catch (error: any) {
      console.error('Flitt API Error:', error.response?.data || error.message);
      
      return {
        response_status: 'failure',
        error_message: error.response?.data?.error_message || 'Network error occurred',
        error_code: error.response?.data?.error_code || 'NETWORK_ERROR'
      };
    }
  }

  /**
   * Get order status from Flitt
   */
  async getOrderStatus(orderId: string): Promise<any> {
    const params = {
      merchant_id: this.merchantId,
      order_id: orderId
    };

    const signature = this.generateSignature(params);
    const requestData = { ...params, signature };

    try {
      const response = await axios.post(
        `${this.baseUrl}/api/get_order_status/`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 15000
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Flitt Order Status Error:', error.response?.data || error.message);
      throw error;
    }
  }
}