// ============================================================================
// WHITEBOARD TOOLBAR - Tool Selection & Controls
// ============================================================================
// Draggable toolbar with all whiteboard tools
// ============================================================================

import { useState, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPen,
  faHighlighter,
  faEraser,
  faSquare,
  faCircle,
  faArrowRight,
  faFont,
  faSmile,
  faMousePointer,
  faHand,
  faUndo,
  faRedo,
  faTrash,
  faDownload,
  faTimes,
  faGripLines,
  faPalette,
} from '@fortawesome/free-solid-svg-icons';
import { useWhiteboardStore } from '../state/whiteboardStore';
import { exportToPNG, downloadBlob } from '../utils/exporters';
import { useDraggable } from '../hooks/useDraggable';
import { ClearBoardModal } from './ClearBoardModal';
import type { WhiteboardTool } from '../types';
import { useFluentIcons } from '../../../icons/useFluentIcons';
import type React from 'react';

interface WhiteboardToolbarProps {
  onClose: () => void;
  canManageRoom: boolean;
}

interface ToolConfig {
  tool: WhiteboardTool;
  icon: typeof faPen;
  label: string;
  testId?: string;
}

const TOOLS: Array<ToolConfig> = [
  { tool: 'select',      icon: faMousePointer, label: 'Select (V)',    testId: 'tool-select' },
  { tool: 'hand',        icon: faHand,         label: 'Pan (H)',       testId: 'tool-hand' },
  { tool: 'pen',         icon: faPen,          label: 'Pen (P)',       testId: 'tool-pen' },
  { tool: 'highlighter', icon: faHighlighter,  label: 'Highlighter',   testId: 'tool-highlighter' },
  { tool: 'eraser',      icon: faEraser,       label: 'Eraser (E)',    testId: 'tool-eraser' },
  { tool: 'line',        icon: faGripLines,    label: 'Line (L)',      testId: 'tool-line' },
  { tool: 'rectangle',   icon: faSquare,       label: 'Rectangle (R)', testId: 'tool-rectangle' },
  { tool: 'circle',      icon: faCircle,       label: 'Circle (C)',    testId: 'tool-circle' },
  { tool: 'arrow',       icon: faArrowRight,   label: 'Arrow (A)',     testId: 'tool-arrow' },
  { tool: 'text',        icon: faFont,         label: 'Text (T)',      testId: 'tool-text' },
  { tool: 'stamp',       icon: faSmile,        label: 'Emoji',         testId: 'tool-emoji' },
];

const COLORS = [
  '#000000', '#FFFFFF', '#FF5555', '#FFC43D', '#36CFC9',
  '#2E9BFF', '#A855F7', '#10B981', '#F97316', '#EC4899',
];

type FluentIconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;

