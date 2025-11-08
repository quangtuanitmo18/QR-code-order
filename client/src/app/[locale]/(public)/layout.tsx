import NavItems from '@/app/[locale]/(public)/nav-items'
import DarkModeToggle from '@/components/dark-mode-toggle'
import SwitchLanguage from '@/components/switch-language'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Link } from '@/i18n/routing'
import { Menu, Package2 } from 'lucide-react'

export default async function Layout(
  props: Readonly<{
    children: React.ReactNode
    modal: React.ReactNode
    params: Promise<{ locale: string }>
  }>
) {
  const params = await props.params

  const { locale } = params
  const { children, modal } = props

  return (
    <div className="relative flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background px-3 sm:h-16 sm:gap-4 sm:px-4 md:px-6">
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold md:text-base">
            <Package2 className="h-6 w-6" />
            <span className="sr-only">Big boy</span>
          </Link>
          <NavItems className="flex-shrink-0 text-muted-foreground transition-colors hover:text-foreground" />
        </nav>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="min-h-[44px] min-w-[44px] shrink-0 md:hidden md:min-h-[40px] md:min-w-[40px]"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] sm:w-[320px]">
            <SheetHeader className="sr-only">
              <SheetTitle />
              <SheetDescription />
            </SheetHeader>
            <nav className="grid gap-6 text-lg font-medium">
              <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
                <Package2 className="h-6 w-6" />
                <span className="sr-only">Big boy</span>
              </Link>

              <NavItems className="text-muted-foreground transition-colors hover:text-foreground" />
            </nav>
          </SheetContent>
        </Sheet>
        <div className="ml-auto flex items-center gap-2 sm:gap-4">
          <SwitchLanguage />
          <DarkModeToggle />
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {children}
        {modal}
      </main>
    </div>
  )
}
