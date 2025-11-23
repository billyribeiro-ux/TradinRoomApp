/**
 * ChatInput Component - Microsoft Enterprise Pattern
 * Handles message input, file uploads, emoji picker, and sending
 */

import {
  faPaperPlane,
  faImage,
  faSmile,
  faTimes,
  faSpinner,
  faCheckCircle
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useRef } from 'react';

import { EmojiPicker } from '../icons/EmojiPicker';
import { PANEL_COLORS } from '../panelColors';

const MAX_MESSAGE_LENGTH = 5000;

enum LoadingState {
  Idle = 'idle',
  Loading = 'loading',
  Success = 'success',
  Error = 'error'
}

interface UploadProgress {
  percentage: number;
  bytesUploaded: number;
  totalBytes: number;
  fileName: string;
}

interface ChatInputProps {
  input: string;
  imagePreview?: string;
  pendingFile?: File;
  uploadProgress: UploadProgress;
  sendingState: LoadingState;
  uploadingState: LoadingState;
  showEmojiPicker: boolean;
  onInputChange: (value: string) => void;
  onSend: (e: React.FormEvent) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCancelFile: () => void;
  onEmojiSelect: (emoji: string) => void;
  onToggleEmojiPicker: () => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

export function ChatInput({
  input,
  imagePreview,
  pendingFile,
  uploadProgress,
  sendingState,
  uploadingState,
  showEmojiPicker,
  onInputChange,
  onSend,
  onFileSelect,
  onCancelFile,
  onEmojiSelect,
  onToggleEmojiPicker
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      {/* File Preview - Microsoft Teams Style */}
      {(imagePreview || pendingFile) && (
        <section className={`border-t ${PANEL_COLORS.container.divider} px-3 py-2 ${PANEL_COLORS.card.backgroundAlt}`} role="region" aria-label="File preview">
          <div className="flex items-center gap-2">
            {imagePreview ? (
              <div className="relative inline-block flex-shrink-0">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className={`h-12 w-12 object-cover rounded border ${PANEL_COLORS.card.border}`}
                />
                <button
                  onClick={onCancelFile}
                  className={`absolute -top-1 -right-1 p-0.5 ${PANEL_COLORS.buttons.danger.background} hover:${PANEL_COLORS.buttons.danger.hover} rounded-full ${PANEL_COLORS.text.primary} transition-colors focus:outline-none focus:ring-2 focus:ring-red-500`}
                  aria-label="Remove file"
                >
                  <FontAwesomeIcon icon={faTimes} className="w-3 h-3" />
                </button>
              </div>
            ) : pendingFile ? (
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className={`p-2 ${PANEL_COLORS.input.background} rounded`}>
                  <FontAwesomeIcon icon={faImage} className={`w-5 h-5 ${PANEL_COLORS.text.secondary}`} />
                </div>
                <button
                  onClick={onCancelFile}
                  className={`p-1 ${PANEL_COLORS.buttons.danger.background} hover:${PANEL_COLORS.buttons.danger.hover} rounded-full ${PANEL_COLORS.text.primary} transition-colors focus:outline-none focus:ring-2 focus:ring-red-500`}
                  aria-label="Remove file"
                >
                  <FontAwesomeIcon icon={faTimes} className="w-3 h-3" />
                </button>
              </div>
            ) : null}
            
            <div className="flex-1 min-w-0">
              <p className={`text-xs ${PANEL_COLORS.text.primary} font-medium truncate`}>
                {pendingFile?.name || 'Image'}
              </p>
              {pendingFile && (
                <p className={`text-xs ${PANEL_COLORS.text.secondary}`}>
                  {formatFileSize(pendingFile.size)}
                </p>
              )}
              
              {uploadingState === LoadingState.Loading && (
                <>
                  <div className={`w-full ${PANEL_COLORS.input.background} rounded-full h-1 mt-1`}>
                    <div 
                      className={`${PANEL_COLORS.buttons.primary.background} h-1 rounded-full transition-all duration-300`}
                      style={{ width: `${uploadProgress.percentage}%` }}
                    />
                  </div>
                  <p className={`text-xs ${PANEL_COLORS.text.secondary} mt-0.5`}>
                    {uploadProgress.percentage}%
                  </p>
                </>
              )}
              
              {uploadingState === LoadingState.Success && (
                <div className={`flex items-center gap-1 ${PANEL_COLORS.accents.success} mt-0.5`}>
                  <FontAwesomeIcon icon={faCheckCircle} className="w-3 h-3" />
                  <span className="text-xs">Ready</span>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Input Area */}
      <footer className={`border-t ${PANEL_COLORS.container.divider} p-2 sm:p-3`} role="contentinfo">
        <form onSubmit={onSend} className="flex items-center gap-1 sm:gap-2">
          <input
            id="chat-file-upload"
            name="chat-file-upload"
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf,text/*,.doc,.docx"
            onChange={onFileSelect}
            className="hidden"
            aria-label="Select file to upload"
          />
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingState === LoadingState.Loading || sendingState === LoadingState.Loading}
            className={`flex-shrink-0 p-1.5 sm:p-2 ${PANEL_COLORS.buttons.secondary.background} ${PANEL_COLORS.buttons.secondary.hover} rounded ${PANEL_COLORS.text.secondary} hover:${PANEL_COLORS.text.primary} transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 ${PANEL_COLORS.input.focus.ring} touch-manipulation`}
            aria-label="Upload file"
          >
            {uploadingState === LoadingState.Loading ? (
              <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
            ) : (
              <FontAwesomeIcon icon={faImage} className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>
          
          <div className="relative flex-shrink-0">
            <button
              type="button"
              onClick={onToggleEmojiPicker}
              className={`p-1.5 sm:p-2 ${PANEL_COLORS.buttons.secondary.background} ${PANEL_COLORS.buttons.secondary.hover} rounded ${PANEL_COLORS.text.secondary} hover:${PANEL_COLORS.text.primary} transition-colors focus:outline-none focus:ring-2 ${PANEL_COLORS.input.focus.ring} touch-manipulation`}
              aria-label="Add emoji"
              aria-expanded={showEmojiPicker}
            >
              <FontAwesomeIcon icon={faSmile} className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            {showEmojiPicker && (
              <EmojiPicker
                onEmojiSelect={onEmojiSelect}
                onClose={() => onToggleEmojiPicker()}
              />
            )}
          </div>

          <input
            id="chat-message-input"
            name="chat-message-input"
            type="text"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder={imagePreview ? "Caption..." : "Message..."}
            className={`flex-1 min-w-0 ${PANEL_COLORS.input.background} border ${PANEL_COLORS.input.border} rounded px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base ${PANEL_COLORS.text.primary} ${PANEL_COLORS.text.placeholder} focus:outline-none focus:ring-2 ${PANEL_COLORS.input.focus.ring} touch-manipulation`}
            disabled={sendingState === LoadingState.Loading}
            maxLength={MAX_MESSAGE_LENGTH}
            aria-label="Message input"
            autoComplete="off"
          />

          <button
            type="submit"
            disabled={
              sendingState === LoadingState.Loading || 
              uploadingState === LoadingState.Loading || 
              (!input.trim() && !pendingFile)
            }
            className={`flex-shrink-0 p-1.5 sm:p-2 ${PANEL_COLORS.buttons.primary.background} ${PANEL_COLORS.buttons.primary.hover} active:bg-blue-800 disabled:${PANEL_COLORS.buttons.secondary.background} disabled:cursor-not-allowed rounded ${PANEL_COLORS.text.primary} transition-colors focus:outline-none focus:ring-2 ${PANEL_COLORS.input.focus.ring} touch-manipulation`}
            aria-label="Send message"
          >
            {sendingState === LoadingState.Loading ? (
              <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
            ) : (
              <FontAwesomeIcon icon={faPaperPlane} className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>
        </form>
      </footer>
    </>
  );
}
