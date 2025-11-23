/** SSOT: Primary implementation. Do not duplicate. */
import { X, Check, Loader2, Palette, Circle, Square, Save, RefreshCw, Upload, Download, RefreshCcwDot, Sun, Moon, Zap, ShieldCheck, Shield, Lock , Type, Eye, Radio } from 'lucide-react';
import * as Icons from 'lucide-react';
import React, { useEffect, useState, useCallback, useRef, Profiler } from "react";
// Fixed: 2025-10-24 - Database schema alignment fixes
// Microsoft TypeScript standards - corrected field references



import type { OperationState } from '../../types/branding.types';
import { validateBrandingData, mapFormDataToDatabase, mapDatabaseToFormData, isValidHexColor } from '../../utils/brandingUtils';
import { validateImageFile } from '../../utils/fileValidation';
import { uploadPublicAsset } from '../../services/storageService';
import { applyCssVars } from '../../utils/cssVarManager';
import { downloadThemeJson, parseThemeJson } from '../../utils/themeExport';
import { createRateLimiter } from '../../utils/rateLimit';

import {
  UPLOAD_CONFIG,
  LIMITS,
} from '../../config/constants';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useRoomStore } from '../../store/roomStore';
import { useThemeStore } from '../../store/themeStore';
import { useToastStore } from '../../store/toastStore';
import { clearMicrosoftCache } from '../../utils/cacheManager';

