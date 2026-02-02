'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GetActiveRewardsResType, EmployeeSpinType } from '@/schemaValidations/employee-spin.schema'
import { CheckCircle2, X } from 'lucide-react'

interface SpinResultModalProps {
  reward: (GetActiveRewardsResType['data'][0] & { id: number }) | null
  employeeSpin: EmployeeSpinType | null
  isOpen: boolean
  onClose: () => void
  onClaim?: () => void
}

export function SpinResultModal({
  reward,
  employeeSpin,
  isOpen,
  onClose,
  onClaim,
}: SpinResultModalProps) {
  if (!reward || !employeeSpin) return null

  const canClaim = employeeSpin.status === 'PENDING' && !employeeSpin.expiredAt

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">Congratulations! 🎉</DialogTitle>
          <DialogDescription className="text-center">You won a reward!</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          {/* Reward Display */}
          <div
            className="flex h-32 w-32 items-center justify-center rounded-full text-2xl font-bold text-white shadow-lg"
            style={{ backgroundColor: reward.color || '#3b82f6' }}
          >
            {reward.icon ? (
              <span className="text-4xl">{reward.icon}</span>
            ) : (
              <CheckCircle2 className="h-16 w-16" />
            )}
          </div>

          {/* Reward Name */}
          <div className="text-center">
            <h3 className="mb-2 text-2xl font-bold">{reward.name}</h3>
            {reward.description && (
              <p className="text-sm text-muted-foreground">{reward.description}</p>
            )}
            {reward.value && (
              <Badge variant="secondary" className="mt-2">
                {reward.value}
              </Badge>
            )}
          </div>

          {/* Status Info */}
          <div className="w-full space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant={employeeSpin.status === 'PENDING' ? 'default' : 'secondary'}>
                {employeeSpin.status}
              </Badge>
            </div>
            {employeeSpin.expiredAt && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Expires:</span>
                <span>{new Date(employeeSpin.expiredAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex w-full gap-3">
            {canClaim && onClaim && (
              <Button onClick={onClaim} className="flex-1">
                Claim Reward
              </Button>
            )}
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
