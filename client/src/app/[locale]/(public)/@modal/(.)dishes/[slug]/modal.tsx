'use client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { useRouter } from '@/i18n/routing'

import { useState } from 'react'
export default function Modal({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [open, setOpen] = useState(true)

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        setOpen(open)
        if (!open) router.back()
      }}
    >
      <DialogContent className='max-h-full overflow-auto'>
        <DialogHeader className='hidden'>
          <DialogTitle></DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}
