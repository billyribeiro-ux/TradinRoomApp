/**
 * =====================================================================
 * useThemeActions.ts
 * ---------------------------------------------------------------------
 * Central business logic for creating, updating, and applying user themes.
 * Fully aligned with Supabase schema:
 *   id, user_id, name, description, thumbnail_light, thumbnail_dark,
 *   theme_json, created_at, updated_at
 * =====================================================================
 */

/**
 * =====================================================================
 * useThemeActions.ts
 * ---------------------------------------------------------------------
 * Central business logic for creating, updating, and applying user themes.
 * Fully aligned with Supabase schema:
 *   id, user_id, name, description, thumbnail_light, thumbnail_dark,
 *   theme_json, created_at, updated_at
 * =====================================================================
 */

import { useState, useCallback, useEffect } from 'react';

import { generateThemeThumbnails } from "../components/theme/generateThemeThumbnail";
import { supabase } from '../lib/supabase';
import type { UserThemeRow } from "../repositories/themeRepository";
import { themeRepository } from "../repositories/themeRepository";
import type { Json } from "../types/database.types";
import { authService, reportError, ErrorSeverity } from '../services/authService';
import { useThemeStore } from "../store/themeStore";
import { useToastStore } from "../store/toastStore";

// Added: 2025-01-24 - Import service hooks and error reporting

import type { Room, Database , ChatMessage } from '../types/database.types';

type InsertRoom = Database['public']['Tables']['rooms']['Insert'];
// Fixed: 2025-01-24 - Eradicated 5 null usage(s) - Microsoft TypeScript standards
// Replaced null with undefined, removed unnecessary null checks, used optional types



export function useThemeActions() {
  const themeStore = useThemeStore();
  const addToast = useToastStore((s) => s.addToast);

  // ===============================================================
  // ✅ APPLY THEME (permanent)
  // ===============================================================
  const applyTheme = (themeJson: Record<string, unknown>) => {
    try {
      themeStore.importTheme(themeJson);
      addToast("🎨 Theme applied successfully!", "success");
    } catch (error) {
      console.error("[useThemeActions] applyTheme failed:", error);
      addToast("Failed to apply theme.", "error");
    }
  };

  // ===============================================================
  // ✅ PREVIEW THEME (temporary)
  // ===============================================================
  const previewTheme = (themeJson: Record<string, unknown>, durationMs: number = 3500) => {
    try {
      themeStore.importTheme(themeJson);
      if (durationMs < 999999) {
        setTimeout(() => themeStore.restoreLastTheme(), durationMs);
      }
    } catch (error) {
      console.error("[useThemeActions] previewTheme failed:", error);
      addToast("Failed to preview theme.", "error");
    }
  };

  // ===============================================================
  // ✅ END PREVIEW (manual revert)
  // ===============================================================
  const endPreview = () => {
    try {
      themeStore.restoreLastTheme();
      addToast("Preview reverted.", "info");
    } catch (error) {
      console.error("[useThemeActions] endPreview failed:", error);
    }
  };

  // ===============================================================
  // ✅ LOAD USER THEMES
  // ===============================================================
  const loadMyThemes = async (userId: string): Promise<UserThemeRow[]> => {
    try {
      const data = await themeRepository.getThemesByUser(userId);
      return data || [];
    } catch (error) {
      console.error("[useThemeActions] loadMyThemes failed:", error);
      addToast("Failed to load themes.", "error");
      return [];
    }
  };

  // ===============================================================
  // ✅ SAVE CURRENT THEME
  // ===============================================================
  const saveCurrentTheme = async (
    userId: string,
    name: string,
    description?: string
  ) => {
    try {
      const themeJsonObject = themeStore.buildThemeJson(themeStore.currentTheme!) as Record<string, unknown>;
      const { light, dark } = await generateThemeThumbnails(themeJsonObject);

      await themeRepository.createTheme({
        userId,
        name,
        description,
        themeJson: themeJsonObject as Json,
        thumbnailLight: light,
        thumbnailDark: dark,
      });

      addToast(`🎨 Theme "${name}" saved successfully!`, "success");
    } catch (error) {
      console.error("[useThemeActions] saveCurrentTheme failed:", error);
      addToast("Failed to save theme.", "error");
    }
  };

  // ===============================================================
  // ✅ UPDATE EXISTING THEME
  // ===============================================================
  const updateSavedTheme = async (
    themeId: string,
    _userId: string,
    name?: string,
    description?: string
  ) => {
    try {
      const themeJsonObject = themeStore.buildThemeJson(themeStore.currentTheme!) as Record<string, unknown>;
      const { light, dark } = await generateThemeThumbnails(themeJsonObject);

      await themeRepository.updateTheme(themeId, {
        name,
        description,
        theme_json: themeJsonObject as Json,
        thumbnail_light: light,
        thumbnail_dark: dark,
      });

      addToast("✅ Theme updated successfully!", "success");
    } catch (error) {
      console.error("[useThemeActions] updateSavedTheme failed:", error);
      addToast("Failed to update theme.", "error");
    }
  };

  // ===============================================================
  // ✅ DELETE THEME
  // ===============================================================
  const deleteTheme = async (themeId: string, userId: string) => {
    try {
      await themeRepository.deleteTheme(themeId, userId);
      addToast("🗑️ Theme deleted successfully!", "success");
    } catch (error) {
      console.error("[useThemeActions] deleteTheme failed:", error);
      addToast("Failed to delete theme.", "error");
    }
  };

  // ===============================================================
  // ✅ PUBLIC API
  // ===============================================================
  return {
    applyTheme,
    previewTheme,
    endPreview,
    loadMyThemes,
    saveCurrentTheme,
    updateSavedTheme,
    deleteTheme,
  };
}

