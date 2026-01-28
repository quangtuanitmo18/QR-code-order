// server/src/utils/vnpay.ts

import envConfig from '@/config'

// Lazy load vnpay module
let vnpayInstance: any = null
let VnpLocaleEnum: any = null
let ProductCodeEnum: any = null
let HashAlgorithmEnum: any = null

async function getVnpay() {
  if (!vnpayInstance) {
    const vnpayModule = await import('vnpay')
    VnpLocaleEnum = vnpayModule.VnpLocale
    ProductCodeEnum = vnpayModule.ProductCode
    HashAlgorithmEnum = vnpayModule.HashAlgorithm

    vnpayInstance = new vnpayModule.VNPay({
      tmnCode: envConfig.VNPAY_TMN_CODE,
      secureSecret: envConfig.VNPAY_SECURE_SECRET,
      vnpayHost: envConfig.VNPAY_URL,
      testMode: true,
      hashAlgorithm: HashAlgorithmEnum.SHA512
    })
  }

  return vnpayInstance
}

export interface BuildPaymentUrlParams {
  amount: number
  orderId: string
  orderInfo: string
  ipAddr: string
  locale?: string
  returnUrl?: string
}

export const buildVNPayPaymentUrl = async (params: BuildPaymentUrlParams) => {
  const vnpay = await getVnpay()
  const { amount, orderId, orderInfo, ipAddr, locale, returnUrl } = params

  return vnpay.buildPaymentUrl({
    vnp_Amount: amount,
    vnp_IpAddr: ipAddr,
    vnp_TxnRef: orderId,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: ProductCodeEnum.Other,
    vnp_ReturnUrl: returnUrl || envConfig.VNPAY_RETURN_URL,
    vnp_Locale: VnpLocaleEnum.VN
  })
}

export const verifyVNPayReturn = async (query: any) => {
  console.log('query', query)
  const vnpay = await getVnpay()
  console.log('vnpay', vnpay)
  return vnpay.verifyReturnUrl(query)
}

export const verifyVNPayIPN = async (body: any) => {
  const vnpay = await getVnpay()
  return vnpay.verifyIpnCall(body)
}

// Manual type definitions (instead of re-exporting from vnpay)
export enum VnpLocale {
  VN = 'vn',
  EN = 'en'
}

export enum ProductCode {
  Other = 'other',
  Bill = 'bill',
  Fashion = 'fashion',
  Phone = 'phone'
}

export enum HashAlgorithm {
  SHA256 = 'SHA256',
  SHA512 = 'SHA512',
  MD5 = 'MD5'
}
