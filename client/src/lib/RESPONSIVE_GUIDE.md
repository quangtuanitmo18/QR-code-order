# Responsive Design Developer Guide

**Last Updated**: November 7, 2025  
**Project**: Restaurant Management System  
**Tech Stack**: Next.js 15, React 18, Tailwind CSS

## 🎯 Core Principles

### 1. **CSS-First Approach**

Always prefer Tailwind CSS utilities over JavaScript hooks. Use JS hooks only when absolutely necessary.

```tsx
// ✅ PREFER: CSS-only solution
;<div className="text-sm md:text-base lg:text-lg">Hello World</div>

// ⚠️ AVOID: Unnecessary JS
function Component() {
  const { isMobile } = useViewport()
  return <div className={isMobile ? 'text-sm' : 'text-lg'}>Hello World</div>
}
```

### 2. **Mobile-First Philosophy**

Base styles target mobile. Add larger breakpoints progressively.

```tsx
// ✅ CORRECT: Mobile first
className = 'p-4 md:p-6 lg:p-8'

// ❌ WRONG: Desktop first
className = 'p-8 lg:p-6 md:p-4'
```

### 3. **Preserve Existing Logic**

**CRITICAL**: Only modify styles/CSS. Never change component logic or behavior.

```tsx
// ✅ CORRECT: Only add responsive classes
<Button
  onClick={handleClick}  // Keep existing logic
  className="w-full md:w-auto"  // Add responsive styles
>
  Submit
</Button>

// ❌ WRONG: Changing logic
<Button
  onClick={isMobile ? handleMobileClick : handleClick}  // Don't do this!
>
  Submit
</Button>
```

---

## 📏 Breakpoints

| Name   | Min Width | Usage         | Class Prefix |
| ------ | --------- | ------------- | ------------ |
| Mobile | 0-639px   | Phones        | _(default)_  |
| SM     | 640px+    | Large phones  | `sm:`        |
| MD     | 768px+    | Tablets       | `md:`        |
| LG     | 1024px+   | Laptops       | `lg:`        |
| XL     | 1280px+   | Desktops      | `xl:`        |
| 2XL    | 1920px+   | Large screens | `2xl:`       |

---

## 🛠️ When to Use What

### Use Tailwind CSS (90% of cases)

**Layout Changes:**

```tsx
// Stack on mobile, row on desktop
<div className="flex flex-col md:flex-row gap-4">

// 1 column → 2 columns → 3 columns
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

**Sizing:**

```tsx
// Full width on mobile, auto on desktop
<Button className="w-full md:w-auto">Click Me</Button>

// Responsive padding
<div className="p-4 md:p-6 lg:p-8">
```

**Visibility:**

```tsx
// Show only on mobile
<div className="block md:hidden">Mobile Menu</div>

// Show only on desktop
<div className="hidden md:block">Desktop Menu</div>
```

### Use useMediaQuery Hook (8% of cases)

**When you need conditional rendering of different components:**

```tsx
import { useMediaQuery } from '@/hooks/useMediaQuery'

function TableOrCards() {
  const isMobile = useMediaQuery('(max-width: 767px)')

  if (isMobile) {
    return <CardLayout data={data} />
  }

  return <TableLayout data={data} />
}
```

**When CSS alone can't achieve the behavior:**

```tsx
function DynamicChart() {
  const isMobile = useMediaQuery('(max-width: 767px)')

  // Chart library needs different config for mobile
  return <Chart config={isMobile ? mobileConfig : desktopConfig} />
}
```

### Use useViewport Hook (2% of cases)

**When you need detailed viewport information:**

```tsx
import { useViewport } from '@/hooks/useViewport'

function ComplexComponent() {
  const { width, height, orientation, breakpoint } = useViewport()

  // Complex logic based on multiple factors
  if (orientation === 'landscape' && width < 768) {
    return <LandscapeMobileView />
  }

  return <StandardView />
}
```

---

## 📚 Common Patterns

### Pattern 1: Responsive Navigation

**Already implemented in our app!** See `mobile-nav-links.tsx` and `nav-links.tsx`

```tsx
// Mobile: Sheet drawer
<Sheet>
  <SheetTrigger asChild>
    <Button size="icon" variant="outline" className="md:hidden">
      <Menu />
    </Button>
  </SheetTrigger>
  <SheetContent side="left">
    {/* Mobile menu */}
  </SheetContent>
