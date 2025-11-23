import { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Field,
  Input
} from '@fluentui/react-components';
import DOMPurify from 'dompurify';
import {
  Home20Regular,
  Eye20Regular,
  Checkmark20Regular,
  Edit20Regular,
  Delete20Regular,
  ArrowUndo20Regular,
  ArrowRedo20Regular,
  Dismiss20Regular,
  Code20Regular,
  ArrowSync20Regular,
  TextBold20Regular,
  TextItalic20Regular,
  TextUnderline20Regular,
  TextStrikethrough20Regular,
  Highlight20Regular,
  TextAlignLeft20Regular,
  TextBulletList20Regular,
  TextNumberListLtr20Regular,
  TextAlignCenter20Regular,
  TextAlignRight20Regular,
  Table20Regular,
  TextFont20Regular,
  Link20Regular,
  Image20Regular,
  Video20Regular,
  ChevronDown20Regular
} from '@fluentui/react-icons';

interface Note {
  id: string;
  name: string;
  content: string;
  createdAt: Date;
}

interface NotesViewProps {
  roomId: string;
  roomName: string;
  showNewNoteModal?: boolean;
  onShowNewNoteModal?: (show: boolean) => void;
  isAdmin?: boolean;
  /**
   * autoInit: When true, automatically creates a first empty note on mount if no notes exist.
   * Purpose: Enables isolated E2E testing without needing upstream UI flows to create the initial note.
   */
  autoInit?: boolean;
}

