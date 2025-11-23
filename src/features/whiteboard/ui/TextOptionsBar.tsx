// ============================================================================
// TEXT OPTIONS BAR - Font Family, Size, Weight, Alignment, Color
// ============================================================================

import { useWhiteboardStore } from '../state/whiteboardStore';
import { TEXT_FONT_FAMILIES, TEXT_FONT_SIZES, TEXT_FONT_WEIGHTS } from '../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBold,
  faItalic,
  faUnderline,
  faAlignLeft,
  faAlignCenter,
  faAlignRight,
} from '@fortawesome/free-solid-svg-icons';

export function TextOptionsBar() {
  const fontFamily = useWhiteboardStore((s) => s.fontFamily);
  const fontSize = useWhiteboardStore((s) => s.fontSize);
  const fontWeight = useWhiteboardStore((s) => s.fontWeight);
  const fontStyle = useWhiteboardStore((s) => s.fontStyle);
  const textDecoration = useWhiteboardStore((s) => s.textDecoration);
  const textAlign = useWhiteboardStore((s) => s.textAlign);
  const color = useWhiteboardStore((s) => s.color);
  
  const setFontFamily = useWhiteboardStore((s) => s.setFontFamily);
  const setFontSize = useWhiteboardStore((s) => s.setFontSize);
  const setFontWeight = useWhiteboardStore((s) => s.setFontWeight);
  const setTextAlign = useWhiteboardStore((s) => s.setTextAlign);
  const toggleBold = useWhiteboardStore((s) => s.toggleBold);
  const toggleItalic = useWhiteboardStore((s) => s.toggleItalic);
  const toggleUnderline = useWhiteboardStore((s) => s.toggleUnderline);
  const setColor = useWhiteboardStore((s) => s.setColor);
  
  return (
    <div className="wb-presenter-only flex flex-wrap items-center gap-2 p-3 bg-slate-800 rounded-lg shadow-lg border border-slate-700">
      {/* Font Family */}
      <select
        value={fontFamily}
        onChange={(e) => setFontFamily(e.target.value)}
        className="px-3 py-1.5 bg-slate-700 text-white text-sm rounded border border-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        {TEXT_FONT_FAMILIES.map((font: { value: string; name: string }) => (
          <option key={font.value} value={font.value}>
            {font.name}
          </option>
        ))}
      </select>
      
      {/* Font Size */}
      <select
        value={fontSize}
        onChange={(e) => setFontSize(Number(e.target.value))}
        className="px-3 py-1.5 bg-slate-700 text-white text-sm rounded border border-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        {TEXT_FONT_SIZES.map((size: number) => (
          <option key={size} value={size}>
            {size}px
          </option>
        ))}
      </select>
      
      {/* Font Weight */}
      <select
        value={fontWeight}
        onChange={(e) => setFontWeight(Number(e.target.value))}
        className="px-3 py-1.5 bg-slate-700 text-white text-sm rounded border border-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        {TEXT_FONT_WEIGHTS.map((weight: { value: number; name: string }) => (
          <option key={weight.value} value={weight.value}>
            {weight.name}
          </option>
        ))}
      </select>
      
      {/* Bold */}
      <button
        onClick={toggleBold}
        className={`px-3 py-1.5 rounded text-sm font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
          fontWeight === 700
            ? 'bg-blue-600 text-white shadow-md'
            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
        }`}
        title="Bold (Cmd/Ctrl+B)"
      >
        <FontAwesomeIcon icon={faBold} />
      </button>
      
      {/* Italic */}
      <button
        onClick={toggleItalic}
        className={`px-3 py-1.5 rounded text-sm italic transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
          fontStyle === 'italic'
            ? 'bg-blue-600 text-white shadow-md'
            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
        }`}
        title="Italic (Cmd/Ctrl+I)"
      >
        <FontAwesomeIcon icon={faItalic} />
      </button>
      
      {/* Underline */}
      <button
        onClick={toggleUnderline}
        className={`px-3 py-1.5 rounded text-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
          textDecoration === 'underline'
            ? 'bg-blue-600 text-white shadow-md'
            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
        }`}
        title="Underline (Cmd/Ctrl+U)"
      >
        <FontAwesomeIcon icon={faUnderline} />
      </button>
      
      {/* Divider */}
      <div className="w-px h-6 bg-slate-600" />
      
      {/* Align Left */}
      <button
        onClick={() => setTextAlign('left')}
        className={`px-3 py-1.5 rounded text-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
          textAlign === 'left'
            ? 'bg-blue-600 text-white shadow-md'
            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
        }`}
        title="Align Left"
      >
        <FontAwesomeIcon icon={faAlignLeft} />
      </button>
      
      {/* Align Center */}
      <button
        onClick={() => setTextAlign('center')}
        className={`px-3 py-1.5 rounded text-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
          textAlign === 'center'
            ? 'bg-blue-600 text-white shadow-md'
            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
        }`}
        title="Align Center"
      >
        <FontAwesomeIcon icon={faAlignCenter} />
      </button>
      
      {/* Align Right */}
      <button
        onClick={() => setTextAlign('right')}
        className={`px-3 py-1.5 rounded text-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
          textAlign === 'right'
            ? 'bg-blue-600 text-white shadow-md'
            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
        }`}
        title="Align Right"
      >
        <FontAwesomeIcon icon={faAlignRight} />
      </button>
      
      {/* Divider */}
      <div className="w-px h-6 bg-slate-600" />
      
      {/* Color Picker */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-slate-400">Color:</label>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-10 h-8 rounded border border-slate-600 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        />
      </div>
    </div>
  );
}
