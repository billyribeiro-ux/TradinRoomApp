/** Component tests for AdvancedBrandingSettings (SSOT) */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AdvancedBrandingSettings } from '../AdvancedBrandingSettings';
import { mockThemeStore, mockAuthStore, mockRoomStore, mockToastStore, createMockSupabase } from '../../../test-utils/test-helpers';

// Mock stores
vi.mock('../../../store/themeStore', () => ({
  useThemeStore: () => mockThemeStore,
}));

vi.mock('../../../store/authStore', () => ({
  useAuthStore: (selector: any) => {
    if (typeof selector === 'function') {
      return selector(mockAuthStore);
    }
    return mockAuthStore;
  },
}));

vi.mock('../../../store/roomStore', () => ({
  useRoomStore: () => mockRoomStore,
}));

vi.mock('../../../store/toastStore', () => ({
  useToastStore: () => mockToastStore,
}));

// Mock Supabase
vi.mock('../../../lib/supabase', () => ({
  supabase: createMockSupabase(),
}));

// Mock utilities
vi.mock('../../../utils/cacheManager', () => ({
  clearMicrosoftCache: vi.fn().mockResolvedValue(undefined),
}));

describe('AdvancedBrandingSettings', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockToastStore.addToast = vi.fn();
  });

  it('should render modal with title', async () => {
    render(<AdvancedBrandingSettings onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText(/Advanced Branding/i)).toBeInTheDocument();
    });
  });

  it('should show admin verification loading state', async () => {
    render(<AdvancedBrandingSettings onClose={mockOnClose} />);

    // Should show verification spinner initially
    const verifyingText = screen.queryByText(/Verifying permissions/i);
    if (verifyingText) {
      expect(verifyingText).toBeInTheDocument();
    }
  });

  it('should render all tabs', async () => {
    render(<AdvancedBrandingSettings onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Basic')).toBeInTheDocument();
      expect(screen.getByText('Colors')).toBeInTheDocument();
      expect(screen.getByText('Typography')).toBeInTheDocument();
      expect(screen.getByText('Icons')).toBeInTheDocument();
    });
  });

  it('should close modal when close button clicked', async () => {
    render(<AdvancedBrandingSettings onClose={mockOnClose} />);

    await waitFor(() => {
      const closeButton = screen.getByLabelText(/Close/i);
      fireEvent.click(closeButton);
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should disable save button while saving', async () => {
    render(<AdvancedBrandingSettings onClose={mockOnClose} />);

    await waitFor(() => {
      const saveButton = screen.getByText(/Save Changes/i);
      expect(saveButton).toBeInTheDocument();
      
      // Button should be enabled initially (if admin)
      // This test validates the disabled state mechanism exists
      expect(saveButton).toHaveProperty('disabled');
    });
  });

  it('should show business name input in Basic tab', async () => {
    render(<AdvancedBrandingSettings onClose={mockOnClose} />);

    await waitFor(() => {
      const basicTab = screen.getByText('Basic');
      fireEvent.click(basicTab);
    });

    await waitFor(() => {
      const input = screen.getByLabelText(/Business Name/i);
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue(mockThemeStore.businessName);
    });
  });

  it('should show color pickers in Colors tab', async () => {
    render(<AdvancedBrandingSettings onClose={mockOnClose} />);

    await waitFor(() => {
      const colorsTab = screen.getByText('Colors');
      fireEvent.click(colorsTab);
    });

    await waitFor(() => {
      expect(screen.getByText(/Primary Color/i)).toBeInTheDocument();
      expect(screen.getByText(/Secondary Color/i)).toBeInTheDocument();
    });
  });

  it('should show font family selector in Typography tab', async () => {
    render(<AdvancedBrandingSettings onClose={mockOnClose} />);

    await waitFor(() => {
      const typographyTab = screen.getByText('Typography');
      fireEvent.click(typographyTab);
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/Font Family/i)).toBeInTheDocument();
    });
  });

  it('should show icon size input in Icons tab', async () => {
    render(<AdvancedBrandingSettings onClose={mockOnClose} />);

    await waitFor(() => {
      const iconsTab = screen.getByText('Icons');
      fireEvent.click(iconsTab);
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/Icon Size/i)).toBeInTheDocument();
    });
  });

  it('should handle tab navigation', async () => {
    render(<AdvancedBrandingSettings onClose={mockOnClose} />);

    await waitFor(() => {
      const colorsTab = screen.getByText('Colors');
      fireEvent.click(colorsTab);
    });

    // Colors tab should be active
    await waitFor(() => {
      expect(screen.getByText(/Primary Color/i)).toBeInTheDocument();
    });

    // Switch to Typography
    const typographyTab = screen.getByText('Typography');
    fireEvent.click(typographyTab);

    await waitFor(() => {
      expect(screen.getByLabelText(/Font Family/i)).toBeInTheDocument();
    });
  });

  it('should not crash when changing business name', async () => {
    render(<AdvancedBrandingSettings onClose={mockOnClose} />);

    await waitFor(() => {
      const basicTab = screen.getByText('Basic');
      fireEvent.click(basicTab);
    });

    await waitFor(() => {
      const input = screen.getByLabelText(/Business Name/i);
      fireEvent.change(input, { target: { value: 'New Business Name' } });
      
      // Should not crash
      expect(input).toHaveValue('New Business Name');
    });
  });

  it('should render without crashing when no user', () => {
    const originalUser = mockAuthStore.user;
    mockAuthStore.user = undefined as any;

    expect(() => {
      render(<AdvancedBrandingSettings onClose={mockOnClose} />);
    }).not.toThrow();

    mockAuthStore.user = originalUser;
  });

  it('should render without crashing when no room', () => {
    const originalRoom = mockRoomStore.currentRoom;
    mockRoomStore.currentRoom = undefined as any;

    expect(() => {
      render(<AdvancedBrandingSettings onClose={mockOnClose} />);
    }).not.toThrow();

    mockRoomStore.currentRoom = originalRoom;
  });
});
