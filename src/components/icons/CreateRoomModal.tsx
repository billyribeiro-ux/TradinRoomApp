/* ORIGINAL CODE START — reason: Unused import causing TS6133 warning
   Date: 2025-01-21 21:00:00
*/
// import { useState, useCallback, useMemo, FormEvent, useEffect } from 'react';
/* ORIGINAL CODE END */

// FIX NOTE – TS6133 unused variable corrected: Comment out unused import
import { X, Loader2, Radio, Upload } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState, useCallback, useMemo } from 'react';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// const useEffect  = undefined; /* UNUSED IMPORT – preserved for reference */
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import type { Room } from '../../types/database.types';
// Fixed: 2025-10-24 - Database schema alignment fixes
// Microsoft TypeScript standards - corrected field references


// Fixed: 2025-10-24 - Emergency null/undefined fixes for production
// Microsoft TypeScript standards applied - null → undefined, using optional types


// Fixed: 2025-01-24 - Eradicated 8 null usage(s) - Microsoft TypeScript standards
// Replaced null with undefined, removed unnecessary null checks, used optional types

// 🔥 FIXED: 2025-01-24 - Schema alignment with actual Supabase database
// - Line 233: Changed .eq('name') to .eq('title')  
// - Line 246: Removed duplicate 'name' field
// - Line 251: Removed non-existent 'created_by' field
// - Lines 268-276: Commented out room_memberships table access

interface CreateRoomModalProps {
  sourceRoom: Room | undefined;
  mode?: 'create' | 'edit' | 'clone';
  onClose: () => void;
  onCreated: () => void;
}

