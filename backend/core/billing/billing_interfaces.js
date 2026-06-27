/**
 * Booza Think Platform OS - Billing & Usage Engine Interfaces (Phase 6-4)
 */

// 1. Payment Provider Interface (Stripe, Toss, PayPal, Apple Pay 등과 연동 교체 가능 구조)
class PaymentProviderInterface {
  constructor(providerName) {
    this.providerName = providerName;
  }
  
  async initPayment(amount, currency, orderId) {
    throw new Error('initPayment must be implemented by payment provider');
  }

  async verifyPayment(paymentKey, amount) {
    throw new Error('verifyPayment must be implemented by payment provider');
  }

  async refundPayment(paymentKey, reason) {
    throw new Error('refundPayment must be implemented by payment provider');
  }
}

// 2. Subscription Interface (구독 요금제 관리 구조)
class SubscriptionInterface {
  async getSubscription(projectId) {
    throw new Error('getSubscription must be implemented');
  }

  async upgradeSubscription(projectId, targetTier) {
    throw new Error('upgradeSubscription must be implemented');
  }

  async cancelSubscription(projectId) {
    throw new Error('cancelSubscription must be implemented');
  }
}

// 3. Quota & Limits Interface (자원 할당 사용량 한도 제어)
class QuotaInterface {
  async checkQuota(projectId, resourceMetric, requestedQty) {
    throw new Error('checkQuota must be implemented');
  }

  async consumeQuota(projectId, resourceMetric, qty) {
    throw new Error('consumeQuota must be implemented');
  }
}

// 4. Mock Stub Implementations (Stripe & Toss Pay Stubs)
class StripePaymentProvider extends PaymentProviderInterface {
  constructor() {
    super('Stripe');
  }
  async initPayment(amount, currency, orderId) {
    console.log(`[Stripe Pay Stub] Initiating Stripe Payment: ${amount} ${currency} for ${orderId}`);
    return { success: true, paymentUrl: 'https://checkout.stripe.com/stub-pay-session', provider: 'Stripe' };
  }
  async verifyPayment(paymentKey, amount) {
    console.log(`[Stripe Pay Stub] Verifying Stripe Session key: ${paymentKey}`);
    return { success: true, transactionId: `txn_stripe_${Date.now()}` };
  }
}

class TossPaymentProvider extends PaymentProviderInterface {
  constructor() {
    super('Toss');
  }
  async initPayment(amount, currency, orderId) {
    console.log(`[Toss Pay Stub] Initiating Toss Payment: ${amount} ${currency} for ${orderId}`);
    return { success: true, paymentUrl: 'https://api.tosspayments.com/v1/stub-checkout', provider: 'Toss' };
  }
  async verifyPayment(paymentKey, amount) {
    console.log(`[Toss Pay Stub] Verifying Toss payments client: ${paymentKey}`);
    return { success: true, transactionId: `txn_toss_${Date.now()}` };
  }
}

// 5. Billing Engine & Usage Engine Stubs
class BillingEngine {
  constructor(paymentProvider) {
    this.provider = paymentProvider;
  }
  async processInvoice(projectId, amount, currency) {
    console.log(`[Billing Engine] Processing invoice for project ${projectId} of amount: ${amount}`);
    return await this.provider.initPayment(amount, currency, `inv_${Date.now()}`);
  }
}

class UsageEngine {
  async trackUsage(projectId, metricName, quantity, unit) {
    console.log(`[Usage Engine] Measuring resource usage for ${projectId}: ${quantity} ${unit} of ${metricName}`);
    return { success: true, measured: true, timestamp: new Date() };
  }
}

module.exports = {
  PaymentProviderInterface,
  SubscriptionInterface,
  QuotaInterface,
  StripePaymentProvider,
  TossPaymentProvider,
  BillingEngine,
  UsageEngine
};
