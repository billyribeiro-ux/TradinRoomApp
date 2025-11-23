/**
 * Theme System End-to-End Test Utility
 * Last Updated: October 30, 2025 @ 19:45 PST
 * 
 * CRITICAL FIX: Added Microsoft Enterprise Pattern for test isolation
 * - Tests #2, #4, #7 now use try-finally blocks to preserve/restore original state
 * - Prevents test data ("Persistence Test 1761") from polluting BrandHeader display
 * - Guarantees state restoration even on test failure
 * 
 * Tests the complete theme system functionality:
 * - BrandingSettings component
 * - TypographySettings component
 * - Theme store persistence (saveTheme, loadTheme, deleteTheme)
 * - Database integration (user_themes table)
 * 
 * Usage:
 *   import { runThemeSystemTest } from './utils/themeSystemTest';
 *   await runThemeSystemTest();
 * 
 * Or call from browser console in dev mode:
 *   window.runThemeSystemTest?.()
 */

import { themeRepository } from '../repositories/themeRepository';
import { verifyUserThemesSchema } from '../services/verifySchema';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';

export interface ThemeSystemTestResult {
  passed: boolean;
  tests: {
    schemaVerification: {
      passed: boolean;
      message: string;
      details?: Record<string, unknown>;
    };
    brandingSettings: {
      passed: boolean;
      message: string;
    };
    typographySettings: {
      passed: boolean;
      message: string;
    };
    saveTheme: {
      passed: boolean;
      message: string;
      themeId?: string;
    };
    loadTheme: {
      passed: boolean;
      message: string;
    };
    deleteTheme: {
      passed: boolean;
      message: string;
    };
    persistence: {
      passed: boolean;
      message: string;
    };
  };
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
  };
}

/**
 * Run comprehensive end-to-end test of theme system
 */
