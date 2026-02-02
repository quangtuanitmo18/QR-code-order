'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { GetActiveRewardsResType } from '@/schemaValidations/employee-spin.schema'

interface SpinWheelProps {
  rewards: GetActiveRewardsResType['data']
  onSpin: (spinId: number) => Promise<void>
  availableSpins: number
  pendingSpinId?: number | null
  isLoading?: boolean
}

export function SpinWheel({
  rewards,
  onSpin,
  availableSpins,
  pendingSpinId,
  isLoading = false,
  wonRewardId,
}: SpinWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const wheelRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Calculate wheel segments
  const totalProbability = rewards.reduce((sum, r) => sum + r.probability, 0)
  const normalizedRewards = rewards.map((r) => ({
    ...r,
    normalizedProbability: r.probability / totalProbability,
  }))

  // Calculate angles for each segment
  const segments = normalizedRewards.map((reward, index) => {
    const startAngle = normalizedRewards
      .slice(0, index)
      .reduce((sum, r) => sum + r.normalizedProbability * 360, 0)
    const endAngle = startAngle + reward.normalizedProbability * 360
    return {
      ...reward,
      startAngle,
      endAngle,
      angle: reward.normalizedProbability * 360,
    }
  })

  // Animate to won reward when wonRewardId changes
  useEffect(() => {
    if (wonRewardId && isSpinning) {
      const segment = segments.find((s) => s.id === wonRewardId)
      if (segment) {
        // Calculate the center angle of the segment
        const finalAngle = segment.startAngle + segment.angle / 2

        // Add multiple full rotations for smooth animation
        const fullRotations = 5 // Number of full 360° rotations
        const totalRotation = fullRotations * 360 + (360 - finalAngle) + rotation

        // Animate
        setRotation(totalRotation)

        // Reset spinning state after animation
        setTimeout(() => {
          setIsSpinning(false)
        }, 3000)
      }
    }
  }, [wonRewardId, segments, rotation, isSpinning])

  // Reset wonRewardId when starting a new spin
  useEffect(() => {
    if (!isSpinning && wonRewardId) {
      // Reset after a delay to allow modal to show
      const timer = setTimeout(() => {
        // This will be handled by parent component
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [isSpinning, wonRewardId])

  const handleSpin = async () => {
    if (!pendingSpinId || isSpinning || availableSpins === 0) return

    setIsSpinning(true)

    try {
      // Call onSpin callback - it will return the result with the reward
      const result = await onSpin(pendingSpinId)

      // The parent component will update wonRewardId prop, which triggers the animation
      // via the useEffect above
    } catch (error) {
      console.error('Spin error:', error)
      setIsSpinning(false)
    }
  }

  // Reset rotation when rewards change
  useEffect(() => {
    setRotation(0)
  }, [rewards])

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
        {/* Wheel Container */}
        <div ref={containerRef} className="relative aspect-square w-full max-w-md">
          {/* Wheel */}
          <div
            ref={wheelRef}
            className="duration-3000 relative h-full w-full overflow-hidden rounded-full border-4 border-gray-800 transition-transform ease-out"
            style={{
              transform: `rotate(${rotation}deg)`,
            }}
          >
            {/* Segments */}
            <svg className="h-full w-full" viewBox="0 0 400 400">
              <defs>
                {segments.map((segment, index) => {
                  // Convert Tailwind color class to hex (simplified - you may need a color mapping)
                  const colorMap: Record<string, string> = {
                    'bg-blue-500': '#3b82f6',
                    'bg-green-500': '#22c55e',
                    'bg-red-500': '#ef4444',
                    'bg-yellow-500': '#eab308',
                    'bg-purple-500': '#a855f7',
                    'bg-pink-500': '#ec4899',
                    'bg-orange-500': '#f97316',
                    'bg-indigo-500': '#6366f1',
                  }
                  const baseColor =
                    colorMap[segment.color] || segment.color.replace('bg-', '#3b82f6')
                  return (
                    <linearGradient
                      key={index}
                      id={`gradient-${index}`}
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor={baseColor} stopOpacity="0.9" />
                      <stop offset="100%" stopColor={baseColor} stopOpacity="0.7" />
                    </linearGradient>
                  )
                })}
              </defs>
              {segments.map((segment, index) => {
                const startAngleRad = ((segment.startAngle - 90) * Math.PI) / 180
                const endAngleRad = ((segment.endAngle - 90) * Math.PI) / 180
                const largeArcFlag = segment.angle > 180 ? 1 : 0

                const x1 = 200 + 200 * Math.cos(startAngleRad)
                const y1 = 200 + 200 * Math.sin(startAngleRad)
                const x2 = 200 + 200 * Math.cos(endAngleRad)
                const y2 = 200 + 200 * Math.sin(endAngleRad)

                // Calculate text position (middle of segment)
                const textAngle =
                  ((segment.startAngle + segment.endAngle) / 2 - 90) * (Math.PI / 180)
                const textRadius = 150
                const textX = 200 + textRadius * Math.cos(textAngle)
                const textY = 200 + textRadius * Math.sin(textAngle)

                return (
                  <g key={index}>
                    <path
                      d={`M 200 200 L ${x1} ${y1} A 200 200 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                      fill={`url(#gradient-${index})`}
                      stroke="#fff"
                      strokeWidth="2"
                    />
                    <text
                      x={textX}
                      y={textY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-white text-sm font-bold"
                      transform={`rotate(${segment.startAngle + segment.angle / 2}, ${textX}, ${textY})`}
                    >
                      {segment.name}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>

          {/* Pointer/Indicator */}
          <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-2">
            <div className="h-0 w-0 border-l-[15px] border-r-[15px] border-t-[30px] border-l-transparent border-r-transparent border-t-red-600" />
          </div>
        </div>

        {/* Spin Button */}
        <Button
          onClick={handleSpin}
          disabled={isSpinning || isLoading || availableSpins === 0 || !pendingSpinId}
          size="lg"
          className="min-w-[200px]"
        >
          {isSpinning || isLoading ? (
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