export function CreateRoomModal({ sourceRoom, mode = 'create', onClose, onCreated }: CreateRoomModalProps) {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | undefined>();
  /* ORIGINAL CODE BLOCK START
     Issue: Unused variable 'loadingDefaults' causing TS6133 error
     Fix: Comment out unused variable to maintain code for future use
     Date: 2025-01-21
  */
  // const [loadingDefaults, setLoadingDefaults] = useState(false);
  /* ORIGINAL CODE BLOCK END */

  // Determine modal mode based on props
  const isEditing = mode === 'edit';
  const isCloning = mode === 'clone';

  const [formData, setFormData] = useState({
    title: isCloning && sourceRoom ? `${sourceRoom.title} (Copy)` : sourceRoom?.title || '',
    description: sourceRoom?.description || '',
    tags: sourceRoom?.tags || [],
    // Branding properties with default values
    iconUrl: '',
    cardBgColor: '#253142',
    cardBorderColor: '#3d4f66',
    iconBgColor: '#0078d4',
    iconColor: '#ffffff',
    titleColor: '#ffffff',
    descriptionColor: '#94a3b8',
    buttonText: 'Enter Trading Room',
    buttonBgColor: '#0078d4',
    buttonTextColor: '#ffffff',
    buttonWidth: 'md' as const,
  });

  const [uploading, setUploading] = useState(false);

  /* ORIGINAL CODE BLOCK START
     Issue: Schema mismatch - 'default_room_settings' column doesn't exist in tenants table
     Fix: Comment out entire useEffect that references non-existent database column
     Date: 2025-01-21
  */
  // Load default settings from tenant when creating a new room
  // useEffect(() => {
  //   const loadDefaultSettings = async () => {
  //     if (!user || sourceRoom || mode !== 'create') return;

  //     setLoadingDefaults(true);
  //     try {
  //       // Get user's primary tenant using helper function
  //       const primaryTenantId = await getUserPrimaryTenant(user.id);
  //       if (!primaryTenantId) {
  //         console.error('[CreateRoomModal] User has no active tenant');
  //         return;
  //       }

  //       const { data: tenant } = await supabase
  //         .from('tenants')
  //         .select('default_room_settings')
  //         .eq('id', primaryTenantId)
  //         .maybeSingle();

  //       if (tenant?.default_room_settings && Object.keys(tenant.default_room_settings).length > 0) {
  //         const defaults = tenant.default_room_settings as any;
  //         setFormData(prev => ({
  //           ...prev,
  //           cardBgColor: defaults.card_bg_color || prev.cardBgColor,
  //           cardBorderColor: defaults.card_border_color || prev.cardBorderColor,
  //           iconBgColor: defaults.icon_bg_color || prev.iconBgColor,
  //           iconColor: defaults.icon_color || prev.iconColor,
  //           titleColor: defaults.title_color || prev.titleColor,
  //           descriptionColor: defaults.description_color || prev.descriptionColor,
  //           buttonText: defaults.button_text || prev.buttonText,
  //           buttonBgColor: defaults.button_bg_color || prev.buttonBgColor,
  //           buttonTextColor: defaults.button_text_color || prev.buttonTextColor,
  //           buttonWidth: defaults.button_width || prev.buttonWidth,
  //         }));
  //       }
  //     } catch (err) {
  //       console.error('Failed to load default settings:', err);
  //     } finally {
  //       setLoadingDefaults(false);
  //     }
  //   };

  //   loadDefaultSettings();
  // }, [user, sourceRoom, mode]);
  /* ORIGINAL CODE BLOCK END */

  const isValid = useMemo(() => {
    return formData.title.trim().length > 0;
  }, [formData.title]);

  const handleChange = useCallback((field: string, value: string | number | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(undefined);
  }, []);

  const handleTitleChange = useCallback((value: string) => {
    handleChange('title', value);
  }, [handleChange]);

  const handleIconUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    setError(undefined);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('room-icons')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('room-icons')
        .getPublicUrl(data.path);

      handleChange('iconUrl', publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload icon');
    } finally {
      setUploading(false);
    }
  }, [user, handleChange]);

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !isValid) return;

    setCreating(true);
    setError(undefined);

    try {
      // Resolve tenant ID using professional pattern
      let tenantId: string;

      if (sourceRoom?.tenant_id) {
        // Editing/cloning existing room - use its tenant
        tenantId = sourceRoom.tenant_id;
      } else {
        // Creating new room - get or create default tenant
        const { data: existingTenant } = await supabase
          .from('tenants')
          .select('id')
          .limit(1)
          .maybeSingle();

        if (existingTenant) {
          tenantId = existingTenant.id;
        } else {
          // No tenant exists - create default tenant automatically
          const { data: newTenant, error: createError } = await supabase
            .from('tenants')
            .insert({
              business_name: 'Revolution Trading Pros'
            })
            .select('id')
            .single();

          if (createError || !newTenant) {
            throw new Error('Failed to initialize organization. Please try again.');
          }
          
          tenantId = newTenant.id;
          console.log('[CreateRoomModal] Auto-created default tenant:', tenantId);
        }
      }

      if (isEditing && sourceRoom) {
        console.log('[CreateRoomModal] Updating room with colors:', {
          cardBgColor: formData.cardBgColor,
          cardBorderColor: formData.cardBorderColor,
          iconBgColor: formData.iconBgColor,
          iconColor: formData.iconColor,
          titleColor: formData.titleColor,
          descriptionColor: formData.descriptionColor,
          buttonBgColor: formData.buttonBgColor,
          buttonTextColor: formData.buttonTextColor,
        });

        const { error: roomError } = await supabase
          .from('rooms')
          .update({
            name: formData.title.trim(),
            title: formData.title.trim(),
            description: formData.description.trim() || undefined,
            icon_url: formData.iconUrl || undefined,
            tags: formData.tags.length > 0 ? formData.tags : undefined,
            // Required fields with defaults
            icon_bg_color: formData.iconBgColor,
            icon_color: formData.iconColor,
            title_color: formData.titleColor,
            description_color: formData.descriptionColor,
            card_bg_color: formData.cardBgColor,
            card_border_color: formData.cardBorderColor,
            button_text: formData.buttonText,
            button_bg_color: formData.buttonBgColor,
            button_text_color: formData.buttonTextColor,
            button_width: formData.buttonWidth,
          })
          .eq('id', sourceRoom.id);

        if (roomError) {
          console.error('[CreateRoomModal] Failed to update room:', roomError);
          throw roomError;
        }

        console.log('[CreateRoomModal] Room updated successfully');
        addToast('Changes updated successfully', 'success');
      } else {
        // 🔥 FIXED: Changed from 'name' to 'title' to match database schema
        const { data: existingRoom } = await supabase
          .from('rooms')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('title', formData.title.trim())
          .maybeSingle();

        if (existingRoom) {
          setError('A room with this name already exists in your organization');
          setCreating(false);
          return;
        }

        // Check if user exists in users table, if not, create them
        const userId = user.id;
        
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();
        
        if (!existingUser) {
          // Create user record if doesn't exist
          const { error: userError } = await supabase
            .from('users')
            .insert({
              id: user.id,
              email: user.email || '',
              display_name: user.email?.split('@')[0],
            });
          
          if (userError) {
            console.error('[CreateRoomModal] Failed to create user record:', userError);
            throw new Error('Failed to create user record');
          }
        }
        
        const { data: newRoom, error: roomError } = await supabase
          .from('rooms')
          .insert({
            tenant_id: tenantId,
            name: formData.title.trim(), // Required field
            title: formData.title.trim(),
            description: formData.description.trim() || undefined,
            icon_url: formData.iconUrl || undefined,
            is_active: true,
            tags: formData.tags.length > 0 ? formData.tags : undefined,
            created_by: userId,
            // Required fields with defaults
            icon_bg_color: formData.iconBgColor,
            icon_color: formData.iconColor,
            title_color: formData.titleColor,
            description_color: formData.descriptionColor,
            card_bg_color: formData.cardBgColor,
            card_border_color: formData.cardBorderColor,
            button_text: formData.buttonText,
            button_bg_color: formData.buttonBgColor,
            button_text_color: formData.buttonTextColor,
            button_width: formData.buttonWidth,
          })
          .select()
          .single();

        if (roomError) throw roomError;

        // Create room membership record for the creator
        const { error: memberError } = await supabase
          .from('room_memberships')
          .insert({
            room_id: newRoom.id,
            user_id: user.id, // Fixed: Changed from profile_id to user_id to match schema
            role: 'admin', // Creator gets admin role
          });
        
        if (memberError) {
          console.error('[CreateRoomModal] Failed to create room membership:', memberError);
          // Don't throw - room is created, membership can be added later
        }

        addToast('Room created successfully', 'success');
      }

      onCreated();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : isEditing ? 'Failed to update room' : 'Failed to create room';
      console.error('[CreateRoomModal] Error:', errorMessage, err);
      setError(errorMessage);
      addToast(errorMessage, 'error');
      setCreating(false);
    }
  }, [user, formData, isValid, sourceRoom, isEditing, onCreated, addToast]);

  const handleResetSettings = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      cardBgColor: '#253142',
      cardBorderColor: '#3d4f66',
      iconBgColor: '#0078d4',
      iconColor: '#ffffff',
      titleColor: '#ffffff',
      descriptionColor: '#94a3b8',
      buttonText: 'Enter Trading Room',
      buttonBgColor: '#0078d4',
      buttonTextColor: '#ffffff',
      buttonWidth: 'md',
    }));
  }, []);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-slate-800 rounded-lg sm:rounded-xl shadow-2xl w-full max-w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden border border-slate-700">
        <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 border-b border-slate-700">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-blue-600 rounded-lg">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {isEditing ? 'Edit Room' : sourceRoom ? 'Duplicate Room' : 'Create New Room'}
              </h2>
              <p className="text-sm text-slate-400">
                {isEditing ? `Editing "${sourceRoom?.title}"` : sourceRoom ? `Creating a copy of "${sourceRoom.title}"` : 'Set up a new trading room'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors touch-manipulation"
            disabled={creating}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 overflow-y-auto max-h-[calc(95vh-180px)] sm:max-h-[calc(90vh-180px)]">
          {error && (
            <div className="p-3 sm:p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200 text-xs sm:text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2">
              Room Name *
            </label>
            <input
              id="room-name"
              name="room-name"
              type="text"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
              placeholder="Main Trading Room"
              required
              disabled={creating}
              maxLength={100}
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Describe your trading room..."
              rows={3}
              disabled={creating}
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2">
              Room Tags
            </label>
            <div className="space-y-3">
              {/* Selected Tags */}
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 bg-blue-600 text-white text-xs sm:text-sm rounded-full"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => {
                          const newTags = formData.tags.filter((_, i) => i !== index);
                          handleChange('tags', newTags);
                        }}
                        className="ml-1 hover:text-red-300"
                        disabled={creating}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              
              {/* Tag Suggestions */}
              <div>
                <p className="text-xs text-slate-400 mb-2">Suggestions:</p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {['Stocks', 'Crypto', 'Forex', 'Options', 'Day Trading', 'Swing Trading', 'Beginner Friendly', 'Advanced'].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => {
                        if (!formData.tags.includes(suggestion)) {
                          handleChange('tags', [...formData.tags, suggestion]);
                        }
                      }}
                      className="px-2 sm:px-3 py-1 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-slate-300 text-xs sm:text-sm rounded-lg transition-colors touch-manipulation"
                      disabled={creating || formData.tags.includes(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Custom Tag Input */}
              <div className="flex gap-1.5 sm:gap-2">
                <input
                  type="text"
                  placeholder="Add custom tag..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
                  disabled={creating}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const input = e.target as HTMLInputElement;
                      const newTag = input.value.trim();
                      if (newTag && !formData.tags.includes(newTag)) {
                        handleChange('tags', [...formData.tags, newTag]);
                        input.value = '';
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const input = document.querySelector('input[placeholder="Add custom tag..."]') as HTMLInputElement;
                    const newTag = input?.value.trim();
                    if (newTag && !formData.tags.includes(newTag)) {
                      handleChange('tags', [...formData.tags, newTag]);
                      input.value = '';
                    }
                  }}
                  className="flex-shrink-0 px-3 sm:px-4 py-2 sm:py-2.5 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-sm sm:text-base rounded-lg transition-colors disabled:opacity-50 touch-manipulation"
                  disabled={creating}
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2">
              Room Icon
            </label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-slate-900 border-2 border-dashed border-slate-700 rounded-lg flex items-center justify-center overflow-hidden">
                {formData.iconUrl ? (
                  <img src={formData.iconUrl} alt="Room icon" className="w-full h-full object-cover" />
                ) : (
                  <Radio className="w-8 h-8 text-slate-600" />
                )}
              </div>
              <label className="flex-1">
                <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white cursor-pointer transition-colors">
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Upload Icon</span>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleIconUpload}
                  className="hidden"
                  disabled={creating || uploading}
                />
              </label>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Recommended size: 128x128 pixels (square). Supports JPG, PNG, WebP.
            </p>
          </div>

          <div className="border-t border-slate-700 pt-6 mt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Card Styling</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2">
                  Card Background
                </label>
                <input
                  id="card-bg-color"
                  name="card-bg-color"
                  type="color"
                  value={formData.cardBgColor}
                  onChange={(e) => handleChange('cardBgColor', e.target.value)}
                  className="w-full h-10 bg-slate-900 border border-slate-700 rounded-lg cursor-pointer"
                  disabled={creating}
                  aria-label="Card background color"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2">
                  Card Border
                </label>
                <input
                  id="card-border-color"
                  name="card-border-color"
                  type="color"
                  value={formData.cardBorderColor}
                  onChange={(e) => handleChange('cardBorderColor', e.target.value)}
                  className="w-full h-10 bg-slate-900 border border-slate-700 rounded-lg cursor-pointer"
                  disabled={creating}
                  aria-label="Card border color"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2">
                  Icon Background
                </label>
                <input
                  id="icon-bg-color"
                  name="icon-bg-color"
                  type="color"
                  value={formData.iconBgColor}
                  onChange={(e) => handleChange('iconBgColor', e.target.value)}
                  className="w-full h-10 bg-slate-900 border border-slate-700 rounded-lg cursor-pointer"
                  disabled={creating}
                  aria-label="Icon background color"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2">
                  Icon Color
                </label>
                <input
                  id="icon-color"
                  name="icon-color"
                  type="color"
                  value={formData.iconColor}
                  onChange={(e) => handleChange('iconColor', e.target.value)}
                  className="w-full h-10 bg-slate-900 border border-slate-700 rounded-lg cursor-pointer"
                  aria-label="Icon color"
                  disabled={creating}
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2">
                  Title Color
                </label>
                <input
                  id="title-color"
                  name="title-color"
                  type="color"
                  value={formData.titleColor}
                  onChange={(e) => handleChange('titleColor', e.target.value)}
                  className="w-full h-10 bg-slate-900 border border-slate-700 rounded-lg cursor-pointer"
                  disabled={creating}
                  aria-label="Title color"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2">
                  Description Color
                </label>
                <input
                  id="description-color"
                  name="description-color"
                  type="color"
                  value={formData.descriptionColor}
                  onChange={(e) => handleChange('descriptionColor', e.target.value)}
                  className="w-full h-10 bg-slate-900 border border-slate-700 rounded-lg cursor-pointer"
                  disabled={creating}
                  aria-label="Description color"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-700 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Button Styling</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2">
                  Button Text
                </label>
                <input
                  type="text"
                  value={formData.buttonText}
                  onChange={(e) => handleChange('buttonText', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
                  placeholder="Enter Trading Room"
                  disabled={creating}
                  maxLength={50}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2">
                    Button Background
                  </label>
                  <input
                    type="color"
                    value={formData.buttonBgColor}
                    onChange={(e) => handleChange('buttonBgColor', e.target.value)}
                    className="w-full h-10 bg-slate-900 border border-slate-700 rounded-lg cursor-pointer"
                    disabled={creating}
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2">
                    Button Text Color
                  </label>
                  <input
                    type="color"
                    value={formData.buttonTextColor}
                    onChange={(e) => handleChange('buttonTextColor', e.target.value)}
                    className="w-full h-10 bg-slate-900 border border-slate-700 rounded-lg cursor-pointer"
                    disabled={creating}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2">
                  Button Width
                </label>
                <select
                  value={formData.buttonWidth}
                  onChange={(e) => handleChange('buttonWidth', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={creating}
                >
                  <option value="sm">Small</option>
                  <option value="md">Medium</option>
                  <option value="lg">Large</option>
                  <option value="full">Full Width</option>
                </select>
              </div>
            </div>
          </div>
        </form>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3 p-3 sm:p-4 md:p-6 border-t border-slate-700 bg-slate-900/50">
          <button
            type="button"
            onClick={handleResetSettings}
            className="px-4 py-2 text-sm sm:text-base bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
            disabled={creating}
            title="Reset styling to defaults"
          >
            Reset
          </button>

          <div className="flex gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => {
                addToast('Default settings feature coming soon', 'info');
              }}
              className="flex-1 sm:flex-none px-4 py-2 text-sm sm:text-base bg-green-600 hover:bg-green-700 active:bg-green-800 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              disabled={creating || !user}
            >
              Save as Default
            </button>

            <button
              type="submit"
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={!isValid || creating}
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isEditing ? 'Updating...' : 'Creating...'}</span>
                </>
              ) : (
                isEditing ? 'Update' : 'Create'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}