export function WhiteboardToolbar({ onClose, canManageRoom }: WhiteboardToolbarProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const fluentIcons = useFluentIcons();
  
  const tool = useWhiteboardStore((s) => s.tool);
  const color = useWhiteboardStore((s) => s.color);
  const size = useWhiteboardStore((s) => s.size);
  const mode = useWhiteboardStore((s) => s.mode);
  const recordInkInOutput = useWhiteboardStore((s) => s.recordInkInOutput);
  const fontFamily = useWhiteboardStore((s) => s.fontFamily);
  const fontSize = useWhiteboardStore((s) => s.fontSize);
  const fontWeight = useWhiteboardStore((s) => s.fontWeight);
  const fontStyle = useWhiteboardStore((s) => s.fontStyle);
  const textDecoration = useWhiteboardStore((s) => s.textDecoration);

  const setTool = useWhiteboardStore((s) => s.setTool);
  const setColor = useWhiteboardStore((s) => s.setColor);
  const setSize = useWhiteboardStore((s) => s.setSize);
  const setMode = useWhiteboardStore((s) => s.setMode);
  const setRecordInkInOutput = useWhiteboardStore((s) => s.setRecordInkInOutput);
  const setFontFamily = useWhiteboardStore((s) => s.setFontFamily);
  const setFontSize = useWhiteboardStore((s) => s.setFontSize);
  const toggleBold = useWhiteboardStore((s) => s.toggleBold);
  const toggleItalic = useWhiteboardStore((s) => s.toggleItalic);
  const toggleUnderline = useWhiteboardStore((s) => s.toggleUnderline);
  const undo = useWhiteboardStore((s) => s.undo);
  const redo = useWhiteboardStore((s) => s.redo);
  const clearShapes = useWhiteboardStore((s) => s.clearShapes);
  const history = useWhiteboardStore((s) => s.history);
  const historyIndex = useWhiteboardStore((s) => s.historyIndex);
  
  // Draggable toolbar
  const { position, size: toolbarSize, handleDragStart, handleResizeStart } = useDraggable({
    initialPosition: { x: 16, y: 16 },
    initialSize: { width: 280 },
    persistKey: 'whiteboard.toolbar',
  });

  // Render an icon, preferring Fluent if available
  const renderToolIcon = useCallback((t: ToolConfig) => {
    if (fluentIcons) {
      const m = fluentIcons as Record<string, FluentIconComponent | undefined>;
      const size = 20;
      const pick =
        t.tool === 'select'      ? (m.Cursor24Regular || m.Cursor20Regular) :
        t.tool === 'hand'        ? (m.HandRight24Regular || m.HandRight20Regular) :
        t.tool === 'pen'         ? (m.Edit24Regular || m.Pen24Regular || m.Edit20Regular) :
        t.tool === 'highlighter' ? (m.Highlight24Regular || m.Highlight20Regular) :
        t.tool === 'eraser'      ? (m.Eraser24Regular || m.Eraser20Regular) :
        t.tool === 'line'        ? (m.LineHorizontal124Regular || m.LineHorizontal120Regular) :
        t.tool === 'rectangle'   ? (m.ShapeSquare24Regular || m.ShapeSquare20Regular) :
        t.tool === 'circle'      ? (m.Circle24Regular || m.Circle20Regular) :
        t.tool === 'arrow'       ? (m.ArrowRight24Regular || m.ArrowRight20Regular) :
        t.tool === 'text'        ? (m.TextT24Regular || m.TextT20Regular) :
        t.tool === 'stamp'       ? (m.EmojiSmileSlight24Regular || m.Emoji24Regular || m.Emoji20Regular) :
        null;

      if (pick) {
        const IconComp = pick as FluentIconComponent;
        return <IconComp width={size} height={size} />;
      }
    }
    return <FontAwesomeIcon icon={t.icon} />;
  }, [fluentIcons]);
  
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const hasHistory = history.length > 0;

  const handleExport = async () => {
    // Target the main whiteboard canvas explicitly
    const canvas = document.querySelector<HTMLCanvasElement>('canvas[data-testid="whiteboard-canvas"]');
    if (!canvas) {
      console.error('WhiteboardToolbar: main whiteboard canvas not found for export.');
      return;
    }

    try {
      const blob = await exportToPNG(canvas, { format: 'png' });
      if (!blob) {
        console.error('WhiteboardToolbar: exportToPNG returned null blob.');
        return;
      }
      downloadBlob(blob, `whiteboard-${Date.now()}.png`);
    } catch (error) {
      console.error('WhiteboardToolbar: failed to export PNG.', error);
    }
  };
  
  const handleClearClick = () => {
    setShowClearConfirm(true);
  };
  
  const handleClearConfirm = () => {
    const saveHistory = useWhiteboardStore.getState().saveHistory;
    saveHistory('clear-all');
    clearShapes();
    setShowClearConfirm(false);
  };
  
  const handleClearCancel = () => {
    setShowClearConfirm(false);
  };
  
  return (
    <div 
      className="wb-presenter-only wb-toolbar fixed bg-slate-800 rounded-lg shadow-xl px-2 py-2 flex flex-col gap-2 z-50 relative"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${toolbarSize.width}px`,
        maxWidth: 260,
      }}
      data-testid="whiteboard-toolbar"
    >
      {/* Drag Handle Header */}
      <div 
        className="flex items-center justify-between pb-2 border-b border-slate-600 cursor-move"
        onPointerDown={handleDragStart}
      >
        <h3 className="text-sm font-semibold text-white select-none">⋮⋮ Whiteboard</h3>
        <div className="flex items-center gap-2">
          {canManageRoom && (
            <button
              type="button"
              onClick={() => setIsRecording((v) => !v)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isRecording ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
              }`}
              title={isRecording ? 'Stop recording whiteboard' : 'Start recording whiteboard'}
              data-testid="toolbar-record-toggle"
            >
              {fluentIcons && (fluentIcons.Record24Regular || fluentIcons.Record20Regular)
                ? (() => {
                    const I = (fluentIcons.Record24Regular || fluentIcons.Record20Regular) as FluentIconComponent | undefined;
                    return I ? <I /> : <span className="block w-3 h-3 rounded-full bg-red-400" />;
                  })()
                : <span className="block w-3 h-3 rounded-full bg-red-400" />}
            </button>
          )}
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
            title="Close"
          >
            {fluentIcons && (fluentIcons.Dismiss24Regular || fluentIcons.Dismiss20Regular)
              ? (() => {
                  const I = (fluentIcons.Dismiss24Regular || fluentIcons.Dismiss20Regular) as FluentIconComponent | undefined;
                  return I ? <I /> : <FontAwesomeIcon icon={faTimes} />;
                })()
              : <FontAwesomeIcon icon={faTimes} />}
          </button>
        </div>
      </div>

      {/* Tools */}
      <div className="flex flex-col gap-1">
        <div className="text-[10px] text-slate-400 font-semibold mb-0.5">Tools</div>
        <div className="grid grid-cols-4 gap-1">
          {TOOLS.map((t) => (
            <button
              key={t.tool}
              onClick={() => setTool(t.tool)}
              className={`w-8 h-8 rounded flex items-center justify-center transition-all ${
                tool === t.tool
                  ? 'bg-blue-600 text-white shadow-lg scale-105'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
              title={t.label}
              data-testid={t.testId}
            >
              {renderToolIcon(t)}
            </button>
          ))}
        </div>
      </div>
      
      {/* Colors */}
      <div className="flex flex-col gap-1">
        <div className="text-[10px] text-slate-400 font-semibold mb-0.5 flex items-center gap-1">
          {fluentIcons && (fluentIcons.Color24Regular || fluentIcons.Color20Regular)
            ? (() => {
                const I = (fluentIcons.Color24Regular || fluentIcons.Color20Regular) as FluentIconComponent | undefined;
                return I ? <I className="w-3 h-3" /> : <FontAwesomeIcon icon={faPalette} className="w-3 h-3" />;
              })()
            : <FontAwesomeIcon icon={faPalette} className="w-3 h-3" />}
          <span>Color</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Active color swatch */}
          <button
            type="button"
            className="w-7 h-7 rounded-full border border-slate-600 flex items-center justify-center bg-slate-900 hover:border-blue-400 transition-all flex-shrink-0"
            style={{ boxShadow: '0 0 0 1px rgba(15,23,42,0.9)' }}
          >
            <span
              className="block rounded-full"
              style={{
                width: '14px',
                height: '14px',
                backgroundColor: color,
                boxShadow: '0 0 0 1px rgba(15,23,42,0.8)',
              }}
            />
          </button>
          {/* Palette */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-4 h-4 rounded-full border transition-all flex-shrink-0 ${
                  color === c ? 'border-blue-400 scale-110' : 'border-slate-600'
                }`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Size */}
      <div className="flex flex-col gap-1">
        <div className="text-xs text-slate-400 font-semibold mb-1">
          Size: {size}px
        </div>
        <input
          type="range"
          min="1"
          max="50"
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
          className="w-full"
        />
      </div>
      
      {/* Highlighter Options */}
      {tool === 'highlighter' && (
        <div className="flex flex-col gap-2 pt-2 border-t border-slate-600">
          <div className="text-xs text-slate-400 font-semibold">Highlighter</div>
          <div className="flex items-center gap-2 px-2 py-2 bg-slate-700 rounded">
            {fluentIcons && (fluentIcons.Color24Regular || fluentIcons.Color20Regular)
              ? (() => {
                  const I = (fluentIcons.Color24Regular || fluentIcons.Color20Regular) as FluentIconComponent | undefined;
                  return I ? <I className="text-slate-400" /> : <FontAwesomeIcon icon={faPalette} className="text-slate-400" />;
                })()
              : <FontAwesomeIcon icon={faPalette} className="text-slate-400" />}
            <span className="text-xs text-slate-300">Gradient (Default)</span>
          </div>
          <div className="text-xs text-slate-500">
            Soft 3-stop gradient with multiply blend
          </div>
        </div>
      )}
      
      {/* Text Formatting */}
      {tool === 'text' && (
        <div className="flex flex-col gap-2 pt-2 border-t border-slate-600">
          <div className="text-xs text-slate-400 font-semibold">Text Format</div>
          
          {/* Font Family */}
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className="w-full px-2 py-1 bg-slate-700 text-white text-xs rounded border border-slate-600"
          >
            <option value="Inter, system-ui, sans-serif">Inter</option>
            <option value="Roboto, sans-serif">Roboto</option>
            <option value="'Segoe UI', sans-serif">Segoe UI</option>
            <option value="system-ui, sans-serif">System UI</option>
            <option value="monospace">Monospace</option>
          </select>
          
          {/* Font Size */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Size:</span>
            <input
              type="number"
              min="8"
              max="128"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="flex-1 px-2 py-1 bg-slate-700 text-white text-xs rounded border border-slate-600"
            />
          </div>
          
          {/* Bold, Italic, Underline */}
          <div className="flex gap-1">
            <button
              onClick={toggleBold}
              className={`flex-1 px-2 py-1 rounded text-xs font-bold transition-all ${
                fontWeight === 700
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
              title="Bold"
            >
              B
            </button>
            <button
              onClick={toggleItalic}
              className={`flex-1 px-2 py-1 rounded text-xs italic transition-all ${
                fontStyle === 'italic'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
              title="Italic"
            >
              I
            </button>
            <button
              onClick={toggleUnderline}
              className={`flex-1 px-2 py-1 rounded text-xs underline transition-all ${
                textDecoration === 'underline'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
              title="Underline"
            >
              U
            </button>
          </div>
        </div>
      )}
      
      {/* Mode Selector */}
      <div className="flex flex-col gap-1 pt-2 border-t border-slate-600">
        <div className="text-xs text-slate-400 font-semibold mb-1">Mode</div>
        <div className="flex gap-1">
          <button
            onClick={() => setMode('whiteboard')}
            className={`flex-1 px-2 py-1 rounded text-xs transition-all ${
              mode === 'whiteboard'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
            title="Whiteboard - Clean canvas"
          >
            Whiteboard
          </button>
        </div>
      </div>

      {/* Record Ink Toggle */}
      <div className="flex flex-col gap-1 pt-2 border-t border-slate-600">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={recordInkInOutput}
            onChange={(e) => setRecordInkInOutput(e.target.checked)}
            className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
          <span className="text-xs text-slate-300">Record Ink in Output</span>
        </label>
        <p className="text-xs text-slate-500">
          When enabled, recordings will include ink overlay
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1 pt-2 border-t border-slate-600">
        <div className="flex gap-1">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded transition-colors text-sm"
            title="Undo (Ctrl+Z)"
          >
            {fluentIcons && (fluentIcons.ArrowUndo24Regular || fluentIcons.ArrowUndo20Regular)
              ? (() => {
                  const I = (fluentIcons.ArrowUndo24Regular || fluentIcons.ArrowUndo20Regular) as FluentIconComponent | undefined;
                  return I ? <I /> : <FontAwesomeIcon icon={faUndo} />;
                })()
              : <FontAwesomeIcon icon={faUndo} />}
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded transition-colors text-sm"
            title="Redo (Ctrl+Y)"
          >
            {fluentIcons && (fluentIcons.ArrowRedo24Regular || fluentIcons.ArrowRedo20Regular)
              ? (() => {
                  const I = (fluentIcons.ArrowRedo24Regular || fluentIcons.ArrowRedo20Regular) as FluentIconComponent | undefined;
                  return I ? <I /> : <FontAwesomeIcon icon={faRedo} />;
                })()
              : <FontAwesomeIcon icon={faRedo} />}
          </button>
        </div>
        
        {/* History counters for testing */}
        <div className="hidden">
          <span data-testid="history-count">{history.length}</span>
          <span data-testid="history-pointer">{historyIndex}</span>
        </div>
        
        <button
          onClick={handleExport}
          disabled={!hasHistory}
          className="px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded transition-colors text-sm"
          title="Export as PNG"
        >
          {fluentIcons && (fluentIcons.ArrowDownload24Regular || fluentIcons.ArrowDownload20Regular)
            ? (() => {
                const I = (fluentIcons.ArrowDownload24Regular || fluentIcons.ArrowDownload20Regular) as FluentIconComponent | undefined;
                return I ? <I className="mr-2" /> : <FontAwesomeIcon icon={faDownload} className="mr-2" />;
              })()
            : <FontAwesomeIcon icon={faDownload} className="mr-2" />}
          Export
        </button>
        
        {canManageRoom && (
          <button
            onClick={handleClearClick}
            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors text-sm"
            title="Clear All"
          >
            {fluentIcons && (fluentIcons.Delete24Regular || fluentIcons.Delete20Regular)
              ? (() => {
                  const I = (fluentIcons.Delete24Regular || fluentIcons.Delete20Regular) as FluentIconComponent | undefined;
                  return I ? <I className="mr-2" /> : <FontAwesomeIcon icon={faTrash} className="mr-2" />;
                })()
              : <FontAwesomeIcon icon={faTrash} className="mr-2" />}
            Clear All
          </button>
        )}
      </div>
      
      {/* Resize Grip */}
      <div
        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-blue-500/20 transition-colors"
        onPointerDown={handleResizeStart}
        data-testid="toolbar-resize-grip"
        title="Resize toolbar"
      >
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-slate-600 rounded-full" />
      </div>
      
      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <ClearBoardModal
          onConfirm={handleClearConfirm}
          onCancel={handleClearCancel}
        />
      )}
    </div>
  );
}