export async function runThemeSystemTest(): Promise<ThemeSystemTestResult> {
  const result: ThemeSystemTestResult = {
    passed: false,
    tests: {
      schemaVerification: { passed: false, message: 'Not tested' },
      brandingSettings: { passed: false, message: 'Not tested' },
      typographySettings: { passed: false, message: 'Not tested' },
      saveTheme: { passed: false, message: 'Not tested' },
      loadTheme: { passed: false, message: 'Not tested' },
      deleteTheme: { passed: false, message: 'Not tested' },
      persistence: { passed: false, message: 'Not tested' }
    },
    summary: {
      totalTests: 7,
      passedTests: 0,
      failedTests: 0
    }
  };

  if (import.meta.env.DEV) {
    console.debug('[ThemeSystemTest] Starting comprehensive theme system test...');
  }

  try {
    // Test 1: Schema Verification
    if (import.meta.env.DEV) {
      console.debug('[ThemeSystemTest] Test 1: Verifying user_themes table schema...');
    }
    try {
      const schemaResult = await verifyUserThemesSchema();
      result.tests.schemaVerification = {
        passed: schemaResult.exists && schemaResult.matches,
        message: schemaResult.exists && schemaResult.matches
          ? 'Schema verification passed'
          : `Schema verification failed: ${schemaResult.discrepancies.join(', ')}`,
        details: {
          exists: schemaResult.exists,
          matches: schemaResult.matches,
          discrepancies: schemaResult.discrepancies
        }
      };
      if (result.tests.schemaVerification.passed) result.summary.passedTests++;
      else result.summary.failedTests++;
    } catch (error) {
      result.tests.schemaVerification = {
        passed: false,
        message: `Schema verification error: ${error instanceof Error ? error.message : String(error)}`
      };
      result.summary.failedTests++;
    }

    // Test 2: Branding Settings Store Integration
    if (import.meta.env.DEV) {
      console.debug('[ThemeSystemTest] Test 2: Testing branding settings store integration...');
    }
    const originalBusinessName = useThemeStore.getState().businessName;
    const originalLogoUrl = useThemeStore.getState().logoUrl;
    try {
      const { setBusinessName, setLogoUrl } = useThemeStore.getState();
      
      // Test business name
      const testBusinessName = 'Test Business';
      setBusinessName(testBusinessName);
      const updatedBusinessName = useThemeStore.getState().businessName;
      
      if (updatedBusinessName !== testBusinessName) {
        throw new Error(`Business name not updated: expected "${testBusinessName}", got "${updatedBusinessName}"`);
      }

      // Test logo URL
      const testLogoUrl = 'https://example.com/logo.png';
      setLogoUrl(testLogoUrl);
      const updatedLogoUrl = useThemeStore.getState().logoUrl;
      
      if (updatedLogoUrl !== testLogoUrl) {
        throw new Error(`Logo URL not updated: expected "${testLogoUrl}", got "${updatedLogoUrl}"`);
      }

      result.tests.brandingSettings = {
        passed: true,
        message: 'Branding settings store integration working correctly'
      };
      result.summary.passedTests++;

    } catch (error) {
      result.tests.brandingSettings = {
        passed: false,
        message: `Branding settings test failed: ${error instanceof Error ? error.message : String(error)}`
      };
      result.summary.failedTests++;
    } finally {
        // Microsoft Pattern: ALWAYS restore, even on failure
        useThemeStore.getState().setBusinessName(originalBusinessName);
        useThemeStore.getState().setLogoUrl(originalLogoUrl);
    }

    // Test 3: Typography Settings Store Integration
    if (import.meta.env.DEV) {
      console.debug('[ThemeSystemTest] Test 3: Testing typography settings store integration...');
    }
    try {
      const { setTypography } = useThemeStore.getState();
      
      const testTypography = {
        fontFamily: 'Roboto, sans-serif',
        fontSize: '16px',
        fontWeight: '400',
        lineHeight: '1.5',
        fontSizeBase: '16px',
        fontSizeHeading: '24px',
        fontWeightNormal: '400',
        fontWeightBold: '700'
      };

      setTypography(testTypography);
      const updatedTypography = useThemeStore.getState().typography;
      
      if (updatedTypography.fontFamily !== testTypography.fontFamily ||
          updatedTypography.fontSizeBase !== testTypography.fontSizeBase) {
        throw new Error('Typography not updated correctly');
      }

      result.tests.typographySettings = {
        passed: true,
        message: 'Typography settings store integration working correctly'
      };
      result.summary.passedTests++;
    } catch (error) {
      result.tests.typographySettings = {
        passed: false,
        message: `Typography settings test failed: ${error instanceof Error ? error.message : String(error)}`
      };
      result.summary.failedTests++;
    }

    // Test 4: Save Theme
    if (import.meta.env.DEV) {
      console.debug('[ThemeSystemTest] Test 4: Testing saveTheme functionality...');
    }
    let savedThemeId: string | undefined;
    const originalBusinessName4 = useThemeStore.getState().businessName;
    const originalLogoUrl4 = useThemeStore.getState().logoUrl;
    try {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) {
        result.tests.saveTheme = {
          passed: false,
          message: 'User not authenticated - cannot test saveTheme'
        };
        result.summary.failedTests++;
      } else {
        const { currentTheme, saveTheme } = useThemeStore.getState();
        
        if (!currentTheme) {
          result.tests.saveTheme = {
            passed: false,
            message: 'No current theme to save'
          };
          result.summary.failedTests++;
        } else {
          // Set a test theme name to identify test theme
          useThemeStore.getState().setThemeName('E2E Test Theme');
          
          // Save theme
          await saveTheme(currentTheme);

          // Verify theme was saved to database
          const savedThemes = await themeRepository.getThemesByUser(userId);
          const testTheme = savedThemes.find(t => t.name === 'E2E Test Theme');
          
          if (!testTheme) {
            throw new Error('Theme was not saved to database');
          }

          savedThemeId = testTheme.id;

          result.tests.saveTheme = {
            passed: true,
            message: 'saveTheme working correctly',
            themeId: savedThemeId
          };
          result.summary.passedTests++;
        }
      }
    } catch (error) {
      result.tests.saveTheme = {
        passed: false,
        message: `saveTheme test failed: ${error instanceof Error ? error.message : String(error)}`
      };
      result.summary.failedTests++;
    } finally {
      // Microsoft Pattern: ALWAYS restore, even on failure
      useThemeStore.getState().setBusinessName(originalBusinessName4);
      useThemeStore.getState().setLogoUrl(originalLogoUrl4);
    }

    // Test 5: Load Theme
    if (import.meta.env.DEV) {
      console.debug('[ThemeSystemTest] Test 5: Testing loadTheme functionality...');
    }
    try {
      if (!savedThemeId) {
        result.tests.loadTheme = {
          passed: false,
          message: 'No saved theme ID from previous test'
        };
        result.summary.failedTests++;
      } else {
        const { loadTheme } = useThemeStore.getState();
        await loadTheme(savedThemeId);

        // Verify theme was loaded
        const loadedThemeName = useThemeStore.getState().themeName;
        if (loadedThemeName !== 'E2E Test Theme') {
          throw new Error('Theme was not loaded correctly');
        }

        result.tests.loadTheme = {
          passed: true,
          message: 'loadTheme working correctly'
        };
        result.summary.passedTests++;
      }
    } catch (error) {
      result.tests.loadTheme = {
        passed: false,
        message: `loadTheme test failed: ${error instanceof Error ? error.message : String(error)}`
      };
      result.summary.failedTests++;
    }

    // Test 6: Delete Theme
    if (import.meta.env.DEV) {
      console.debug('[ThemeSystemTest] Test 6: Testing deleteTheme functionality...');
    }
    try {
      if (!savedThemeId) {
        result.tests.deleteTheme = {
          passed: false,
          message: 'No saved theme ID from previous test'
        };
        result.summary.failedTests++;
      } else {
        const userId = useAuthStore.getState().user?.id;
        if (!userId) {
          result.tests.deleteTheme = {
            passed: false,
            message: 'User not authenticated - cannot test deleteTheme'
          };
          result.summary.failedTests++;
        } else {
          const { deleteTheme } = useThemeStore.getState();
          await deleteTheme(savedThemeId);

          // Verify theme was deleted
          const themes = await themeRepository.getThemesByUser(userId);
          const deletedTheme = themes.find(t => t.id === savedThemeId);
          
          if (deletedTheme) {
            throw new Error('Theme was not deleted from database');
          }

          result.tests.deleteTheme = {
            passed: true,
            message: 'deleteTheme working correctly'
          };
          result.summary.passedTests++;
        }
      }
    } catch (error) {
      result.tests.deleteTheme = {
        passed: false,
        message: `deleteTheme test failed: ${error instanceof Error ? error.message : String(error)}`
      };
      result.summary.failedTests++;
    }

    // Test 7: Persistence Verification
    if (import.meta.env.DEV) {
      console.debug('[ThemeSystemTest] Test 7: Testing theme persistence...');
    }
    const originalBusinessName7 = useThemeStore.getState().businessName;
    const originalLogoUrl7 = useThemeStore.getState().logoUrl;
    try {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) {
        result.tests.persistence = {
          passed: false,
          message: 'User not authenticated - cannot test persistence'
        };
        result.summary.failedTests++;
      } else {
        // Create a test theme
        const testThemeName = `Persistence Test ${Date.now()}`;
        useThemeStore.getState().setThemeName(testThemeName);
        const { currentTheme, saveTheme } = useThemeStore.getState();
        
        if (!currentTheme) {
          result.tests.persistence = {
            passed: false,
            message: 'No current theme to test persistence'
          };
          result.summary.failedTests++;
        } else {
          await saveTheme(currentTheme);

          // Verify it's in database
          const themes = await themeRepository.getThemesByUser(userId);
          const persistedTheme = themes.find(t => t.name === testThemeName);
          
          if (!persistedTheme) {
            throw new Error('Theme was not persisted to database');
          }

          // Clean up test theme
          await useThemeStore.getState().deleteTheme(persistedTheme.id);

          result.tests.persistence = {
            passed: true,
            message: 'Theme persistence working correctly'
          };
          result.summary.passedTests++;
        }
      }
    } catch (error) {
      result.tests.persistence = {
        passed: false,
        message: `Persistence test failed: ${error instanceof Error ? error.message : String(error)}`
      };
      result.summary.failedTests++;
    } finally {
      // Microsoft Pattern: ALWAYS restore, even on failure
      useThemeStore.getState().setBusinessName(originalBusinessName7);
      useThemeStore.getState().setLogoUrl(originalLogoUrl7);
    }

    // Calculate overall result
    result.passed = result.summary.passedTests === result.summary.totalTests;

    if (import.meta.env.DEV) {
      console.debug('[ThemeSystemTest] Test complete:', {
        passed: result.passed,
        summary: result.summary,
        tests: result.tests
      });
    }

    return result;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[ThemeSystemTest] Fatal error during testing:', error);
    }
    result.passed = false;
    return result;
  }
}

// Make available in browser console for dev mode
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).runThemeSystemTest = runThemeSystemTest;
  console.debug('[ThemeSystemTest] Test utility available at window.runThemeSystemTest()');
}

