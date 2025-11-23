# Archived Logger Implementations

**Archived:** November 1, 2025, 7:42 PM  
**Reason:** Consolidated to `productionLogger.ts`

## Migration Summary

All logger implementations have been consolidated to use `productionLogger.ts` for:
- Consistency across codebase
- Better features (scoped logging, performance tools)
- Zero production overhead
- Easier maintenance

## Files Archived:

### `logger.ts` (Original)
- **Size:** 109 lines
- **Was used by:** 1 file (roomFiles.tsx)
- **Features:** Log storage, history, singleton pattern
- **Status:** Replaced with productionLogger

### `../lib/logger.ts` (Azure Integration)
- **Size:** 125 lines
- **Was used by:** 2 files (errorBoundary.tsx, spotifyFallback.ts)
- **Features:** Azure App Insights, CRITICAL level
- **Status:** Replaced with productionLogger + CRITICAL wrapper

## Migration Details:

### Updated Files:
1. ✅ `components/infrastructure.ts` - Now uses productionLogger.scope()
2. ✅ `lib/errorBoundary.tsx` - Uses productionLogger with log alias
3. ✅ `services/spotifyFallback.ts` - Uses scoped logger
4. ✅ `components/rooms/roomFiles.tsx` - Direct productionLogger import

### Files Using loggerFactory (auto-updated):
- `components/trading/TradingRoomContainer.tsx`
- `components/trading/useHotkeys.ts`
- `components/trading/useRoomPresence.ts`
- `components/trading/utils/performance.ts`

## Active Logger:
**`../productionLogger.ts`** - Single source of truth for all logging

## Deletion Policy:
These files are safe to delete after 7 days (November 8, 2025) if no issues arise.

## Rollback:
If needed, restore from this archive.
