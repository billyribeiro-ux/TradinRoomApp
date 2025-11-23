/**
 * useAuth.ts
 * ------------------------------------------------------------
 * Convenience hook for authentication
 * Re-exports useAuth from AuthContext for cleaner imports
 */

export { useAuth } from '../contexts/AuthContext';
export type { AuthContextType, AuthUser } from '../contexts/AuthContext';
