/** Microsoft-style test utilities for React Testing Library */

import type { RenderOptions } from '@testing-library/react';
import { render } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { vi } from 'vitest';

// Mock Zustand stores
export const mockThemeStore = {
  businessName: 'Test Business',
  logoUrl: '',
  colors: {
    primary: '#2563eb',
    secondary: '#3b82f6',
    accent: '#60a5fa',
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
    textMuted: '#9ca3af',
    backgroundPrimary: '#0f172a',
    backgroundSecondary: '#1e293b',
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    fontWeight: '400',
    lineHeight: '1.5',
    fontSizeBase: '14px',
    fontSizeHeading: '24px',
    fontWeightNormal: '400',
    fontWeightBold: '700',
  },
  icons: {
    iconTheme: 'lucide',
    iconSize: '24px',
    iconColor: '#6B7280',
    style: 'lucide',
    size: '24px',
    roomIcon: 'Radio',
  },
  uiStyle: {
    iconTheme: 'lucide',
    borderRadius: 0.5,
    spacing: 1.0,
    fontSize: '14px',
    fontFamily: 'Inter, sans-serif',
  },
  motion: {
    type: 'smooth',
    duration: '300ms',
    easing: 'ease-in-out',
    reduceMotion: false,
  },
  setBusinessName: vi.fn(),
  setLogoUrl: vi.fn(),
  setColors: vi.fn(),
  setTypography: vi.fn(),
  setIcons: vi.fn(),
  setUIStyle: vi.fn(),
  setMotion: vi.fn(),
  applyThemeByJson: vi.fn(),
};

export const mockAuthStore = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    display_name: 'Test User',
    avatar_url: null,
    role: 'admin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  session: null,
  signIn: vi.fn(),
  signOut: vi.fn(),
  updateProfile: vi.fn(),
};

export const mockRoomStore = {
  currentRoom: {
    id: 'test-room-id',
    name: 'Test Room',
    tenant_id: 'test-tenant-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  rooms: [],
  setCurrentRoom: vi.fn(),
  addRoom: vi.fn(),
  removeRoom: vi.fn(),
};

export const mockToastStore = {
  toasts: [],
  addToast: vi.fn(),
  removeToast: vi.fn(),
  clearToasts: vi.fn(),
};

// Mock Supabase client
export const createMockSupabase = () => ({
  from: vi.fn((_table: string) => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { role: 'admin', joined_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
            error: null,
          }),
        })),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })),
    insert: vi.fn().mockResolvedValue({ error: null }),
  })),
  storage: {
    from: vi.fn((_bucket: string) => ({
      upload: vi.fn().mockResolvedValue({ error: null }),
      getPublicUrl: vi.fn(() => ({
        data: { publicUrl: 'https://example.com/test-file.png' },
      })),
    })),
  },
});

// Custom render with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialState?: Record<string, unknown>;
}

export function renderWithProviders(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return <>{children}</>;
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

// Assert toast was called with message
export function expectToastCalled(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') {
  expect(mockToastStore.addToast).toHaveBeenCalledWith(
    expect.stringContaining(message),
    type
  );
}

// Reset all mocks
export function resetAllMocks() {
  vi.clearAllMocks();
  mockToastStore.toasts = [];
}
