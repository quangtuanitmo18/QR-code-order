'use client'

import { EmployeeSpinType } from '@/schemaValidations/employee-spin.schema'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'

interface RewardHistoryProps {
  spins: EmployeeSpinType[]
  isLoading?: boolean
  onClaim?: (spinId: number) => void
  isClaiming?: boolean
}

export function RewardHistory({
  spins,
  isLoading = false,
  onClaim,
  isClaiming = false,
}: RewardHistoryProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  if (spins.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <p>No spin history yet.</p>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="default">Pending</Badge>
      case 'CLAIMED':
        return <Badge variant="secondary">Claimed</Badge>
      case 'EXPIRED':
        return <Badge variant="outline">Expired</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Reward</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Claimed At</TableHead>
            {onClaim && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {spins.map((spin) => (
            <TableRow key={spin.id}>
              <TableCell>
                {spin.spinDate ? format(new Date(spin.spinDate), 'MMM dd, yyyy HH:mm') : '-'}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {spin.reward && (
                    <>
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: spin.reward.color || '#3b82f6' }}
                      />
                      <span className="font-medium">{spin.reward.name}</span>
                    </>
                  )}
                </div>
              </TableCell>
              <TableCell>{spin.reward?.type || '-'}</TableCell>
              <TableCell>{getStatusBadge(spin.status)}</TableCell>
              <TableCell>
                {spin.claimedAt ? format(new Date(spin.claimedAt), 'MMM dd, yyyy HH:mm') : '-'}
              </TableCell>
              {onClaim && (
                <TableCell className="text-right">
                  {spin.status !== 'CLAIMED' && (
                    <Button size="sm" onClick={() => onClaim(spin.id)} disabled={isClaiming}>
                      Claim
                    </Button>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
