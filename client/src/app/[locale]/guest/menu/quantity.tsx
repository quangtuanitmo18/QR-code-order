import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Minus, Plus } from 'lucide-react'

export default function Quantity({
  onChange,
  value,
}: {
  onChange: (value: number) => void
  value: number
}) {
  return (
    <div className="flex gap-1 sm:gap-2">
      <Button
        className="h-11 w-11 p-0 sm:h-10 sm:w-10"
        size="icon"
        disabled={value === 0}
        onClick={() => onChange(value - 1)}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <Input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        className="h-11 w-12 p-1 text-center text-sm sm:h-10 sm:w-14"
        value={value}
        onChange={(e) => {
          let value = e.target.value
          const numberValue = Number(value)
          if (isNaN(numberValue)) {
            return
          }
          onChange(numberValue)
        }}
      />
      <Button
        className="h-11 w-11 p-0 sm:h-10 sm:w-10"
        size="icon"
        onClick={() => onChange(value + 1)}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  )
}
