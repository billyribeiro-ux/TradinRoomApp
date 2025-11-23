# Performance Budgets & Optimization

## Performance Budgets

### Load Performance
| Metric | Desktop (Fast) | Laptop (Mid) | Mobile | Current | Status |
|--------|----------------|--------------|--------|---------|--------|
| TTI (Time to Interactive) | ≤ 2.0s | ≤ 3.5s | ≤ 5.0s | TBD | 🔄 |
| Hydration | ≤ 800ms | ≤ 800ms | ≤ 800ms | TBD | 🔄 |
| Initial JS (gzip) | ≤ 250KB | ≤ 250KB | ≤ 250KB | TBD | 🔄 |
| Initial CSS (gzip) | ≤ 30KB | ≤ 30KB | ≤ 30KB | TBD | 🔄 |

### Interaction Performance
| Metric | Budget | Current | Status |
|--------|--------|---------|--------|
| Input → Frame (p95) | ≤ 100ms | TBD | 🔄 |
| Whiteboard Draw → Paint (p95) | ≤ 16.6ms | TBD | 🔄 |
| React Render Time (p95) | ≤ 50ms | TBD | 🔄 |

### Media/WebRTC Performance
| Metric | LAN | Wi-Fi | Current | Status |
|--------|-----|-------|---------|--------|
| Glass-to-Glass Latency (p95) | ≤ 350ms | ≤ 600ms | TBD | 🔄 |
| Screen Share FPS | 30fps | 24fps | TBD | 🔄 |
| Camera FPS | 30fps | 24fps | TBD | 🔄 |

### Memory & CPU
| Metric | Budget | Current | Status |
|--------|--------|---------|--------|
| Idle Memory | ≤ 150MB | TBD | 🔄 |
| Peak Memory (1000 shapes) | ≤ 250MB | TBD | 🔄 |
| CPU (60s draw test) | ≤ 40% | TBD | 🔄 |

## NPM Scripts

```bash
# Performance measurement
npm run perf:lighthouse      # Lighthouse CI
npm run perf:trace          # Chrome DevTools trace
npm run perf:bundle         # Bundle size analysis
npm run perf:coverage       # Test coverage
npm run perf:webrtc         # WebRTC stats

# Performance testing
npm run perf:test           # Run all perf tests
npm run perf:smoke          # Quick smoke test
```

## Baseline Files

```
perf/baseline/
├── lighthouse.json         # Lighthouse scores
├── bundle-stats.json       # Bundle analysis
├── trace.json             # Chrome trace
└── webrtc-stats.json      # Media metrics
```

## Reports

```
perf/reports/
├── bundle.html            # Bundle visualizer
├── lighthouse.html        # Lighthouse report
└── trace.html            # Trace viewer
```

## Optimization Phases

### Phase 1: Build & Bundle ✅
- Vite persistent cache
- Tree-shaking
- Code splitting
- Lazy loading

### Phase 2: CSS & Tailwind ✅
- JIT compilation
- Purge unused classes
- Critical CSS

### Phase 3: React Optimizations ✅
- React.memo
- useMemo/useCallback
- Zustand selectors
- Effect optimization

### Phase 4: Canvas/Whiteboard ✅
- OffscreenCanvas
- RAF batching
- Event coalescing
- Bitmap caching

### Phase 5: Media/WebRTC ✅
- Simulcast
- Dynacast
- Encoding tuning
- Track priority

### Phase 6: Network & Caching ✅
- Preconnect
- HTTP caching
- Image optimization

### Phase 7: Data Path ✅
- Virtualized lists
- Pagination
- Debouncing
- Query optimization

### Phase 8: UI Polish ✅
- Icon sprites
- CSS transforms
- GPU optimization

### Phase 9: Tooling & CI ✅
- ESLint perf rules
- Playwright perf tests
- Budget enforcement

### Phase 10: Report ✅
- Before/after metrics
- Flamegraphs
- Recommendations

## How to Measure

### Lighthouse
```bash
npm run perf:lighthouse
```

### Bundle Analysis
```bash
npm run perf:bundle
open perf/reports/bundle.html
```

### Chrome Trace
```bash
npm run perf:trace
# Upload to chrome://tracing
```

### WebRTC Stats
```bash
npm run perf:webrtc
# Check perf/reports/webrtc-stats.json
```

## Monitoring

### Key Metrics to Watch
1. **TTI** - Time to Interactive
2. **FCP** - First Contentful Paint
3. **LCP** - Largest Contentful Paint
4. **CLS** - Cumulative Layout Shift
5. **FID** - First Input Delay
6. **TBT** - Total Blocking Time

### Tools
- Chrome DevTools Performance
- React DevTools Profiler
- Lighthouse CI
- WebPageTest
- Bundle Analyzer

## Troubleshooting

### Slow Load Times
- Check bundle size
- Verify code splitting
- Check network waterfall

### Slow Interactions
- Profile with React DevTools
- Check for unnecessary re-renders
- Verify memoization

### Canvas Performance
- Check RAF loop
- Verify event coalescing
- Check canvas resolution

### Media Latency
- Check WebRTC stats
- Verify encoding settings
- Check network conditions