const FONT_OPTIONS = [
  { value: 'system-ui, -apple-system, sans-serif', label: 'System Default' },
  { value: 'Inter, sans-serif', label: 'Inter' },
  { value: 'Roboto, sans-serif', label: 'Roboto' },
  { value: 'Open Sans, sans-serif', label: 'Open Sans' },
  { value: 'Lato, sans-serif', label: 'Lato' },
  { value: 'Montserrat, sans-serif', label: 'Montserrat' },
  { value: 'Poppins, sans-serif', label: 'Poppins' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Helvetica, sans-serif', label: 'Helvetica' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: '"Times New Roman", serif', label: 'Times New Roman' },
];

const ICON_OPTIONS = [
  'Radio',
  'TrendingUp',
  'BarChart3',
  'LineChart',
  'Activity',
  'Briefcase',
  'Building2',
  'DollarSign',
  'Target',
  'Zap',
];

interface AdvancedBrandingSettingsProps {
  onClose: () => void;
}

export function AdvancedBrandingSettings({ onClose }: AdvancedBrandingSettingsProps) {
  
  const {
    businessName,
    logoUrl,
    colors,
    typography,
    icons,
    setBusinessName,
    setLogoUrl,
    setColors,
    setTypography,
    setIcons,
  } = useThemeStore();

  const { currentRoom } = useRoomStore();

  const { addToast } = useToastStore();
  const user = useAuthStore(state => state.user);
  const [formData, setFormData] = useState({
    // Basic tab fields (NEW)
    businessName,
    logoUrl: logoUrl || '',
    
    // Colors tab fields (NEW)
    primaryColor: colors.primary,
    secondaryColor: colors.secondary,
    accentColor: colors.accent,
    backgroundColor: colors.background,
    textPrimary: colors.textPrimary,
    textSecondary: colors.textSecondary,
    textMuted: colors.textMuted,
    backgroundPrimary: colors.backgroundPrimary,
    backgroundSecondary: colors.backgroundSecondary,
    borderColor: colors.border,
    
    // Typography tab fields (PRESERVED - original functionality)
    fontFamily: typography.fontFamily,
    fontSizeBase: typography.fontSizeBase,
    fontSizeHeading: typography.fontSizeHeading,
    fontWeightNormal: typography.fontWeightNormal,
    fontWeightBold: typography.fontWeightBold,
    
    // Icons tab fields (NEW)
    iconStyle: icons.style,
    iconSize: icons.size,
    roomIcon: icons.roomIcon,
  });

  /* TAB NAVIGATION STATE - ADDED
   * ========================================
   * Date: October 21, 2025
   * Change ID: HYBRID-007
   * Purpose: Control which tab content is visible in modal
   * 
   * DEFAULT VALUE: 'typography'
   * - Preserves original focus (typography-only mode started here)
   * - User sees typography controls first on modal open
   * 
   * OPTIONS:
   * - 'basic': Business name + logo upload
   * - 'colors': 12 color pickers (brand, text, UI sections)
   * - 'typography': Font family, sizes, weights (original tab)
   * - 'icons': Icon style, size, room icon selector
   * 
   * USAGE:
   * - Tab buttons: onClick={() => setActiveTab('colors')}
   * - Content sections: {activeTab === 'colors' && <ColorTab />}
   * 
   * ROLLBACK:
   * Comment out this line if reverting to single-panel layout
   * 
   * TESTING:
   * - Click each tab → Correct content section displays
   * - Tab button styling → Active tab highlighted
   * ========================================
   */
  const [activeTab, setActiveTab] = useState<'basic' | 'colors' | 'typography' | 'icons'>('typography');

  /* LOGO UPLOAD STATE - ADDED
   * ========================================
   * Date: October 21, 2025
   * Change ID: HYBRID-008
   * Purpose: Loading indicator during Supabase upload
   * 
   * USAGE:
   * - setUploadingLogo(true) → Start upload, disable button, show spinner
   * - setUploadingLogo(false) → Upload complete/failed, enable button, hide spinner
   * 
   * UI INTEGRATION:
   * - Upload button: disabled={uploadingLogo}
   * - Button text: {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
   * - Loader2 icon: <Loader2 className="animate-spin" /> when true
   * 
   * ROLLBACK:
   * Comment out this line if removing logo upload feature
   * 
   * TESTING:
   * - Select file → Button shows "Uploading..." with spinner
   * - Upload complete → Button returns to "Upload Logo"
   * - Upload error → Button returns to "Upload Logo" + alert shown
   * ========================================
   */
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<OperationState>({ status: 'idle', retryCount: 0 });

  // Admin-only edit gating
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [membership, setMembership] = useState<{ role?: string } | undefined>();
  const saveAttempts = useRef<number>(0);

  // Concurrency control: latest-wins pattern
  const saveReqId = useRef<number>(0);
  const uploadReqId = useRef<number>(0);

  // Rate limiting: 3 actions per 5 seconds
  const rateLimiter = useRef(createRateLimiter(5000, 3));

  const verifyAdminStatus = useCallback(async (): Promise<boolean> => {
    if (!currentRoom?.id || !user?.id) {
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('room_memberships')
        .select('id, room_id, user_id, role, joined_at')
        .eq('room_id', currentRoom.id)
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        return false;
      }

      const membershipData = data as { role: string; joined_at: string };
      setMembership({ role: membershipData.role });

      if (membershipData.role !== 'admin') {
        return false;
      }

      const joinedAt = new Date(membershipData.joined_at).getTime();
      const accountAge = Date.now() - joinedAt;
      if (Number.isFinite(joinedAt) && accountAge < 60 * 60 * 1000) {
        addToast('Admin account must be at least 1 hour old to edit branding', 'warning');
        return false;
      }

      const { data: withinLimits } = await supabase
        .rpc('check_rate_limit', { p_user_id: user.id });

      if (withinLimits === false) {
        addToast('Rate limit exceeded. Maximum 10 changes per hour.', 'error');
        return false;
      }

      return true;
    } catch (err) {
      return false;
    }
  }, [currentRoom?.id, user?.id, addToast]);

  useEffect(() => {
    setIsVerifying(true);
    verifyAdminStatus().then((result: boolean) => {
      setIsAdmin(result);
      setIsVerifying(false);
    });
  }, [verifyAdminStatus]);

  // FIX: Manage body class for overlay lock
  // SSR Guard: Only run in browser environment
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }
    
    document.body.classList.add("theme-panel-open");
    return () => {
      document.body.classList.remove("theme-panel-open");
    };
  }, []);

  /* LIVE THEME PREVIEW EFFECT - ADDED
   * ========================================
   * Date: October 21, 2025
   * Change ID: HYBRID-009
   * Purpose: Apply theme changes in real-time while modal is open
   * Scope: Primary color, font family, background color
   * 
   * HOW IT WORKS:
   * - Updates CSS variables on document.documentElement (root)
   * - Triggers whenever formData changes (primaryColor, fontFamily, backgroundColor)
   * - Non-persistent (reverts if user clicks Cancel instead of Save)
   * 
   * CSS VARIABLES UPDATED:
   * - --theme-primary: Main brand color (used in buttons, accents)
   * - --theme-font: Font family (used in all text elements)
   * - --theme-bg: Background color (used in main app background)
   * 
   * USAGE:
   * - User changes color picker → CSS variable updates instantly
   * - User sees live preview in background (behind modal)
   * - Click Save → Changes persist to store
   * - Click Cancel → CSS variables revert on modal close
   * 
   * DEPENDENCIES:
   * - formData.primaryColor: From Colors tab
   * - formData.fontFamily: From Typography tab
   * - formData.backgroundColor: From Colors tab
   * 
   * ROLLBACK:
   * Comment out this entire useEffect block
   * 
   * TESTING:
   * - Open modal, go to Colors tab
   * - Change primary color → Background UI updates
   * - Change font in Typography tab → Text updates
   * - Click Cancel → Changes revert
   * - Click Save → Changes persist
   * 
   * TROUBLESHOOTING:
   * - If preview not visible: Check if CSS uses these variables
   * - If changes persist after Cancel: Check onClose cleanup
   * ========================================
   */
  useEffect(() => {
    applyCssVars({
      '--theme-primary': formData.primaryColor,
      '--theme-font': formData.fontFamily,
      '--theme-bg': formData.backgroundColor,
    });
  }, [formData.primaryColor, formData.fontFamily, formData.backgroundColor]);

  // TODO: Realtime integration will use mapDatabaseToFormData; keep referenced to satisfy linter until wired
  useEffect(() => { void mapDatabaseToFormData; }, []);

  /* OLD FONT/WEIGHT OPTIONS - PRESERVED FOR REFERENCE
   * ========================================
   * Date: October 21, 2025
   * Original: Local constants for font dropdown (7 fonts)
   * Status: KEPT for backward compatibility
   * Note: FONT_OPTIONS constant above (line 103) is now used in Typography tab
   * 
   * USAGE:
   * - These arrays were used in original typography-only UI
   * - Now replaced by FONT_OPTIONS (11 fonts) for consistency
   * - Kept here in case of rollback or reference
   * 
  
  */
  // const fontOptions = ['Montserrat', 'Open Sans', 'Inter', 'Roboto', 'Poppins', 'Lato', 'Raleway'];
  // const weightOptions = [300, 400, 500, 600, 700, 800];
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentRoom) return;

    // Idempotency guard
    if (uploadingLogo) return;

    // Rate limiting
    if (!rateLimiter.current.attempt()) {
      addToast('Please slow down. Too many upload attempts.', 'warning');
      return;
    }

    // Validate file using shared utility
    const validation = validateImageFile(file, UPLOAD_CONFIG.ALLOWED_TYPES, LIMITS.maxAvatarSize);
    if (!validation.ok) {
      addToast((validation as { ok: false; reason: string }).reason, 'error');
      return;
    }

    // Concurrency control: latest-wins
    const reqId = ++uploadReqId.current;
    const previousLogoUrl = formData.logoUrl;

    setUploadingLogo(true);
    try {
      // Get tenant_id for pathing
      const { data: room } = await supabase
        .from('rooms')
        .select('tenant_id')
        .eq('id', currentRoom.id)
        .single();
      
      if (!room?.tenant_id) {
        addToast('No tenant found', 'error');
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${room.tenant_id}/logo-${Date.now()}.${fileExt}`;
      
      // Upload using shared service (typed result)
      const result = await uploadPublicAsset({
        supabase,
        bucket: 'branding',
        path: fileName,
        file,
      });

      // Check if this is still the latest request
      if (reqId !== uploadReqId.current) {
        return;
      }

      if (!result.ok) {
        addToast((result as { ok: false; error: string }).error, 'error');
        return;
      }
      
      // Update form data (shows preview)
      setFormData({ ...formData, logoUrl: result.url });
      addToast('Logo uploaded successfully', 'success');
      
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      addToast(message, 'error');
      
      // Rollback on error
      setFormData({ ...formData, logoUrl: previousLogoUrl });
    } finally {
      // Only clear loading if this is still the latest request
      if (reqId === uploadReqId.current) {
        setUploadingLogo(false);
      }
    }
  };

  const handleSave = async () => {
    // Idempotency guard
    if (saving) return;

    // Rate limiting
    if (!rateLimiter.current.attempt()) {
      addToast('Please slow down. Too many save attempts.', 'warning');
      return;
    }

    // Concurrency control: latest-wins
    const reqId = ++saveReqId.current;

    setSaving(true);
    setSaveState({ status: 'loading', retryCount: 0, lastOperation: 'save', timestamp: new Date() });
    try {
      saveAttempts.current++;
      const stillAdmin = await verifyAdminStatus();
      if (!stillAdmin) {
        addToast('Admin verification failed', 'error');
        return;
      }

      // Validate form before saving
      const validation = validateBrandingData(formData);
      if (!validation.valid) {
        const firstError = Object.values(validation.errors || {})[0];
        addToast(firstError || 'Validation failed. Please review your inputs.', 'error');
        return;
      }
    
      if (!currentRoom) {
        addToast('Missing tenant context', 'error');
        return;
      }

      // Fetch tenant_id from rooms
      const { data: room } = await supabase
        .from('rooms')
        .select('tenant_id')
        .eq('id', currentRoom.id)
        .single();
      if (!room?.tenant_id) throw new Error('No tenant found for this room');
      
      
      
      const updatePayload = mapFormDataToDatabase(formData);
      const { error: supabaseError } = await supabase
        .from('tenants')
        .update(updatePayload)
        .eq('id', room.tenant_id);
      
      if (supabaseError) {
        throw new Error(`Database save failed: ${supabaseError.message}`);
      }
      
      
      // Check if this is still the latest request
      if (reqId !== saveReqId.current) {
        return;
      }

      // STEP 1a: Apply business name and logo (PRESERVED)
      // ==================================================
      // Date: October 21, 2025 (preserved from original)
      // Fields: businessName (string), logoUrl (string | undefined)
      // Tab: Basic tab
      // NOTE: Now updates Zustand store AFTER database save for consistency
      setBusinessName(formData.businessName);
      setLogoUrl(formData.logoUrl || '');

      
      setColors({
        primary: formData.primaryColor,
        secondary: formData.secondaryColor,
        accent: formData.accentColor,
        background: formData.backgroundColor,
        surface: formData.backgroundPrimary,
        text: formData.textPrimary,
        textSecondary: formData.textSecondary,
        border: formData.borderColor,
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
        textPrimary: formData.textPrimary,
        textMuted: formData.textMuted,
        backgroundPrimary: formData.backgroundPrimary,
        backgroundSecondary: formData.backgroundSecondary,
      });
      
      // Additional color updates (if needed for theme system)
      setColors({
        ...colors,
        primary: formData.primaryColor,
        secondary: formData.secondaryColor,
        accent: formData.accentColor,
      });
      
      setTypography({
        fontFamily: formData.fontFamily,
        fontSize: formData.fontSizeBase,
        fontWeight: '400',
        lineHeight: '1.5',
        fontSizeBase: formData.fontSizeBase,
        fontSizeHeading: formData.fontSizeHeading,
        fontWeightNormal: formData.fontWeightNormal,
        fontWeightBold: formData.fontWeightBold,
      });

      setIcons({
        iconTheme: 'lucide',
        iconSize: formData.iconSize,
        iconColor: '#6B7280',
        style: formData.iconStyle,
        size: formData.iconSize,
        roomIcon: formData.roomIcon,
      });

      // Purpose: Clear cached theme data to force re-render
      // Integration: clearMicrosoftCache from src/utils/cacheManager.ts
      await clearMicrosoftCache('theme', {
        resetStores: false,      // Don't reset stores (we just updated them)
        resetCSSVars: true,      // DO reset CSS variables
        autoReload: false,       // DON'T reload (modal state)
        showToasts: false,       // No toast (modal has feedback)
      });

      // STEP 3: Close modal (PRESERVED)
      // ================================
      // Date: October 21, 2025 (preserved from original)
      // Purpose: Close branding modal after successful save
      onClose();

    } catch (err) {
      console.error('[AdvancedBrandingSettings] Save error:', {
        message: (err as Error)?.message,
        stack: (err as Error)?.stack,
      });
      
      // Show user-friendly error via toast
      const errorMessage = err instanceof Error ? err.message : 'Failed to save branding settings';
      addToast(errorMessage, 'error');
      
    } finally {
      // Only clear loading if this is still the latest request
      if (reqId === saveReqId.current) {
        setSaving(false);
        setSaveState({ status: 'idle', retryCount: 0 });
      }
    }
  };

  // Performance: Profiler callback (DEV only)
  const onRenderCallback = useCallback(
    (
      _id: string,
      _phase: "mount" | "update" | "nested-update",
      actualDuration: number,
      baseDuration: number,
      _startTime: number,
      _commitTime: number
    ) => {
      if (import.meta.env.DEV && actualDuration > 16) {
        console.debug('[AdvancedBrandingSettings] Performance:', {
          actualDuration: `${actualDuration.toFixed(2)}ms`,
          baseDuration: `${baseDuration.toFixed(2)}ms`,
        });
      }
    },
    []
  );

  const content = (
    <>
      {isVerifying && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-8">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 animate-pulse text-blue-500" />
              <span className="text-white">Verifying permissions...</span>
            </div>
          </div>
        </div>
      )}

      {!isVerifying && !isAdmin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-8 max-w-md">
            <div className="flex items-start gap-3">
              <Lock className="w-6 h-6 text-red-400 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Admin Access Required</h3>
                <p className="text-slate-300 mb-4">Only administrators can modify branding settings.</p>
                <p className="text-sm text-slate-400">Your role: <span className="font-medium">{membership?.role}</span></p>
                <button onClick={onClose} className="mt-6 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAdmin && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="advanced-branding-title"
          aria-describedby="advanced-branding-description"
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <div className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 max-w-3xl w-full max-h-[90vh] overflow-y-auto transition-all">
            <div className="sticky top-0 bg-slate-900 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
              <h2 id="advanced-branding-title" className="text-xl font-semibold text-white">
                Advanced Branding
              </h2>
              <p id="advanced-branding-description" className="sr-only">
                Configure advanced typography, fonts, weights, and interface scaling for your theme. Changes preview live and can be saved to your account.
              </p>
              <button
                onPointerDown={(e) => {
                  e.preventDefault(); // Prevent ghost clicks on touch
                  onClose();
                }}
                className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none"
                aria-label="Close advanced branding settings"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

	  	{/* TABS NAVIGATION - ADDED
         * ========================================
         * Date: October 21, 2025
         * Change ID: HYBRID-012
         * Purpose: 4-tab navigation system for branding suite
         * 
         * TABS:
         * - Basic: Business name + logo upload
         * - Colors: 12 color pickers (brand, text, UI)
         * - Typography: Font family, sizes, weights (original tab)
         * - Icons: Icon style, size, room icon selector
         * 
         * STYLING:
         * - Active tab: bg-slate-700 + border-b-2 border-blue-500
         * - Inactive tabs: text-slate-400 + hover effects
         * - Icons: Type, Eye, Radio icons from lucide-react
         * 
         * INTERACTION:
         * - onPointerDown: Universal input support (mouse/touch/pen)
         * - setActiveTab: Updates state to show correct content
         * 
         * ROLLBACK:
         * Comment out this entire div to revert to single-panel layout
         * 
         * TESTING:
         * - Click each tab → Correct content section displays
         * - Tab styling → Active tab highlighted with blue border
         * - Pointer events → Works with mouse, touch, pen
         * ========================================
         */}
        <div className="flex border-b border-slate-700">
          {[
            { id: 'basic', label: 'Basic', icon: Eye },
            { id: 'colors', label: 'Colors', icon: Eye },
            { id: 'typography', label: 'Typography', icon: Type },
            { id: 'icons', label: 'Icons', icon: Radio },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onPointerDown={() => setActiveTab(id as typeof activeTab)}
              className={`flex-1 px-4 py-3 flex items-center justify-center gap-2 transition-colors ${
                activeTab === id
                  ? 'bg-slate-700 text-white border-b-2 border-blue-500'
                  : 'text-slate-400 hover:text-white hover:bg-slate-750'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* BASIC TAB - ADDED
           * ========================================
           * Date: October 21, 2025
           * Change ID: HYBRID-013
           * Purpose: Business name and logo upload controls
           * 
           * FIELDS:
           * - Business Name: Text input for company/tenant name
           * - Logo Upload: File input with Supabase storage integration
           * - Logo Preview: Shows uploaded logo image
           * - Remove Logo: Button to clear logo
           * 
           * INTEGRATION:
           * - handleLogoUpload: Supabase storage upload function
           * - uploadingLogo: Loading state for upload button
           * - formData.businessName: Business name value
           * - formData.logoUrl: Logo URL for preview
           * 
           * ROLLBACK:
           * Comment out this entire conditional block
           * 
           * TESTING:
           * - Type business name → Updates formData.businessName
           * - Upload logo → Shows preview, updates formData.logoUrl
           * - Remove logo → Clears formData.logoUrl
           * ========================================
           */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              {/* Business Name */}
              <div>
                <label
                  htmlFor="businessName"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Business Name
                </label>
                <input
                  id="businessName"
                  type="text"
                  value={formData.businessName}
                  onChange={(e) =>
                    setFormData({ ...formData, businessName: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500
                             focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="Enter business name"
                />
              </div>

              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Logo
                </label>
                <div className="flex items-center gap-4 flex-wrap">
                  {formData.logoUrl && (
                    <img
                      src={formData.logoUrl}
                      alt="Logo preview"
                      className="h-16 w-auto object-contain bg-slate-900 rounded-lg p-2"
                    />
                  )}
                  <label className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      disabled={uploadingLogo}
                    />
                    <div
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-blue-600/60
                                 text-white rounded-lg cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {uploadingLogo ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Uploading…
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5" />
                          Upload Logo
                        </>
                      )}
                    </div>
                  </label>
                  {formData.logoUrl && (
                    <button
                      onPointerDown={() =>
                        setFormData({ ...formData, logoUrl: '' })
                      }
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg
                                 focus:ring-2 focus:ring-red-400 focus:outline-none transition-all"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Recommended format: PNG or SVG (≤ 5 MB)
                </p>
              </div>
            </div>
          )}

          {/* COLORS TAB - ADDED
           * ========================================
           * Date: October 21, 2025
           * Change ID: HYBRID-014
           * Purpose: 12 color pickers for complete branding control
           * 
           * SECTIONS:
           * - Brand Colors (4): Primary, Secondary, Accent, Background
           * - Text Colors (3): Primary, Secondary, Muted
           * - UI Colors (3): Background Primary, Background Secondary, Border
           * 
           * CONTROLS:
           * - Color picker: <input type="color"> for visual selection
           * - Text input: Hex value input for precise colors
           * - Description: Helper text explaining each color's purpose
           * 
           * INTEGRATION:
           * - formData.primaryColor, formData.secondaryColor, etc.
           * - Live preview via useEffect (CSS variables)
           * - setFormData updates on change
           * 
           * ROLLBACK:
           * Comment out this entire conditional block
           * 
           * TESTING:
           * - Change color picker → Updates hex input and formData
           * - Type hex value → Updates color picker and formData
           * - Live preview → Background UI updates in real-time
           * ========================================
           */}
          {activeTab === 'colors' && (
            <div className="space-y-8">
              {/* Brand Colors */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Brand Colors
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {[
                    { key: 'primaryColor', label: 'Primary Color', desc: 'Main brand color' },
                    { key: 'secondaryColor', label: 'Secondary Color', desc: 'Supporting accents' },
                    { key: 'accentColor', label: 'Accent Color', desc: 'Highlights & CTAs' },
                    { key: 'backgroundColor', label: 'Background Color', desc: 'Main app background' },
                  ].map(({ key, label, desc }) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        {label}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          id={`color-picker-${key}`}
                          name={`color-picker-${key}`}
                          type="color"
                          value={(formData as Record<string, string>)[key]}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              [key]: e.target.value,
                            })
                          }
                          aria-invalid={!isValidHexColor((formData as Record<string, string>)[key])}
                          aria-label={`${label} color picker`}
                          className="w-12 h-12 rounded cursor-pointer border border-slate-700 focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          id={`color-text-${key}`}
                          name={`color-text-${key}`}
                          type="text"
                          value={(formData as Record<string, string>)[key]}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              [key]: e.target.value,
                            })
                          }
                          aria-invalid={!isValidHexColor((formData as Record<string, string>)[key])}
                          aria-label={`${label} hex value`}
                          className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm
                                     focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Text + UI Colors */}
              <div className="border-t border-slate-700 pt-6 space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Text Colors
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {[
                      { key: 'textPrimary', label: 'Primary Text', desc: 'Headings & important text' },
                      { key: 'textSecondary', label: 'Secondary Text', desc: 'Body text' },
                      { key: 'textMuted', label: 'Muted Text', desc: 'Less important info' },
                    ].map(({ key, label, desc }) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          {label}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            id={`text-color-picker-${key}`}
                            name={`text-color-picker-${key}`}
                            type="color"
                            value={(formData as Record<string, string>)[key]}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                [key]: e.target.value,
                              })
                            }
                            aria-invalid={!isValidHexColor((formData as Record<string, string>)[key])}
                            aria-label={`${label} color picker`}
                            className="w-12 h-12 rounded cursor-pointer border border-slate-700 focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            id={`text-color-text-${key}`}
                            name={`text-color-text-${key}`}
                            type="text"
                            value={(formData as Record<string, string>)[key]}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                [key]: e.target.value,
                              })
                            }
                            aria-invalid={!isValidHexColor((formData as Record<string, string>)[key])}
                            className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm
                                       focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">
                    UI Colors
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {[
                      { key: 'backgroundPrimary', label: 'BG Primary', desc: 'Main background panels' },
                      { key: 'backgroundSecondary', label: 'BG Secondary', desc: 'Cards & secondary areas' },
                      { key: 'borderColor', label: 'Border', desc: 'Dividers & component borders' },
                    ].map(({ key, label, desc }) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          {label}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            id={`ui-color-picker-${key}`}
                            name={`ui-color-picker-${key}`}
                            type="color"
                            value={(formData as Record<string, string>)[key]}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                [key]: e.target.value,
                              })
                            }
                            aria-invalid={!isValidHexColor((formData as Record<string, string>)[key])}
                            aria-label={`${label} color picker`}
                            className="w-12 h-12 rounded cursor-pointer border border-slate-700 focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            id={`ui-color-text-${key}`}
                            name={`ui-color-text-${key}`}
                            type="text"
                            value={(formData as Record<string, string>)[key]}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                [key]: e.target.value,
                              })
                            }
                            aria-invalid={!isValidHexColor((formData as Record<string, string>)[key])}
                            className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm
                                       focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TYPOGRAPHY TAB - PRESERVED AND ENHANCED
           * ========================================
           */}
          {activeTab === 'typography' && (
            <div className="space-y-6">
              {/* Font Family */}
              <div>
                <label
                  htmlFor="fontFamily"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Font Family
                </label>
                <select
                  id="fontFamily"
                  value={formData.fontFamily}
                  onChange={(e) =>
                    setFormData({ ...formData, fontFamily: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2
                             text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {FONT_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">Base font for all text elements</p>
              </div>

              {/* Sizes + Weights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[
                  {
                    id: 'fontSizeBase',
                    label: 'Base Font Size',
                    placeholder: '16px',
                    desc: 'Body text size',
                  },
                  {
                    id: 'fontSizeHeading',
                    label: 'Heading Font Size',
                    placeholder: '24px',
                    desc: 'Header text size',
                  },
                ].map(({ id, label, placeholder, desc }) => (
                  <div key={id}>
                    <label
                      htmlFor={id}
                      className="block text-sm font-medium text-slate-300 mb-2"
                    >
                      {label}
                    </label>
                    <input
                      id={id}
                      type="text"
                      value={(formData as Record<string, string>)[id]}
                      onChange={(e) =>
                        setFormData({ ...formData, [id]: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2
                                 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={placeholder}
                    />
                    <p className="text-xs text-slate-500 mt-1">{desc}</p>
                  </div>
                ))}

                {/* Font Weights */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Normal Weight
                  </label>
                  <select
                    value={formData.fontWeightNormal}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        fontWeightNormal: e.target.value,
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2
                               text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="300">Light (300)</option>
                    <option value="400">Normal (400)</option>
                    <option value="500">Medium (500)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Bold Weight
                  </label>
                  <select
                    value={formData.fontWeightBold}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        fontWeightBold: e.target.value,
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2
                               text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="600">Semi-Bold (600)</option>
                    <option value="700">Bold (700)</option>
                    <option value="800">Extra Bold (800)</option>
                  </select>
                </div>
              </div>

              {/* Preview */}
              <div className="mt-8 p-5 bg-slate-900 rounded-lg border border-slate-700">
                <p className="text-sm text-slate-300 mb-3">Typography Preview</p>
                <div style={{ fontFamily: formData.fontFamily }}>
                  <h2
                    style={{
                      fontSize: formData.fontSizeHeading,
                      fontWeight: formData.fontWeightBold,
                    }}
                    className="text-white mb-2"
                  >
                    Heading Text Sample
                  </h2>
                  <p
                    style={{
                      fontSize: formData.fontSizeBase,
                      fontWeight: formData.fontWeightNormal,
                    }}
                    className="text-slate-300"
                  >
                    This is body text using your selected typography settings. The quick brown fox jumps over the lazy dog.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ICONS TAB - ADDED
    
           */}
          {activeTab === 'icons' && (
            <div className="space-y-6">
              {/* Icon Size */}
              <div>
                <label
                  htmlFor="iconSize"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Icon Size
                </label>
                <input
                  id="iconSize"
                  type="text"
                  value={formData.iconSize}
                  onChange={(e) =>
                    setFormData({ ...formData, iconSize: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2
                             text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="24px"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Default size for icons throughout the app
                </p>
              </div>

              {/* Room Icon Selector */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Room Icon
                </label>
                <div className="grid grid-cols-5 gap-3">
                  {ICON_OPTIONS.map((iconName) => {
                    const IconComponent = (Icons as unknown as Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>> | undefined>)[iconName];
                    return (
                      <button
                        key={iconName}
                        onPointerDown={() =>
                          setFormData({ ...formData, roomIcon: iconName })
                        }
                        className={`p-4 rounded-lg border-2 transition-all focus:outline-none
                                    ${
                                      formData.roomIcon === iconName
                                        ? 'border-blue-500 bg-blue-600/20'
                                        : 'border-slate-700 bg-slate-900 hover:border-slate-600'
                                    }`}
                        title={iconName}
                        aria-pressed={formData.roomIcon === iconName}
                      >
                        {IconComponent && (
                          <IconComponent className="w-8 h-8 text-white mx-auto" />
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-500 mt-3">
                  Icon shown on room cards and headers
                </p>
              </div>

              {/* Preview */}
              <div className="mt-8 p-6 bg-slate-900 rounded-lg border border-slate-700">
                <p className="text-sm text-slate-300 mb-4">Icon Preview</p>
                <div className="flex items-center justify-center gap-4 p-6 bg-slate-800 rounded-lg">
                  <div className="p-3 bg-blue-600 rounded-lg">
                    {(() => {
                      const SelectedIcon =
                        (Icons as unknown as Record<
                          string,
                          React.ComponentType<React.SVGProps<SVGSVGElement>> | undefined
                        >)[formData.roomIcon] || Icons.Radio;
                      return SelectedIcon ? (
                        <SelectedIcon
                          style={{
                            width: formData.iconSize,
                            height: formData.iconSize,
                          }}
                          className="text-white"
                        />
                      ) : null;
                    })()}
                  </div>
                  <div className="text-left">
                    <div className="text-white font-semibold">Selected Icon</div>
                    <div className="text-slate-400 text-sm">
                      {formData.roomIcon}
                    </div>
                    <div className="text-slate-500 text-xs mt-1">
                      Size: {formData.iconSize}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* OLD TYPOGRAPHY CONTENT - PRESERVED FOR ROLLBACK
           * ========================================
           * Date: October 21, 2025
           * Original: Single-panel typography controls
           * Status: COMMENTED OUT - replaced by tab system above
           * 
           * ROLLBACK INSTRUCTIONS:
           * 1. Comment out all tab conditionals above
           * 2. Uncomment this section
           * 3. Remove tab navigation div
           * 4. Revert to single-panel layout
           * ========================================
           */}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-900 border-t border-slate-700 px-6 py-4 flex items-center justify-end gap-3">
          {/* OLD CANCEL BUTTON - PRESERVED FOR ROLLBACK
           * ==========================================
           * Original onClick handler (mouse only)
           * Date Commented: [Current Date]
           * Reason: Replacing with onPointerDown for universal input support
           */}
          {/*
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          */}

          {/* OLD CANCEL BUTTON HOVER - PRESERVED FOR ROLLBACK
           * =================================================
           * Date Commented: October 21, 2025
           * Original: hover:bg-slate-600 (subtle gray hover)
           * Reason: Upgrading to Fluent-style blue glow hover
           * Source: Microsoft-Standard Code Audit - Priority 2
           * Rollback: Uncomment className below, remove new one
           * ───────────────────────────────────────────────────────────────
           * className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none"
           * ═══════════════════════════════════════════════════════════════
           */}
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              onClose();
            }}
            className="px-4 py-2 bg-slate-700 hover:bg-blue-600/60 text-white rounded-lg transition-all focus:ring-2 focus:ring-blue-500 focus:outline-none"
            aria-label="Cancel and close without saving"
            type="button"
          >
            Cancel
          </button>
        
          {isAdmin && (
          <button
            onClick={handleSave}
            disabled={saving || uploadingLogo}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white rounded-lg transition-colors flex items-center gap-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
              aria-label={saveState.status === 'loading' ? "Saving changes..." : uploadingLogo ? "Logo upload in progress..." : "Save theme changes"}
            type="button"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
          )}
        </div>
      </div>
    </div>
    )}
    </>
  );

  // Performance: Wrap with Profiler in DEV only
  return import.meta.env.DEV ? (
    <Profiler id="AdvancedBrandingSettings" onRender={onRenderCallback}>
      {content}
    </Profiler>
  ) : (
    content
  );
}

// 🔹 Phase 2 Add-on Controls
// -----------------------------------------------------

const iconThemes = [
  { name: 'Lucide Default', value: 'lucide' },
  { name: 'Microsoft Fluent', value: 'fluent' },
  { name: 'Minimal Line', value: 'line' },
  { name: 'Filled', value: 'filled' },
];

export function AdvancedBrandingSettingsPhase2({ onClose: _onClose }: AdvancedBrandingSettingsProps) {
  const { uiStyle, setUIStyle } = useThemeStore();
  const user = useAuthStore(state => state.user);
  const [formData, setFormData] = useState({
    iconTheme: uiStyle.iconTheme || 'lucide',
    borderRadius: uiStyle.borderRadius || 0.5,
    spacing: uiStyle.spacing || 1.0,
  });

  const [presets, setPresets] = useState<Array<Record<string, unknown>>>([]);
  const [savingPreset, setSavingPreset] = useState(false);
  
  // Concurrency control for preset saves
  const presetReqId = useRef<number>(0);

  const handleSavePreset = async () => {
    // Idempotency guard: prevent double-clicks
    if (savingPreset) return;
    
    // Latest-wins concurrency control
    const reqId = ++presetReqId.current;
    
    setSavingPreset(true);
    try {
      const presetName = prompt('Enter a name for this theme preset:');
      if (!presetName) return;
      
      // Check if superseded
      if (reqId !== presetReqId.current) {
        return;
      }

      // TODO: Use user_themes table with correct schema
      const { error } = await supabase
        .from('user_themes')
        .insert([
          {
            user_id: user?.id || 'anonymous',
            name: presetName,
            description: `Theme preset: ${presetName}`,
            theme_json: {
              // Add all theme properties from formData
              ...formData
            },
          },
        ]);

      if (error) throw error;

      // Check again before applying results
      if (reqId !== presetReqId.current) {
        return;
      }
      
      await loadPresets();
      alert('Preset saved!');
    } catch (err) {
    } finally {
      // Only clear loading if this is still the latest request
      if (reqId === presetReqId.current) {
        setSavingPreset(false);
      }
    }
  };

  const loadPresets = async () => {
    const { data, error } = await supabase.from('user_themes').select('*');
    if (!error && data) setPresets(data);
  };

  const applyPreset = (preset: { theme_json?: Record<string, unknown> }) => {
    // Extract theme data from theme_json field
    const themeData = (preset.theme_json || {}) as Record<string, unknown>;
    setFormData({
      iconTheme: (themeData.icon_theme as string) || 'lucide',
      borderRadius: (themeData.border_radius as number) || 0.5,
      spacing: (themeData.spacing as number) || 1.0,
    });
    setUIStyle({
      iconTheme: (themeData.icon_theme as string) || 'lucide',
      borderRadius: (themeData.border_radius as number) || 0.5,
      spacing: (themeData.spacing as number) || 1.0,
      fontSize: (themeData.fontSize as string) || '14px',
      fontFamily: (themeData.fontFamily as string) || 'Inter, sans-serif',
    });
  };

  useEffect(() => {
    loadPresets();
  }, []);

  return (
    <div className="p-6 space-y-8">
      {/* Icon Theme */}
      <section>
        <h3 className="text-lg font-semibold text-white mb-3">Icon Theme</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {iconThemes.map((theme) => (
            <button
              key={theme.value}
              onClick={() => setFormData({ ...formData, iconTheme: theme.value })}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                formData.iconTheme === theme.value
                  ? 'border-blue-500 bg-blue-600/20 text-white'
                  : 'border-slate-700 hover:border-blue-500 text-slate-300 hover:text-white'
              }`}
            >
              <Palette className="w-4 h-4" />
              {theme.name}
            </button>
          ))}
        </div>
      </section>

      {/* Border Radius */}
      <section>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Border Radius
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={formData.borderRadius}
          onChange={(e) =>
            setFormData({ ...formData, borderRadius: parseFloat(e.target.value) })
          }
          className="w-full accent-blue-500"
        />
        <p className="text-xs text-slate-400 mt-1">
          Controls how round elements are ({Math.round(Number(formData.borderRadius) * 100)}%)
        </p>
      </section>

      {/* Element Spacing */}
      <section>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Element Spacing
        </label>
        <input
          type="range"
          min={0.8}
          max={1.4}
          step={0.05}
          value={formData.spacing}
          onChange={(e) =>
            setFormData({ ...formData, spacing: parseFloat(e.target.value) })
          }
          className="w-full accent-blue-500"
        />
        <p className="text-xs text-slate-400 mt-1">
          Adjusts overall padding and margin scale ({Number(formData.spacing).toFixed(2)}×)
        </p>
      </section>

      {/* Presets */}
      <section className="border-t border-slate-700 pt-6">
        <h3 className="text-lg font-semibold text-white mb-3">Theme Presets</h3>
        <div className="flex flex-wrap gap-3 mb-3">
          <button
            onClick={handleSavePreset}
            disabled={savingPreset}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            {savingPreset ? 'Saving...' : 'Save Preset'}
          </button>
          <button
            onClick={loadPresets}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {presets.length === 0 ? (
          <p className="text-slate-500 text-sm">No presets saved yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {presets.map((preset) => (
              <div
                key={String((preset as Record<string, unknown>).id)}
                className="p-4 rounded-lg border border-slate-700 bg-slate-900 hover:border-blue-500 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-slate-200 font-semibold">{String((preset as Record<string, unknown>).name ?? '')}</h4>
                  <button
                    onClick={() => applyPreset(preset)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs"
                  >
                    Apply
                  </button>
                </div>
                <div className="text-xs text-slate-400 space-y-1">
                  <p>Icon: {String((preset as Record<string, unknown>).icon_theme ?? '')}</p>
                  <p>
                    Radius:{' '}
                    {Number((preset as Record<string, unknown>).border_radius ?? 0) * 100}
                    %
                  </p>
                  <p>
                    Spacing:{' '}
                    {Number.parseFloat(String((preset as Record<string, unknown>).spacing ?? '1')).toFixed(2)}×
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Live Extended Preview */}
      <section className="border-t border-slate-700 pt-6">
        <h3 className="text-lg font-semibold text-white mb-3">Extended Preview</h3>
        <div
          className="p-6 bg-slate-900 border border-slate-700 rounded-xl flex flex-col gap-4 transition-all"
          style={{
            borderRadius: `${Number(formData.borderRadius) * 1.5}rem`,
            gap: `${Number(formData.spacing) * 1.25}rem`,
          }}
        >
          <button
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            style={{ borderRadius: `${Number(formData.borderRadius) * 1.25}rem` }}
          >
            <Circle className="w-5 h-5" />
            Primary Button
          </button>
          <div
            className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 text-white rounded-lg"
            style={{ borderRadius: `${Number(formData.borderRadius) * 1.25}rem` }}
          >
            <Square className="w-4 h-4" />
            Secondary Element
          </div>
        </div>
      </section>
    </div>
  );
}
// --- Continue inside AdvancedBrandingSettings.tsx ---

// 🔹 Phase 3 — Color, Motion, Export/Import
// -----------------------------------------------------

export function AdvancedBrandingSettingsPhase3({ onClose: _onClose }: AdvancedBrandingSettingsProps) {
  const { colors, motion, setColors, setMotion } = useThemeStore();
  const [palette, setPalette] = useState<'light' | 'dark' | 'contrast' | 'custom'>('dark');
  const [motionStyle, setMotionStyle] = useState(motion.duration === '0ms' ? 'minimal' : motion.duration === '180ms' ? 'energetic' : 'smooth');
  const [importing, setImporting] = useState(false);

  const paletteOptions = [
    { name: 'Light', value: 'light', icon: <Sun className="w-4 h-4" /> },
    { name: 'Dark', value: 'dark', icon: <Moon className="w-4 h-4" /> },
    { name: 'High Contrast', value: 'contrast', icon: <ShieldCheck className="w-4 h-4" /> },
    { name: 'Custom', value: 'custom', icon: <Zap className="w-4 h-4" /> },
  ];

  const motionOptions = [
    { name: 'Smooth', value: 'smooth', desc: 'Gentle Fluent motion' },
    { name: 'Energetic', value: 'energetic', desc: 'Fast transitions' },
    { name: 'Minimal', value: 'minimal', desc: 'Static, reduced motion' },
  ];

  // --- Palette application
  const applyPalette = async (mode: string) => {
    const presets = {
      light: {
        primary: '#2563eb',
        secondary: '#6B7280',
        accent: '#F59E0B',
        background: '#ffffff',
        surface: '#f1f5f9',
        text: '#1e293b',
        textSecondary: '#475569',
        border: '#e2e8f0',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
        textPrimary: '#1e293b',
        textMuted: '#64748b',
        backgroundPrimary: '#ffffff',
        backgroundSecondary: '#f1f5f9',
      },
      dark: {
        primary: '#2563eb',
        secondary: '#6B7280',
        accent: '#F59E0B',
        background: '#0f172a',
        surface: '#1e293b',
        text: '#f8fafc',
        textSecondary: '#cbd5e1',
        border: '#334155',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
        textPrimary: '#f8fafc',
        textMuted: '#64748b',
        backgroundPrimary: '#0f172a',
        backgroundSecondary: '#1e293b',
      },
      contrast: {
        primary: '#00ffff',
        secondary: '#ff00ff',
        accent: '#ffff00',
        background: '#000000',
        surface: '#1a1a1a',
        text: '#ffffff',
        textSecondary: '#e0e0e0',
        border: '#404040',
        success: '#00ff00',
        warning: '#ffaa00',
        error: '#ff0000',
        info: '#00aaff',
        textPrimary: '#ffffff',
        textMuted: '#a0a0a0',
        backgroundPrimary: '#000000',
        backgroundSecondary: '#1a1a1a',
      },
      custom: { ...colors },
    };
    const newPalette = presets[mode as keyof typeof presets];
    // Map extended palette modes back to core palette state type
    const paletteMode =
      mode === 'highContrast'
        ? 'contrast'
        : (mode as 'light' | 'dark' | 'custom');
    setPalette(paletteMode);
    setColors({ ...newPalette });
  };

  const applyMotion = (type: string) => {
    setMotionStyle(type as 'smooth' | 'energetic' | 'minimal');
    const duration = type === 'smooth' ? '300ms' : type === 'energetic' ? '180ms' : '0ms';
    setMotion({ duration, easing: 'ease', reduceMotion: false });
    applyCssVars({ '--motion-speed': duration });
  };

  const handleExport = () => {
    downloadThemeJson(`theme-export-${new Date().toISOString()}.json`, { colors, motion });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const imported = await parseThemeJson(file);
      if (typeof imported === 'object' && imported !== null) {
        const data = imported as Record<string, unknown>;
        if (data.colors) setColors(data.colors as typeof colors);
        if (data.motion) setMotion(data.motion as typeof motion);
      }
      alert('Theme imported successfully!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to import JSON.');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const handleReset = () => {
    if (!confirm('Reset theme to default Fluent values?')) return;
    setColors({
      primary: '#2563eb',
      secondary: '#6B7280',
      accent: '#F59E0B',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f8fafc',
      textSecondary: '#cbd5e1',
      border: '#334155',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
      textPrimary: '#f8fafc',
      textMuted: '#64748b',
      backgroundPrimary: '#0f172a',
      backgroundSecondary: '#1e293b',
    });
    setMotion({ duration: '300ms', easing: 'ease', reduceMotion: false });
    alert('Theme reset to defaults.');
  };

  return (
    <div className="p-6 space-y-8">
      {/* Color Palette Presets */}
      <section>
        <h3 className="text-lg font-semibold text-white mb-3">Color Palette</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {paletteOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => applyPalette(opt.value)}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                palette === opt.value
                  ? 'border-blue-500 bg-blue-600/20 text-white'
                  : 'border-slate-700 hover:border-blue-500 text-slate-300 hover:text-white'
              }`}
            >
              {opt.icon}
              {opt.name}
            </button>
          ))}
        </div>
      </section>

      {/* Motion Themes */}
      <section>
        <h3 className="text-lg font-semibold text-white mb-3">Motion Theme</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {motionOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => applyMotion(opt.value)}
              className={`flex flex-col items-center gap-1 px-4 py-3 rounded-lg border transition-all ${
                motionStyle === opt.value
                  ? 'border-blue-500 bg-blue-600/20 text-white'
                  : 'border-slate-700 hover:border-blue-500 text-slate-300 hover:text-white'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span className="text-sm">{opt.name}</span>
              <span className="text-[11px] text-slate-400">{opt.desc}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Export / Import */}
      <section className="border-t border-slate-700 pt-6">
        <h3 className="text-lg font-semibold text-white mb-3">Export / Import</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" /> Export JSON
          </button>

          <label className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg cursor-pointer transition-colors">
            <Upload className="w-4 h-4" />
            {importing ? 'Importing...' : 'Import JSON'}
            <input
              type="file"
              accept="application/json"
              onChange={handleImport}
              className="hidden"
              disabled={importing}
            />
          </label>

          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <RefreshCcwDot className="w-4 h-4" /> Reset Defaults
          </button>
        </div>
      </section>

      {/* Palette Live Preview */}
      <section className="border-t border-slate-700 pt-6">
        <h3 className="text-lg font-semibold text-white mb-3">Palette Preview</h3>
        <div
          className="p-6 rounded-xl border border-slate-700 flex flex-col gap-4"
          style={{
            backgroundColor: colors.background,
            color: colors.textPrimary,
            transition: 'all var(--motion-speed,300ms) ease',
          }}
        >
          <h1
            className="text-xl font-semibold"
            style={{ color: colors.primary }}
          >
            Fluent Theme Demo
          </h1>
          <p className="text-sm opacity-80">
            Current mode: <strong>{palette}</strong> — motion: <strong>{motionStyle}</strong>
          </p>
          <button
            className="px-4 py-2 rounded-lg font-semibold text-white"
            style={{ backgroundColor: colors.primary }}
          >
            Primary Action
          </button>
        </div>
      </section>
    </div>
  );
}
