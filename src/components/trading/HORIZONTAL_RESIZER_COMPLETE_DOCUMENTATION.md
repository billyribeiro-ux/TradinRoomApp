# **COMPLETE DOCUMENTATION: Horizontal Resizer Bar & alertsHeight SSOT**

---

## **📋 OVERVIEW**

The **HorizontalResizeHandle** is the horizontal bar between alerts and chat that controls the vertical split. When dragged UP, the alerts panel grows (more messages visible). When dragged DOWN, it shrinks (fewer messages visible).

**Key Components:**
- `alertsHeight` - SSOT state (pixels) 
- `handleVerticalResizeDown` - Handler that updates the state
- `HorizontalResizeHandle` - UI component that triggers the handler
- CSS variables and localStorage for persistence

---

## **📁 FILE 1: `/Users/user/Desktop/Wilbur/src/components/trading/useTradingRoomState.ts`**

### **🔹 SSOT State Management**

#### **Line 11: Default Value Definition**
```typescript
const DEFAULTS = { leftPanelWidth: 480, alertsHeight: 300 };
```
- **Purpose**: Default alerts panel height
- **Value**: `300px`
- **Used**: When no saved state exists in localStorage

#### **Line 12: Storage Key**
```typescript
const STORAGE_KEY = 'tradingRoom.layout.v1';
```
- **Purpose**: localStorage key for persisting layout state
- **Format**: JSON string with `{ leftPanelWidth, alertsHeight }`

#### **Line 59: State Interface Property**
```typescript
// In UseTradingRoomStateReturn interface
alertsHeight: number;
```
- **Purpose**: TypeScript type definition for returned state
- **Type**: `number` (pixels)

#### **Line 106: Setter Interface Property**
```typescript
// In UseTradingRoomStateReturn interface  
setAlertsHeight: (height: number) => void;
```
- **Purpose**: TypeScript type definition for setter function
- **Signature**: Takes height in pixels, returns void

#### **Line 231: SSOT STATE DECLARATION** ⭐⭐⭐
```typescript
const [alertsHeight, setAlertsHeight] = useState<number>(DEFAULTS.alertsHeight);
```
- **THIS IS THE SINGLE SOURCE OF TRUTH**
- **Initial Value**: `300` (from DEFAULTS)
- **State Hook**: React useState with TypeScript
- **Scope**: Lives in useTradingRoomState hook
- **Flows To**: All other components via props

#### **Lines 234-243: Load from localStorage on Mount**
```typescript
useEffect(() => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const { leftPanelWidth, alertsHeight } = JSON.parse(raw);
      if (typeof leftPanelWidth === 'number') setLeftPanelWidth(leftPanelWidth);
      if (typeof alertsHeight === 'number') setAlertsHeight(alertsHeight);
    }
  } catch {}
}, []);
```
- **Purpose**: Restore user's previous panel height
- **Timing**: Runs once on component mount
- **Safety**: Type checking prevents invalid values
- **Error Handling**: Try/catch prevents localStorage failures

#### **Lines 246-253: Persist to localStorage on Changes**
```typescript
useEffect(() => {
  const id = requestAnimationFrame(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ leftPanelWidth, alertsHeight }));
    } catch {}
  });
  return () => cancelAnimationFrame(id);
}, [leftPanelWidth, alertsHeight]);
```
- **Purpose**: Save state whenever it changes
- **Performance**: Uses requestAnimationFrame to batch writes
- **Trigger**: Runs every time `alertsHeight` changes
- **Cleanup**: Cancels rAF on unmount

#### **Lines 256-262: Reset Layout Function**
```typescript
const resetLayout = useCallback(() => {
  setLeftPanelWidth(DEFAULTS.leftPanelWidth);
  setAlertsHeight(DEFAULTS.alertsHeight);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULTS));
  } catch {}
}, []);
```
- **Purpose**: Reset alerts height to default 300px
- **Called**: When user wants to reset layout
- **Persistence**: Updates localStorage immediately

