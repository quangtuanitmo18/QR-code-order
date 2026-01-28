'use client'
import { useAppStore } from '@/components/app-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from '@/i18n/routing'
import { generateSocketInstace, handleErrorApi } from '@/lib/utils'
import { useGuestLoginMutation } from '@/queries/useGuest'
import { GuestLoginBody, GuestLoginBodyType } from '@/schemaValidations/guest.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useParams, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

export default function GuestLoginForm() {
  const setSocket = useAppStore((state) => state.setSocket)
  const setRole = useAppStore((state) => state.setRole)
  const searchParams = useSearchParams()
  const params = useParams()
  const tableNumber = Number(params.number)
  const token = searchParams.get('token')
  const router = useRouter()
  const t = useTranslations('GuestLoginForm')
  const loginMutation = useGuestLoginMutation()
  const form = useForm<GuestLoginBodyType>({
    resolver: zodResolver(GuestLoginBody),
    defaultValues: {
      name: '',
      token: token ?? '',
      tableNumber,
    },
  })

  useEffect(() => {
    if (!token) {
      router.push('/')
    }
  }, [token, router])

  async function onSubmit(values: GuestLoginBodyType) {
    if (loginMutation.isPending) return
    try {
      const result = await loginMutation.mutateAsync(values)
      setRole(result.payload.data.guest.role)
      setSocket(generateSocketInstace(result.payload.data.accessToken))
      router.push('/guest/menu')
    } catch (error) {
      handleErrorApi({
        error,
        setError: form.setError,
      })
    }
  }

  return (
    <Card className="mx-auto w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl">{t('title')}</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            className="w-full space-y-2"
            noValidate
            onSubmit={form.handleSubmit(onSubmit, console.log)}
          >
            <div className="grid gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid gap-2">
                      <Label htmlFor="name">{t('nameLabel')}</Label>
                      <Input id="name" type="text" required {...field} />
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" size="lg">
                {t('continueButton')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
