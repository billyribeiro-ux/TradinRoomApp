// ============================================================================
// MUTED CHAT USERS MODAL - Microsoft Enterprise Standard
// ============================================================================
import { X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface MutedUsersModalProps {
  onClose: () => void;
}

interface MutedUser {
  id: string;
  name: string;
  mutedAt: Date;
}

export function MutedUsersModal({ onClose }: MutedUsersModalProps) {
  const [mutedUsers, setMutedUsers] = useState<MutedUser[]>([]);

  // Load muted users from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('muted_users');
      if (saved) {
        setMutedUsers(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load muted users:', error);
    }
  }, []);

  const handleUnmute = (userId: string) => {
    const updated = mutedUsers.filter(u => u.id !== userId);
    setMutedUsers(updated);
    try {
      localStorage.setItem('muted_users', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save muted users:', error);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-[95vw] sm:max-w-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-700">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Muted Chat Users</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 sm:py-8 min-h-[200px] sm:min-h-[300px]">
          {mutedUsers.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-white text-lg sm:text-xl text-center">
                You don't have any muted/ignored users.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {mutedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between bg-slate-700 rounded-lg px-4 py-3 hover:bg-slate-600 transition-colors"
                >
                  <div>
                    <p className="text-white font-semibold">{user.name}</p>
                    <p className="text-slate-400 text-sm">
                      Muted on {user.mutedAt.toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleUnmute(user.id)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    Unmute
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-700 bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
