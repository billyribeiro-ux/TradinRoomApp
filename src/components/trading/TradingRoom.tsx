// =========================================================
// PART 1 — Imports, Constants, and Universal Responsiveness
// =========================================================

import React from 'react';

import type { Room, ChatMessage, Alert } from '../../types/database.types';

import { TradingRoomContainer } from './TradingRoomContainer';

// =========================================================
// TradingRoom Component - Clean Microsoft Enterprise Architecture
// =========================================================

interface TradingRoomProps {
  room: Room;
  onLeave: () => void;
  initialAlerts?: Alert[];
  initialMessages?: ChatMessage[];
}

export function TradingRoom({ 
  room, 
  onLeave,
  initialAlerts: _initialAlerts = [],
  initialMessages: _initialMessages = []
}: TradingRoomProps) {
  // =========================================================
  // DELEGATED TO CONTAINER - Microsoft Enterprise Pattern
  // =========================================================
  return (
    <TradingRoomContainer
      room={room}
      onLeave={onLeave}
    />
  );
}

// =========================================================
// PART 4 — Error Boundary (Microsoft Standard)
// =========================================================

export class TradingRoomErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message?: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { 
      hasError: true, 
      message: error?.message ?? 'Unexpected Error' 
    };
  }
  
  override componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[TradingRoom Error]', error, info);
  }
  
  override render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-slate-900 text-white">
          <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
          <p className="opacity-80 mb-4">{this.state.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition"
          >
            Reload Room
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}