export function NotesView({
  roomId: _roomId,
  roomName: _roomName,
  showNewNoteModal: externalShowModal,
  onShowNewNoteModal,
  isAdmin = false,
  autoInit = false
}: NotesViewProps) {
  // UI state
  const [internalShowModal, setInternalShowModal] = useState(false);
  const [noteName, setNoteName] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [showNoteMenu, setShowNoteMenu] = useState(false);
  // Rename dialog state
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [renameTargetId, setRenameTargetId] = useState<string | null>(null);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [styleDropdown, setStyleDropdown] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState('Normal');
  const [selectedFont, setSelectedFont] = useState('Arial');
  const [selectedSize, setSelectedSize] = useState('16');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [tableRows, setTableRows] = useState('3');
  const [tableCols, setTableCols] = useState('3');

  // ContentEditable ref — useRef (no rerenders)
  const editorRef = useRef<HTMLDivElement | null>(null);

  const styleOptions = [
    'Normal',
    'Quote',
    'Code',
    'Header 1',
    'Header 2',
    'Header 3',
    'Header 4',
    'Header 5',
    'Header 6'
  ];

  // Utilities
  const focusEditor = () => {
    if (editorRef.current) editorRef.current.focus();
  };

  const getSelectionRange = () => {
    const sel = window.getSelection?.();
    if (!sel || sel.rangeCount === 0) return null;
    return sel.getRangeAt(0);
  };

  // ---- Editing commands (kept execCommand for breadth; guarded/focused)
  const handleUndo = () => {
    if (!editorRef.current) return;
    document.execCommand('undo', false);
    focusEditor();
  };

  const handleRedo = () => {
    if (!editorRef.current) return;
    document.execCommand('redo', false);
    focusEditor();
  };

  const handleClearFormatting = () => {
    if (!editorRef.current) return;
    document.execCommand('removeFormat', false);
    document.execCommand('unlink', false);
    focusEditor();
  };

  const handleBold = () => {
    if (!editorRef.current) return;
    document.execCommand('bold', false);
    focusEditor();
  };

  const handleItalic = () => {
    if (!editorRef.current) return;
    document.execCommand('italic', false);
    focusEditor();
  };

  const handleUnderline = () => {
    if (!editorRef.current) return;
    document.execCommand('underline', false);
    focusEditor();
  };

  const handleStrikethrough = () => {
    if (!editorRef.current) return;
    document.execCommand('strikeThrough', false);
    focusEditor();
  };

  const handleAlignLeft = () => {
    if (!editorRef.current) return;
    document.execCommand('justifyLeft', false);
    focusEditor();
  };

  const handleAlignCenter = () => {
    if (!editorRef.current) return;
    document.execCommand('justifyCenter', false);
    focusEditor();
  };

  const handleAlignRight = () => {
    if (!editorRef.current) return;
    document.execCommand('justifyRight', false);
    focusEditor();
  };

  const handleBulletList = () => {
    if (!editorRef.current) return;
    document.execCommand('insertUnorderedList', false);
    focusEditor();
  };

  const handleNumberedList = () => {
    if (!editorRef.current) return;
    document.execCommand('insertOrderedList', false);
    focusEditor();
  };

  const handleHighlight = (color: string) => {
    if (!editorRef.current) return;
    try {
      if (!document.execCommand('hiliteColor', false, color)) {
        document.execCommand('backColor', false, color);
      }
    } catch {
      document.execCommand('backColor', false, color);
    }
    setShowColorPicker(false);
    focusEditor();
  };

  const handleFontChange = (font: string) => {
    if (!editorRef.current) return;
    setSelectedFont(font);
    document.execCommand('fontName', false, font);
    focusEditor();
  };

  const handleSizeChange = (size: string) => {
    if (!editorRef.current) return;
    setSelectedSize(size);
    const range = getSelectionRange();
    if (!range || range.collapsed) return;
    try {
      const span = document.createElement('span');
      span.style.fontSize = `${size}px`;
      const contents = range.extractContents();
      span.appendChild(contents);
      range.insertNode(span);
      // restore caret after span
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        const after = document.createRange();
        after.setStartAfter(span);
        after.setEndAfter(span);
        sel.addRange(after);
      }
    } catch (e) {
      console.error('Font size change failed:', e);
    }
    focusEditor();
  };

  const handleStyleChange = (style: string) => {
    setSelectedStyle(style);
    setStyleDropdown(false);
    if (!editorRef.current) return;

    const range = getSelectionRange();
    if (!range || range.collapsed) return;

    try {
      let element: HTMLElement;
      switch (style) {
        case 'Header 1':
          element = document.createElement('h1');
          element.style.cssText = 'font-size:2em;font-weight:700;margin:0.67em 0;';
          break;
        case 'Header 2':
          element = document.createElement('h2');
          element.style.cssText = 'font-size:1.5em;font-weight:700;margin:0.75em 0;';
          break;
        case 'Header 3':
          element = document.createElement('h3');
          element.style.cssText = 'font-size:1.17em;font-weight:700;margin:0.83em 0;';
          break;
        case 'Header 4':
          element = document.createElement('h4');
          element.style.cssText = 'font-size:1em;font-weight:700;margin:1.12em 0;';
          break;
        case 'Header 5':
          element = document.createElement('h5');
          element.style.cssText = 'font-size:0.83em;font-weight:700;margin:1.5em 0;';
          break;
        case 'Header 6':
          element = document.createElement('h6');
          element.style.cssText = 'font-size:0.67em;font-weight:700;margin:1.67em 0;';
          break;
        case 'Quote':
          element = document.createElement('blockquote');
          element.style.cssText =
            'border-left:4px solid #cbd5e1;padding-left:1em;margin:1em 0;font-style:italic;';
          break;
        case 'Code':
          element = document.createElement('code');
          element.style.cssText =
            'background:#1e293b;padding:0.2em 0.4em;border-radius:3px;font-family:monospace;';
          break;
        default:
          element = document.createElement('p');
      }
      element.textContent = range.toString();
      range.deleteContents();
      range.insertNode(element);

      // restore selection/caret after element
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        const after = document.createRange();
        after.setStartAfter(element);
        after.setEndAfter(element);
        sel.addRange(after);
      }
    } catch (e) {
      console.error('Style change failed:', e);
    }
    focusEditor();
  };

  const handleCodeBlock = () => {
    if (!editorRef.current) return;
    const codeHTML =
      '<pre style="background:#1e293b;padding:1em;border-radius:4px;overflow-x:auto;margin:1em 0;font-family:monospace;"><code>// Enter code here</code></pre><p><br></p>';
    document.execCommand('insertHTML', false, codeHTML);
    focusEditor();
  };

  const handleRotate = () => {
    if (!editorRef.current) return;
    const range = getSelectionRange();
    if (!range || range.collapsed) return;
    try {
      const span = document.createElement('span');
      span.style.display = 'inline-block';
      span.style.transform = 'rotate(180deg)';
      const contents = range.extractContents();
      span.appendChild(contents);
      range.insertNode(span);

      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        const after = document.createRange();
        after.setStartAfter(span);
        after.setEndAfter(span);
        sel.addRange(after);
      }
    } catch (e) {
      console.error('Rotate failed:', e);
    }
    focusEditor();
  };

  // Modal toggles / inserts
  const handleInsertLink = () => setShowLinkModal(true);
  const insertLink = () => {
    if (!editorRef.current) return;
    if (!linkUrl) return;
    const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
    document.execCommand('createLink', false, url);
    scrubBidi(editorRef.current);
    setLinkUrl('');
    setShowLinkModal(false);
    focusEditor();
  };

  const handleInsertImage = () => setShowImageModal(true);
  const insertImage = () => {
    if (!editorRef.current || !imageUrl) return;
    const img = `<img src="${imageUrl}" style="max-width:100%;height:auto;" dir="ltr" />`;
    document.execCommand('insertHTML', false, img);
    scrubBidi(editorRef.current);
    setImageUrl('');
    setShowImageModal(false);
    focusEditor();
  };

  const handleInsertTable = () => setShowTableModal(true);
  const insertTable = () => {
    if (!editorRef.current) return;
    const rows = Math.max(1, parseInt(tableRows || '1', 10));
    const cols = Math.max(1, parseInt(tableCols || '1', 10));
    let html = '<table dir="ltr" style="border-collapse:collapse;width:100%;margin:1em 0;">';
    for (let r = 0; r < rows; r++) {
      html += '<tr dir="ltr">';
      for (let c = 0; c < cols; c++) {
        html +=
          '<td dir="ltr" style="border:1px solid #64748b;padding:8px;min-width:100px;">Cell</td>';
      }
      html += '</tr>';
    }
    html += '</table><p><br></p>';
    document.execCommand('insertHTML', false, html);
    scrubBidi(editorRef.current);
    setTableRows('3');
    setTableCols('3');
    setShowTableModal(false);
    focusEditor();
  };

  const handleInsertVideo = () => setShowVideoModal(true);
  const insertVideo = () => {
    if (!editorRef.current || !videoUrl) return;
    const safe = videoUrl.startsWith('http') ? videoUrl : `https://${videoUrl}`;
    const video = `<video src="${safe}" controls style="max-width:100%;height:auto;" dir="ltr"></video><p><br></p>`;
    document.execCommand('insertHTML', false, video);
    scrubBidi(editorRef.current);
    setVideoUrl('');
    setShowVideoModal(false);
    focusEditor();
  };

  // External vs internal modal state
  const showNewNoteModal =
    externalShowModal !== undefined ? externalShowModal : internalShowModal;
  const setShowNewNoteModal =
    onShowNewNoteModal || setInternalShowModal;

  // Notes CRUD
  const handleCreateNote = () => {
    const trimmed = noteName.trim();
    if (!trimmed) return;
    const newNote: Note = {
      id: Date.now().toString(),
      name: trimmed,
      content: '',
      createdAt: new Date()
    };
    setNotes(prev => [...prev, newNote]);
    setSelectedNoteId(newNote.id);
    setNoteName('');
    setShowNewNoteModal(false);
  };

  const selectedNote = notes.find(n => n.id === selectedNoteId) || null;

  // Initialize editor content when switching notes; keep DOM uncontrolled during typing
  useEffect(() => {
    if (!editorRef.current) return;
    editorRef.current.innerHTML = selectedNote?.content || '';
    // Ensure LTR after injecting content
    scrubBidi(editorRef.current);
  }, [selectedNote?.id]);

  // Auto-init first note for test environments or simplified flows
  useEffect(() => {
    if (autoInit && notes.length === 0) {
      const now = Date.now();
      const first: Note = {
        id: (now).toString(),
        name: 'First Note',
        content: '',
        createdAt: new Date()
      };
      const second: Note = {
        id: (now + 1).toString(),
        name: 'Second Note',
        content: '',
        createdAt: new Date()
      };
      setNotes([first, second]);
      setSelectedNoteId(first.id);
    }
  }, [autoInit, notes.length]);

  // Bidi scrubber to enforce LTR on elements
  const scrubBidi = (node: Element | HTMLElement) => {
    if (!node) return;
    try {
      node.removeAttribute('dir');
      if ((node as HTMLElement).style) {
        (node as HTMLElement).style.removeProperty('direction');
        (node as HTMLElement).style.removeProperty('unicode-bidi');
        (node as HTMLElement).style.removeProperty('writing-mode');
        (node as HTMLElement).style.removeProperty('text-align');
      }
      if (node.tagName === 'BDO' || node.tagName === 'BDI') {
        const parent = node.parentNode;
        while (node.firstChild) parent?.insertBefore(node.firstChild, node);
        parent?.removeChild(node);
      }
      (node as HTMLElement).setAttribute('dir', 'ltr');
    } catch (e) {
      // noop: scrub failures should never crash typing
    }
  };

  // Paste sanitization to enforce LTR and strip bidi attributes
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const onPaste: EventListener = (ev: Event) => {
      const e = ev as ClipboardEvent;
      e.preventDefault();
      const html = e.clipboardData?.getData('text/html') || '';
      const plain = e.clipboardData?.getData('text/plain') || '';

      // Sanitize
      const safeHTML = html
        ? DOMPurify.sanitize(html, { USE_PROFILES: { html: true } })
        : DOMPurify.sanitize(plain);

      const sel = window.getSelection?.();
      if (!sel || sel.rangeCount === 0) {
        editor.insertAdjacentHTML('beforeend', safeHTML);
        scrubBidi(editor);
        return;
      }
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const fragment = range.createContextualFragment(safeHTML);
      const last = fragment.lastChild;
      range.insertNode(fragment);
      if (last) {
        const newRange = document.createRange();
        newRange.setStartAfter(last);
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);
      }
      scrubBidi(editor);
    };
    editor.addEventListener('paste', onPaste);
    return () => editor.removeEventListener('paste', onPaste);
  }, []);

  const handleNoteContentChange = (content: string) => {
    if (!selectedNoteId) return;
    setNotes(prev =>
      prev.map(n => (n.id === selectedNoteId ? { ...n, content } : n))
    );
  };

  const handleRenameNote = (noteId: string | null) => {
    if (!noteId) return;
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    setRenameTargetId(noteId);
    setRenameValue(note.name);
    setRenameError(null);
    setRenameOpen(true);
    setShowNoteMenu(false);
  };

  const validateRename = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return 'Name cannot be empty';
    const duplicate = notes.some(
      n => n.id !== renameTargetId && n.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) return 'A note with this name already exists';
    return null;
  };

  const commitRename = () => {
    const err = validateRename(renameValue);
    if (err || !renameTargetId) {
      setRenameError(err);
      return; // keep dialog open for correction
    }
    const trimmed = renameValue.trim();
    setNotes(prev => prev.map(n => (n.id === renameTargetId ? { ...n, name: trimmed } : n)));
    setRenameOpen(false);
    setRenameTargetId(null);
    setRenameError(null);
  };

  // Save-rename handler was unused; remove to avoid unused var lint.

  const handleDeleteNote = (noteId: string) => {
    setNotes(prev => {
      const next = prev.filter(n => n.id !== noteId);
      // maintain selection
      if (selectedNoteId === noteId) {
        setSelectedNoteId(next.length ? next[0].id : null);
      }
      return next;
    });
    setShowNoteMenu(false);
  };

  const handleSetWelcomeMat = () => {
    console.log('Set as Welcome Mat:', selectedNote?.name);
  };
  const handleApplyWelcomeMatToAll = () => {
    console.log('Apply as Welcome Mat to all rooms:', selectedNote?.name);
  };
  const handleBringEveryoneHere = () => {
    console.log('Bring everyone here to note:', selectedNote?.name);
  };
  const handleDone = () => {
    console.log('Done editing note:', selectedNote?.name);
  };
  const handleEditNote = () => {
    console.log('Edit note:', selectedNote?.name);
    setShowNoteMenu(false);
  };

  const handleDownloadNote = () => {
    if (!selectedNote) return;
    const content = `${selectedNote.name}\n\n${selectedNote.content}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedNote.name}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    console.log('Downloaded note:', selectedNote.name);
  };

  // L67: Enforce LTR and observe mutations to prevent bidi flips
  useEffect(() => {
    if (!editorRef.current) return;
    
    const editor = editorRef.current;
    
    // Function to force LTR and scrub any RTL styles (minimal logging)
    const forceLTR = () => {
      editor.setAttribute('dir', 'ltr');
      editor.style.setProperty('direction', 'ltr', 'important');
      // Use unicode-bidi:isolate to prevent surrounding RTL influence without overriding logical order
      editor.style.setProperty('unicode-bidi', 'isolate', 'important');
      editor.style.setProperty('text-align', 'left', 'important');
      editor.style.setProperty('writing-mode', 'horizontal-tb', 'important');
      // Scrub descendants
      editor.querySelectorAll('*').forEach(el => scrubBidi(el as HTMLElement));
    };
    
    // Initial force
    forceLTR();
    
    // Set up MutationObserver to catch any dynamic changes
    const observer = new MutationObserver((mutations) => {
      let shouldForceLTR = false;
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes') {
          if (mutation.target === editor || editor.contains(mutation.target)) {
            shouldForceLTR = true;
          }
        }
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node instanceof HTMLElement) {
              scrubBidi(node);
              node.querySelectorAll('*').forEach(el => scrubBidi(el));
              shouldForceLTR = true;
            }
          });
        }
      });
      if (shouldForceLTR) setTimeout(forceLTR, 0);
    });
    
    // Observe the editor and all its ancestors
    observer.observe(editor, {
      attributes: true,
      attributeFilter: ['style', 'dir', 'class'],
  subtree: true,
  childList: true
    });
    
    // Also observe document.documentElement and body for global changes
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['dir', 'class']
    });
    
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['dir', 'class']
    });
    
    return () => {
      observer.disconnect();
    };
  }, [selectedNote?.id]);

  return (
  <div className="flex flex-col h-full w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800" data-testid="notes-view" dir="ltr" style={{ direction: 'ltr', unicodeBidi: 'isolate' }}>
      {/* Empty state */}
      {notes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center">
            <svg
              className="w-16 h-16 text-slate-600 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-slate-400 text-lg font-medium">No notes yet</p>
            <p className="text-slate-500 text-sm mt-2">
              Click “+ New Note” to create your first note
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          {/* Rename Dialog */}
          <Dialog open={renameOpen} onOpenChange={(_, data) => { setRenameOpen(data.open); if (!data.open) setRenameError(null); }}>
            <DialogSurface>
              <DialogBody>
                <DialogTitle>Rename note</DialogTitle>
                <DialogContent>
                  <Field label="Name" validationMessage={renameError ?? undefined} validationState={renameError ? 'error' : 'none'}>
                    <Input
                      data-testid="rename-input"
                      value={renameValue}
                      onChange={(_, d) => {
                        setRenameValue(d.value);
                        setRenameError(validateRename(d.value));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRename();
                      }}
                    />
                  </Field>
                </DialogContent>
                <DialogActions>
                  <Button appearance="secondary" onClick={() => setRenameOpen(false)}>Cancel</Button>
                  <Button appearance="primary" onClick={commitRename} disabled={!!validateRename(renameValue)}>Save</Button>
                </DialogActions>
              </DialogBody>
            </DialogSurface>
          </Dialog>
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 flex items-center gap-2 relative transition-all shadow-sm">
            <span data-testid="note-title" className="text-cyan-400 font-semibold text-sm">
              {selectedNote?.name || 'Select a note'}
            </span>
            <ChevronDown20Regular
              data-testid="note-menu-toggle"
              onClick={() => setShowNoteMenu(v => !v)}
              className="text-cyan-400 cursor-pointer hover:text-cyan-300 transition-colors"
            />

            {showNoteMenu && (
              <div className="absolute top-full left-0 mt-1 bg-slate-700 rounded-lg shadow-xl z-50 min-w-[240px]">
                <button
                  onClick={handleEditNote}
                  className="w-full text-left px-4 py-2 text-slate-200 hover:bg-slate-600 flex items-center gap-2 text-sm transition-colors focus:outline-none"
                >
                  <Edit20Regular /> Edit Note
                </button>
                <button
                  onClick={() => handleRenameNote(selectedNoteId)}
                  className="w-full text-left px-4 py-2 text-slate-200 hover:bg-slate-600 flex items-center gap-2 text-sm transition-colors focus:outline-none"
                >
                  <Edit20Regular /> Rename Note
                </button>
                <button
                  onClick={() => {
                    handleBringEveryoneHere();
                    setShowNoteMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-slate-200 hover:bg-slate-600 flex items-center gap-2 text-sm transition-colors focus:outline-none"
                >
                  <Eye20Regular /> Bring everyone here
                </button>
                <button
                  onClick={() => {
                    handleSetWelcomeMat();
                    setShowNoteMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-slate-200 hover:bg-slate-600 flex items-center gap-2 text-sm transition-colors focus:outline-none"
                >
                  <Home20Regular /> Make Welcome Mat
                </button>
                <button
                  onClick={() => {
                    handleApplyWelcomeMatToAll();
                    setShowNoteMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-slate-200 hover:bg-slate-600 flex items-center gap-2 text-sm transition-colors focus:outline-none"
                >
                  <Home20Regular /> Apply as Welcome Mat to multiple rooms
                </button>
                <button
                  onClick={() => selectedNoteId && handleDeleteNote(selectedNoteId)}
                  className="w-full text-left px-4 py-2 text-red-400 hover:bg-slate-600 flex items-center gap-2 text-sm transition-colors focus:outline-none"
                >
                  <Delete20Regular /> Delete
                </button>
              </div>
            )}
          </div>

          {/* Primary actions */}
          <div className="bg-slate-800 px-6 py-3 flex gap-3 items-center flex-wrap">
            <button
              onClick={handleSetWelcomeMat}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium text-sm transition-all flex items-center gap-2 focus:outline-none"
            >
              <Home20Regular /> Set as Welcome Mat
            </button>
            <button
              onClick={handleApplyWelcomeMatToAll}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium text-sm transition-all flex items-center gap-2 focus:outline-none"
            >
              <Home20Regular /> Apply as Welcome Mat to all rooms
            </button>
            <button
              onClick={handleBringEveryoneHere}
              className="px-4 py-2 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-lg font-medium text-sm transition-all flex items-center gap-2 backdrop-blur-sm focus:outline-none"
            >
              <Eye20Regular /> Bring Everyone here
            </button>
            <button
              onClick={handleDone}
              className="px-4 py-2 bg-blue-600/90 hover:bg-blue-500 text-white rounded-lg font-medium text-sm transition-all flex items-center gap-2 backdrop-blur-sm focus:outline-none"
            >
              Done <Checkmark20Regular />
            </button>
          </div>

          {/* Toolbar */}
          <div className="bg-slate-800 px-3 py-2 flex flex-wrap gap-1 items-center">
            {/* Style dropdown */}
            <div className="relative">
              <button
                onClick={() => setStyleDropdown(v => !v)}
                className="px-3 py-1 rounded-lg text-slate-200 text-sm hover:bg-slate-700 flex items-center gap-1 transition-colors focus:outline-none"
                title="Text Style"
              >
                {selectedStyle}
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 10l5 5 5-5z" />
                </svg>
              </button>
              {styleDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-slate-700 rounded-lg shadow-xl z-50 min-w-[150px]">
                  {styleOptions.map(style => (
                    <button
                      key={style}
                      onClick={() => handleStyleChange(style)}
                      className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-600 text-sm transition-colors focus:outline-none"
                    >
                      {style}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="w-px h-6 bg-slate-600/50" />

            <button onClick={handleUndo} className="p-1 hover:bg-slate-700 rounded-lg text-slate-300" title="Undo"><ArrowUndo20Regular /></button>
            <div className="w-px h-6 bg-slate-600/50" />
            <button onClick={handleRedo} className="p-1 hover:bg-slate-700 rounded-lg text-slate-300" title="Redo"><ArrowRedo20Regular /></button>
            <div className="w-px h-6 bg-slate-600/50" />
            <button onClick={handleClearFormatting} className="p-1 hover:bg-slate-700 rounded-lg text-slate-300" title="Clear Formatting"><Dismiss20Regular /></button>
            <div className="w-px h-6 bg-slate-600/50" />
            <button onClick={handleCodeBlock} className="p-1 hover:bg-slate-700 rounded-lg text-slate-300" title="Code Block"><Code20Regular /></button>
            <div className="w-px h-6 bg-slate-600/50" />
            <button onClick={handleRotate} className="p-1 hover:bg-slate-700 rounded-lg text-slate-300" title="Rotate"><ArrowSync20Regular /></button>
            <div className="w-px h-6 bg-slate-600/50" />
            <button onClick={handleBold} className="p-1 hover:bg-slate-700 rounded-lg text-slate-300" title="Bold"><TextBold20Regular /></button>
            <div className="w-px h-6 bg-slate-600/50" />
            <button onClick={handleItalic} className="p-1 hover:bg-slate-700 rounded-lg text-slate-300" title="Italic"><TextItalic20Regular /></button>
            <div className="w-px h-6 bg-slate-600/50" />
            <button onClick={handleUnderline} className="p-1 hover:bg-slate-700 rounded-lg text-slate-300" title="Underline"><TextUnderline20Regular /></button>
            <div className="w-px h-6 bg-slate-600/50" />
            <button onClick={handleStrikethrough} className="p-1 hover:bg-slate-700 rounded-lg text-slate-300" title="Strikethrough"><TextStrikethrough20Regular /></button>
            <div className="w-px h-6 bg-slate-600/50" />

            {/* Highlight */}
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(v => !v)}
                className="p-1 hover:bg-slate-700 rounded-lg text-slate-300"
                title="Highlight Color"
              >
                <Highlight20Regular />
              </button>
              {showColorPicker && (
                <div className="absolute top-full left-0 mt-1 bg-slate-700 rounded-lg shadow-xl z-50 p-2 grid grid-cols-5 gap-2">
                  {[
                    '#ffff00',
                    '#00ff00',
                    '#00ffff',
                    '#ff00ff',
                    '#ff0000',
                    '#ffa500',
                    '#90ee90',
                    '#add8e6',
                    '#ffb6c1',
                    '#ffffff'
                  ].map(color => (
                    <button
                      key={color}
                      onClick={() => handleHighlight(color)}
                      className="w-6 h-6 rounded hover:scale-110 transition-transform focus:outline-none"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="w-px h-6 bg-slate-600/50" />

            {/* Font family */}
            <select
              value={selectedFont}
              onChange={e => handleFontChange(e.target.value)}
              className="px-2 py-1 rounded-lg text-slate-200 text-sm hover:bg-slate-700 bg-slate-800 focus:outline-none"
              title="Font Family"
            >
              <option>Arial</option>
              <option>Helvetica</option>
              <option>Times New Roman</option>
              <option>Courier</option>
            </select>

            <div className="w-px h-6 bg-slate-600/50" />

            {/* Font size */}
            <select
              value={selectedSize}
              onChange={e => handleSizeChange(e.target.value)}
              className="px-2 py-1 rounded-lg text-slate-2 00 text-sm hover:bg-slate-700 bg-slate-800 focus:outline-none"
              title="Font Size"
            >
              <option>12</option>
              <option>14</option>
              <option>16</option>
              <option>18</option>
              <option>20</option>
              <option>24</option>
            </select>

            <div className="w-px h-6 bg-slate-600/50" />

            <button onClick={handleAlignLeft} className="p-1 hover:bg-slate-700 rounded-lg text-slate-300" title="Align Left"><TextAlignLeft20Regular /></button>
            <div className="w-px h-6 bg-slate-600/50" />
            <button onClick={handleBulletList} className="p-1 hover:bg-slate-700 rounded-lg text-slate-300" title="Bullet List"><TextBulletList20Regular /></button>
            <div className="w-px h-6 bg-slate-600/50" />
            <button onClick={handleNumberedList} className="p-1 hover:bg-slate-700 rounded-lg text-slate-300" title="Numbered List"><TextNumberListLtr20Regular /></button>
            <div className="w-px h-6 bg-slate-600/50" />
            <button onClick={handleAlignCenter} className="p-1 hover:bg-slate-700 rounded-lg text-slate-300" title="Align Center"><TextAlignCenter20Regular /></button>
            <div className="w-px h-6 bg-slate-600/50" />
            <button onClick={handleAlignRight} className="p-1 hover:bg-slate-700 rounded-lg text-slate-300" title="Align Right"><TextAlignRight20Regular /></button>
            <div className="w-px h-6 bg-slate-600/50" />
            <button onClick={handleInsertTable} className="p-1 hover:bg-slate-700 rounded-lg text-slate-300" title="Insert Table"><Table20Regular /></button>
            <div className="w-px h-6 bg-slate-600/50" />
            <button onClick={() => setStyleDropdown(v => !v)} className="p-1 hover:bg-slate-700 rounded-lg text-slate-300" title="Text Formatting"><TextFont20Regular /></button>
            <div className="w-px h-6 bg-slate-600/50" />
            <button onClick={handleInsertLink} className="p-1 hover:bg-slate-700 rounded-lg text-slate-300" title="Insert Link"><Link20Regular /></button>
            <div className="w-px h-6 bg-slate-600/50" />
            <button onClick={handleInsertImage} className="p-1 hover:bg-slate-700 rounded-lg text-slate-300" title="Insert Image"><Image20Regular /></button>
            <div className="w-px h-6 bg-slate-600/50" />
            <button onClick={handleInsertVideo} className="p-1 hover:bg-slate-700 rounded-lg text-slate-300" title="Insert Video"><Video20Regular /></button>
            <div className="w-px h-6 bg-slate-600/50" />
            <button className="p-1 hover:bg-slate-700 rounded-lg text-slate-300 text-sm font-medium" title="Insert GIFs">GIFs</button>
          </div>

          {/* Editor */}
          <div className="flex-1 bg-slate-900 p-4 overflow-auto" dir="ltr" style={{ direction: 'ltr', unicodeBidi: 'isolate' }}>
            <div
              id="notes-editor"
              data-testid="notes-editor"
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              dir="ltr"
              onInput={(e) => {
                const html = (e.currentTarget as HTMLDivElement).innerHTML;
                handleNoteContentChange(html);
              }}
              className="w-full h-full bg-slate-800 text-slate-100 p-4 rounded-lg focus:outline-none text-sm min-h-[200px] force-ltr"
              style={{
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                direction: 'ltr',
                unicodeBidi: 'isolate',
                textAlign: 'left'
              }}
            />
          </div>

          {/* Notes list */}
          {notes.length >= 1 && (
            <div className="bg-slate-800 border-t border-slate-600/50 p-3">
              <div className="flex items-center justify-center gap-3 overflow-x-auto pb-2">
                {notes.map(note => (
                  <button
                    key={note.id}
                    onClick={() => setSelectedNoteId(note.id)}
                    className={`flex-shrink-0 px-4 py-2 rounded-lg transition-all text-sm font-semibold ${
                      selectedNoteId === note.id
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg scale-105'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {note.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bottom actions */}
          <div className="bg-slate-800 border-t border-slate-600/50 px-6 py-3 flex gap-3 items-center">
            {isAdmin && (
              <>
                <button
                  onClick={handleEditNote}
                  className="px-4 py-2 bg-blue-600/90 hover:bg-blue-500 text-white rounded-lg font-medium text-sm transition-all flex items-center gap-2 backdrop-blur-sm border border-blue-400/20 focus:outline-none"
                >
                  <Edit20Regular /> Edit
                </button>
                <button
                  onClick={() => selectedNoteId && handleDeleteNote(selectedNoteId)}
                  className="px-4 py-2 bg-red-600/90 hover:bg-red-500 text-white rounded-lg font-medium text-sm transition-all flex items-center gap-2 backdrop-blur-sm border border-red-400/20 focus:outline-none"
                >
                  <Delete20Regular /> Delete
                </button>
              </>
            )}
            <button
              onClick={handleDownloadNote}
              className="px-4 py-2 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-lg font-medium text-sm transition-all flex items-center gap-2 backdrop-blur-sm border border-emerald-400/20 focus:outline-none"
            >
              <Eye20Regular /> Download
            </button>
          </div>
        </div>
      )}

      {/* New Note Modal */}
      {showNewNoteModal && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
            onClick={() => {
              setShowNewNoteModal(false);
              setNoteName('');
            }}
          />
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
            <div className="rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
              <div
                className="px-6 py-5 border-b flex items-center justify-between"
                style={{ backgroundColor: '#334156', borderColor: '#334156' }}
              >
                <h2 className="text-lg font-bold text-white">New Note name:</h2>
                <button
                  onClick={() => {
                    setShowNewNoteModal(false);
                    setNoteName('');
                  }}
                  className="transition-colors focus:outline-none hover:opacity-80 text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6" style={{ backgroundColor: '#1a1f2e' }}>
                <input
                  type="text"
                  value={noteName}
                  onChange={e => setNoteName(e.target.value)}
                  placeholder="Enter note name"
                  className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent border font-medium text-slate-900"
                  style={{ backgroundColor: '#ffffff', borderColor: '#334156' }}
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleCreateNote();
                  }}
                />
              </div>
              <div
                className="px-6 py-4 border-t flex justify-end gap-3"
                style={{ backgroundColor: '#334156', borderColor: '#334156' }}
              >
                <button
                  onClick={() => {
                    setShowNewNoteModal(false);
                    setNoteName('');
                  }}
                  className="px-6 py-2 rounded-lg font-semibold transition-all text-white"
                  style={{ backgroundColor: '#475569', border: '1px solid #64748b' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#64748b')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#475569')}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateNote}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-semibold transition-all shadow-lg"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Insert Link Modal */}
      {showLinkModal && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={() => setShowLinkModal(false)} />
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
            <div className="rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="px-6 py-5 border-b flex items-center justify-between" style={{ backgroundColor: '#334156', borderColor: '#334156' }}>
                <h2 className="text-lg font-bold text-white">Insert Link</h2>
                <button onClick={() => setShowLinkModal(false)} className="transition-colors focus:outline-none hover:opacity-80 text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6" style={{ backgroundColor: '#1a1f2e' }}>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-slate-900"
                  style={{ backgroundColor: '#f1f5f9', color: '#0f172a' }}
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && insertLink()}
                />
              </div>
              <div className="px-6 py-4 border-t flex justify-end gap-3" style={{ backgroundColor: '#334156', borderColor: '#334156' }}>
                <button onClick={() => setShowLinkModal(false)} className="px-6 py-2 rounded-lg font-semibold transition-all text-white" style={{ backgroundColor: '#475569', border: '1px solid #64748b' }}>Cancel</button>
                <button onClick={insertLink} className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-semibold transition-all shadow-lg">Insert</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Insert Image Modal */}
      {showImageModal && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={() => setShowImageModal(false)} />
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
            <div className="rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="px-6 py-5 border-b flex items-center justify-between" style={{ backgroundColor: '#334156', borderColor: '#334156' }}>
                <h2 className="text-lg font-bold text-white">Insert Image</h2>
                <button onClick={() => setShowImageModal(false)} className="transition-colors focus:outline-none hover:opacity-80 text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6" style={{ backgroundColor: '#1a1f2e' }}>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-slate-900"
                  style={{ backgroundColor: '#f1f5f9', color: '#0f172a' }}
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && insertImage()}
                />
              </div>
              <div className="px-6 py-4 border-t flex justify-end gap-3" style={{ backgroundColor: '#334156', borderColor: '#334156' }}>
                <button onClick={() => setShowImageModal(false)} className="px-6 py-2 rounded-lg font-semibold transition-all text-white" style={{ backgroundColor: '#475569', border: '1px solid #64748b' }}>Cancel</button>
                <button onClick={insertImage} className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-semibold transition-all shadow-lg">Insert</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Insert Table Modal */}
      {showTableModal && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={() => setShowTableModal(false)} />
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
            <div className="rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="px-6 py-5 border-b flex items-center justify-between" style={{ backgroundColor: '#334156', borderColor: '#334156' }}>
                <h2 className="text-lg font-bold text-white">Insert Table</h2>
                <button onClick={() => setShowTableModal(false)} className="transition-colors focus:outline-none hover:opacity-80 text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-4" style={{ backgroundColor: '#1a1f2e' }}>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Rows</label>
                  <input
                    type="number"
                    value={tableRows}
                    onChange={e => setTableRows(e.target.value)}
                    min={1}
                    max={20}
                    className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-slate-900"
                    style={{ backgroundColor: '#f1f5f9', color: '#0f172a' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Columns</label>
                  <input
                    type="number"
                    value={tableCols}
                    onChange={e => setTableCols(e.target.value)}
                    min={1}
                    max={10}
                    className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-slate-900"
                    style={{ backgroundColor: '#f1f5f9', color: '#0f172a' }}
                  />
                </div>
              </div>
              <div className="px-6 py-4 border-t flex justify-end gap-3" style={{ backgroundColor: '#334156', borderColor: '#334156' }}>
                <button onClick={() => setShowTableModal(false)} className="px-6 py-2 rounded-lg font-semibold transition-all text-white" style={{ backgroundColor: '#475569', border: '1px solid #64748b' }}>Cancel</button>
                <button onClick={insertTable} className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-semibold transition-all shadow-lg">Insert</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Insert Video Modal */}
      {showVideoModal && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={() => setShowVideoModal(false)} />
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
            <div className="rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="px-6 py-5 border-b flex items-center justify-between" style={{ backgroundColor: '#334156', borderColor: '#334156' }}>
                <h2 className="text-lg font-bold text-white">Insert Video</h2>
                <button onClick={() => setShowVideoModal(false)} className="transition-colors focus:outline-none hover:opacity-80 text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6" style={{ backgroundColor: '#1a1f2e' }}>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={e => setVideoUrl(e.target.value)}
                  placeholder="https://example.com/video.mp4"
                  className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-slate-900"
                  style={{ backgroundColor: '#f1f5f9', color: '#0f172a' }}
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && insertVideo()}
                />
              </div>
              <div className="px-6 py-4 border-t flex justify-end gap-3" style={{ backgroundColor: '#334156', borderColor: '#334156' }}>
                <button onClick={() => setShowVideoModal(false)} className="px-6 py-2 rounded-lg font-semibold transition-all text-white" style={{ backgroundColor: '#475569', border: '1px solid #64748b' }}>Cancel</button>
                <button onClick={insertVideo} className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-semibold transition-all shadow-lg">Insert</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
