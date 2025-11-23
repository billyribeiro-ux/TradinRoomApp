// ═══════════════════════════════════════════════════════════════
// LOGGING CONFIGURATION - Microsoft Standards
// ═══════════════════════════════════════════════════════════════
// Updated: 2025-11-01 - Consolidated to use productionLogger
// This provides enhanced features: scoped logging, performance tools,
// and zero production overhead while maintaining backward compatibility
// ═══════════════════════════════════════════════════════════════

import { logger } from '../utils/productionLogger';

/**
 * Logger factory for creating scoped loggers
 * Now uses productionLogger for enhanced features and consistency
 */
export const loggerFactory = {
  create: (name: string) => logger.scope(name)
};
