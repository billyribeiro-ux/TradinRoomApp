# Architecture Documentation

## Single Source of Truth (SSOT) Pattern

### AdvancedBrandingSettings Migration

**Effective Date:** November 2, 2025  
**Status:** Complete  
**Migration Strategy:** Non-breaking with deprecation warnings

#### Background
The `AdvancedBrandingSettings` component was originally located in `/src/components/icons/` but has been consolidated to `/src/components/theme/` as the Single Source of Truth (SSOT). This migration enforces architectural consistency and prevents duplicate implementations.

#### Implementation
- **SSOT Location:** `/src/components/theme/AdvancedBrandingSettings.tsx`
- **Legacy Shim:** `/src/components/icons/AdvancedBrandSettings.tsx` (re-export only)
- **ESLint Enforcement:** Warns on imports from legacy path (will become error in next sprint)

#### Migration Path
All imports have been rewritten to use the SSOT path:
```typescript
// ✅ Correct (SSOT)
import { AdvancedBrandingSettings } from '@/components/theme/AdvancedBrandingSettings';

// ⚠️ Deprecated (legacy shim - will warn)
import { AdvancedBrandingSettings } from '@/components/icons/AdvancedBrandSettings';
```

The legacy shim remains functional for backward compatibility but will be removed in a future release. Developers are encouraged to update imports immediately to avoid warnings.

#### Rationale
- **Consistency:** Theme-related components belong in `/theme/` directory
- **Maintainability:** Single implementation prevents divergence and bugs
- **Discoverability:** Clear organizational structure aids navigation
- **Type Safety:** Centralized exports ensure consistent TypeScript contracts

#### Next Steps
- **Current Sprint:** ESLint warns on legacy imports
- **Next Sprint:** Flip ESLint rule from 'warn' to 'error'
- **Future Release:** Remove legacy shim entirely after migration period

---

## Component Organization

### Directory Structure
```
src/components/
├── theme/              # Theme and branding components (SSOT)
│   ├── AdvancedBrandingSettings.tsx  # Main branding modal
│   ├── BrandingSettings.tsx          # Simple branding panel
│   ├── ThemeSettingsPanel.tsx        # Theme settings container
│   └── ...
├── icons/              # Legacy location (shims only)
│   └── AdvancedBrandSettings.tsx     # DEPRECATED: Re-export shim
└── ...
```

### Import Conventions
- Prefer absolute imports using `@/` alias for cross-directory imports
- Use relative imports for same-directory or sibling imports
- Always import from SSOT locations, never from shims

---

## Testing Strategy

### Test Coverage
- **Unit Tests:** 36 tests covering all utilities and services (100% pass rate)
- **Component Tests:** 13 tests for AdvancedBrandingSettings (100% pass rate)
- **E2E Tests:** 6 smoke scenarios for critical user flows

### Test Organization
```
tests/
├── unit/               # Fast, isolated utility tests
├── smoke/              # E2E smoke tests (Playwright)
└── e2e/                # Full E2E test suite

src/
├── test-utils/         # Shared test helpers and mocks
└── **/__tests__/       # Component tests co-located with source
```

See [TESTING.md](../TESTING.md) for detailed testing documentation.

---

## Stability Patterns

### Concurrency Control
All async operations use latest-wins pattern with request IDs:
```typescript
const reqId = useRef<number>(0);

const handler = async () => {
  const id = ++reqId.current;
  // ... async work ...
  if (id !== reqId.current) return; // Superseded
  // ... apply results ...
};
```

### SSR Safety
All browser-only code is guarded:
```typescript
if (typeof window === 'undefined') return;
document.body.classList.add('modal-open');
```

### Rate Limiting
User actions are rate-limited to prevent abuse:
```typescript
const limiter = createRateLimiter(5000, 3); // 3 actions per 5 seconds
if (!limiter.attempt()) {
  showToast('Please slow down', 'warning');
  return;
}
```

---

## Code Quality Standards

### TypeScript
- Strict mode enabled
- No `any` types (use `unknown` with type guards)
- No non-null assertions (`!`)
- Explicit return types for public APIs

### ESLint
- Zero warnings policy
- SSOT import enforcement
- React hooks rules enabled
- Import order conventions

### Testing
- 100% coverage for utilities and services
- 80%+ coverage for components
- All tests must pass before merge
- No flaky tests allowed

---

## Deployment

### Build Verification
```bash
# TypeScript check
npx tsc --noEmit

# Lint check
npx eslint . --max-warnings=0

# Unit tests
npm run test:unit

# E2E tests (optional in CI)
npm run test:e2e
```

### CI/CD Pipeline
1. Install dependencies
2. Run TypeScript check
3. Run ESLint
4. Run unit tests
5. Build application
6. Run E2E tests (if browsers available)
7. Deploy to staging/production

---

## Performance

### Bundle Size
- Code splitting by route
- Lazy loading for modals and heavy components
- Tree shaking enabled

### Runtime Performance
- Memoization for expensive computations
- Debouncing for user input
- Rate limiting for API calls
- Optimistic UI updates with rollback

### Monitoring
- Error tracking via console.error
- Performance metrics via browser DevTools
- User feedback via toast notifications

---

## Security

### Authentication
- Admin verification with 1-hour minimum account age
- Role-based access control (RBAC)
- Session validation on sensitive operations

### Data Validation
- File type and size validation
- Color hex validation
- Input sanitization
- SQL injection prevention (Supabase RLS)

### Rate Limiting
- Front-end rate limiting (3 actions per 5 seconds)
- Back-end rate limiting (Supabase policies)
- Concurrency control (latest-wins pattern)

---

## Future Improvements

### Planned Enhancements
- [ ] Real-time theme preview across all users
- [ ] Theme marketplace for sharing presets
- [ ] Advanced color palette generator
- [ ] Accessibility contrast checker
- [ ] Theme versioning and rollback

### Technical Debt
- [ ] Remove legacy shim after migration period
- [ ] Consolidate duplicate validation logic
- [ ] Add integration tests for theme persistence
- [ ] Improve E2E test coverage
- [ ] Add visual regression tests

---

*Last Updated: November 2, 2025*
