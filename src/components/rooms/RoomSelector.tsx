/**
 * RoomSelector.tsx — Enterprise Trading Room Selector
 * -----------------------------------------------------
 * - Lists user’s trading rooms with live theme branding
 * - Integrates Create/Edit/Clone/Delete modals
 * - Loads tenant-wide branding & color settings
 * - Safe Supabase + Toast integration (2025-10 edition)
 */

import * as Icons from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';

import { supabase } from '../../lib/supabase';
import { getUserRooms, deleteRoom } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useToastStore } from '../../store/toastStore';
import type { Room } from '../../types/database.types';
import { CreateRoomModal } from '../icons/CreateRoomModal';
import { AdvancedBrandingSettings } from '../theme/AdvancedBrandingSettings';

import { DeleteRoomModal } from './DeleteRoomModal';
// Fixed: 2025-10-24 - Database schema alignment fixes
// Microsoft TypeScript standards - corrected field references

// Room icon component
const getRoomIcon = Icons.Users;


// Fixed: 2025-01-24 - Eradicated 4 null usage(s) - Microsoft TypeScript standards
// Replaced null with undefined, removed unnecessary null checks, used optional types


interface RoomSelectorProps {
  onSelectRoom?: (room: Room) => void;
}

interface ExtendedRoom extends Omit<Room, 'icon_bg_color' | 'title_color' | 'description_color' | 'button_text' | 'button_bg_color' | 'button_text_color' | 'button_width' | 'card_bg_color' | 'card_border_color' | 'icon_url' | 'icon_color'> {
  card_bg_color: string;
  card_border_color: string;
  icon_url: string;
  icon_bg_color: string;
  icon_color?: string;
  title_color: string;
  description_color: string;
  button_text: string;
  button_bg_color: string;
  button_text_color: string;
  button_width: 'sm' | 'md' | 'lg' | 'full';
}

