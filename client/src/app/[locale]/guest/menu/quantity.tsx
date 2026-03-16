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
    <div className="flex items-center gap-1 rounded-full border border-border/50 bg-background/50 p-1 shadow-sm backdrop-blur-sm sm:gap-2">
      <Button
        variant="ghost"
        className="h-9 w-9 rounded-full p-0 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary sm:h-8 sm:w-8"
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
        className="h-9 w-12 border-none bg-transparent p-1 text-center text-base font-semibold focus-visible:ring-0 sm:h-8 sm:w-14"
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
        className="h-9 w-9 rounded-full bg-primary p-0 text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md sm:h-8 sm:w-8"
        size="icon"
        onClick={() => onChange(value + 1)}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  )
}
