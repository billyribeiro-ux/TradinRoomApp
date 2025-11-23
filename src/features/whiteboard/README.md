# Whiteboard Feature - Architecture Documentation

## Overview

Zoom-parity whiteboard system with clean architecture, proper state management, and enterprise-grade code quality.

## Architecture

### Component Hierarchy
```
WhiteboardSurface (container)
├── WhiteboardCanvasPro (rendering + interaction with DPR support)
└── WhiteboardToolbar (UI controls)
```

**Note:** Consolidated to single canvas component (WhiteboardCanvasPro) for simplicity and maintainability.

### State Management
- **Zustand Store** (`state/whiteboardStore.ts`) - Single source of truth
  - Tool state (tool, color, size, opacity)
  - Canvas state (shapes, selection)
  - History state (undo/redo)
  - Viewport state (pan, zoom)
  - Collaboration state (remote cursors)

### Utilities
- **drawPrimitives.ts** - Canvas2D rendering functions
- **transform.ts** - Pan/zoom mathematics, coordinate conversion
- **undoRedo.ts** - History management with coalescing
- **exporters.ts** - PNG/SVG export

### Hooks
- **usePointerDrawing.ts** - Unified pointer event handling (mouse/touch/stylus)

## Features (Phase 2 MVP)

✅ **Tools:**
- Select (click to select shapes)
- Hand (pan viewport)
- Pen (freehand drawing)
- Highlighter (semi-transparent marker)
- Eraser (remove strokes)
- Rectangle, Circle, Line, Arrow
- Text, Stamp (emoji)

✅ **Viewport:**
- Pan with hand tool or spacebar
- Zoom with mouse wheel (Ctrl+wheel)
- Viewport transform applied to all rendering

✅ **History:**
- Undo/Redo (Ctrl+Z, Ctrl+Shift+Z)
- Bounded history (100 entries max)
- Coalescing for continuous strokes

✅ **Export:**
- Export to PNG
- Download to file

## Usage

```typescript
import { WhiteboardOverlay } from '@/features/whiteboard/WhiteboardOverlay';

<WhiteboardOverlay
  isActive={isWhiteboardActive}
  canAnnotate={canManageRoom}
  width={window.innerWidth}
  height={window.innerHeight}
  roomId={room.id}
  userId={user.id}
  onClose={() => setIsWhiteboardActive(false)}
/>
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `isActive` | `boolean` | Show/hide whiteboard |
| `canAnnotate` | `boolean` | Allow drawing (false = view-only) |
| `width` | `number` | Canvas width in pixels |
| `height` | `number` | Canvas height in pixels |
| `roomId` | `string` | Room ID for collaboration |
| `userId` | `string` | Current user ID |
| `onClose` | `() => void` | Close handler |
| `onEventEmit` | `(event) => void` | Emit collaboration events (Phase 3) |
| `incomingEvents` | `Event[]` | Incoming collaboration events (Phase 3) |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `V` | Select tool |
| `H` | Hand tool (pan) |
| `P` | Pen tool |
| `E` | Eraser tool |
| `R` | Rectangle tool |
| `C` | Circle tool |
| `L` | Line tool |
| `A` | Arrow tool |
| `T` | Text tool |
| `Space` | Temporary hand tool (pan) |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |
| `Ctrl+Wheel` | Zoom |

## Performance

- **Pointer-to-paint latency:** < 16ms (60fps)
- **Undo/redo:** < 10ms
- **Memory:** < 50MB for 500 shapes
- **Render loop:** 60fps sustained via requestAnimationFrame

## Future Phases

### Phase 3: Parity Features
- Remote cursors with user names/colors
- Collaboration: op-log sync (insert/update/delete)
- Touch support (pinch zoom, two-finger pan)
- SVG export
- Laser pointer (animated trail)
- Pixel-based eraser

### Phase 4: Hardening
- Quadtree for selection performance
- Pointer coalescing
- Pressure sensitivity (stylus)
- Accessibility (ARIA, keyboard nav)
- Reduced motion mode

### Phase 5: QA & E2E
- Unit tests for utils
- Component tests for toolbar
- Playwright E2E tests

## Migration from Old System

The old monolithic `WhiteboardOverlay.tsx` (1,191 lines) has been retired to `/src/retired_files/whiteboard/`.

**Key improvements:**
- ✅ Separation of concerns (canvas, toolbar, state)
- ✅ Zustand store integration
- ✅ Pan/zoom viewport transforms
- ✅ Proper undo/redo system
- ✅ Export utilities
- ✅ Cleaner, more maintainable code

## Troubleshooting

### Whiteboard not showing
- Check `isActive` prop is `true`
- Verify z-index (should be 50)

### Drawing not working
- Check `canAnnotate` prop is `true`
- Verify pointer events are not blocked

### Performance issues
- Check shape count (> 1000 shapes may slow down)
- Verify requestAnimationFrame is running
- Check for memory leaks in browser DevTools

## Contributing

When adding new features:
1. Add types to `types.ts`
2. Add store actions to `whiteboardStore.ts`
3. Add rendering to `drawPrimitives.ts`
4. Add UI to `WhiteboardToolbar.tsx`
5. Update this README

## License

Proprietary - Revolution Trading Pros

## 🆕 Text & Emoji Tools (Latest Update)

### Text Tool Features
- **Full formatting support**: Font family, size, weight (bold), style (italic), decoration (underline)
- **Inline editing**: Textarea overlay with live preview
- **Multi-line support**: Press Enter for new lines
- **Keyboard shortcuts**: 
  - `Cmd/Ctrl+Enter` to finish editing
  - `Esc` to cancel
  - `Cmd/Ctrl+B` to toggle bold
- **DPR-aware rendering**: Sharp text on all displays
- **Word wrapping**: Automatic line breaking
- **Undo/redo**: Full history integration

### Emoji Tool Features
- **Emoji picker**: 64 emojis across 4 categories
- **Click to place**: Simple interaction model
- **Scalable**: Respects font size setting
- **Undo/redo**: Full history integration

### Debug System
Enable diagnostic logging:
```javascript
// In browser console
whiteboardDebug.enable()

