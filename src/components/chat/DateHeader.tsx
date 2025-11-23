/**
 * DateHeader Component - Microsoft Enterprise Pattern
 * Displays date separators between messages
 */

import { format } from 'date-fns';

import { PANEL_COLORS } from '../panelColors';

interface DateHeaderProps {
  date: Date;
}

/**
 * DateHeader - Shows formatted date separator
 * @param date - Date to display
 * @returns Formatted date header with horizontal lines
 * @remarks Format: "Wednesday, October 21, 2025" (matches AlertsPanel)
 */
export function DateHeader({ date }: DateHeaderProps) {
  return (
    <div className="flex items-center justify-center my-4">
      <div className={`flex-1 border-t ${PANEL_COLORS.container.divider}`}></div>
      <span className={`px-4 text-xs font-semibold ${PANEL_COLORS.text.secondary} uppercase tracking-wider`}>
        {format(date, 'EEEE, MMMM d, yyyy')}
      </span>
      <div className={`flex-1 border-t ${PANEL_COLORS.container.divider}`}></div>
    </div>
  );
}
