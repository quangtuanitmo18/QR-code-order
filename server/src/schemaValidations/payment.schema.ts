import { PaymentMethodValues, PaymentStatusValues } from '@/constants/type'
import z from 'zod'
import { AccountSchema } from './account.schema'
import { OrderSchema } from './order.schema'

export const PaymentSchema = z.object({
  id: z.number(),
  guestId: z.number().nullable(),
  tableNumber: z.number().nullable(),
  amount: z.number(),
  paymentMethod: z.enum(PaymentMethodValues),
  status: z.enum(PaymentStatusValues),
  transactionRef: z.string(),
  externalTransactionId: z.string().nullable(),
  externalCustomerId: z.string().nullable(),
  externalSessionId: z.string().nullable(),
  paymentUrl: z.string().nullable(),
  returnUrl: z.string().nullable(),
  ipAddress: z.string().nullable(),
  responseCode: z.string().nullable(),
  responseMessage: z.string().nullable(),
  bankCode: z.string().nullable(),
  cardType: z.string().nullable(),
  paymentIntentStatus: z.string().nullable(),
  last4Digits: z.string().nullable(),
  cardBrand: z.string().nullable(),
  currency: z.string().nullable(),
  metadata: z.string().nullable(),
  description: z.string().nullable(),
  note: z.string().nullable(),
  paymentHandlerId: z.number().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  paidAt: z.date().nullable()
})

export type PaymentSchemaType = z.TypeOf<typeof PaymentSchema>

// Create payment body
export const CreatePaymentBody = z.object({
  paymentMethod: z.enum(PaymentMethodValues),
  returnUrl: z.string().url().optional(),
  note: z.string().optional(),
  currency: z.enum(['USD', 'VND']).default('USD')
})

export type CreatePaymentBodyType = z.TypeOf<typeof CreatePaymentBody>

// Create payment response
export const CreatePaymentRes = z.object({
  message: z.string(),
  data: z.object({
    payment: PaymentSchema,
    paymentUrl: z.string().optional(),
    orders: z.array(OrderSchema).optional()
  })
})

export type CreatePaymentResType = z.TypeOf<typeof CreatePaymentRes>

// Get payments query params
export const GetPaymentsQueryParams = z.object({
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  status: z.enum(PaymentStatusValues).optional(),
  paymentMethod: z.enum(PaymentMethodValues).optional()
})

export type GetPaymentsQueryParamsType = z.TypeOf<typeof GetPaymentsQueryParams>

// Get payment list
export const GetPaymentsRes = z.object({
  message: z.string(),
  data: z.array(
    PaymentSchema.extend({
      guest: z
        .object({
          id: z.number(),
          name: z.string(),
          tableNumber: z.number().nullable()
        })
        .nullable(),
      paymentHandler: AccountSchema.nullable()
    })
  )
})

export type GetPaymentsResType = z.TypeOf<typeof GetPaymentsRes>

// Get payment detail
export const GetPaymentDetailRes = z.object({
  message: z.string(),
  data: PaymentSchema.extend({
    orders: z.array(OrderSchema),
    guest: z
      .object({
        id: z.number(),
        name: z.string(),
        tableNumber: z.number().nullable()
      })
      .nullable(),
    paymentHandler: AccountSchema.nullable()
  })
})

export type GetPaymentDetailResType = z.TypeOf<typeof GetPaymentDetailRes>

export const PaymentParam = z.object({
  paymentId: z.coerce.number()
})

export type PaymentParamType = z.TypeOf<typeof PaymentParam>

// server/src/schemaValidations/payment.schema.ts

export const CreatePaymentBodyWithCurrency = z.object({
  paymentMethod: z.enum(PaymentMethodValues),
  returnUrl: z.string().url().optional(),
  note: z.string().optional(),
  currency: z.enum(['USD', 'VND']).default('USD')
})

export type CreatePaymentBodyWithCurrencyType = z.TypeOf<typeof CreatePaymentBodyWithCurrency>