#### **Lines 375-376: Initial CSS Variable Setup**
```typescript
// Set initial panel dimensions
root.style.setProperty('--panel-width', `${leftPanelWidth}px`);
root.style.setProperty('--alert-height', `${alertsHeight}px`);
```
- **Purpose**: Set CSS custom properties on initial mount
- **CSS Variable**: `--alert-height` (used by other components)
- **Timing**: Runs once on mount

#### **Lines 418-420: Update CSS Variable on Changes**
```typescript
useEffect(() => {
  document.documentElement.style.setProperty('--alert-height', `${alertsHeight}px`);
}, [alertsHeight]);
```
- **Purpose**: Keep CSS variable in sync with state
- **Trigger**: Every time `alertsHeight` changes
- **Usage**: Other components can read `var(--alert-height)`

#### **Line 441: Export State from Hook**
```typescript
return {
  // ... other properties
  alertsHeight,      // ← Current height value
  // ... other properties
};
```

#### **Line 491: Export Setter from Hook**
```typescript
return {
  // ... other properties
  setAlertsHeight,   // ← Function to update height
  // ... other properties
};
```

---

## **📁 FILE 2: `/Users/user/Desktop/Wilbur/src/components/trading/TradingRoomContainer.tsx`**

### **🔹 Handler Implementation**

#### **Line 85: Import Current Height from SSOT**
```typescript
const {
  // ... other properties
  alertsHeight,  // ← Get current height from useTradingRoomState
  // ... other properties
} = tradingRoomState;
```
- **Purpose**: Access current alerts height for calculations
- **Source**: Comes from useTradingRoomState SSOT
- **Usage**: Used as `startHeight` in resize calculations

#### **Line 111: Import Setter from SSOT**
```typescript
const {
  // ... other properties
  setAlertsHeight, // ← Get setter function from useTradingRoomState
  // ... other properties
} = tradingRoomState;
```
- **Purpose**: Get function to update alerts height
- **Source**: Comes from useTradingRoomState SSOT
- **Usage**: Called to update state during drag

