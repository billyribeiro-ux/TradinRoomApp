/**
 * Feature Flags Configuration
 * Toggle features on/off without code changes
 */

export const FEATURES = {
  /**
   * Use Fluent UI icons instead of FontAwesome
   * - false: Original FontAwesome icons (default)
   * - true: New Microsoft Fluent UI icons
   * 
   * To switch: Just change this value and refresh
   */
  USE_FLUENT_UI: true,
  
  /**
   * Enable experimental chat features
   */
  EXPERIMENTAL_CHAT: false,
  
  /**
   * Enable LiveKit video/audio features
   * - false: Disable LiveKit (saves quota, app works without it)
   * - true: Enable LiveKit video/audio
   */
  ENABLE_LIVEKIT: false,
} as const;

// Helper functions
export const useFluentUI = () => FEATURES.USE_FLUENT_UI;
export const useExperimentalChat = () => FEATURES.EXPERIMENTAL_CHAT;

// Type-safe feature flag access
export type FeatureFlags = typeof FEATURES;
export type FeatureName = keyof FeatureFlags;
