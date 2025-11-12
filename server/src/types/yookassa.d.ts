// Type definitions for @appigram/yookassa-node
declare module '@appigram/yookassa-node' {
  export interface YooKassaConfig {
    shopId: string
    secretKey: string
  }

  export interface YooKassaAmount {
    value: string
    currency: string
  }

  export interface YooKassaConfirmation {
    type: string
    return_url?: string
    confirmation_url?: string
  }

  export interface YooKassaCustomer {
    email?: string
    phone?: string
  }

  export interface YooKassaReceiptItem {
    description: string
    quantity: string
    amount: YooKassaAmount
    vat_code: number
  }

  export interface YooKassaReceipt {
    customer?: YooKassaCustomer
    items: YooKassaReceiptItem[]
  }

  export interface YooKassaPaymentRequest {
    amount: YooKassaAmount
    confirmation: YooKassaConfirmation
    capture?: boolean
    description?: string
    metadata?: Record<string, any>
    receipt?: YooKassaReceipt
  }

  export interface YooKassaPaymentMethod {
    type: string
    id: string
    saved: boolean
    card?: {
      first6: string
      last4: string
      expiry_year: string
      expiry_month: string
      card_type: string
      issuer_country?: string
    }
  }

  export interface YooKassaPayment {
    id: string
    status: 'pending' | 'waiting_for_capture' | 'succeeded' | 'canceled'
    amount: YooKassaAmount
    description?: string
    created_at: string
    expires_at?: string
    confirmation?: YooKassaConfirmation
    metadata?: Record<string, any>
    payment_method?: YooKassaPaymentMethod
    paid: boolean
    refundable: boolean
    test: boolean
  }

  export class YooKassa {
    constructor(config: YooKassaConfig)
    createPayment(payment: YooKassaPaymentRequest): Promise<YooKassaPayment>
    getPayment(paymentId: string): Promise<YooKassaPayment>
    capturePayment(paymentId: string, amount?: YooKassaAmount): Promise<YooKassaPayment>
    cancelPayment(paymentId: string): Promise<YooKassaPayment>
  }
}
