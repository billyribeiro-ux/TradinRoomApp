import type { BrandingFormData, ValidationResult } from '../types/branding.types';

// Validates hex color format
export const isValidHexColor = (color: string): boolean => {
  return /^#[0-9A-F]{6}$/i.test(color);
};

// Validates all branding form data
export const validateBrandingData = (data: BrandingFormData): ValidationResult => {
  const errors: Record<string, string> = {};

  // Validate business name
  if (!data.businessName || data.businessName.length < 1) {
    errors.businessName = 'Business name is required';
  } else if (data.businessName.length > 100) {
    errors.businessName = 'Business name must be less than 100 characters';
  }

  // Validate colors
  const colorFields = [
    'primaryColor', 'secondaryColor', 'accentColor', 'backgroundColor',
    'textPrimary', 'textSecondary', 'textMuted', 'backgroundPrimary',
    'backgroundSecondary', 'borderColor'
  ] as const;

  colorFields.forEach((field) => {
    if (!isValidHexColor(data[field])) {
      errors[field] = 'Must be a valid hex color (#RRGGBB)';
    }
  });

  // Validate font sizes
  const sizePattern = /^\d+(\.\d+)?(px|rem|em)$/;
  if (!sizePattern.test(data.fontSizeBase)) {
    errors.fontSizeBase = 'Must be a valid CSS size (e.g., 16px, 1rem)';
  }
  if (!sizePattern.test(data.fontSizeHeading)) {
    errors.fontSizeHeading = 'Must be a valid CSS size';
  }

  // Validate font weights
  const validWeights = ['300', '400', '500', '600', '700', '800'];
  if (!validWeights.includes(data.fontWeightNormal)) {
    errors.fontWeightNormal = 'Must be a valid font weight';
  }
  if (!validWeights.includes(data.fontWeightBold)) {
    errors.fontWeightBold = 'Must be a valid font weight';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  };
};

// Maps form data to database columns (use undefined, never null)
export const mapFormDataToDatabase = (data: BrandingFormData): Record<string, unknown> => {
  return {
    business_name: data.businessName,
    logo_url: data.logoUrl || undefined,
    primary_color: data.primaryColor,
    secondary_color: data.secondaryColor,
    accent_color: data.accentColor,
    background_color: data.backgroundColor,
    text_color_primary: data.textPrimary,
    text_color_secondary: data.textSecondary,
    text_color_muted: data.textMuted,
    background_primary: data.backgroundPrimary,
    background_secondary: data.backgroundSecondary,
    border_color: data.borderColor,
    font_family: data.fontFamily,
    font_size_base: data.fontSizeBase,
    font_size_heading: data.fontSizeHeading,
    font_weight_normal: data.fontWeightNormal,
    font_weight_bold: data.fontWeightBold,
    icon_style: data.iconStyle,
    icon_size: data.iconSize,
    room_icon: data.roomIcon,
  };
};

// Maps database row to form data
export const mapDatabaseToFormData = (row: Record<string, unknown>): BrandingFormData => {
  return {
    businessName: (row.business_name as string) || '',
    logoUrl: (row.logo_url as string) || '',
    primaryColor: (row.primary_color as string) || '#2563eb',
    secondaryColor: (row.secondary_color as string) || '#6B7280',
    accentColor: (row.accent_color as string) || '#F59E0B',
    backgroundColor: (row.background_color as string) || '#0f172a',
    textPrimary: (row.text_color_primary as string) || '#f8fafc',
    textSecondary: (row.text_color_secondary as string) || '#cbd5e1',
    textMuted: (row.text_color_muted as string) || '#64748b',
    backgroundPrimary: (row.background_primary as string) || '#0f172a',
    backgroundSecondary: (row.background_secondary as string) || '#1e293b',
    borderColor: (row.border_color as string) || '#334155',
    fontFamily: (row.font_family as string) || 'Inter, sans-serif',
    fontSizeBase: (row.font_size_base as string) || '16px',
    fontSizeHeading: (row.font_size_heading as string) || '24px',
    fontWeightNormal: (row.font_weight_normal as string) || '400',
    fontWeightBold: (row.font_weight_bold as string) || '700',
    iconStyle: (row.icon_style as string) || 'outline',
    iconSize: (row.icon_size as string) || '24px',
    roomIcon: (row.room_icon as string) || 'Radio',
  };
};


