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
import { Package2, PanelLeft } from 'lucide-react'

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
          className="min-h-[44px] min-w-[44px] rounded-xl border-border/50 sm:hidden sm:min-h-[40px] sm:min-w-[40px]"
        >
          <PanelLeft className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] border-r border-border/40 sm:max-w-xs">
        <SheetHeader className="sr-only">
          <SheetTitle />
          <SheetDescription />
        </SheetHeader>
        <nav className="grid gap-1.5 pt-4 text-lg font-medium">
          <Link
            href="#"
            className="group mb-4 flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary text-lg font-semibold text-primary-foreground shadow-glow md:text-base"
          >
            <Package2 className="h-5 w-5 transition-all group-hover:scale-110" />
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
                  'relative flex min-h-[44px] items-center gap-4 rounded-xl px-3 transition-all hover:bg-accent hover:text-foreground',
                  {
                    'bg-primary/10 font-medium text-primary': isActive,
                    'text-muted-foreground': !isActive,
                  }
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
                )}
                <Item.Icon className={cn('h-5 w-5', isActive && 'text-primary')} />
                {Item.title}
              </Link>
            )
          })}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
