'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GetActiveRewardsResType } from '@/schemaValidations/employee-spin.schema'
import { Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useMemo } from 'react'

// Dynamic import Wheel component to avoid SSR issues (library uses window object)
const Wheel = dynamic(() => import('react-custom-roulette').then((mod) => mod.Wheel), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  ),
})

interface SpinWheelProps {
  rewards: GetActiveRewardsResType['data']
  availableSpins: number
  isSpinning: boolean
  isLoading: boolean
  mustSpin: boolean
  prizeNumber: number | null
  onSpinClick: () => void
  onStopSpinning: () => void
}

export function SpinWheel({
  rewards,
  availableSpins,
  isSpinning,
  isLoading,
  mustSpin,
  prizeNumber,
  onSpinClick,
  onStopSpinning,
}: SpinWheelProps) {
  // Map rewards to wheel data format required by react-custom-roulette
  // Format: { option: string, style?: { backgroundColor?: string, textColor?: string } }
  // Backend trả về color là CSS color name (blue, green, red, pink, indigo, etc.)
  const wheelData = useMemo(
    () =>
      rewards.map((r) => ({
        option: r.name,
        style: {
          backgroundColor: r.color || 'blue',
          textColor: '#ffffff',
        },
      })),
    [rewards]
  )

  if (rewards.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Spin Wheel</CardTitle>
          <CardDescription>No rewards available</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">Please contact admin to add rewards.</p>
        </CardContent>
      </Card>
    )
  }

  // Ensure prizeNumber is valid (library requires valid index)
  const effectivePrizeNumber =
    prizeNumber !== null && prizeNumber >= 0 && prizeNumber < wheelData.length ? prizeNumber : 0

  // Debug log
  if (mustSpin && prizeNumber !== null) {
    console.log(
      '[SpinWheel] Spinning to prizeNumber:',
      effectivePrizeNumber,
      'reward:',
      wheelData[effectivePrizeNumber]?.option
    )
  }

  const disableSpinButton = isSpinning || isLoading || availableSpins === 0 || mustSpin

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spin Wheel</CardTitle>
        <CardDescription>
          {availableSpins > 0
            ? `You have ${availableSpins} spin${availableSpins > 1 ? 's' : ''} available`
            : 'No spins available'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        {/* Wheel Container - Library handles its own pointer */}
        <div className="flex aspect-square w-full max-w-md items-center justify-center">
          <Wheel
            mustStartSpinning={mustSpin}
            prizeNumber={effectivePrizeNumber}
            data={wheelData}
            // Theo docs: đơn vị là giây, default ~0.5s
            spinDuration={0.6}
            outerBorderColor="#1f2937"
            outerBorderWidth={4}
            radiusLineColor="#020617"
            radiusLineWidth={2}
            textDistance={70}
            onStopSpinning={onStopSpinning}
          />
        </div>

        {/* Spin Button */}
        <Button
          onClick={onSpinClick}
          disabled={disableSpinButton}
          size="lg"
          className="min-w-[200px]"
        >
          {isSpinning || isLoading || mustSpin ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Spinning...
            </>
          ) : availableSpins === 0 ? (
            'No Spins Available'
          ) : (
            'Spin Now!'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
