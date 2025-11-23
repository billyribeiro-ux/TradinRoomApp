/**
 * Hotkeys Hook - Microsoft Enterprise Standards
 * =========================================================
 * Manages keyboard shortcuts and hotkey combinations
 * Provides consistent hotkey behavior across the trading room
 */

import { useEffect, useCallback, useRef, useMemo } from 'react';

import { loggerFactory } from '../infrastructure';

interface HotkeyConfig {
  readonly key: string;
  readonly ctrlKey?: boolean;
  readonly shiftKey?: boolean;
  readonly altKey?: boolean;
  readonly metaKey?: boolean;
  readonly action: () => void;
  readonly description: string;
}

interface UseHotkeysProps {
  readonly hotkeys: readonly HotkeyConfig[];
  readonly enabled?: boolean;
}

export function useHotkeys({ hotkeys, enabled = true }: UseHotkeysProps): void {
  const logger = useMemo(() => loggerFactory.create('Hotkeys'), []);
  const hotkeysRef = useRef(hotkeys);
  
  // Update ref when hotkeys change
  useEffect(() => {
    hotkeysRef.current = hotkeys;
  }, [hotkeys]);

  // Check if event matches hotkey configuration
  const matchesHotkey = useCallback((event: KeyboardEvent, hotkey: HotkeyConfig): boolean => {
    return (
      event.key.toLowerCase() === hotkey.key.toLowerCase() &&
      !!event.ctrlKey === !!hotkey.ctrlKey &&
      !!event.shiftKey === !!hotkey.shiftKey &&
      !!event.altKey === !!hotkey.altKey &&
      !!event.metaKey === !!hotkey.metaKey
    );
  }, []);

  // Handle keyboard events
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;
    
    // Ignore hotkeys when user is typing in input fields
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true'
    ) {
      return;
    }

    // Find matching hotkey
    const matchedHotkey = hotkeysRef.current.find(hotkey => 
      matchesHotkey(event, hotkey)
    );

    if (matchedHotkey) {
      event.preventDefault();
      event.stopPropagation();
      
      try {
        matchedHotkey.action();
        logger.debug(`Hotkey activated: ${matchedHotkey.description}`);
      } catch (error) {
        logger.error(`Hotkey failed: ${matchedHotkey.description}`, error);
      }
    }
  }, [enabled, matchesHotkey, logger]);

  // Set up keyboard event listeners
  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown, true);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [enabled, handleKeyDown]);

  // Log available hotkeys in development
  useEffect(() => {
    if (import.meta.env.DEV && hotkeys.length > 0) {
      logger.debug(`Available hotkeys: ${hotkeys.map(h => h.description).join(', ')}`);
    }
  }, [hotkeys, logger]);
}
