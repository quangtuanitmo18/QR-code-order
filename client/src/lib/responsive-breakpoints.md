# Responsive Breakpoints Reference

**Project**: Restaurant Management System  
**Framework**: Next.js 15 + Tailwind CSS  
**Approach**: Mobile-First Responsive Design

## Breakpoint System

Our application uses Tailwind CSS's mobile-first breakpoint system with 6 device categories:

| Breakpoint | Min Width   | Target Devices | Tailwind Prefix | Usage                  |
| ---------- | ----------- | -------------- | --------------- | ---------------------- |
| **Mobile** | 0px - 639px | Phones         | _(default)_     | Base styles            |
| **SM**     | 640px+      | Large Phones   | `sm:`           | Large phones, phablets |
| **MD**     | 768px+      | Tablets        | `md:`           | Tablets, small laptops |
| **LG**     | 1024px+     | Laptops        | `lg:`           | Laptops, desktops      |
| **XL**     | 1280px+     | Desktops       | `xl:`           | Large desktops         |
| **2XL**    | 1920px+     | Large Screens  | `2xl:`          | Ultra-wide monitors    |

## Mobile-First Philosophy

Always write styles for **mobile first**, then add larger breakpoints:

```tsx
// ✅ GOOD - Mobile first
<div className="text-sm md:text-base lg:text-lg xl:text-xl">

// ❌ BAD - Desktop first
<div className="text-xl lg:text-lg md:text-base sm:text-sm">
```

## Common Responsive Patterns

### 1. Show/Hide Based on Breakpoint

```tsx
// Show only on mobile
<div className="block md:hidden">Mobile only</div>

// Show only on desktop
<div className="hidden md:block">Desktop only</div>

// Show only on tablet
<div className="hidden md:block lg:hidden">Tablet only</div>
```

### 2. Responsive Layout

```tsx
// Stack on mobile, row on desktop
<div className="flex flex-col md:flex-row">

// 1 column mobile → 2 tablet → 4 desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
```

### 3. Responsive Spacing

```tsx
// Progressive padding increase
<div className="p-4 md:p-6 lg:p-8 xl:p-10">

// Progressive gap increase
<div className="space-y-4 md:space-y-6 lg:space-y-8">
```

### 4. Responsive Typography

```tsx
// Heading sizes
<h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl">

// Body text
<p className="text-sm md:text-base lg:text-lg">
```

### 5. Touch-Friendly Targets (Mobile)

```tsx
// Minimum 44x44px on mobile, can be smaller on desktop
<button className="min-h-[44px] min-w-[44px] md:min-h-[36px] md:min-w-[36px]">
```

### 6. Responsive Navigation

```tsx
// Mobile: Hamburger menu
// Desktop: Full horizontal menu
<nav>
  {/* Mobile trigger */}
  <button className="md:hidden">☰</button>

  {/* Desktop menu */}
  <div className="hidden md:flex md:gap-4">
    <Link href="/menu">Menu</Link>
    <Link href="/orders">Orders</Link>
  </div>
</nav>
```

### 7. Responsive Tables

```tsx
// Mobile: Horizontal scroll
<div className="overflow-x-auto">
  <table className="w-full">...</table>
</div>

// Or: Card layout on mobile
<div className="block md:hidden">
  {/* Card layout */}
</div>
<div className="hidden md:block">
  <table>...</table>
</div>
```

### 8. Responsive Modals

```tsx
// Full screen on mobile, centered on desktop
<Dialog>
  <DialogContent className="h-full w-full md:h-auto md:max-w-lg">{/* Content */}</DialogContent>
</Dialog>
```

## Container Widths

Containers automatically max out at these widths per breakpoint:

```tsx
<div className="container mx-auto">
  {/* sm: 640px */}
  {/* md: 768px */}
  {/* lg: 1024px */}
  {/* xl: 1280px */}
  {/* 2xl: 1400px (custom for containers) */}
</div>
```

## Testing Responsive Designs

### Chrome DevTools

1. Open DevTools (F12)
2. Click device toolbar icon (Ctrl+Shift+M)
3. Select device presets or set custom dimensions

### Common Test Sizes

- **Mobile**: 375x667 (iPhone SE), 390x844 (iPhone 13)
- **Tablet**: 768x1024 (iPad), 810x1080 (iPad Air)
- **Desktop**: 1920x1080, 2560x1440

## Best Practices

1. **Always start with mobile** - Design mobile first, then enhance for larger screens
2. **Test on real devices** - Emulators are good, but real devices are better
3. **Use semantic breakpoints** - Think about content, not specific devices
4. **Avoid too many breakpoints** - Stick to the 6 defined breakpoints
5. **Group related responsive classes** - Keep width, padding, text size together
6. **Test in landscape and portrait** - Especially for tablets
7. **Consider touch targets** - 44x44px minimum on mobile/tablet
8. **No horizontal scroll** - Unless intentional (tables, carousels)

## Examples from Our Codebase

### Existing Mobile Navigation (Good Example!)

```tsx
// From: manage/mobile-nav-links.tsx
<Sheet>
  <SheetTrigger asChild>
    <Button size="icon" variant="outline" className="sm:hidden">
      <PanelLeft className="h-5 w-5" />
    </Button>
  </SheetTrigger>
  <SheetContent side="left" className="sm:max-w-xs">
    {/* Mobile menu content */}
  </SheetContent>
</Sheet>

// From: manage/nav-links.tsx
<aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
  {/* Desktop sidebar */}
</aside>
```

## Resources

- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [Tailwind CSS Screens Configuration](https://tailwindcss.com/docs/screens)
- [WCAG Touch Target Size](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
