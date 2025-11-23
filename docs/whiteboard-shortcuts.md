# Whiteboard Keyboard Shortcuts

## Tool Selection

| Action | Mac | Windows/Linux |
|--------|-----|---------------|
| Select Tool | V | V |
| Hand/Pan Tool | H | H |
| Pen Tool | P | P |
| Text Tool | T | T |
| Emoji Tool | (Click button) | (Click button) |
| Eraser Tool | E or X | E or X |

## Editing

| Action | Mac | Windows/Linux |
|--------|-----|---------------|
| Undo | ⌘Z | Ctrl+Z |
| Redo | ⇧⌘Z | Ctrl+Shift+Z or Ctrl+Y |
| Delete Selected | ⌫ or ⌦ | Backspace or Delete |

## Text Editing

| Action | Mac | Windows/Linux |
|--------|-----|---------------|
| New Line | ⏎ | Enter |
| Finish Editing | ⌘⏎ | Ctrl+Enter |
| Cancel Editing | Esc | Esc |
| Bold Toggle | ⌘B | Ctrl+B |
| Increase Font Size | ⌘= | Ctrl+= |
| Decrease Font Size | ⌘- | Ctrl+- |

## Navigation

| Action | Mac | Windows/Linux |
|--------|-----|---------------|
| Move Selected (1px) | Arrow Keys | Arrow Keys |
| Nudge (10px) | ⇧ + Arrow | Shift + Arrow |
| Pan Canvas | Space + Drag | Space + Drag |
| Zoom In | ⌘+ | Ctrl++ |
| Zoom Out | ⌘- | Ctrl+- |

## Toolbar

| Action | Mac | Windows/Linux |
|--------|-----|---------------|
| Toggle Toolbar | ⌘; | Ctrl+; |
| Drag Toolbar | Click & Drag Header | Click & Drag Header |
| Resize Toolbar | Drag Right Edge | Drag Right Edge |

## Debug Mode

To enable diagnostic logging, open browser console and run:
```javascript
whiteboardDebug.enable()
```

To disable:
```javascript
whiteboardDebug.disable()
```

## Notes

- All shortcuts work when the whiteboard is active
- Text editing shortcuts only work when text editor is focused
- Toolbar is presenter-only and never appears in recordings
- Position and size of toolbar persist across sessions