#### **Lines 138-206: COMPLETE HANDLER DEFINITION** ⭐⭐⭐
```typescript
// Vertical resize handler - controls alerts panel height (ENTERPRISE PATTERN)
const handleVerticalResizeDown = useCallback((
  e: React.MouseEvent | React.TouchEvent | React.PointerEvent
): void => {
  e.preventDefault();
  
  // Lines 144-145: Universal coordinate getter for all event types
  const getClientY = (evt: MouseEvent | TouchEvent | PointerEvent) =>
    'touches' in evt ? evt.touches[0]?.clientY ?? 0 : evt.clientY;

  // Line 147: Capture starting Y position when drag begins
  const startY = getClientY(e.nativeEvent);
  
  // Line 148: Capture starting height from SSOT
  const startHeight = alertsHeight;
  
  // Lines 149-151: Calculate dynamic constraints based on viewport
  const viewportHeight = window.innerHeight;
  const minHeight = Math.max(120, viewportHeight * 0.15); // Min: 120px or 15vh
  const maxHeight = viewportHeight * 0.6;                  // Max: 60vh
  
  // Line 153: rAF ID for animation frame management
  let rafId: number | null = null;

  // Lines 155-171: Move handler - runs on every mouse/touch/pointer move
  const handleMove = (moveEvent: MouseEvent | TouchEvent | PointerEvent) => {
    moveEvent.preventDefault();
    
    // Lines 159-161: Cancel previous frame to prevent stacking
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }
    
    // Lines 163-170: Schedule update in next animation frame (60fps)
    rafId = requestAnimationFrame(() => {
      const currentY = getClientY(moveEvent);
      
      // Line 165: ⭐ INVERTED DELTA CALCULATION ⭐
      const deltaY = startY - currentY; 
      // LOGIC:
      // - Drag UP:   currentY < startY → deltaY > 0 → height INCREASES
      // - Drag DOWN: currentY > startY → deltaY < 0 → height DECREASES
      // This matches standard chat app behavior (up = more messages)
      
      // Line 168: Calculate new height with constraints
      const newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight + deltaY));
      
      // Line 169: ⭐ UPDATE SSOT STATE ⭐
      setAlertsHeight(newHeight);
      // This triggers:
      // 1. State update in useTradingRoomState
      // 2. localStorage persistence
      // 3. CSS variable update
      // 4. UI re-render with new height
    });
  };

  // Lines 173-192: End handler - cleanup when drag ends
  const handleEnd = () => {
    // Lines 175-177: Cancel any pending animation frame
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    
    // Lines 180-186: Remove all event listeners (memory leak prevention)
    window.removeEventListener('mousemove', handleMove);
    window.removeEventListener('mouseup', handleEnd);
    window.removeEventListener('touchmove', handleMove);
    window.removeEventListener('touchend', handleEnd);
    window.removeEventListener('pointermove', handleMove);
    window.removeEventListener('pointerup', handleEnd);
    
    // Lines 189-191: Reset body styles that were set during drag
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.body.style.touchAction = '';
  };

  // Lines 195-197: Set body styles during drag operation
  document.body.style.cursor = 'row-resize';    // Visual feedback
  document.body.style.userSelect = 'none';      // Prevent text selection
  document.body.style.touchAction = 'none';     // Prevent browser touch actions
  
  // Lines 200-205: Attach event listeners for drag operation
  window.addEventListener('mousemove', handleMove);
  window.addEventListener('mouseup', handleEnd);
  window.addEventListener('touchmove', handleMove, { passive: false });
  window.addEventListener('touchend', handleEnd);
  window.addEventListener('pointermove', handleMove);
  window.addEventListener('pointerup', handleEnd);
  
// Line 206: React useCallback dependencies
}, [alertsHeight, setAlertsHeight]);
```

**ENTERPRISE FEATURES:**
- ✅ **60fps rAF batching** - Smooth updates via requestAnimationFrame
- ✅ **Multi-input support** - Mouse, Touch, and Pointer events
- ✅ **INVERTED logic** - Drag UP = grow (standard chat behavior)
- ✅ **Memory leak prevention** - Proper listener cleanup
- ✅ **Touch optimization** - touchAction prevention
- ✅ **Dynamic constraints** - Min/max based on viewport size
- ✅ **Visual feedback** - Cursor and user-select changes

#### **Line 587: Pass State to Layout**
```typescript
const layoutState: TradingRoomLayoutProps['state'] = {
  // ... other properties
  alertsHeight,  // ← Current height passed to TradingRoomLayout
  // ... other properties
};
```

#### **Line 609: Pass Handler to Layout**
```typescript
const layoutHandlers: TradingRoomLayoutProps['handlers'] = {
  // ... other handlers
  handleVerticalResizeDown,  // ← Handler passed to TradingRoomLayout
  // ... other handlers
};
```

---

## **📁 FILE 3: `/Users/user/Desktop/Wilbur/src/components/trading/types.ts`**

### **🔹 TypeScript Definitions**

#### **Line 72: State Interface Type**
```typescript
export interface TradingRoomState {
  // ... other properties
  readonly alertsHeight: Px;  // ← Type alias for number (pixels)
  // ... other properties
}
```
- **Px Type**: `type Px = number;` (defined earlier in file)
- **readonly**: Prevents direct mutation
- **Purpose**: Type safety for alerts height

#### **Line 124: Handler Interface Type**
```typescript
export interface TradingRoomHandlers {
  // ... other handlers
  readonly handleVerticalResizeDown: (e: ResizeStartEvent) => void; // alerts ↕ chat
  // ... other handlers
}
```
- **ResizeStartEvent**: Union type for React.MouseEvent | React.TouchEvent | React.PointerEvent
- **Comment**: Clarifies this controls alerts ↕ chat vertical split
- **Purpose**: Type safety for resize handler

