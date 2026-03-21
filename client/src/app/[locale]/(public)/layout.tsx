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
import { Menu } from 'lucide-react'

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
      {/* ── Glassmorphism Header ── */}
      <header className="sticky top-0 z-20 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="sm:h-18 flex h-16 items-center gap-4 px-4 sm:px-6 md:px-8">
          <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-1 md:text-sm lg:gap-1">
            <Link
              href="/"
              className="mr-4 flex items-center gap-2.5 text-lg font-bold tracking-tight"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-lg text-primary-foreground shadow-glow">
                🍽
              </span>
              <span className="hidden bg-gradient-to-r from-primary to-amber-600 bg-clip-text text-transparent dark:to-amber-400 lg:inline">
                Big Boy
              </span>
            </Link>
            <NavItems className="relative rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-accent hover:text-foreground" />
          </nav>

          {/* Mobile menu trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="min-h-[44px] min-w-[44px] shrink-0 rounded-xl border-border/50 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] border-r border-border/40 sm:w-[320px]">
              <SheetHeader className="sr-only">
                <SheetTitle />
                <SheetDescription />
              </SheetHeader>
              <nav className="grid gap-3 pt-4 text-lg font-medium">
                <Link href="/" className="mb-4 flex items-center gap-2.5 text-lg font-bold">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-xl text-primary-foreground shadow-glow">
                    🍽
                  </span>
                  <span className="bg-gradient-to-r from-primary to-amber-600 bg-clip-text text-transparent dark:to-amber-400">
                    Big Boy
                  </span>
                </Link>

                <NavItems className="rounded-lg px-3 py-2.5 text-base text-muted-foreground transition-all hover:bg-accent hover:text-foreground" />
              </nav>
            </SheetContent>
          </Sheet>

          {/* Right side controls */}
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <SwitchLanguage />
            <DarkModeToggle />
          </div>
        </div>
        {/* Gradient accent line */}
        <div className="h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      </header>
      <main className="flex w-full flex-1 flex-col">
        {children}
        {modal}
      </main>
    </div>
  )
}
