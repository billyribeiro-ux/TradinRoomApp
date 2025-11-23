// ============================================================================
// GET RANDOM USER MODAL - Microsoft Enterprise Standard
// ============================================================================
import { X } from 'lucide-react';
import { useState } from 'react';

import { useRoomStore, type RoomMember } from '../../store/roomStore';

interface GetRandomUserModalProps {
  onClose: () => void;
}

export function GetRandomUserModal({ onClose }: GetRandomUserModalProps) {
  const [trialsOnly, setTrialsOnly] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(true);
  const [selectedUser, setSelectedUser] = useState<RoomMember | null>(null);
  const { members } = useRoomStore();

  const handleGetRandomUser = (fromTrialsOnly: boolean) => {
    setTrialsOnly(fromTrialsOnly);
    setShowConfirmation(false);

    // Filter users based on trials selection
    let eligibleUsers = members;
    
    if (fromTrialsOnly) {
      // Filter for trial users (you can customize this logic)
      eligibleUsers = members.filter(() => {
        // Example: Check if user has 'trial' in their metadata or is new
        return true; // Placeholder - implement your trial user logic
      });
    }

    if (eligibleUsers.length === 0) {
      setSelectedUser(null);
      return;
    }

    // Get random user
    const randomIndex = Math.floor(Math.random() * eligibleUsers.length);
    const randomUser = eligibleUsers[randomIndex];
    
    setSelectedUser(randomUser);
  };

  const handleReset = () => {
    setShowConfirmation(true);
    setSelectedUser(null);
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-[95vw] sm:max-w-md overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {showConfirmation ? (
          <>
            {/* Confirmation Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700">
              <h2 className="text-xl sm:text-2xl font-bold text-white">Only select from Trials?</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Confirmation Buttons */}
            <div className="flex items-center justify-end gap-3 sm:gap-4 px-4 sm:px-6 py-6 sm:py-8">
              <button
                onClick={() => handleGetRandomUser(false)}
                className="px-6 sm:px-8 py-3 sm:py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors text-lg sm:text-xl"
              >
                No
              </button>
              <button
                onClick={() => handleGetRandomUser(true)}
                className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors text-xl"
              >
                Yes
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Result Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700">
              <h2 className="text-2xl font-bold text-white">
                {trialsOnly ? 'Random Trial User' : 'Random User'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Result Content */}
            <div className="px-6 py-8">
              {selectedUser ? (
                <div className="bg-slate-700 rounded-lg p-6 text-center">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-slate-600 flex items-center justify-center">
                    {selectedUser.avatar_url ? (
                      <img
                        src={selectedUser.avatar_url}
                        alt={selectedUser.display_name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-3xl">
                        {selectedUser.display_name?.charAt(0).toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {selectedUser.display_name || 'Unknown User'}
                  </h3>
                  {selectedUser.city && (
                    <p className="text-slate-300">
                      📍 {selectedUser.city}
                      {selectedUser.region && `, ${selectedUser.region}`}
                      {selectedUser.country && ` - ${selectedUser.country}`}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-400 text-lg">
                    {trialsOnly ? 'No trial users found.' : 'No users available.'}
                  </p>
                </div>
              )}
            </div>

            {/* Result Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700 bg-slate-900/50 gap-3">
              <button
                onClick={handleReset}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white font-bold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
