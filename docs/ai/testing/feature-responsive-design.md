---
phase: testing
title: Testing Strategy
description: Define testing approach, test cases, and quality assurance
---

# Testing Strategy

## Test Coverage Goals

**What level of testing do we aim for?**

- **Unit test coverage target**: 100% of new responsive hooks and utility functions
- **Integration test scope**: All responsive components, critical responsive layouts
- **End-to-end test scenarios**: Key user journeys on mobile, tablet, and desktop breakpoints
- **Manual testing**: All pages on real devices across all 6 breakpoints
- **Alignment with requirements**: All success criteria from requirements doc must be testable and tested

## Unit Tests

**What individual components need testing?**

### Responsive Hooks

#### useViewport Hook

- [ ] **Test case 1**: Returns correct viewport state on mount
- [ ] **Test case 2**: Updates viewport state on window resize
- [ ] **Test case 3**: Correctly identifies breakpoints (mobile, sm, md, lg, xl, 2xl)
- [ ] **Test case 4**: Correctly sets isMobile, isTablet, isDesktop flags
- [ ] **Test case 5**: Debounces resize events (max 1 update per 150ms)
- [ ] **Test case 6**: Cleans up event listeners on unmount
- [ ] **Test case 7**: Throws error if used outside ViewportProvider
- [ ] **Test case 8**: Returns safe defaults during SSR

#### useMediaQuery Hook

- [ ] **Test case 1**: Returns true when media query matches
- [ ] **Test case 2**: Returns false when media query doesn't match
- [ ] **Test case 3**: Updates when media query match changes
- [ ] **Test case 4**: Cleans up media query listeners on unmount
- [ ] **Test case 5**: Handles invalid media queries gracefully
- [ ] **Test case 6**: Works with multiple media queries simultaneously

#### useBreakpoint Hook

- [ ] **Test case 1**: Returns current breakpoint name
- [ ] **Test case 2**: Updates breakpoint on window resize
- [ ] **Test case 3**: Returns correct breakpoint for edge cases (exactly at breakpoint width)

#### useOrientation Hook

- [ ] **Test case 1**: Returns 'portrait' when height > width
- [ ] **Test case 2**: Returns 'landscape' when width > height
- [ ] **Test case 3**: Updates on orientation change

### Responsive Utility Components

#### ViewportProvider

- [ ] **Test case 1**: Provides viewport context to children
- [ ] **Test case 2**: Initializes with correct default values
- [ ] **Test case 3**: Updates context on window resize
- [ ] **Test case 4**: Handles multiple consumers correctly

#### ResponsiveContainer

- [ ] **Test case 1**: Applies correct classes for mobile breakpoint
- [ ] **Test case 2**: Applies correct classes for tablet breakpoint
- [ ] **Test case 3**: Applies correct classes for desktop breakpoint

#### ResponsiveTable

- [ ] **Test case 1**: Renders table layout on desktop
- [ ] **Test case 2**: Renders card layout on mobile
- [ ] **Test case 3**: Applies horizontal scroll on tablet (if configured)
- [ ] **Test case 4**: Handles empty data gracefully
- [ ] **Test case 5**: Renders all columns correctly on desktop
- [ ] **Test case 6**: Shows essential data only on mobile card layout

#### ResponsiveDialog

- [ ] **Test case 1**: Renders centered on desktop
- [ ] **Test case 2**: Renders full-screen on mobile
- [ ] **Test case 3**: Close button is touch-friendly on mobile (44x44px)
- [ ] **Test case 4**: Handles overflow content correctly on all breakpoints

### Responsive Utility Functions

- [ ] **Test case 1**: `getBreakpoint()` returns correct breakpoint for given width
- [ ] **Test case 2**: `debounce()` utility works correctly
- [ ] **Test case 3**: Responsive size calculation utilities work correctly

## Integration Tests

**How do we test component interactions?**

### Navigation Integration

- [ ] **Integration 1**: Navigation switches from desktop menu to mobile hamburger at md breakpoint
- [ ] **Integration 2**: Mobile menu opens and closes correctly
- [ ] **Integration 3**: Navigation links work on all breakpoints
- [ ] **Integration 4**: Active route highlighting works on mobile and desktop

### Layout Integration

- [ ] **Integration 5**: Header, Sidebar, Footer adapt correctly together
- [ ] **Integration 6**: Sidebar toggles correctly on tablet breakpoint
- [ ] **Integration 7**: Main content area adjusts width when sidebar opens/closes

### Form Integration

