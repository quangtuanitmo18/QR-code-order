---
phase: implementation
title: Implementation Guide
description: Technical implementation notes, patterns, and code guidelines
---

# Implementation Guide

## Development Setup

**How do we get started?**

### Prerequisites and dependencies

- Node.js 18+ and npm installed
- Next.js 15 project already set up
- Tailwind CSS already configured
- shadcn/ui components library installed
- React 18+

### Environment setup steps

1. Ensure you're in the `client/` directory
2. Install dependencies (already done): `npm install`
3. Start development server: `npm run dev`
4. Open browser at `http://localhost:3000`

### Configuration needed

1. **Tailwind Config**: Verify/update breakpoints in `tailwind.config.ts`
2. **Next.js Config**: Ensure Image optimization is configured in `next.config.ts`
3. **TypeScript**: Types for responsive utilities will be added to `global.d.ts` or separate type files

## Code Structure

**How is the code organized?**

### Directory structure

```
client/src/
├── components/
│   ├── responsive/              # NEW: Responsive utility components
│   │   ├── ViewportProvider.tsx
│   │   ├── ResponsiveContainer.tsx
│   │   ├── ResponsiveTable.tsx
│   │   └── ResponsiveDialog.tsx
│   ├── ui/                      # MODIFY: Existing shadcn components
│   │   └── [make existing components responsive]
│   ├── navigation/              # MODIFY: Navigation components
│   │   └── [responsive navigation]
│   └── layout/                  # MODIFY: Layout components
│       └── [responsive layouts]
├── hooks/                       # NEW: Responsive hooks
│   ├── useViewport.tsx
│   ├── useMediaQuery.tsx
│   ├── useBreakpoint.tsx
│   └── useOrientation.tsx
├── lib/
│   └── responsive-utils.ts      # NEW: Responsive utility functions
└── app/
    └── [locale]/
        └── [all pages - modify for responsiveness]
```

### Module organization

- **Responsive hooks** in `src/hooks/` - reusable across the app
- **Responsive utility components** in `src/components/responsive/`
- **Responsive utilities** in `src/lib/responsive-utils.ts`
- **Page-specific responsive code** stays in respective page files

### Naming conventions

- Hooks: `use[Name].tsx` (e.g., `useViewport.tsx`)
- Responsive components: `Responsive[Component].tsx`
- Utility functions: camelCase (e.g., `getBreakpoint()`)
- CSS classes: Follow Tailwind conventions with mobile-first approach

## Implementation Notes

**Key technical details to remember:**

### Core Features

#### Feature 1: Viewport Detection System

**Implementation approach:**

```typescript
// src/hooks/useViewport.tsx
'use client';
import { createContext, useContext, useEffect, useState } from 'react';

interface ViewportState {
  width: number;
  height: number;
  breakpoint: 'mobile' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

const ViewportContext = createContext<ViewportState | null>(null);

export function ViewportProvider({ children }: { children: React.ReactNode }) {
  const [viewport, setViewport] = useState<ViewportState>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
    breakpoint: 'xl',
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  });

  useEffect(() => {
    const handleResize = debounce(() => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      let breakpoint: ViewportState['breakpoint'] = 'mobile';
      if (width >= 1920) breakpoint = '2xl';
      else if (width >= 1280) breakpoint = 'xl';
      else if (width >= 1024) breakpoint = 'lg';
      else if (width >= 768) breakpoint = 'md';
      else if (width >= 640) breakpoint = 'sm';

      setViewport({
        width,
        height,
        breakpoint,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
      });
    }, 150);

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <ViewportContext.Provider value={viewport}>{children}</ViewportContext.Provider>;
}

export function useViewport() {
  const context = useContext(ViewportContext);
  if (!context) throw new Error('useViewport must be used within ViewportProvider');
  return context;
}

function debounce<T extends (...args: any[]) => any>(func: T, wait: number) {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
```

**Usage:**
Wrap the app in `app-provider.tsx` or layout:

```typescript
<ViewportProvider>
  {children}
</ViewportProvider>
```

#### Feature 2: Media Query Hook

**Implementation approach:**

```typescript
// src/hooks/useMediaQuery.tsx
'use client'
import { useEffect, useState } from 'react'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    if (media.matches !== matches) {
      setMatches(media.matches)
    }

    const listener = () => setMatches(media.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [matches, query])

  return matches
}
```

**Usage:**

```typescript
const isMobile = useMediaQuery('(max-width: 768px)')
const isLandscape = useMediaQuery('(orientation: landscape)')
```

#### Feature 3: Responsive Navigation

**Implementation approach:**

- Use hamburger menu on mobile (< 768px)
- Use full horizontal menu on desktop (>= 768px)
- Implement smooth slide-in animation for mobile menu
- Use Tailwind classes: `hidden md:flex` for desktop-only, `md:hidden` for mobile-only

**Example pattern:**

```typescript
export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isMobile } = useViewport();

  return (
    <nav>
      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-4">
        <NavLink href="/menu">Menu</NavLink>
        <NavLink href="/orders">Orders</NavLink>
      </div>

      {/* Mobile Hamburger */}
      <button
        className="md:hidden"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        <MenuIcon />
      </button>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-white z-50">
          {/* Mobile menu content */}
        </div>
      )}
    </nav>
  );
}
```

