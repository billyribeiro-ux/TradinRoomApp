import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPencilAlt, faMicrophone, faDesktop, faVideo, faComment, faWrench } from '@fortawesome/free-solid-svg-icons';

interface UserInfoModalProps {
  user: {
    id: string;
    display_name?: string;
    username?: string;
    email?: string;
    avatar_url?: string;
    last_login?: string;
    location?: string;
    system?: string;
  };
  onClose: () => void;
}

export function UserInfoModal({ user, onClose }: UserInfoModalProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'system' | 'actions' | 'notes'>('info');
  const [permissions, setPermissions] = useState({
    microphone: false,
    screenshare: false,
    webcam: false,
    adminChat: false,
  });
  const [temporaryAccess, setTemporaryAccess] = useState(false);

  const displayName = user.display_name || user.username || 'Unknown User';

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gray-800 px-6 py-4 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-24 h-24 rounded bg-gray-700 flex items-center justify-center overflow-hidden">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl text-white">👤</span>
                )}
              </div>
              <button className="absolute bottom-0 right-0 bg-gray-600 rounded-full p-2 hover:bg-gray-500">
                <FontAwesomeIcon icon={faPencilAlt} className="text-white text-xs" />
              </button>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                {displayName}
                <FontAwesomeIcon icon={faPencilAlt} className="text-blue-500 text-sm cursor-pointer" />
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-6 pt-4 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-6 py-3 font-semibold rounded-t-lg transition-colors ${
              activeTab === 'info' 
                ? 'bg-gray-800 text-green-500 border-b-2 border-green-500' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            User Info
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`px-6 py-3 font-semibold rounded-t-lg transition-colors ${
              activeTab === 'system' 
                ? 'bg-gray-800 text-green-500 border-b-2 border-green-500' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            System
          </button>
          <button
            onClick={() => setActiveTab('actions')}
            className={`px-6 py-3 font-semibold rounded-t-lg transition-colors ${
              activeTab === 'actions' 
                ? 'bg-gray-800 text-green-500 border-b-2 border-green-500' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Actions
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-6 py-3 font-semibold rounded-t-lg transition-colors ${
              activeTab === 'notes' 
                ? 'bg-gray-800 text-green-500 border-b-2 border-green-500' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Admin Notes
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'info' && (
            <div className="space-y-4 text-white">
              <div className="flex items-center gap-4">
                <span className="font-bold w-32">Name:</span>
                <span>{displayName}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold w-32">Last Login:</span>
                <span>{user.last_login || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold w-32">Email:</span>
                <span className="underline">{user.email || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold w-32">Badges:</span>
                <span></span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold w-32">Location:</span>
                <span>{user.location || 'n/a'}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold w-32">System:</span>
                <span>{user.system || 'n/a'}</span>
              </div>
              
              <div className="pt-4 border-t border-gray-700">
                <div className="font-bold mb-4">Permissions:</div>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={permissions.microphone}
                      onChange={(e) => setPermissions({...permissions, microphone: e.target.checked})}
                      className="w-5 h-5"
                    />
                    <FontAwesomeIcon icon={faMicrophone} className="w-5" />
                    <span>Microphone</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={permissions.screenshare}
                      onChange={(e) => setPermissions({...permissions, screenshare: e.target.checked})}
                      className="w-5 h-5"
                    />
                    <FontAwesomeIcon icon={faDesktop} className="w-5" />
                    <span>Screenshare</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={permissions.webcam}
                      onChange={(e) => setPermissions({...permissions, webcam: e.target.checked})}
                      className="w-5 h-5"
                    />
                    <FontAwesomeIcon icon={faVideo} className="w-5" />
                    <span>WebCam</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={permissions.adminChat}
                      onChange={(e) => setPermissions({...permissions, adminChat: e.target.checked})}
                      className="w-5 h-5"
                    />
                    <FontAwesomeIcon icon={faComment} className="w-5" />
                    <span>Admin Chat</span>
                  </label>
                </div>
                
                <div className="flex items-center justify-between mt-6">
                  <button className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded border-2 border-green-500">
                    Save
                  </button>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={temporaryAccess}
                      onChange={(e) => setTemporaryAccess(e.target.checked)}
                      className="w-5 h-5"
                    />
                    <FontAwesomeIcon icon={faWrench} className="w-5" />
                    <span>Temporary Access Only</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="text-white">
              <p>System information coming soon...</p>
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="text-white">
              <p>Actions coming soon...</p>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="text-white">
              <textarea 
                className="w-full h-64 bg-gray-800 text-white p-4 rounded border border-gray-700"
                placeholder="Admin notes..."
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-800 px-6 py-4 flex items-center justify-between border-t border-gray-700">
          <button className="px-6 py-2 bg-transparent border-2 border-white text-white font-semibold rounded hover:bg-white/10">
            @Mention
          </button>
          <button className="px-6 py-2 bg-transparent border-2 border-white text-white font-semibold rounded hover:bg-white/10">
            Private Chat
          </button>
          <button className="px-6 py-2 bg-transparent border-2 border-cyan-500 text-cyan-500 font-semibold rounded hover:bg-cyan-500/10">
            Follow
          </button>
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