</Sheet>

// Desktop: Fixed sidebar
<aside className="hidden md:flex">
  {/* Desktop menu */}
</aside>
```

### Pattern 2: Responsive Tables

**Strategy**: Cards on mobile (< 10 rows), horizontal scroll for larger datasets

```tsx
// Small datasets: Card layout on mobile
function SmallDataTable({ data }: { data: Item[] }) {
  return (
    <>
      {/* Mobile: Card layout */}
      <div className="block space-y-4 md:hidden">
        {data.map((item) => (
          <Card key={item.id}>
            <CardHeader>{item.name}</CardHeader>
            <CardContent>{item.description}</CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop: Table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>...</TableHeader>
          <TableBody>...</TableBody>
        </Table>
      </div>
    </>
  )
}

// Large datasets: Horizontal scroll
function LargeDataTable({ data }: { data: Item[] }) {
  return (
    <div className="overflow-x-auto">
      <Table className="min-w-[600px]">{/* Table content */}</Table>
    </div>
  )
}
```

### Pattern 3: Responsive Forms

```tsx
function ResponsiveForm() {
  return (
    <form className="space-y-4">
      {/* Full width on mobile, auto on desktop */}
      <Input className="w-full md:w-auto" />

      {/* Stack on mobile, row on desktop */}
      <div className="flex flex-col gap-4 md:flex-row">
        <Input placeholder="First Name" />
        <Input placeholder="Last Name" />
      </div>

      {/* Touch-friendly buttons on mobile */}
      <Button className="min-h-[44px] w-full md:min-h-[36px] md:w-auto">Submit</Button>
    </form>
  )
}
```

### Pattern 4: Responsive Modals

```tsx
import { Dialog, DialogContent } from '@/components/ui/dialog'

function ResponsiveDialog({ children }: { children: React.ReactNode }) {
  return (
    <Dialog>
      <DialogContent
        // Full screen on mobile, centered on desktop
        className="h-full w-full md:h-auto md:max-w-lg"
      >
        {children}
      </DialogContent>
    </Dialog>
  )
}
```

### Pattern 5: Responsive Images

```tsx
import Image from 'next/image'

function ResponsiveImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative h-48 w-full md:h-64 lg:h-80">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="rounded-lg object-cover"
      />
    </div>
  )
}
```

### Pattern 6: Responsive Spacing

```tsx
// Progressive padding
<div className="p-4 md:p-6 lg:p-8 xl:p-10">

// Progressive gaps
<div className="space-y-4 md:space-y-6 lg:space-y-8">

// Progressive text sizes
<h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl">
```

### Pattern 7: Touch-Friendly Targets

Minimum 44x44px on mobile for WCAG compliance:

```tsx
// Buttons
<Button className="min-h-[44px] min-w-[44px] md:min-h-[36px] md:min-w-[36px]">

// Icons
<button className="p-3 md:p-2">  {/* 44px total on mobile */}
  <Icon className="h-5 w-5" />
</button>
```

---

## 🔧 Available Tools

### Hooks

```tsx
// Basic media query
import { useMediaQuery } from '@/hooks/useMediaQuery'
const isMobile = useMediaQuery('(max-width: 767px)')

// Predefined breakpoint hooks
import { useIsMobile, useIsTablet, useIsDesktop } from '@/hooks/useMediaQuery'
const isMobile = useIsMobile()

// Full viewport state (use sparingly)
import { useViewport } from '@/hooks/useViewport'
const { width, height, breakpoint, isMobile, orientation } = useViewport()
```

### Components

```tsx
// Responsive container
import { ResponsiveContainer } from '@/components/responsive'
;<ResponsiveContainer maxWidth="xl" padding center>
  {children}
</ResponsiveContainer>

// Responsive grid
import { ResponsiveGrid } from '@/components/responsive'
;<ResponsiveGrid columns={{ mobile: 1, md: 2, lg: 3 }}>
  {items.map((item) => (
    <Card key={item.id}>{item}</Card>
  ))}
</ResponsiveGrid>

// Responsive stack (vertical mobile → horizontal desktop)
import { ResponsiveStack } from '@/components/responsive'
;<ResponsiveStack breakpoint="md" gap="lg">
  <div>Item 1</div>
  <div>Item 2</div>
</ResponsiveStack>
```

---

## ✅ Best Practices

### DO ✅

1. **Start with mobile styles**

   ```tsx
   className = 'text-sm md:text-base lg:text-lg'
   ```

2. **Use semantic breakpoints**

   ```tsx
   // Based on content needs, not specific devices
   className = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
   ```

3. **Group related responsive classes**

   ```tsx
   className = 'w-full p-4 text-sm md:w-auto md:p-6 md:text-base'
   ```

4. **Test on real devices**
   - Chrome DevTools is good for initial testing
   - Always test on real phones/tablets before shipping

5. **Consider touch targets**
   ```tsx
   className = 'min-h-[44px] min-w-[44px]' // Mobile
   ```

### DON'T ❌

1. **Don't change existing logic**

   ```tsx
   // ❌ BAD
   onClick={isMobile ? mobileHandler : desktopHandler}

   // ✅ GOOD
   onClick={existingHandler}  // Keep it unchanged
   ```

2. **Don't use too many breakpoints**

   ```tsx
   // ❌ BAD - too granular
   className = 'text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-2xl'

   // ✅ GOOD - meaningful jumps
   className = 'text-sm md:text-base lg:text-lg'
   ```

3. **Don't create separate mobile/desktop components unnecessarily**

   ```tsx
   // ❌ BAD - duplication
   {
     isMobile ? <MobileButton /> : <DesktopButton />
   }

   // ✅ GOOD - single component with responsive classes
   ;<Button className="w-full md:w-auto" />
   ```

4. **Don't allow horizontal scroll** (unless intentional)
   ```tsx
   // ✅ Intentional scroll
   <div className="overflow-x-auto">
     <Table className="min-w-[600px]" />
   </div>
   ```

---

## 🧪 Testing Checklist

### Before Committing

- [ ] Test on Chrome mobile emulator (375px, 768px, 1920px)
- [ ] Test in both portrait and landscape
- [ ] No horizontal scrolling (except intentional)
- [ ] Touch targets ≥ 44x44px on mobile
- [ ] Text is readable without zooming
- [ ] All functionality works on all breakpoints
- [ ] No layout shifts during responsive transitions

### Before Releasing

- [ ] Test on real iPhone (iOS Safari)
- [ ] Test on real Android phone (Chrome)
- [ ] Test on real iPad/tablet
- [ ] Run Lighthouse mobile audit (score ≥ 90)
- [ ] Check accessibility (keyboard navigation, screen reader)

---

## 📖 Quick Reference

```tsx
// Show/Hide
className = 'block md:hidden' // Mobile only
className = 'hidden md:block' // Desktop only
className = 'hidden md:block lg:hidden' // Tablet only

// Layout
className = 'flex flex-col md:flex-row' // Stack → Row
className = 'grid grid-cols-1 md:grid-cols-2' // 1 col → 2 cols

// Sizing
className = 'w-full md:w-auto' // Full width → Auto
className = 'h-48 md:h-64 lg:h-80' // Progressive height

// Spacing
className = 'p-4 md:p-6 lg:p-8' // Progressive padding
className = 'gap-4 md:gap-6 lg:gap-8' // Progressive gap

// Typography
className = 'text-sm md:text-base lg:text-lg' // Progressive size

// Touch Targets
className = 'min-h-[44px] md:min-h-[36px]' // Mobile 44px, Desktop 36px
```

---

## 🆘 Need Help?

1. Check this guide first
2. Review existing responsive components (`mobile-nav-links.tsx`, `nav-links.tsx`)
3. Check Tailwind docs: https://tailwindcss.com/docs/responsive-design
4. Ask the team in #frontend channel

---

## 📦 Related Documentation

- [Breakpoints Reference](./responsive-breakpoints.md)
- [Tailwind Config](../../tailwind.config.ts)
- [Design System Requirements](../../../docs/ai/requirements/feature-responsive-design.md)
- [Implementation Guide](../../../docs/ai/implementation/feature-responsive-design.md)
