import type {
  Theme,
  BrandVariants
} from '@fluentui/react-components';
import { 
  FluentProvider, 
  webDarkTheme, 
  webLightTheme, 
  Spinner,
  createDarkTheme
} from '@fluentui/react-components';
import type { ReactNode} from 'react';
import React, { Suspense, useMemo } from 'react';

import { useThemeStore } from '../../store/themeStore';

interface ThemeProviderProps {
  children: ReactNode;
  theme?: 'dark' | 'light';
}

/**
 * ThemeProvider - Microsoft Fluent Design Integration
 * Provides full theme support with custom color integration
 * Integrates user's custom colors with Fluent UI components
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  theme = 'dark' 
}) => {
  const { colors } = useThemeStore();
  
  // Create custom Fluent theme from user's colors
  const customTheme = useMemo(() => {
    // Create brand variants from primary color
    const brandVariants: BrandVariants = {
      10: colors.primary,
      20: colors.primary,
      30: colors.primary,
      40: colors.primary,
      50: colors.primary,
      60: colors.primary,
      70: colors.primary,
      80: colors.primary,
      90: colors.primary,
      100: colors.primary,
      110: colors.primary,
      120: colors.primary,
      130: colors.primary,
      140: colors.primary,
      150: colors.primary,
      160: colors.primary,
    };
    
    const baseTheme = theme === 'dark' ? webDarkTheme : webLightTheme;
    const customDarkTheme = createDarkTheme(brandVariants);
    
    // Merge with custom colors for full integration
    const mergedTheme: Theme = {
      ...baseTheme,
      ...customDarkTheme,
      colorBrandBackground: colors.primary,
      colorBrandForeground1: colors.text,
      colorNeutralBackground1: colors.background,
      colorNeutralForeground1: colors.text,
      colorNeutralForeground2: colors.textSecondary,
      colorNeutralStroke1: colors.border,
    };
    
    return mergedTheme;
  }, [colors, theme]);

  return (
    <FluentProvider theme={customTheme} dir="ltr">
      <Suspense 
        fallback={
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            width: '100vw'
          }}>
            <Spinner label="Loading Trading Room..." size="large" />
          </div>
        }
      >
        {children}
      </Suspense>
    </FluentProvider>
  );
};

export default ThemeProvider;