import type { Database } from './database.types';

// Extract table types
export type TenantRow = Database['public']['Tables']['tenants']['Row'];
export type TenantUpdate = Database['public']['Tables']['tenants']['Update'];

// Form data interface matching your database schema
export interface BrandingFormData {
  // Basic fields
  businessName: string;      // maps to: business_name
  logoUrl: string;           // maps to: logo_url

  // Color fields
  primaryColor: string;      // maps to: primary_color
  secondaryColor: string;    // maps to: secondary_color
  accentColor: string;       // maps to: accent_color
  backgroundColor: string;   // maps to: background_color
  textPrimary: string;       // maps to: text_color_primary
  textSecondary: string;     // maps to: text_color_secondary
  textMuted: string;         // maps to: text_color_muted
  backgroundPrimary: string; // maps to: background_primary
  backgroundSecondary: string; // maps to: background_secondary
  borderColor: string;       // maps to: border_color

  // Typography fields
  fontFamily: string;        // maps to: font_family
  fontSizeBase: string;      // maps to: font_size_base
  fontSizeHeading: string;   // maps to: font_size_heading
  fontWeightNormal: string;  // maps to: font_weight_normal
  fontWeightBold: string;    // maps to: font_weight_bold

  // Icon fields
  iconStyle: string;         // maps to: icon_style
  iconSize: string;          // maps to: icon_size
  roomIcon: string;          // maps to: room_icon
}

// Validation result type
export interface ValidationResult {
  valid: boolean;
  errors?: Record<string, string>;
}

// Operation state for async operations (use undefined, never null)
export interface OperationState {
  status: 'idle' | 'loading' | 'success' | 'error';
  error?: Error;
  retryCount: number;
  lastOperation?: string;
  timestamp?: Date;
}


