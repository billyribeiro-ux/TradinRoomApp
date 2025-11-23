import { Upload, Check, User } from 'lucide-react';
import { useState, useRef } from 'react';

import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
// Fixed: 2025-10-24 - React component type fixes
// Microsoft TypeScript standards - proper ref and element types


// Fixed: 2025-10-24 - Emergency null/undefined fixes for production
// Microsoft TypeScript standards applied - null → undefined, using optional types


// Fixed: 2025-01-24 - Eradicated 3 null usage(s) - Microsoft TypeScript standards
// Replaced null with undefined, removed unnecessary null checks, used optional types


interface AvatarSelectorProps {
  currentAvatarUrl: string | undefined;
  onAvatarChange: (avatarUrl: string) => void;
}

const PRESET_AVATARS = [
  '/avatars/avatar-1.svg',
  '/avatars/avatar-2.svg',
  '/avatars/avatar-3.svg',
  '/avatars/avatar-4.svg',
  '/avatars/avatar-5.svg',
  '/avatars/avatar-6.svg',
  '/avatars/avatar-7.svg',
  '/avatars/avatar-8.svg',
];

export function AvatarSelector({ currentAvatarUrl, onAvatarChange }: AvatarSelectorProps) {
  const user = useAuthStore(state => state.user);
  const { addToast } = useToastStore();
  const [selectedPreset, setSelectedPreset] = useState<string | undefined>();
  const [uploading, setUploading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePresetSelect = (avatarUrl: string) => {
    setSelectedPreset(avatarUrl);
    setUploadPreview(undefined);
    onAvatarChange(avatarUrl);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      addToast('Please select a valid image file (JPEG, PNG, GIF, or WebP)', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addToast('Image must be less than 5MB', 'error');
      return;
    }

    setUploading(true);

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setSelectedPreset(undefined);
      onAvatarChange(publicUrl);
      addToast('Avatar uploaded successfully', 'success');
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      addToast('Failed to upload avatar. Please try again.', 'error');
      setUploadPreview(undefined);
    } finally {
      setUploading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const isPresetSelected = (avatarUrl: string) => {
    return currentAvatarUrl === avatarUrl || selectedPreset === avatarUrl;
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Upload Custom Avatar</h3>
        <div className="flex items-center gap-4">
          <input
            ref={fileInputRef as React.RefObject<HTMLInputElement>}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={handleUploadClick}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span className="text-sm font-medium">
              {uploading ? 'Uploading...' : 'Upload Image'}
            </span>
          </button>
          {uploadPreview && (
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-blue-500">
              <img
                src={uploadPreview}
                alt="Upload preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Maximum file size: 5MB. Supported formats: JPEG, PNG, GIF, WebP
        </p>
      </div>

      <div className="border-t border-slate-600 pt-4">
        <h3 className="text-sm font-semibold text-white mb-3">Choose Preset Avatar</h3>
        <div className="grid grid-cols-4 gap-3">
          {PRESET_AVATARS.map((avatarUrl, index) => (
            <button
              key={index}
              onClick={() => handlePresetSelect(avatarUrl)}
              className={`relative w-full aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                isPresetSelected(avatarUrl)
                  ? 'border-blue-500 ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-800'
                  : 'border-slate-600 hover:border-slate-500'
              }`}
            >
              <img
                src={avatarUrl}
                alt={`Preset avatar ${Number(index) + 1}`}
                className="w-full h-full object-cover"
              />
              {isPresetSelected(avatarUrl) && (
                <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-600 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Use Gravatar</h3>
            <p className="text-xs text-slate-400 mt-1">
              Automatically synced from gravatar.com
            </p>
          </div>
          <User className="w-8 h-8 text-slate-400" />
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Your Gravatar is based on your email address. To change it, visit{' '}
          <a
            href="https://gravatar.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            gravatar.com
          </a>
        </p>
      </div>
    </div>
  );
}