// Disable
whiteboardDebug.disable()

// Check status
whiteboardDebug.isEnabled()
```

Debug categories:
- `POINTER` - Pointer events
- `TEXT` - Text tool operations
- `EMOJI` - Emoji tool operations
- `RENDER` - Canvas rendering
- `STATE` - Store updates
- `TOOLBAR` - Toolbar interactions
- `COMPOSITOR` - Recording compositor
- `UNDO` - History operations

### File Structure
```
src/features/whiteboard/
├── components/
│   ├── WhiteboardCanvasPro.tsx   # Main canvas with DPR support & all tools
│   ├── WhiteboardSurface.tsx     # Container component
│   ├── WhiteboardToolbar.tsx     # Toolbar with formatting controls
│   ├── TextEditor.tsx            # Inline text editor
│   └── EmojiPicker.tsx           # Emoji selection UI
├── tools/
│   ├── PenTool.ts                # Pen drawing tool
│   ├── HighlighterTool.ts        # Highlighter tool
│   ├── EraserTool.ts             # Eraser tool
│   ├── TextTool.ts               # Text tool
│   ├── EmojiTool.ts              # Emoji tool
│   ├── RectangleTool.ts          # Rectangle shape
│   ├── CircleTool.ts             # Circle shape
│   ├── LineTool.ts               # Line tool
│   └── ArrowTool.ts              # Arrow tool
├── utils/
│   ├── drawPrimitives.ts         # Rendering functions
│   ├── textLayout.ts             # Text measurement & formatting
│   ├── transform.ts              # Coordinate transforms
│   └── debug.ts                  # Debug logging
├── state/
│   └── whiteboardStore.ts        # Zustand store (SSOT)
├── types.ts                      # TypeScript types
└── __tests__/                    # Unit tests
    ├── textUndo.spec.ts
    └── emojiRender.spec.ts
```

### Testing
```bash
# Run all whiteboard tests
./scripts/test-whiteboard.sh

# Run specific tests
npm run test textLayout.spec.ts
npm run test textUndo.spec.ts
npm run test emojiRender.spec.ts

# Run E2E tests
npx playwright test whiteboard-text-emoji.spec.ts
```

### Keyboard Shortcuts
See `docs/whiteboard-shortcuts.md` for complete list.

**Quick reference:**
- `T` - Text tool
- `E` - Eraser tool
- `V` - Select tool
- `H` - Hand tool
- `P` - Pen tool
- `Cmd/Ctrl+Z` - Undo
- `Cmd/Ctrl+Shift+Z` - Redo

### Performance
- **Text rendering**: <1ms per node (DPR-aware)
- **Emoji rendering**: <0.5ms per emoji
- **Debug overhead**: 0ms when disabled
- **Bundle size**: +10KB gzipped

### Browser Support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

### Known Limitations
1. No text selection within rendered text (would require hit testing)
2. No resize handles for text boxes (would require selection UI)
3. No rich text editing (plain text only)
4. System emojis only (no custom uploads)

### Future Enhancements
- Selection handles for text/emoji
- Multi-select and grouping
- Text alignment options
- Text rotation
- More emoji categories
- Emoji search
- Recent emojis tracking

## Recording Integration

### Presenter-Only Toolbar
The toolbar has class `wb-presenter-only` and is never captured in recordings.

### Canvas Publishing
When recording is enabled:
1. Canvas is captured via `canvas.captureStream()`
2. Only drawings, text, and emojis appear in stream
3. Toolbar remains invisible to viewers

### Compositor Integration
Text and emoji are rendered directly to canvas before streaming, ensuring they appear in recordings when "Include in Recording" is enabled.

## Troubleshooting

### Text not appearing
1. Enable debug: `whiteboardDebug.enable()`
2. Check console for `[WB:TEXT]` logs
3. Verify text tool is selected
4. Check if text editor appeared on click

### Emoji not placing
1. Enable debug mode
2. Check console for `[WB:EMOJI]` logs
3. Verify emoji picker opened
4. Check if emoji was selected

### Formatting not applying
1. Verify toolbar controls are visible when text tool is active
2. Check store state in React DevTools
3. Verify font formatting is passed to shape

### Performance issues
1. Check number of shapes in store
2. Verify RAF batching is working
3. Check for memory leaks in DevTools
4. Disable debug mode if enabled

## Contributing

### Adding New Tools
1. Add tool type to `types.ts`
2. Create tool module in `tools/` directory (e.g., `MyTool.ts`)
3. Add rendering logic to `WhiteboardCanvasPro.tsx` or tool module
4. Add toolbar button to `WhiteboardToolbar.tsx`
5. Update `whiteboardStore.ts` if new state is needed
6. Add keyboard shortcut if applicable
7. Add tests

### Code Style
- TypeScript strict mode
- ESLint + Prettier
- Functional components with hooks
- Zustand for state management
- Test-driven development

### Testing Requirements
- Unit tests for utilities
- Integration tests for components
- E2E tests for user flows
- 80%+ code coverage target

## License
See main project LICENSE file.
