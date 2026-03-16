'use client'
import menuItems from '@/app/[locale]/manage/menuItems'
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
import { useAppStore } from '@/store/useAppStore'
import { PanelLeft, UtensilsCrossed } from 'lucide-react'

export default function MobileNavLinks() {
  const pathname = usePathname()
  const role = useAppStore((state) => state.role)

  if (pathname.includes('/manage/login')) {
    return null
  }

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
        <nav className="grid gap-2 text-lg font-medium">
          <Link
            href="#"
            className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-tr from-primary to-accent text-lg font-semibold text-primary-foreground shadow-md transition-all md:text-base"
          >
            <UtensilsCrossed className="h-5 w-5 transition-transform group-hover:scale-110" />
            <span className="sr-only">Acme Inc</span>
          </Link>
          {menuItems.map((Item, index) => {
            const isActive = pathname === Item.href
            if (!Item.roles.includes(role as any)) return null
            return (
              <Link
                key={Item.href}
                href={Item.href}
                className={cn(
                  'flex min-h-[44px] items-center gap-4 rounded-xl px-3 py-2 text-sm font-medium transition-all hover:text-foreground',
                  {
                    'bg-gradient-to-r from-primary to-accent text-white shadow-md': isActive,
                    'text-muted-foreground hover:bg-muted/50': !isActive,
                  }
                )}
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