#### Feature 4: Responsive Tables

**Implementation approach:**

- Use horizontal scroll container on mobile
- Optionally provide card layout alternative
- Use Tailwind's `overflow-x-auto` utility

```typescript
export function ResponsiveTable({ data }: { data: any[] }) {
  const { isMobile } = useViewport();

  if (isMobile) {
    // Card layout for mobile
    return (
      <div className="space-y-4">
        {data.map(item => (
          <Card key={item.id}>
            {/* Card layout */}
          </Card>
        ))}
      </div>
    );
  }

  // Table layout for desktop
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        {/* Table content */}
      </table>
    </div>
  );
}
```

#### Feature 5: Responsive Images

**Implementation approach:**
Use Next.js `<Image>` component with responsive sizes:

```typescript
import Image from 'next/image';

export function ResponsiveImage({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={800}
      height={600}
      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
      className="w-full h-auto"
    />
  );
}
```

### Patterns & Best Practices

#### Pattern 1: Mobile-First CSS

Always write base styles for mobile, then add larger breakpoint styles:

```typescript
// Good ✅
<div className="text-sm md:text-base lg:text-lg">

// Bad ❌
<div className="text-lg md:text-base sm:text-sm">
```

#### Pattern 2: Progressive Enhancement

Use CSS for layout, JS only when necessary:

```typescript
// Good ✅ - Pure CSS
<div className="flex flex-col md:flex-row">

// Use JS only for complex cases
const { isMobile } = useViewport();
if (isMobile) {
  // Render different component structure
}
```

#### Pattern 3: Touch-Friendly Targets

Ensure all interactive elements are at least 44x44px on mobile:

```typescript
<button className="min-h-[44px] min-w-[44px] md:min-h-[36px] md:min-w-[36px]">
```

#### Pattern 4: Responsive Spacing

Use responsive spacing utilities:

```typescript
<div className="p-4 md:p-6 lg:p-8">
<div className="space-y-4 md:space-y-6 lg:space-y-8">
```

#### Pattern 5: Conditional Rendering

Use `useViewport` hook for conditional rendering:

```typescript
const { isMobile, isTablet, isDesktop } = useViewport();

return (
  <>
    {isMobile && <MobileComponent />}
    {isTablet && <TabletComponent />}
    {isDesktop && <DesktopComponent />}
  </>
);
```

## Integration Points

**How do pieces connect?**

### Integration with Existing Components

1. **Wrap app in ViewportProvider**: Add to `app-provider.tsx` or root layout
2. **Import hooks where needed**: Use `useViewport()`, `useMediaQuery()` in components
3. **Update existing components**: Add responsive Tailwind classes to existing components
4. **Update layouts**: Make header, footer, sidebar responsive

### Integration with Next.js

- Use Next.js `<Image>` for responsive images
- Use Next.js dynamic imports for code splitting on mobile if needed
- Ensure SSR compatibility (all hooks use 'use client' directive)

### Integration with Tailwind

- Use existing Tailwind breakpoints
- Follow Tailwind's mobile-first philosophy
- Use Tailwind's responsive utilities (`md:`, `lg:`, etc.)

## Error Handling

**How do we handle failures?**

### Error Handling Strategy

1. **Graceful Degradation**: If viewport detection fails, assume desktop size
2. **SSR Handling**: Use safe defaults during server-side rendering
3. **Browser Compatibility**: Provide fallbacks for unsupported features

### Example Error Handling:

```typescript
export function useViewport() {
  const context = useContext(ViewportContext)

  // Fallback if provider is missing
  if (!context) {
    console.warn('useViewport must be used within ViewportProvider, returning defaults')
    return {
      width: 1920,
      height: 1080,
      breakpoint: 'xl' as const,
      isMobile: false,
      isTablet: false,
      isDesktop: true,
    }
  }

  return context
}
```

### Logging Approach

- Log viewport changes in development only
- Log responsive component mount/unmount in development
- Use Sentry for production errors related to responsive behavior

## Performance Considerations

**How do we keep it fast?**

### Optimization Strategies

1. **Debounce resize events**: Max 1 update per 150ms
2. **Memoize viewport calculations**: Use React.useMemo where appropriate
3. **Lazy load images**: Use Next.js Image with lazy loading
4. **Code splitting**: Dynamic imports for mobile-specific components
5. **CSS-first approach**: Minimize JavaScript execution

### Caching Approach

- Cache viewport state in React Context
- Use React.memo for components that don't need to re-render on viewport changes

### Performance Benchmarks

- Lighthouse Performance score: > 90 on mobile
- Time to Interactive: < 3 seconds on 3G
- No layout shifts (CLS < 0.1)

### Example Optimization:

```typescript
// Memoize expensive calculations
const gridColumns = useMemo(() => {
  if (isMobile) return 1
  if (isTablet) return 2
  return 4
}, [isMobile, isTablet])
```

## Security Notes

**What security measures are in place?**

### No Security Impact

Responsive design changes are purely UI/layout modifications with no security implications.

### Input Validation

- Maintain existing input validation on all form inputs
- Ensure mobile forms have same validation as desktop
- Touch interactions should not bypass security checks

### Best Practices

- Don't expose sensitive data differently on mobile vs desktop
- Maintain same authentication/authorization on all devices
- Ensure secure API calls regardless of device type
