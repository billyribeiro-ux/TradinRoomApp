import { Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { useState, useRef } from 'react';

import { UPLOAD_CONFIG, LIMITS, STORAGE_BUCKETS } from '../../config/constants';
import { supabase } from '../../lib/supabase';
import { useRoomStore } from '../../store/roomStore';
import { useThemeStore } from '../../store/themeStore';
import { useToastStore } from '../../store/toastStore';
import { validateImageFile } from '../../utils/fileValidation';
import { uploadPublicAsset } from '../../services/storageService';
import { createRateLimiter } from '../../utils/rateLimit';

/**
 * BrandingSettings Component
 * -------------------------
 * Allows users to customize business name and logo.
 * - Business name input
 * - Logo upload via Supabase storage
 * - Live preview of logo
 */
export function BrandingSettings() {
  const { businessName, logoUrl, setBusinessName, setLogoUrl } = useThemeStore();
  const { currentRoom } = useRoomStore();
  const { addToast } = useToastStore();
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Concurrency control and rate limiting
  const uploadReqId = useRef<number>(0);
  const rateLimiter = useRef(createRateLimiter(5000, 3));

  /**
   * Handle logo file upload to Supabase storage
   */
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Idempotency guard
    if (uploadingLogo) return;

    if (!currentRoom) {
      addToast('Please join a room to upload a logo', 'error');
      return;
    }

    // Rate limiting
    if (!rateLimiter.current.attempt()) {
      addToast('Please slow down. Too many upload attempts.', 'warning');
      return;
    }

    // Validate file using shared utility
    const validation = validateImageFile(file, UPLOAD_CONFIG.ALLOWED_TYPES, LIMITS.maxAvatarSize);
    if (!validation.ok) {
      addToast((validation as any).reason || 'Invalid file', 'error');
      return;
    }

    // Concurrency control: latest-wins
    const reqId = ++uploadReqId.current;
    const previousLogoUrl = logoUrl;

    setUploadingLogo(true);
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentRoom.id}/logo-${Date.now()}.${fileExt || 'png'}`;

      // Upload using shared service (typed result)
      const result = await uploadPublicAsset({
        supabase,
        bucket: STORAGE_BUCKETS.branding,
        path: fileName,
        file,
        upsert: false,
      });

      // Check if this is still the latest request
      if (reqId !== uploadReqId.current) {
        console.debug('[BrandingSettings] Upload superseded by newer request');
        return;
      }

      if (!result.ok) {
        addToast((result as any).error || 'Upload failed', 'error');
        return;
      }

      // Update theme store with new logo URL
      setLogoUrl(result.url);

      if (import.meta.env.DEV) {
        console.debug('[BrandingSettings] Logo uploaded successfully:', result.url);
      }

      addToast('Logo uploaded successfully', 'success');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Logo upload failed';
      console.error('[BrandingSettings] Logo upload error:', err);
      addToast(errorMessage, 'error');
      
      // Rollback on error
      setLogoUrl(previousLogoUrl);
    } finally {
      // Only clear loading if this is still the latest request
      if (reqId === uploadReqId.current) {
        setUploadingLogo(false);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const handleBusinessNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBusinessName(e.target.value);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-5 space-y-6">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        <ImageIcon className="w-5 h-5 text-blue-400" />
        Brand Identity
      </h3>

      {/* Business Name Input */}
      <div>
        <label className="block text-sm text-slate-400 mb-2">
          Business Name
        </label>
        <input
          type="text"
          value={businessName}
          onChange={handleBusinessNameChange}
          placeholder="Enter your business name"
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Logo Upload */}
      <div>
        <label className="block text-sm text-slate-400 mb-2">
          Logo
        </label>
        
        {/* Logo Preview */}
        {logoUrl && (
          <div className="mb-3">
            <img
              src={logoUrl}
              alt="Logo preview"
              className="h-20 w-auto rounded-lg border border-slate-700 object-contain bg-slate-800 p-2"
            />
          </div>
        )}

        {/* Upload Button */}
        <label
          htmlFor="logo-upload"
          className={`inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium cursor-pointer transition-colors ${
            uploadingLogo ? 'opacity-50 cursor-not-allowed' : ''
          } ${!currentRoom ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {uploadingLogo ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              {logoUrl ? 'Replace Logo' : 'Upload Logo'}
            </>
          )}
          <input
            id="logo-upload"
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleLogoUpload}
            disabled={uploadingLogo || !currentRoom}
            className="hidden"
          />
        </label>
        
        {!currentRoom && (
          <p className="mt-2 text-xs text-slate-500">
            Please join a room to upload a logo
          </p>
        )}
        
        <p className="mt-2 text-xs text-slate-500">
          Max file size: 2MB. Supported formats: JPEG, PNG, GIF, WebP
        </p>
      </div>
    </div>
  );
}
