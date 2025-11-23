import * as React from 'react';
import { memo } from 'react';

// Reuse your existing modal as-is
import { PostAlertModal } from '../../features/PostAlertModal';

import type { AlertPayload } from './alerts.types';

/**
 * Bridges PostAlertModal → AlertsEntry (sendAlert)
 * - Keeps your modal unchanged
 * - Note: PostAlertModal handles submission internally; this adapter just forwards onClose
 */
interface AlertsComposerAdapterProps {
  onSubmit: (payload: AlertPayload) => void;
  isOpen?: boolean;
  onClose?: () => void;
  // If your modal needs extra props, add them here and forward below.
}

function AlertsComposerAdapterBase({
  onSubmit: _onSubmit,
  isOpen = false, // Microsoft Pattern: Default CLOSED
  onClose,
}: AlertsComposerAdapterProps): React.ReactElement | null {
  // PostAlertModal handles submission internally via createAlert
  // The onSubmit prop is kept for compatibility with the entry interface
  // but not used since PostAlertModal doesn't accept it
  
  // Only render if explicitly opened
  if (!isOpen) {
    return null;
  }
  
  return (
    <PostAlertModal
      onClose={onClose ?? (() => {})}
    />
  );
}

export const AlertsComposerAdapter = memo(AlertsComposerAdapterBase);
export type { AlertsComposerAdapterProps };
