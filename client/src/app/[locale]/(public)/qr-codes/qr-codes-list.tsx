'use client'
import QRCodeTable from '@/components/qrcode-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, Users } from 'lucide-react'
import { useTranslations } from 'next-intl'

type Table = {
  number: number
  capacity: number
  status: string
  token: string
}

export default function QRCodesList({ tables }: { tables: Table[] }) {
  const t = useTranslations('QRCodes')

  const downloadQRCode = (tableNumber: number) => {
    const canvas = document.querySelector(
      `canvas[data-table="${tableNumber}"]`
    ) as HTMLCanvasElement
    if (!canvas) return

    const url = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `table-${tableNumber}-qr-code.png`
    link.href = url
    link.click()
  }

  if (tables.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">{t('noTables')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {tables.map((table) => (
        <Card key={table.number} className="overflow-hidden">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">
                {t('tableNumber', { number: table.number })}
              </CardTitle>
              <Badge variant={table.status === 'Available' ? 'default' : 'secondary'}>
                {table.status}
              </Badge>
            </div>
            <CardDescription className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {t('capacity', { capacity: table.capacity })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center rounded-lg bg-white p-4">
              <div data-table={table.number}>
                <QRCodeTable token={table.token} tableNumber={table.number} width={200} />
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => downloadQRCode(table.number)}
            >
              <Download className="mr-2 h-4 w-4" />
              Download QR Code
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