// Added: 2025-01-24 - Service layer wrapper functions for better error handling

/**
 * Added: 2025-01-24
 * Hook for room service operations with consistent error handling
 */
export function useRoomService() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>();

  // Added: 2025-01-24 - Wrapped createRoom with loading/error states
  const createRoom = useCallback(async (roomData: InsertRoom): Promise<Room | undefined> => {
    try {
      setLoading(true);
      setError(undefined);

      const { data, error: serviceError } = await supabase.from('rooms').insert(roomData).select().single();

      if (serviceError) throw serviceError;
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create room');
      setError(error);
      reportError(error, ErrorSeverity.HIGH, {
        component: 'useRoomService',
        action: 'createRoom',
      });
      return undefined;
    } finally {
      setLoading(false);
    }
  }, []);

  // Added: 2025-01-24 - Get rooms by tenant
  const getRoomsByTenant = useCallback(async (tenantId: string): Promise<Room[]> => {
    try {
      setLoading(true);
      setError(undefined);

      const { data, error: serviceError } = await supabase.from('rooms').select('*').eq('tenant_id', tenantId);

      if (serviceError) throw serviceError;
      return data || [];
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get rooms');
      setError(error);
      reportError(error, ErrorSeverity.MEDIUM, {
        component: 'useRoomService',
        action: 'getRoomsByTenant',
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Added: 2025-01-24 - Update room
  const updateRoom = useCallback(async (roomId: string, updates: Partial<InsertRoom>): Promise<Room | undefined> => {
    try {
      setLoading(true);
      setError(undefined);

      const { data, error: serviceError } = await supabase.from('rooms').update(updates).eq('id', roomId).select().single();

      if (serviceError) throw serviceError;
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update room');
      setError(error);
      reportError(error, ErrorSeverity.MEDIUM, {
        component: 'useRoomService',
        action: 'updateRoom',
      });
      return undefined;
    } finally {
      setLoading(false);
    }
  }, []);

  // Added: 2025-01-24 - Delete room
  const deleteRoom = useCallback(async (roomId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(undefined);

      const { error: serviceError } = await supabase.from('rooms').delete().eq('id', roomId);

      if (serviceError) throw serviceError;
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete room');
      setError(error);
      reportError(error, ErrorSeverity.HIGH, {
        component: 'useRoomService',
        action: 'deleteRoom',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, createRoom, getRoomsByTenant, updateRoom, deleteRoom };
}

/**
 * Added: 2025-01-24
 * Hook for auth service operations with consistent error handling
 */
export function useAuthService() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>();

  // Added: 2025-01-24 - Sign in wrapper
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(undefined);

      const result = await authService.signIn({ email, password });
      
      if (result.error) throw result.error;
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Sign in failed');
      setError(error);
      reportError(error, ErrorSeverity.HIGH, {
        component: 'useAuthService',
        action: 'signIn',
      });
      return { user: null, session: null, error };
    } finally {
      setLoading(false);
    }
  }, []);

  // Added: 2025-01-24 - Sign up wrapper
  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    try {
      setLoading(true);
      setError(undefined);

      const result = await authService.signUp({ email, password, displayName });
      
      if (result.error) throw result.error;
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Sign up failed');
      setError(error);
      reportError(error, ErrorSeverity.HIGH, {
        component: 'useAuthService',
        action: 'signUp',
      });
      return { user: null, session: null, error };
    } finally {
      setLoading(false);
    }
  }, []);

  // Added: 2025-01-24 - Get user profile wrapper
  const getUserProfile = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(undefined);

      const result = await authService.getUserProfile(userId);
      
      if (result.error) throw result.error;
      return result.profile;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get profile');
      setError(error);
      reportError(error, ErrorSeverity.MEDIUM, {
        component: 'useAuthService',
        action: 'getUserProfile',
      });
      return undefined;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, signIn, signUp, getUserProfile };
}

/**
 * Added: 2025-01-24
 * Consolidated real-time subscription hook for messages
 */
export function useRealtimeMessages(roomId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // Added: 2025-01-24 - Single subscription for all components
  useEffect(() => {
    if (!roomId) return;
    
    const channel = supabase
      .channel(`room-${roomId}-messages`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_id=eq.${roomId}`
      }, (payload: any) => {
        console.log('[useRealtimeMessages] Event received:', payload.eventType);
        
        if (payload.eventType === 'INSERT') {
          setMessages((current) => [...current, payload.new as ChatMessage]);
        } else if (payload.eventType === 'DELETE') {
          setMessages((current) => 
            current.filter((msg) => msg.id !== payload.old.id)
          );
        } else if (payload.eventType === 'UPDATE') {
          setMessages((current) =>
            current.map((msg) => 
              msg.id === payload.new.id ? (payload.new as ChatMessage) : msg
            )
          );
        }
      })
      .subscribe();
    
    return () => {
      console.log('[useRealtimeMessages] Unsubscribing');
      channel.unsubscribe();
    };
  }, [roomId]);
  
  return messages;
}
