import { tokens } from '@fluentui/react-components';

/**
 * Small set of chat-specific tokens to centralize spacing and elevation
 * This complements Fluent tokens for local component consistency.
 */
export const CHAT_TOKENS = {
  spacingXS: tokens.spacingHorizontalXS,
  spacingS: tokens.spacingHorizontalS,
  spacingM: tokens.spacingHorizontalM,
  spacingL: tokens.spacingHorizontalL,
  groupedOffset: tokens.spacingHorizontalL,
  avatarCompact: 28,
  avatarDefault: 32,
  messagePadding: tokens.spacingVerticalS,
  elevation: tokens.shadow2,
  focusElevation: tokens.shadow4,
};

export default CHAT_TOKENS;
