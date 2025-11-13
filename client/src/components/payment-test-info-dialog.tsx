'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { PaymentMethod } from '@/constants/type'
import { CheckIcon, CopyIcon, InfoCircledIcon } from '@radix-ui/react-icons'
import { useState } from 'react'

interface TestCardInfo {
  title: string
  number: string
  expiry?: string
  cvv?: string
  otp?: string
  description?: string
}

const testCards: Record<string, TestCardInfo[]> = {
  [PaymentMethod.Stripe]: [
    {
      title: 'Success - Visa',
      number: '4242 4242 4242 4242',
      expiry: 'Any future date',
      cvv: 'Any 3 digits',
      description: 'Payment succeeds immediately',
    },
    {
      title: 'Success - Mastercard',
      number: '5555 5555 5555 4444',
      expiry: 'Any future date',
      cvv: 'Any 3 digits',
      description: 'Payment succeeds immediately',
    },
    {
      title: '3D Secure - Required',
      number: '4000 0027 6000 3184',
      expiry: 'Any future date',
      cvv: 'Any 3 digits',
      description: '3D Secure authentication required',
    },
    {
      title: 'Decline - Insufficient Funds',
      number: '4000 0000 0000 9995',
      expiry: 'Any future date',
      cvv: 'Any 3 digits',
      description: 'Card will be declined',
    },
  ],
  [PaymentMethod.YooKassa]: [
    {
      title: 'Success - Visa',
      number: '5555 5555 5555 4477',
      expiry: '02/29',
      cvv: '123',
      otp: '12345',
      description: 'Успешный платеж (Successful payment)',
    },
    {
      title: 'Success - Mastercard',
      number: '5555 5555 5555 4444',
      expiry: '12/29',
      cvv: '123',
      otp: '12345',
      description: 'Успешный платеж',
    },
    {
      title: '3D Secure Required',
      number: '4111 1111 1111 1026',
      expiry: '12/29',
      cvv: '123',
      otp: '12345',
      description: 'Требуется 3-D Secure',
    },
    {
      title: 'Decline - Insufficient Funds',
      number: '4111 1111 1111 1018',
      expiry: '12/29',
      cvv: '123',
      description: 'Недостаточно средств',
    },
  ],
  [PaymentMethod.VNPay]: [
    {
      title: 'NCB Bank - Success',
      number: '9704 0000 0000 0018',
      expiry: '07/15',
      cvv: 'Any',
      otp: '123456',
      description: 'Ngân hàng NCB - Giao dịch thành công',
    },
    {
      title: 'Vietcombank - Success',
      number: '9704 0000 0000 0026',
      expiry: '07/15',
      cvv: 'Any',
      otp: '123456',
      description: 'Vietcombank - Giao dịch thành công',
    },
    {
      title: 'Techcombank - Success',
      number: '9704 0000 0000 0034',
      expiry: '07/15',
      cvv: 'Any',
      otp: '123456',
      description: 'Techcombank - Giao dịch thành công',
    },
    {
      title: 'Decline - Insufficient Funds',
      number: '9704 0000 0000 0042',
      expiry: '07/15',
      cvv: 'Any',
      description: 'Không đủ số dư',
    },
  ],
}

export function PaymentTestInfoDialog({ paymentMethod }: { paymentMethod?: string }) {
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text.replace(/\s/g, ''))
    setCopiedText(text)
    setTimeout(() => setCopiedText(null), 2000)
  }

  const cards = paymentMethod && testCards[paymentMethod] ? testCards[paymentMethod] : []
  const allCards = Object.entries(testCards).flatMap(([method, cards]) =>
    cards.map((card) => ({ ...card, method }))
  )

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <InfoCircledIcon className="h-4 w-4" />
          Test Payment Info
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <InfoCircledIcon className="h-5 w-5" />
            Test Payment Information
          </DialogTitle>
          <DialogDescription>
            Use these test cards to simulate different payment scenarios in sandbox mode
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {paymentMethod && cards.length > 0 ? (
            // Show only selected payment method
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{paymentMethod}</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {cards.map((card, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">{card.title}</CardTitle>
                      {card.description && (
                        <CardDescription className="text-xs">{card.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center justify-between rounded bg-muted p-2">
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">Card Number</p>
                          <p className="font-mono text-sm font-semibold">{card.number}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => handleCopy(card.number)}
                        >
                          {copiedText === card.number ? (
                            <CheckIcon className="h-4 w-4 text-green-500" />
                          ) : (
                            <CopyIcon className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {card.expiry && (
                        <div className="flex gap-2">
                          <div className="flex-1 rounded bg-muted p-2">
                            <p className="text-xs text-muted-foreground">Expiry</p>
                            <p className="font-mono text-sm">{card.expiry}</p>
                          </div>
                          {card.cvv && (
                            <div className="flex-1 rounded bg-muted p-2">
                              <p className="text-xs text-muted-foreground">CVV</p>
                              <p className="font-mono text-sm">{card.cvv}</p>
                            </div>
                          )}
                        </div>
                      )}
                      {card.otp && (
                        <div className="rounded bg-muted p-2">
                          <p className="text-xs text-muted-foreground">OTP / 3DS Code</p>
                          <p className="font-mono text-sm font-semibold">{card.otp}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            // Show all payment methods
            <>
              {Object.entries(testCards).map(([method, cards]) => (
                <div key={method} className="space-y-4">
                  <h3 className="text-lg font-semibold">{method}</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {cards.map((card, index) => (
                      <Card key={index} className="overflow-hidden">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">{card.title}</CardTitle>
                          {card.description && (
                            <CardDescription className="text-xs">
                              {card.description}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex items-center justify-between rounded bg-muted p-2">
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground">Card Number</p>
                              <p className="font-mono text-sm font-semibold">{card.number}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={() => handleCopy(card.number)}
                            >
                              {copiedText === card.number ? (
                                <CheckIcon className="h-4 w-4 text-green-500" />
                              ) : (
                                <CopyIcon className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          {card.expiry && (
                            <div className="flex gap-2">
                              <div className="flex-1 rounded bg-muted p-2">
                                <p className="text-xs text-muted-foreground">Expiry</p>
                                <p className="font-mono text-sm">{card.expiry}</p>
                              </div>
                              {card.cvv && (
                                <div className="flex-1 rounded bg-muted p-2">
                                  <p className="text-xs text-muted-foreground">CVV</p>
                                  <p className="font-mono text-sm">{card.cvv}</p>
                                </div>
                              )}
                            </div>
                          )}
                          {card.otp && (
                            <div className="rounded bg-muted p-2">
                              <p className="text-xs text-muted-foreground">OTP / 3DS Code</p>
                              <p className="font-mono text-sm font-semibold">{card.otp}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Additional info */}
          <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950">
            <CardHeader>
              <CardTitle className="text-sm">⚠️ Important Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                <li>These cards only work in sandbox/test mode</li>
                <li>Never use real card details for testing</li>
                <li>Some cards require OTP/3DS authentication</li>
                <li>Test declined scenarios to ensure proper error handling</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
