// ============================================================================
// ARCHIVES MODAL - Microsoft Enterprise Standard
// ============================================================================
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface ArchivesModalProps {
  onClose: () => void;
}

type ArchiveSection = 'recording' | 'alerts' | 'chat';

export function ArchivesModal({ onClose }: ArchivesModalProps) {
  const [activeSection, setActiveSection] = useState<ArchiveSection | null>(null);

  const handleSectionClick = (section: ArchiveSection) => {
    setActiveSection(activeSection === section ? null : section);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-[95vw] sm:max-w-md overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-300 rounded flex items-center justify-center">
              <span className="text-slate-700 text-lg">📁</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">Archives</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-600 hover:text-slate-800"
            aria-label="Close"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {/* Recording */}
          <button
            onClick={() => handleSectionClick('recording')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors text-left"
          >
            <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center flex-shrink-0">
              <div className="w-3 h-3 bg-white rounded-full" />
            </div>
            <span className="text-lg font-medium text-slate-800">Recording</span>
          </button>

          {activeSection === 'recording' && (
            <div className="ml-9 pl-4 border-l-2 border-slate-200 py-2 space-y-2">
              <div className="text-sm text-slate-600">
                <p className="mb-2">Access your recorded sessions:</p>
                <ul className="space-y-1">
                  <li className="hover:text-slate-800 cursor-pointer">• Session 1 - Oct 30, 2025</li>
                  <li className="hover:text-slate-800 cursor-pointer">• Session 2 - Oct 29, 2025</li>
                  <li className="hover:text-slate-800 cursor-pointer">• Session 3 - Oct 28, 2025</li>
                </ul>
              </div>
            </div>
          )}

          {/* Alert Logs */}
          <button
            onClick={() => handleSectionClick('alerts')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors text-left"
          >
            <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
              <span className="text-xl">🔔</span>
            </div>
            <span className="text-lg font-medium text-slate-800">Alert Logs</span>
          </button>

          {activeSection === 'alerts' && (
            <div className="ml-9 pl-4 border-l-2 border-slate-200 py-2 space-y-2">
              <div className="text-sm text-slate-600">
                <p className="mb-2">View past alerts:</p>
                <ul className="space-y-1">
                  <li className="hover:text-slate-800 cursor-pointer">• Alert: Market Update - 2:30 PM</li>
                  <li className="hover:text-slate-800 cursor-pointer">• Alert: Breaking News - 1:15 PM</li>
                  <li className="hover:text-slate-800 cursor-pointer">• Alert: Price Alert - 11:00 AM</li>
                </ul>
              </div>
            </div>
          )}

          {/* Chat Logs */}
          <button
            onClick={() => handleSectionClick('chat')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors text-left"
          >
            <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
              <span className="text-xl">💬</span>
            </div>
            <span className="text-lg font-medium text-slate-800">Chat Logs</span>
          </button>

          {activeSection === 'chat' && (
            <div className="ml-9 pl-4 border-l-2 border-slate-200 py-2 space-y-2">
              <div className="text-sm text-slate-600">
                <p className="mb-2">Download chat history:</p>
                <ul className="space-y-1">
                  <li className="hover:text-slate-800 cursor-pointer">• Today's Chat - Oct 31, 2025</li>
                  <li className="hover:text-slate-800 cursor-pointer">• Yesterday's Chat - Oct 30, 2025</li>
                  <li className="hover:text-slate-800 cursor-pointer">• Last Week's Chats</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="w-full bg-slate-600 hover:bg-slate-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
