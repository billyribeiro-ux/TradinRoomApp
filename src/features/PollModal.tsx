// src/components/PollModal.tsx
import { BarChart3, Plus, X, Trash2, Clock, Users } from 'lucide-react';
import { useState } from 'react';

import { createPoll } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useRoomStore } from '../store/roomStore';
import { useToastStore } from '../store/toastStore';
import type { Poll } from '../types/database.types';

interface PollModalProps {
  onClose: () => void;
}

export function PollModal({ onClose }: PollModalProps) {
  const user = useAuthStore(state => state.user);
  const { currentRoom, members } = useRoomStore();
  const { addToast } = useToastStore();

  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [duration, setDuration] = useState(5); // minutes
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [showResults, setShowResults] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !currentRoom) return;

    // Validate inputs
    if (!question.trim()) {
      addToast('Please enter a poll question', 'error');
      return;
    }

    const validOptions = options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      addToast('Please provide at least 2 options', 'error');
      return;
    }

    setIsCreating(true);

    try {
      // Calculate ends_at from duration_minutes
      const endsAt = duration > 0
        ? new Date(Date.now() + duration * 60 * 1000).toISOString()
        : undefined;

      // Enterprise standard: Optimistic update for instant UI feedback
      const tempPollId = `temp-${Date.now()}`;
      const optimisticPoll = {
        id: tempPollId,
        room_id: currentRoom.id,
        title: question.trim(),
        description: undefined,
        options: validOptions,
        is_active: true,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        expires_at: endsAt,
      } as unknown as Poll;

      // Add optimistic poll immediately
      const { addPoll } = useRoomStore.getState();
      addPoll(optimisticPoll);

      // Create poll via API
      const createdPoll = await createPoll({
        room_id: currentRoom.id,
        title: question.trim(),
        options: validOptions,
        created_by: user.id,
        expires_at: endsAt,
      });

      // Replace optimistic poll with real poll from API
      if (createdPoll) {
        const { setPolls, polls: currentPolls } = useRoomStore.getState();
        setPolls(currentPolls.map(p => p.id === tempPollId ? createdPoll : p));
      } else {
        // If creation failed, remove optimistic poll
        const { removePoll } = useRoomStore.getState();
        removePoll(tempPollId);
        throw new Error('Poll creation returned no data');
      }

      addToast('Poll created successfully', 'success');
      onClose();
    } catch (error) {
      // Enterprise standard: Revert optimistic update on error
      const { polls, removePoll } = useRoomStore.getState();
      const optimisticPoll = polls.find(p => p.id.startsWith('temp-'));
      if (optimisticPoll) {
        removePoll(optimisticPoll.id);
      }

      const message = error instanceof Error ? error.message : 'Failed to create poll';
      addToast(message, 'error');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 sm:p-6 md:p-8">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-[95vw] sm:max-w-xl md:max-w-2xl max-h-[90vh] md:max-h-[85vh] border border-slate-700 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">Create Poll</h2>
                <p className="text-xs sm:text-sm text-blue-100 hidden sm:block">Get instant feedback from participants</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 sm:p-1.5 hover:bg-white/20 rounded-lg transition-colors touch-manipulation"
              disabled={isCreating}
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          <div className="space-y-4 sm:space-y-6">
            {/* Question */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2">
                Poll Question
              </label>
              <input
                id="poll-question"
                name="poll-question"
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What would you like to ask?"
                className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 touch-manipulation"
                maxLength={200}
                required
                autoFocus
                autoComplete="off"
              />
              <p className="mt-1 text-xs text-slate-500">
                {question.length}/200 characters
              </p>
            </div>

            {/* Options */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2">
                Answer Options
              </label>
              <div className="space-y-4 sm:space-y-6">
                {options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      id={`poll-option-${index}`}
                      name={`poll-option-${index}`}
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1 px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      maxLength={100}
                      required
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(index)}
                        className="flex-shrink-0 p-1.5 sm:p-2 bg-red-600/20 hover:bg-red-600/30 active:bg-red-600/40 rounded-lg text-red-400 transition-colors touch-manipulation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {options.length < 10 && (
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg text-blue-400 text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Option
                </button>
              )}
            </div>

            {/* Duration */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Poll Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value={1}>1 minute</option>
                <option value={2}>2 minutes</option>
                <option value={5}>5 minutes</option>
                <option value={10}>10 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={0}>No time limit</option>
              </select>
            </div>

            {/* Settings */}
            <div className="space-y-3">
              <label htmlFor="allow-multiple" className="flex items-center gap-3 cursor-pointer">
                <input
                  id="allow-multiple"
                  name="allow-multiple"
                  type="checkbox"
                  checked={allowMultiple}
                  onChange={(e) => setAllowMultiple(e.target.checked)}
                  className="w-4 h-4 bg-slate-900 border-slate-600 rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-300">
                  Allow multiple selections
                </span>
              </label>

              <label htmlFor="show-results" className="flex items-center gap-3 cursor-pointer">
                <input
                  id="show-results"
                  name="show-results"
                  type="checkbox"
                  checked={showResults}
                  onChange={(e) => setShowResults(e.target.checked)}
                  className="w-4 h-4 bg-slate-900 border-slate-600 rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-300">
                  Show results to participants in real-time
                </span>
              </label>
            </div>

            {/* Preview Info */}
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-2 sm:gap-3 text-sm text-slate-400">
                <Users className="w-4 h-4" />
                <span>
                  This poll will be visible to all {members?.length || 0} participants in the room
                </span>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-700 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isCreating}
            className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700/50 disabled:cursor-not-allowed text-slate-300 font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isCreating || !question.trim() || options.filter(o => o.trim()).length < 2}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            {isCreating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <BarChart3 className="w-4 h-4" />
                <span>Create Poll</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PollModal;