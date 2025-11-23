// ============================================================================
// FOLLOWED CHAT USERS MODAL - Microsoft Enterprise Standard
// ============================================================================
import { X, Edit, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface FollowedUsersModalProps {
  onClose: () => void;
}

interface FollowedUser {
  id: string;
  name: string;
  initials: string;
  avatarUrl?: string;
  followedAt: Date;
}

export function FollowedUsersModal({ onClose }: FollowedUsersModalProps) {
  const [followedUsers, setFollowedUsers] = useState<FollowedUser[]>([]);

  // Load followed users from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('followed_users');
      if (saved) {
        const parsed = JSON.parse(saved) as Array<Omit<FollowedUser, 'followedAt'> & { followedAt: string }>;
        setFollowedUsers(parsed.map((u) => ({
          ...u,
          followedAt: new Date(u.followedAt)
        })));
      }
    } catch (error) {
      console.error('Failed to load followed users:', error);
    }
  }, []);

  const handleUnfollow = (userId: string) => {
    const updated = followedUsers.filter(u => u.id !== userId);
    setFollowedUsers(updated);
    try {
      localStorage.setItem('followed_users', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save followed users:', error);
    }
  };

  const handleEdit = (userId: string) => {
    console.log('Edit user:', userId);
    // Implement edit functionality
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-[95vw] sm:max-w-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-700">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Followed Chat Users</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
          {followedUsers.length === 0 ? (
            <div className="flex items-center justify-center h-full min-h-[200px]">
              <p className="text-slate-400 text-lg text-center">
                You haven't followed any users yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {followedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between bg-slate-700/50 rounded-lg px-4 py-3 hover:bg-slate-700 transition-colors border border-slate-600"
                >
                  <div className="flex items-center gap-4">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-600 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">{user.initials}</span>
                      </div>
                    )}
                    <div>
                      <p className="text-white font-semibold text-base sm:text-lg">{user.name}</p>
                      <p className="text-slate-400 text-sm">
                        Followed on {user.followedAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(user.id)}
                      className="p-3 border-2 border-green-600 hover:bg-green-600 text-green-600 hover:text-white rounded-lg transition-colors"
                      aria-label="Edit"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleUnfollow(user.id)}
                      className="p-3 border-2 border-red-600 hover:bg-red-600 text-red-600 hover:text-white rounded-lg transition-colors"
                      aria-label="Unfollow"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-700 bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-lg transition-colors text-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