- [ ] **Integration 8**: Form layouts adapt correctly on mobile
- [ ] **Integration 9**: Form validation works on all breakpoints
- [ ] **Integration 10**: Form submission works on mobile and desktop
- [ ] **Integration 11**: Touch-friendly input fields on mobile (proper sizing)

### Table Integration

- [ ] **Integration 12**: Tables switch between layouts correctly at breakpoint
- [ ] **Integration 13**: Table sorting works in both card and table layouts
- [ ] **Integration 14**: Table filtering works on all breakpoints

### Image Integration

- [ ] **Integration 15**: Responsive images load correct sizes per breakpoint
- [ ] **Integration 16**: Image lazy loading works on mobile
- [ ] **Integration 17**: Image aspect ratios maintained across breakpoints

## End-to-End Tests

**What user flows need validation?**

### Guest User Flows

- [ ] **E2E Flow 1**: Browse menu → view dish details → add to cart → checkout
  - Test on mobile (< 640px)
  - Test on tablet (768px - 1024px)
  - Test on desktop (> 1280px)

- [ ] **E2E Flow 2**: Guest login via QR code → view table menu → place order
  - Test on mobile (primary use case)
  - Test on tablet

- [ ] **E2E Flow 3**: View order status → track order → view order history
  - Test on mobile
  - Test on desktop

### Staff User Flows

- [ ] **E2E Flow 4**: Staff login → view dashboard → manage tables
  - Test on tablet (primary device for staff)
  - Test on mobile
  - Test on desktop

- [ ] **E2E Flow 5**: View orders → update order status → notify kitchen
  - Test on tablet
  - Test on mobile

### Admin User Flows

- [ ] **E2E Flow 6**: Admin login → view dashboard → manage dishes
  - Test on desktop (primary device)
  - Test on tablet
  - Test on mobile

- [ ] **E2E Flow 7**: Manage accounts → create new staff account → assign roles
  - Test on desktop
  - Test on mobile

### Cross-Breakpoint Testing

- [ ] **E2E Flow 8**: Start task on desktop → continue on mobile → complete on tablet
  - Test session persistence
  - Test responsive state management

## Test Data

**What data do we use for testing?**

### Test Fixtures

- Mock viewport sizes for each breakpoint
- Mock window.matchMedia for media query testing
- Mock resize events for viewport testing

### Example Test Data:

```typescript
const mockViewports = {
  mobile: { width: 375, height: 667 },
  mobileLarge: { width: 640, height: 960 },
  tablet: { width: 768, height: 1024 },
  laptop: { width: 1024, height: 768 },
  desktop: { width: 1920, height: 1080 },
  largeScreen: { width: 2560, height: 1440 },
}
```

### Seed Data

- Sample menu items with images (for responsive image testing)
- Sample orders (for responsive table testing)
- Sample user accounts (for responsive form testing)

## Test Reporting & Coverage

**How do we verify and communicate test results?**

### Coverage Commands

```bash
# Run all tests with coverage
npm run test -- --coverage

# Run specific test suites
npm run test -- hooks/useViewport.test.tsx
npm run test -- components/responsive/

# Generate coverage report
npm run test:coverage
```

### Coverage Thresholds

- **Global**: 90% minimum
- **Responsive hooks**: 100% target
- **Responsive components**: 100% target
- **Page components**: 80% minimum (higher for critical pages)

### Coverage Gaps

- Track any files below 100% coverage and rationale
- Document edge cases that are difficult to test
- Note any browser-specific behavior that can't be unit tested

### Manual Testing Outcomes

- Document manual testing results in a checklist
- Screenshot testing on real devices
- Sign-off from QA and product owner

## Manual Testing

**What requires human validation?**

### UI/UX Testing Checklist

#### Mobile Testing (< 640px)

- [ ] All text is readable without zooming
- [ ] All buttons are touch-friendly (44x44px minimum)
- [ ] No horizontal scrolling (except intentional scrollable containers)
- [ ] Images load correctly and are appropriately sized
- [ ] Forms are easy to fill out on mobile keyboard
- [ ] Navigation is accessible and intuitive
- [ ] Modals/dialogs work correctly
- [ ] No layout shifts during page load

#### Tablet Testing (768px - 1024px)

- [ ] Layout uses available space efficiently
- [ ] Touch interactions work smoothly
- [ ] Landscape and portrait orientations both work
- [ ] Navigation adapts correctly
- [ ] Tables are readable and usable
- [ ] Forms are appropriately sized

#### Desktop Testing (> 1280px)

