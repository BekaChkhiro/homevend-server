import { BogOrderRequest, BogOrderResponse, BogPaymentService } from './BogPaymentService.js';

/**
 * Mock BOG Payment Service for testing
 * This simulates BOG payment flow when real API credentials don't work
 */
export class BogPaymentServiceMock extends BogPaymentService {
  private mockOrders: Map<string, any> = new Map();

  constructor() {
    super();
    console.log('⚠️ Using MOCK BOG Payment Service - for testing only!');
  }

  /**
   * Override createOrder to return mock response
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
    console.log('🔄 MOCK: Creating BOG payment order...');
    console.log('- Order ID:', params.orderId);
    console.log('- Amount:', params.amount, params.currency || 'GEL');
    
    // Generate mock BOG order ID
    const mockBogOrderId = `BOG_MOCK_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Store order details for later verification
    this.mockOrders.set(mockBogOrderId, {
      ...params,
      status: 'created',
      createdAt: new Date()
    });
    
    // Generate BOG payment URL with the correct format
    const mockPaymentUrl = `https://payment.bog.ge/?order_id=${mockBogOrderId}`;
    
    console.log('✅ MOCK: Order created successfully');
    console.log('- Mock BOG Order ID:', mockBogOrderId);
    console.log('- Mock Payment URL:', mockPaymentUrl);
    
    // Return mock response matching BOG format
    return {
      id: mockBogOrderId,
      order_id: mockBogOrderId,
      _links: {
        redirect: {
          href: mockPaymentUrl
        }
      }
    };
  }

  /**
   * Simulate payment completion (for testing)
   */
  async simulatePaymentCompletion(orderId: string): Promise<void> {
    const order = this.mockOrders.get(orderId);
    if (!order) {
      throw new Error('Mock order not found');
    }
    
    // Update order status
    order.status = 'completed';
    order.completedAt = new Date();
    
    console.log('✅ MOCK: Payment completed for order:', orderId);
    
    // In a real scenario, this would trigger the webhook
    // For now, the calling code should handle the balance update
  }

  /**
   * Override signature verification to always return true in mock mode
   */
  public verifySignature(signature: string, body: any): boolean {
    console.log('⚠️ MOCK: Signature verification bypassed');
    return true;
  }

  /**
   * Get mock order details
   */
  async getPaymentDetails(orderId: string): Promise<any> {
    const order = this.mockOrders.get(orderId);
    if (!order) {
      throw new Error('Mock order not found');
    }
    
    return {
      order_id: orderId,
      order_status: {
        key: order.status === 'completed' ? 'completed' : 'created',
        value: order.status === 'completed' ? 'გადახდილი' : 'შექმნილი'
      },
      external_order_id: order.orderId,
      purchase_units: {
        transfer_amount: order.amount.toString(),
        currency_code: order.currency || 'GEL'
      },
      payment_detail: order.status === 'completed' ? {
        transfer_method: {
          key: 'card',
          value: 'ბარათით გადახდა'
        },
        transaction_id: `MOCK_TXN_${Date.now()}`,
        code: '100',
        code_description: 'Successful payment (MOCK)'
      } : undefined
    };
  }
}