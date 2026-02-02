'use client'

import { EmployeeSpinType } from '@/schemaValidations/employee-spin.schema'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { CheckCircle2 } from 'lucide-react'

interface PendingRewardsProps {
  spins: EmployeeSpinType[]
  onClaim: (spinId: number) => Promise<void>
  isLoading?: boolean
}

export function PendingRewards({ spins, onClaim, isLoading = false }: PendingRewardsProps) {
  if (spins.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Rewards</CardTitle>
          <CardDescription>No pending rewards to claim</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">All your rewards have been claimed!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Rewards</CardTitle>
        <CardDescription>
          You have {spins.length} reward{spins.length > 1 ? 's' : ''} to claim
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {spins.map((spin) => {
            const isExpired = spin.expiredAt && new Date(spin.expiredAt) < new Date()

            return (
              <div
                key={spin.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex flex-1 items-center gap-4">
                  {spin.reward && (
                    <>
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-full font-bold text-white shadow-md"
                        style={{ backgroundColor: spin.reward.color || '#3b82f6' }}
                      >
                        {spin.reward.icon ? (
                          <span className="text-xl">{spin.reward.icon}</span>
                        ) : (
                          <CheckCircle2 className="h-6 w-6" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{spin.reward.name}</h4>
                        {spin.reward.description && (
                          <p className="text-sm text-muted-foreground">{spin.reward.description}</p>
                        )}
                        <div className="mt-1 flex items-center gap-2">
                          <Badge variant="outline">{spin.reward.type}</Badge>
                          {spin.expiredAt && (
                            <span className="text-xs text-muted-foreground">
                              Expires: {format(new Date(spin.expiredAt), 'MMM dd, yyyy')}
                            </span>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <Button
                  onClick={() => onClaim(spin.id)}
                  disabled={isLoading || isExpired}
                  variant={isExpired ? 'outline' : 'default'}
                >
                  {isExpired ? 'Expired' : 'Claim'}
                </Button>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
