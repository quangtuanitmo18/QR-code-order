'use client'
import { getTableLink } from '@/lib/utils'
import QRCode from 'qrcode'
import { useEffect, useRef } from 'react'

export default function QRCodeTable({
  token,
  tableNumber,
  width = 250,
}: {
  token: string
  tableNumber: number
  width?: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current!
    canvas.height = width + 70
    canvas.width = width
    const canvasContext = canvas.getContext('2d')!
    canvasContext.fillStyle = '#fff'
    canvasContext.fillRect(0, 0, canvas.width, canvas.height)
    canvasContext.font = '20px Arial'
    canvasContext.textAlign = 'center'
    canvasContext.fillStyle = '#000'
    canvasContext.fillText(`Table ${tableNumber}`, canvas.width / 2, canvas.width + 20)
    canvasContext.fillText(`Scan QR code to order`, canvas.width / 2, canvas.width + 50)
    const virtalCanvas = document.createElement('canvas')
    QRCode.toCanvas(
      virtalCanvas,
      getTableLink({
        token,
        tableNumber,
      }),
      {
        width,
        margin: 4,
      },
      function (error) {
        if (error) console.error(error)
        canvasContext.drawImage(virtalCanvas, 0, 0, width, width)
      }
    )
  }, [token, width, tableNumber])
  return <canvas ref={canvasRef} className="h-auto max-w-full" data-table={tableNumber} />
}
