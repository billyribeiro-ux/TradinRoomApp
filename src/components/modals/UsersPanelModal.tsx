// ============================================================================
// USERS PANEL MODAL - Microsoft Enterprise Standard
// ============================================================================
import { X, Search, ArrowUpDown, RefreshCw, Settings } from 'lucide-react';
import { useState, useMemo } from 'react';

import { useRoomStore } from '../../store/roomStore';

interface UsersPanelModalProps {
  onClose: () => void;
}

type SortOrder = 'asc' | 'desc' | 'none';

export function UsersPanelModal({ onClose }: UsersPanelModalProps) {
  const { members } = useRoomStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('none');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    let result = [...members];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(user => 
        user.display_name?.toLowerCase().includes(query) ||
        user.city?.toLowerCase().includes(query) ||
        user.region?.toLowerCase().includes(query) ||
        user.country?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    if (sortOrder !== 'none') {
      result.sort((a, b) => {
        const nameA = a.display_name?.toLowerCase() || '';
        const nameB = b.display_name?.toLowerCase() || '';
        return sortOrder === 'asc' 
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      });
    }

    return result;
  }, [members, searchQuery, sortOrder]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh - in production, this would fetch latest users
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const handleSort = () => {
    setSortOrder(current => {
      if (current === 'none') return 'asc';
      if (current === 'asc') return 'desc';
      return 'none';
    });
  };

  const handleUserMenu = (userId: string) => {
    setSelectedUserId(selectedUserId === userId ? null : userId);
  };

  const handleSettings = () => {
    console.log('User panel settings clicked');
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-[95vw] sm:max-w-md overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with User Count and Actions */}
        <div className="bg-slate-100 px-3 sm:px-4 py-2 sm:py-3 border-b border-slate-300">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-400 rounded-full flex items-center justify-center">
                <span className="text-white text-lg">👤</span>
              </div>
              <span className="text-slate-700 font-semibold text-base sm:text-lg">Users:</span>
              <div className="bg-slate-600 text-white font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm">
                {members.length}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-200 rounded transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Search Button */}
            <button
              onClick={() => document.getElementById('user-search')?.focus()}
              className="flex-1 bg-slate-300 hover:bg-slate-400 p-2 sm:p-3 rounded-lg transition-colors flex items-center justify-center"
              title="Search users"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
            </button>

            {/* Sort A-Z Button */}
            <button
              onClick={handleSort}
              className={`flex-1 p-3 rounded-lg transition-colors flex items-center justify-center ${
                sortOrder !== 'none'
                  ? 'bg-slate-600 text-white'
                  : 'bg-slate-300 hover:bg-slate-400 text-slate-700'
              }`}
              title={`Sort ${sortOrder === 'asc' ? 'Z-A' : sortOrder === 'desc' ? 'None' : 'A-Z'}`}
            >
              <ArrowUpDown className="w-5 h-5" />
            </button>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-green-400 p-3 rounded-lg transition-colors flex items-center justify-center"
              title="Refresh users"
            >
              <RefreshCw className={`w-5 h-5 text-white ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* Settings Button */}
            <button
              onClick={handleSettings}
              className="flex-1 bg-slate-800 hover:bg-slate-900 p-3 rounded-lg transition-colors flex items-center justify-center"
              title="User panel settings"
            >
              <Settings className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="user-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto bg-white">
          {filteredAndSortedUsers.length === 0 ? (
            <div className="flex items-center justify-center h-full p-8">
              <p className="text-slate-500 text-center">
                {searchQuery ? 'No users found matching your search.' : 'No users in this room.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filteredAndSortedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors relative"
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.display_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-300 flex items-center justify-center">
                        <span className="text-slate-600 font-semibold text-lg">
                          {user.display_name?.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 text-lg truncate">
                      {user.display_name || 'Unknown User'}
                    </h3>
                    {(user.city || user.region || user.country) && (
                      <p className="text-slate-600 text-sm truncate">
                        {[user.city, user.region, user.country_code || user.country]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    )}
                  </div>

                  {/* Menu Button */}
                  <button
                    onClick={() => handleUserMenu(user.id)}
                    className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-2xl font-bold text-slate-700"
                    aria-label="User options"
                    aria-haspopup="true"
                    aria-expanded={selectedUserId === user.id}
                  >
                    ⠇
                  </button>

                  {/* User Menu Dropdown */}
                  {selectedUserId === user.id && (
                    <div className="absolute right-4 top-full mt-1 bg-white border border-slate-300 rounded-xl shadow-2xl z-10 min-w-[220px] overflow-hidden">
                      <button
                        onClick={() => {
                          console.log('View user info:', user.id);
                          setSelectedUserId(null);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-slate-100 transition-colors flex items-center gap-3 border-b border-slate-200"
                      >
                        <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center">
                          <span className="text-white text-lg">👤</span>
                        </div>
                        <span className="font-medium text-slate-800">User Info</span>
                      </button>
                      <button
                        onClick={() => {
                          console.log('Mention/Reply:', user.id);
                          setSelectedUserId(null);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-slate-100 transition-colors flex items-center gap-3 border-b border-slate-200"
                      >
                        <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center">
                          <span className="text-white text-lg">↩️</span>
                        </div>
                        <span className="font-medium text-slate-800">Mention / Reply</span>
                      </button>
                      <button
                        onClick={() => {
                          console.log('Private chat:', user.id);
                          setSelectedUserId(null);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-slate-100 transition-colors flex items-center gap-3"
                      >
                        <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center">
                          <span className="text-white text-lg">💬</span>
                        </div>
                        <span className="font-medium text-slate-800">Private Chat</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>
              Showing {filteredAndSortedUsers.length} of {members.length} users
            </span>
            {sortOrder !== 'none' && (
              <span className="text-blue-600 font-medium">
                Sorted {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
