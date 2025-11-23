/**
 * ChatPanel Switcher - Toggle between FontAwesome and Fluent UI
 * This file allows you to switch between icon systems with a feature flag
 * 
 * Usage:
 * 1. Import this file instead of the original ChatPanel
 * 2. Toggle FEATURES.USE_FLUENT_UI in src/config/features.ts
 * 3. Refresh the app to see the changes
 */

import { FEATURES } from '../../config/features';

// Import original FontAwesome version
import { ChatPanel as ChatPanelFA } from './ChatPanel';

// Import Fluent UI version
import { ChatPanel as ChatPanelFluent } from '../chat/fluent/ChatPanel.fluent';

/**
 * Smart component that switches between FontAwesome and Fluent UI
 * based on the feature flag
 */
export const ChatPanel = FEATURES.USE_FLUENT_UI ? ChatPanelFluent : ChatPanelFA;

// Re-export for convenience
export default ChatPanel;