export function RoomSelector({ onSelectRoom }: RoomSelectorProps) {
  const { user, signOut } = useAuthStore();
  const { addToast } = useToastStore();
  useThemeStore(); // Initialize theme store for branding

  const [rooms, setRooms] = useState<ExtendedRoom[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sourceRoom, setSourceRoom] = useState<ExtendedRoom | undefined>();
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'clone'>('create');

  const [showMenuRoomId, setShowMenuRoomId] = useState<string | undefined>();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<ExtendedRoom | undefined>();
  const [showBranding, setShowBranding] = useState(false);

  // ======================================================
  // 🧭 Load Rooms
  // ======================================================
  const loadRooms = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userRooms = await getUserRooms(user.id);
      setRooms(userRooms as ExtendedRoom[]);

      if (userRooms.length > 0) {
        const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .select(
            `
            business_name, logo_url, primary_color, secondary_color, accent_color,
            text_color_primary, text_color_secondary, text_color_muted,
            background_primary, background_secondary, border_color,
            font_family, font_size_base, font_size_heading, font_weight_normal, font_weight_bold,
            icon_style, icon_size, room_icon
          `
          )
          .eq('id', userRooms[0].id)
          .maybeSingle();

        if (tenantError) {
          console.warn('[RoomSelector] Tenant load failed:', tenantError.message);
        }

        if (tenantData) {
          // Note: Theme loading removed - using theme store directly
        }
      }
    } catch (error) {
      console.error('[RoomSelector] Error loading rooms:', error);
      addToast('Failed to load rooms', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, addToast]);

  useEffect(() => {
    if (user) loadRooms();
  }, [user, loadRooms]);

  // ======================================================
  // 🧱 Utilities

  const handleCreateRoom = useCallback(
    (room?: ExtendedRoom) => {
      setSourceRoom(room || undefined);
      setModalMode(room ? 'clone' : 'create');
      setShowCreateModal(true);
    },
    []
  );

  const handleRoomCreated = useCallback(() => {
    setShowCreateModal(false);
    setSourceRoom(undefined);
    setModalMode('create');
    loadRooms();
  }, [loadRooms]);

  const handleEditRoom = useCallback((room: ExtendedRoom) => {
    setSourceRoom(room);
    setModalMode('edit');
    setShowCreateModal(true);
    setShowMenuRoomId(undefined);
  }, []);

  const handleDeleteRoom = useCallback(async () => {
    if (!user || !roomToDelete) return;

    try {
      await deleteRoom(roomToDelete.id, user.id);
      addToast('Room deleted successfully', 'success');
      setShowDeleteModal(false);
      setRoomToDelete(undefined);
      setShowMenuRoomId(undefined);
      loadRooms();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete room';
      addToast(message, 'error');
    }
  }, [user, roomToDelete, loadRooms, addToast]);

  // ======================================================
  // 🧭 UI: Loading State
  // ======================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a2332] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <div className="text-slate-300 text-base font-normal">Loading rooms...</div>
        </div>
      </div>
    );
  }

  // ======================================================
  // 🎨 UI: Rooms Grid
  // ======================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1419] via-[#1a2332] to-[#0f1419]">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pt-6 sm:pt-8 pb-12 sm:pb-16">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10 lg:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-white mb-2 sm:mb-3 tracking-tight">
            Trading Rooms
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">Select a room to join live trading sessions</p>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-10">
          <button
            onClick={() => setShowBranding(true)}
            className="flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-white/10 hover:bg-white/15 active:bg-white/20 backdrop-blur-xl border border-white/20 rounded-lg text-white text-sm sm:text-base font-medium transition-all duration-200 hover:shadow-lg hover:shadow-white/10 touch-manipulation"
          >
            <Icons.Palette className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Theme</span>
          </button>

          <button
            onClick={() => handleCreateRoom()}
            className="flex items-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 active:from-blue-700 active:to-blue-600 rounded-lg text-white text-sm sm:text-base font-semibold transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105 touch-manipulation"
          >
            <Icons.Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Create New Room</span>
          </button>

        </div>

        {/* User Info */}
        <div className="absolute top-4 sm:top-6 right-4 sm:right-6 flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg">
            <div className="text-right">
              <div className="text-xs text-slate-400">Logged in as</div>
              <div className="text-white text-sm font-semibold">{user?.email?.split('@')[0]}</div>
            </div>
          </div>
          <button
            onClick={signOut}
            className="p-2.5 sm:p-3 hover:bg-white/15 active:bg-white/20 backdrop-blur-xl border border-white/20 rounded-lg text-slate-300 hover:text-white transition-all duration-200 flex items-center justify-center touch-manipulation"
            title="Sign out"
          >
            <Icons.LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* No Rooms */}
        {rooms.length === 0 ? (
          <div className="max-w-md mx-auto bg-white/5 backdrop-blur-xl rounded-2xl p-12 sm:p-16 text-center border border-white/10 shadow-2xl">
            <Icons.Users className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-white mb-2">No Rooms Available</h2>
            <p className="text-slate-400 text-sm mb-6">You don’t have access to any rooms yet.</p>
            <button
              onClick={() => handleCreateRoom()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm font-semibold transition shadow-lg"
            >
              <Icons.Plus className="w-5 h-5" />
              <span>Create Your First Room</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 lg:gap-7 max-w-[1600px] mx-auto">
            {rooms.map((room) => {
              const Icon = getRoomIcon;
              const buttonWidthClass =
                {
                  sm: 'px-4 py-2 text-sm',
                  md: 'px-5 py-2 text-sm',
                  lg: 'px-6 py-2 text-sm',
                  full: 'w-full px-5 py-2 text-sm',
                }[room.button_width || 'md'] || 'px-5 py-2 text-sm';

              return (
                <div key={room.id} className="relative group h-full">
                  <div
                    className="rounded-xl p-5 sm:p-6 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-blue-500/10 hover:scale-[1.03] hover:-translate-y-1 border backdrop-blur-xl h-full flex flex-col"
                    style={{
                      backgroundColor: room.card_bg_color || '#253142',
                      borderColor: room.card_border_color || '#3d4f66',
                    }}
                  >
                    {/* Header */}
                    <div className="flex items-start gap-4 mb-4 sm:mb-5 flex-1">
                      <div className="flex-shrink-0">
                        {room.icon_url ? (
                          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 border-white/20 shadow-lg">
                            <img
                              src={room.icon_url}
                              alt={`${room.title} icon`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div
                            className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center rounded-xl shadow-lg"
                            style={{ backgroundColor: room.icon_bg_color || '#0078d4' }}
                          >
                            <Icon className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: room.icon_color || '#fff' }} />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3
                          className="text-lg sm:text-xl font-semibold mb-1 truncate"
                          style={{ color: room.title_color || '#fff' }}
                        >
                          {room.title}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                          <span className="font-medium">Live</span>
                        </div>
                        <p
                          className="text-xs sm:text-sm line-clamp-2"
                          style={{ color: room.description_color || '#94a3b8' }}
                        >
                          {room.description || 'Welcome to the trading room'}
                        </p>
                        
                        {/* Room Tags */}
                        {room.tags && room.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 sm:gap-1.5 mt-2">
                            {room.tags.slice(0, 3).map((tag, index) => (
                              <span
                                key={index}
                                className="inline-block px-1.5 sm:px-2 py-0.5 bg-slate-700 text-slate-300 text-[10px] sm:text-xs rounded-md"
                              >
                                {tag}
                              </span>
                            ))}
                            {room.tags.length > 3 && (
                              <span className="inline-block px-2 py-0.5 bg-slate-600 text-slate-400 text-xs rounded-md">
                                +{room.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Join Button */}
                    <div className="flex justify-center mt-auto pt-4 sm:pt-5">
                      <button
                        onClick={() => onSelectRoom?.(room as Room)}
                        className={`${buttonWidthClass} rounded-lg font-medium transition-all duration-200 hover:opacity-90 hover:scale-105 active:opacity-80 active:scale-95 shadow-lg touch-manipulation`}
                        style={{
                          backgroundColor: room.button_bg_color || '#0078d4',
                          color: room.button_text_color || '#fff',
                        }}
                      >
                        {room.button_text || 'Enter Room'}
                      </button>
                    </div>

                    {/* Menu */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenuRoomId(showMenuRoomId === room.id ? undefined : room.id);
                      }}
                      className="absolute top-3 sm:top-4 right-3 sm:right-4 p-2 hover:bg-white/10 active:bg-white/20 backdrop-blur-xl rounded-lg text-slate-400 hover:text-white transition-all duration-200 touch-manipulation"
                      title="Room options"
                    >
                      <Icons.MoreVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>

                    {showMenuRoomId === room.id && (
                      <div
                        className="absolute top-14 right-3 w-52 bg-slate-800/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 z-50"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleEditRoom(room)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 text-left"
                        >
                          <Icons.Edit className="w-4 h-4 text-blue-400" />
                          <span className="text-white text-sm">Edit Room</span>
                        </button>
                        <button
                          onClick={() => handleCreateRoom(room)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 text-left"
                        >
                          <Icons.Copy className="w-4 h-4 text-green-400" />
                          <span className="text-white text-sm">Clone Room</span>
                        </button>
                        <div className="border-t border-slate-700"></div>
                        <button
                          onClick={() => {
                            setRoomToDelete(room);
                            setShowDeleteModal(true);
                            setShowMenuRoomId(undefined);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-900/50 text-left"
                        >
                          <Icons.Trash2 className="w-4 h-4 text-red-400" />
                          <span className="text-red-200 text-sm">Delete Room</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateRoomModal
          sourceRoom={sourceRoom as Room | undefined}
          mode={modalMode}
          onClose={() => {
            setShowCreateModal(false);
            setSourceRoom(undefined);
            setModalMode('create');
          }}
          onCreated={handleRoomCreated}
        />
      )}

      {showDeleteModal && roomToDelete && (
        <DeleteRoomModal
          roomTitle={roomToDelete.title}
          onConfirm={handleDeleteRoom}
          onCancel={() => {
            setShowDeleteModal(false);
            setRoomToDelete(undefined);
          }}
        />
      )}

      {showBranding && <AdvancedBrandingSettings onClose={() => setShowBranding(false)} />}
    </div>
  );
}
