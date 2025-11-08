'use client'
import menuItems from '@/app/[locale]/manage/menuItems'
import { useAppStore } from '@/components/app-provider'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Link, usePathname } from '@/i18n/routing'
import { cn } from '@/lib/utils'
import { Package2, PanelLeft } from 'lucide-react'

export default function MobileNavLinks() {
  const pathname = usePathname()
  const role = useAppStore((state) => state.role)
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          className="min-h-[44px] min-w-[44px] sm:hidden sm:min-h-[40px] sm:min-w-[40px]"
        >
          <PanelLeft className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:max-w-xs">
        <SheetHeader className="sr-only">
          <SheetTitle />
          <SheetDescription />
        </SheetHeader>
        <nav className="grid gap-6 text-lg font-medium">
          <Link
            href="#"
            className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
          >
            <Package2 className="h-5 w-5 transition-all group-hover:scale-110" />
            <span className="sr-only">Acme Inc</span>
          </Link>
          {menuItems.map((Item, index) => {
            const isActive = pathname === Item.href
            if (!Item.roles.includes(role as any)) return null
            return (
              <Link
                key={index}
                href={Item.href}
                className={cn('flex min-h-[44px] items-center gap-4 px-2.5 hover:text-foreground', {
                  'text-foreground': isActive,
                  'text-muted-foreground': !isActive,
                })}
              >
                <Item.Icon className="h-5 w-5" />
                {Item.title}
              </Link>
            )
          })}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
