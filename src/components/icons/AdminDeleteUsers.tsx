import { Trash2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';

import type { UserCount } from '../../utils/deleteAllUsers';
import { deleteAllUsers, getUserCount } from '../../utils/deleteAllUsers';
// Fixed: 2025-01-24 - Eradicated 2 null usage(s) - Microsoft TypeScript standards
// Replaced null with undefined, removed unnecessary null checks, used optional types

interface DeletionError {
  table: string;
  error: string;
}

interface DeletionResult {
  success: boolean;
  userCount: number;
  authUserCount: number;
  tablesCleared: string[];
  errors: DeletionError[];
}

export function AdminDeleteUsers() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [result, setResult] = useState<DeletionResult | undefined>();
  const [userCount, setUserCount] = useState<UserCount | undefined>();

  const loadUserCount = async () => {
    const count = await getUserCount();
    setUserCount(count);
  };

  const handleDelete = async () => {
    if (confirmText !== 'DELETE ALL USERS') {
      alert('Please type "DELETE ALL USERS" to confirm');
      return;
    }

    setIsDeleting(true);
    setResult(undefined);

    try {
      const deletionResult = await deleteAllUsers();
      setResult(deletionResult as DeletionResult);
      setShowConfirm(false);
      setConfirmText('');
      await loadUserCount();
    } catch (error) {
      console.error('Error during deletion:', error);
      setResult({
        success: false,
        userCount: 0,
        authUserCount: 0,
        tablesCleared: [],
        errors: [{ table: 'general', error: String(error) }],
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-red-900/90 backdrop-blur-sm border-2 border-red-500 rounded-lg p-4 shadow-lg max-w-md">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="text-red-400" size={24} />
          <h3 className="text-lg font-bold text-red-100">Admin: Delete All Users</h3>
        </div>

        {!showConfirm && !result && (
          <div className="space-y-3">
            <p className="text-red-200 text-sm">
              This will permanently delete all users and their associated data from the database.
            </p>

            <button
              onClick={loadUserCount}
              className="w-full px-4 py-2 bg-red-800 hover:bg-red-700 text-white rounded transition-colors text-sm"
            >
              Check User Count
            </button>

            {userCount !== undefined && (
              <div className="bg-red-950/50 p-3 rounded border border-red-700">
                <p className="text-red-200 text-sm font-medium">
                  Current users: {userCount.total}
                </p>
              </div>
            )}

            <button
              onClick={() => setShowConfirm(true)}
              disabled={isDeleting}
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded transition-colors font-semibold flex items-center justify-center gap-2"
            >
              <Trash2 size={16} />
              Delete All Users
            </button>
          </div>
        )}

        {showConfirm && !result && (
          <div className="space-y-3">
            <div className="bg-red-950/50 p-3 rounded border border-red-700">
              <p className="text-red-100 text-sm font-bold mb-2">
                ⚠️ WARNING: This action cannot be undone!
              </p>
              <p className="text-red-200 text-xs mb-3">
                This will delete:
              </p>
              <ul className="text-red-300 text-xs space-y-1 list-disc list-inside">
                <li>All users from public.users</li>
                <li>All users from auth.users</li>
                <li>All chat messages, alerts, polls</li>
                <li>All user preferences and integrations</li>
                <li>All subscriptions and payments</li>
                <li>All related user data</li>
              </ul>
            </div>

            <div>
              <label className="block text-red-200 text-sm font-medium mb-2">
                Type "DELETE ALL USERS" to confirm:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full px-3 py-2 bg-red-950 border border-red-700 rounded text-red-100 placeholder-red-400 focus:outline-none focus:border-red-500"
                placeholder="DELETE ALL USERS"
                disabled={isDeleting}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowConfirm(false);
                  setConfirmText('');
                }}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting || confirmText !== 'DELETE ALL USERS'}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-3">
            <div className={`p-3 rounded border ${
              result.success
                ? 'bg-green-950/50 border-green-700'
                : 'bg-yellow-950/50 border-yellow-700'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {result.success ? (
                  <CheckCircle className="text-green-400" size={20} />
                ) : (
                  <XCircle className="text-yellow-400" size={20} />
                )}
                <h4 className="font-semibold text-white">
                  {result.success ? 'Deletion Complete' : 'Deletion Completed with Warnings'}
                </h4>
              </div>

              <div className="space-y-2 text-sm">
                <p className="text-gray-300">
                  Users deleted: {result.userCount}
                </p>
                <p className="text-gray-300">
                  Auth users: {result.authUserCount}
                </p>
                <p className="text-gray-300">
                  Tables cleared: {result.tablesCleared.length}
                </p>

                {result.errors.length > 0 && (
                  <div className="mt-3">
                    <p className="text-yellow-300 font-medium mb-1">
                      Errors ({result.errors.length}):
                    </p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {result.errors.map((err: DeletionError, idx: number) => (
                        <div key={idx} className="text-xs text-yellow-200 bg-yellow-950/30 p-2 rounded">
                          <span className="font-medium">{err.table}:</span> {err.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.tablesCleared.length > 0 && (
                  <details className="mt-3">
                    <summary className="text-gray-300 cursor-pointer hover:text-white">
                      View cleared tables ({result.tablesCleared.length})
                    </summary>
                    <div className="mt-2 text-xs text-gray-400 space-y-1">
                      {result.tablesCleared.map((table: string, idx: number) => (
                        <div key={idx}>✓ {table}</div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                setResult(undefined);
                loadUserCount();
              }}
              className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