- [ ] Content is not stretched or too wide
- [ ] Hover states work correctly
- [ ] Keyboard navigation works
- [ ] Multi-column layouts display correctly
- [ ] Large screen utilizes space effectively (> 1920px)

### Browser/Device Compatibility

- [ ] **Chrome** (latest): Mobile, Tablet, Desktop
- [ ] **Firefox** (latest): Mobile, Tablet, Desktop
- [ ] **Safari** (latest): Mobile (iOS), Tablet (iPadOS), Desktop (macOS)
- [ ] **Edge** (latest): Desktop
- [ ] **Safari iOS** (iPhone): Mobile
- [ ] **Chrome Android**: Mobile, Tablet

### Real Device Testing

- [ ] iPhone 13/14/15 (iOS)
- [ ] Samsung Galaxy S21/S22/S23 (Android)
- [ ] iPad (iPadOS)
- [ ] Android Tablet
- [ ] Various desktop screen sizes (13", 15", 24", 27", 32")

### Accessibility Testing

- [ ] Keyboard navigation works on all breakpoints
- [ ] Screen reader compatibility (NVDA, JAWS, VoiceOver)
- [ ] Focus indicators visible on all breakpoints
- [ ] Color contrast meets WCAG AA standards
- [ ] Touch targets meet WCAG guidelines (44x44px)
- [ ] No accessibility regressions from responsive changes

### Smoke Tests After Deployment

- [ ] Homepage loads on all devices
- [ ] Menu page loads and displays dishes
- [ ] Order flow works end-to-end
- [ ] Admin dashboard accessible
- [ ] No console errors on any breakpoint

## Performance Testing

**How do we validate performance?**

### Lighthouse Testing

- [ ] **Mobile Lighthouse scores**:
  - Performance: > 90
  - Accessibility: > 90
  - Best Practices: > 90
  - SEO: > 90
  - Mobile-Friendly: Pass

- [ ] **Desktop Lighthouse scores**:
  - Performance: > 95
  - Accessibility: > 90
  - Best Practices: > 90
  - SEO: > 90

### Load Testing Scenarios

- [ ] Page load time on 3G connection < 5 seconds
- [ ] Page load time on 4G connection < 3 seconds
- [ ] Page load time on WiFi < 2 seconds

### Performance Benchmarks

- [ ] First Contentful Paint (FCP) < 2 seconds on mobile
- [ ] Largest Contentful Paint (LCP) < 3 seconds on mobile
- [ ] Time to Interactive (TTI) < 3 seconds on mobile
- [ ] Cumulative Layout Shift (CLS) < 0.1
- [ ] First Input Delay (FID) < 100ms

### Performance Testing Tools

- Chrome DevTools (Network throttling, Performance tab)
- Lighthouse CI
- WebPageTest
- GTmetrix

## Bug Tracking

**How do we manage issues?**

### Issue Tracking Process

1. **Report**: Log all responsive bugs in issue tracker with device/browser info
2. **Categorize**: Tag with `responsive`, `mobile`, `tablet`, or `desktop`
3. **Prioritize**: Critical (blocks core functionality), High, Medium, Low
4. **Assign**: Assign to appropriate developer
5. **Test**: Verify fix on affected device/breakpoint
6. **Close**: Close issue after verification on all affected breakpoints

### Bug Severity Levels

- **Critical**: Core functionality broken on a major breakpoint (e.g., can't place orders on mobile)
- **High**: Important feature broken or major UX issue (e.g., navigation not working on tablet)
- **Medium**: Minor UX issue or non-critical feature broken (e.g., spacing issue on desktop)
- **Low**: Cosmetic issue with minimal impact (e.g., minor alignment issue on large screens)

### Regression Testing Strategy

- Automated regression test suite runs on every PR
- Manual regression testing on critical paths before each release
- Test all breakpoints when fixing responsive bugs
- Maintain a "smoke test" checklist for quick regression checks

### Known Issues

Document any known issues or limitations:

- [ ] Issue 1: [Description] - [Workaround] - [Plan to fix]
- [ ] Issue 2: [Description] - [Workaround] - [Plan to fix]

---

## Testing Timeline

### Week 1-4 (During Development)

- Write unit tests alongside implementation
- Run tests continuously during development
- Fix any failing tests immediately

### Week 5 (Testing Phase)

- Comprehensive manual testing on real devices
- Cross-browser testing
- Performance testing with Lighthouse
- Accessibility audit
- Bug fixing and regression testing

### Pre-Release

- Final QA sign-off
- Stakeholder review on multiple devices
- Performance benchmark verification
- Documentation review