---

## **📁 FILE 4: `/Users/user/Desktop/Wilbur/src/components/trading/TradingRoomLayout.tsx`**

### **🔹 UI Component Implementation**

#### **Lines 161-170: Apply Height to Alerts Section**
```typescript
<section
  data-testid="alerts-panel"
  aria-label="Trading Alerts"
  className="flex-shrink-0 border-b border-slate-700 relative z-10 bg-slate-800"
  style={{ 
    height: `${state.alertsHeight || 300}px`,  // ← APPLY SSOT HEIGHT
    minHeight: '120px',
    maxHeight: '60%'
  }}
>
```
- **Purpose**: Render alerts section with dynamic height
- **Source**: `state.alertsHeight` comes from TradingRoomContainer
- **Fallback**: `300px` if undefined (shouldn't happen with SSOT)
- **Constraints**: CSS min/max for safety

#### **Lines 186-194: HorizontalResizeHandle Component**
```typescript
{/* Horizontal Resizer (Controls Vertical Split) */}
<HorizontalResizeHandle
  onMouseDown={handlers.handleVerticalResizeDown}  // ← ATTACH HANDLER
  role="separator"
  ariaOrientation="horizontal"
  ariaValueMin={120}
  ariaValueMax={Math.round((state.size?.h ?? 0) * 0.6)}
  ariaValueNow={state.alertsHeight}  // ← CURRENT HEIGHT FOR A11Y
  side="right"
/>
```
- **onMouseDown**: Triggers `handleVerticalResizeDown` when user drags
- **ariaValueNow**: Current height for screen readers
- **ariaValueMin/Max**: Dynamic constraints based on viewport
- **side="right"**: Visual alignment for collapse/expand buttons

---

## **📁 FILE 5: `/Users/user/Desktop/Wilbur/src/components/trading/HorizontalResizeHandle.tsx`**

### **🔹 UI Component Definition**

#### **Lines 42-47: Component Documentation**
```typescript
/**
 * HorizontalResizeHandle
 * Creates a HORIZONTAL divider that resizes panels VERTICALLY (alerts/chat split).
 * UI/Effects preserved exactly. Adds:
 * - Pointer Events (without removing your mouse/touch paths)
 * - A11y (role=separator, aria-orientation, values)
 * - Keyboard resizing (ArrowUp/Down, Shift for larger, Home/End)
 */
```
- **Purpose**: Clear documentation of component's role
- **Behavior**: Horizontal bar that controls vertical split
- **Features**: Accessibility, keyboard support, multi-input

#### **Lines 49-66: Component Props Interface**
```typescript
export const HorizontalResizeHandle = React.memo(function HorizontalResizeHandle({
  onMouseDown,        // ← Handler from TradingRoomLayout
  side,               // ← 'right' for alignment
  role = 'separator', // ← A11y role
  ariaOrientation = 'horizontal', // ← A11y orientation
  ariaValueMin,       // ← Min height for A11y
  ariaValueMax,       // ← Max height for A11y
  ariaValueNow,       // ← Current height for A11y
  onCollapse,         // ← Optional collapse button
  onExpand,           // ← Optional expand button
  step = 8,           // ← Keyboard resize step
  stepLarge = 24,     // ← Large step with Shift
  onKeyboardDelta,    // ← Keyboard resize callback
  onKeyboardHome,     // ← Snap to min callback
  onKeyboardEnd,      // ← Snap to max callback
  disabled = false,   // ← Disable interactions
  'data-testid': dataTestId = 'alerts-chat-separator', // ← Test selector
}: HorizontalResizeHandleProps) {
```

#### **Lines 67-89: Keyboard Resize Handler**
```typescript
const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
  if (disabled) return;
  const isLarge = e.shiftKey;
  const d = isLarge ? stepLarge : step;
  switch (e.key) {
    case 'ArrowUp':
      e.preventDefault();
      onKeyboardDelta?.(+d);  // ← Arrow UP = increase height
      break;
    case 'ArrowDown':
      e.preventDefault();
      onKeyboardDelta?.(-d); // ← Arrow DOWN = decrease height
      break;
    case 'Home':
      e.preventDefault();
      onKeyboardHome?.();    // ← Home = min height
      break;
    case 'End':
      e.preventDefault();
      onKeyboardEnd?.();     // ← End = max height
      break;
  }
}, [disabled, step, stepLarge, onKeyboardDelta, onKeyboardHome, onKeyboardEnd]);
```
- **Purpose**: Keyboard accessibility for resize
- **Logic**: Arrow keys match inverted drag logic (UP = grow)

#### **Lines 91-107: Render JSX**
```typescript
return (
  <div
    data-testid={dataTestId}
    role={role}
    aria-label="Resize between alerts and chat"
    aria-orientation={ariaOrientation}
    aria-valuemin={ariaValueMin}
    aria-valuemax={ariaValueMax}
    aria-valuenow={ariaValueNow}
    tabIndex={disabled ? -1 : 0}
    className="relative h-1 cursor-row-resize hover:bg-blue-500/50 transition-all bg-slate-800 backdrop-blur-sm group border-y border-white/10 hover:shadow-[0_0_20px_rgba(148,163,184,0.9),0_0_40px_rgba(148,163,184,0.5)] touch-none"
    style={{ zIndex: 100, touchAction: 'none' }}
    // Keep your original paths intact for maximum compatibility
    onMouseDown={onMouseDown}  // ← TRIGGER RESIZE HANDLER
    onTouchStart={onMouseDown as unknown as (e: React.TouchEvent) => void}
    onKeyDown={handleKeyDown}
  >
```
- **onMouseDown**: Passes event to `handleVerticalResizeDown`
- **onTouchStart**: Touch support (casts to TouchEvent)
- **onKeyDown**: Keyboard support via `handleKeyDown`
- **Accessibility**: Full ARIA support for screen readers

---

## **📁 FILE 6: `/Users/user/Desktop/Wilbur/src/components/icons/AlertsPanel.entry.tsx`**

### **🔹 Container for Alerts Messages**

#### **Lines 81-93: Flex Layout for Proper Resize**
```typescript
return (
  <div className="flex flex-col h-full w-full">
    <div className="flex-shrink-0">
      {ToolbarComponent ? React.createElement(ToolbarComponent, { counts: counts, onSearch: handleSearch, onFilterChange: handleFilterChange }) : null}
    </div>
    <div className="flex-1 overflow-y-auto min-h-0" style={{ overflowAnchor: 'auto' }}>
      {React.createElement(ListComponent, { alerts, onSelect: handleSelect, onAck: handleAck, onDelete: handleDelete })}
    </div>
    {ComposerComponent ? (
      <div className="flex-shrink-0">
        {React.createElement(ComposerComponent, { onSubmit: handleSubmit, isOpen: false, onClose: () => {} })}
      </div>
    ) : null}
  </div>
);
```
- **flex-shrink-0**: Toolbar and composer maintain fixed height
- **flex-1 overflow-y-auto**: Messages area grows/shrinks with resize
- **min-h-0**: Critical for flex overflow to work properly
- **overflowAnchor: 'auto'**: Maintains scroll position during resize

---

## **📁 FILE 7: `/Users/user/Desktop/Wilbur/src/components/icons/AlertsList.tsx`**

### **🔹 Messages List Component**

#### **Line 73: Responsive Container**
```typescript
<div data-testid="alerts-list" className="space-y-4 p-4 w-full overflow-x-hidden flex flex-col">
```
- **flex flex-col**: Ensures proper vertical layout
- **w-full**: Takes full width of container
- **overflow-x-hidden**: Prevents horizontal scroll

---

## **🔄 COMPLETE DATA FLOW**

### **1. Initialization Flow**
```
useTradingRoomState.ts (Line 231)
  ↓ [alertsHeight = 300]
  ↓
TradingRoomContainer.tsx (Line 85)
  ↓ [destructure]
  ↓
TradingRoomLayout.tsx (Line 166)
  ↓ [height: `${state.alertsHeight}px`]
  ↓
Alerts section renders at 300px
```

### **2. Resize Event Flow**
```
User drags HorizontalResizeHandle
  ↓
onMouseDown (Line 104 TradingRoomLayout.tsx)
  ↓
handlers.handleVerticalResizeDown
  ↓
handleMove with rAF (Lines 163-170 TradingRoomContainer.tsx)
  ↓
setAlertsHeight(newHeight) [INVERTED deltaY]
  ↓
useTradingRoomState updates (Line 231)
  ↓
localStorage persists (Lines 246-253)
  ↓
CSS variable updates (Lines 418-420)
  ↓
UI re-renders with new height
```

### **3. Persistence Flow**
```
setAlertsHeight(newHeight)
  ↓
useEffect triggers (Line 246 useTradingRoomState.ts)
  ↓
requestAnimationFrame batches write
  ↓
localStorage.setItem(STORAGE_KEY, JSON.stringify({ alertsHeight }))
  ↓
Next mount: localStorage restores (Lines 234-243)
```

---

## **🎯 KEY IMPLEMENTATION DETAILS**

### **INVERTED Delta Logic (Line 165)**
```typescript
const deltaY = startY - currentY; // INVERTED
```
- **Standard**: `currentY - startY` (drag down = grow)
- **INVERTED**: `startY - currentY` (drag up = grow)
- **Purpose**: Matches chat app expectations (up = more messages)

### **rAF Batching (Lines 163-170)**
```typescript
rafId = requestAnimationFrame(() => {
  const newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight + deltaY));
  setAlertsHeight(newHeight);
});
```
- **60fps updates**: Smooth visual performance
- **Cancellation**: Prevents stacked frames
- **Batching**: Reduces DOM writes

### **Dynamic Constraints (Lines 149-151)**
```typescript
const viewportHeight = window.innerHeight;
const minHeight = Math.max(120, viewportHeight * 0.15); // 120px or 15vh
const maxHeight = viewportHeight * 0.6;                  // 60vh
```
- **Responsive**: Adapts to screen size
- **Minimum**: 120px absolute minimum
- **Maximum**: 60% of viewport height

### **Multi-Input Support (Lines 200-205)**
```typescript
window.addEventListener('mousemove', handleMove);
window.addEventListener('mouseup', handleEnd);
window.addEventListener('touchmove', handleMove, { passive: false });
window.addEventListener('touchend', handleEnd);
window.addEventListener('pointermove', handleMove);
window.addEventListener('pointerup', handleEnd);
```
- **Mouse**: Desktop support
- **Touch**: Mobile/tablet support
- **Pointer**: Modern input API

---

## **📊 SUMMARY**

| Component | Lines | Purpose |
|-----------|-------|---------|
| **useTradingRoomState.ts** | 11, 12, 59, 106, 231, 234-243, 246-253, 256-262, 375-376, 418-420, 441, 491 | **SSOT state management, persistence, CSS variables** |
| **TradingRoomContainer.tsx** | 85, 111, 138-206, 587, 609 | **Handler definition with enterprise features** |
| **types.ts** | 72, 124 | **TypeScript interface definitions** |
| **TradingRoomLayout.tsx** | 161-170, 186-194 | **Apply height to UI, attach handler to component** |
| **HorizontalResizeHandle.tsx** | 42-47, 49-66, 67-89, 91-107 | **UI component with accessibility and keyboard support** |
| **AlertsPanel.entry.tsx** | 81-93 | **Container with proper flex layout for resize** |
| **AlertsList.tsx** | 73 | **Messages list with responsive layout** |

**Total: 23 locations across 7 files**

The horizontal resizer bar is fully implemented with enterprise-grade features including smooth animations, multi-input support, accessibility, persistence, and proper responsive behavior.
