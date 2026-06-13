/**
 * App.tsx — Root Application Shell
 * Microsoft Enterprise Architecture version
 * 
 * CRITICAL FIX: Moved ALL component definitions outside App() to prevent re-creation
 * on every render, which was causing infinite mount/unmount cycles downstream
 */

import { lazy, Suspense, useEffect, type FC, type ReactNode } from 'react';
import '../icons/fa';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { FluentProvider, webDarkTheme, Spinner, type Theme } from '@fluentui/react-components';

// Removed unused supabase import - authStore.initialize() is single source of truth
// Lightweight, always-mounted global UI is imported eagerly.
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import type { Session, User } from '@supabase/supabase-js';
import { ToastContainer } from '../components/ToastContainer';
import { ImageModal } from '../components/modals/ImageModal';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';

// Route-level code splitting: each screen (and the heavy trading-room / whiteboard
// / video stack it pulls in) is loaded on demand so the auth screen no longer
// ships the entire application in the initial bundle. Components are named
// exports, hence the `.then` adapter to the default-export shape `lazy` expects.
const EnhancedAuthPage = lazy(() =>
  import('../components/icons/EnhancedAuthPage').then((m) => ({ default: m.EnhancedAuthPage }))
);
const RoomSelector = lazy(() =>
  import('../components/rooms/RoomSelector').then((m) => ({ default: m.RoomSelector }))
);
const TradingRoomWrapper = lazy(() =>
  import('../components/trading/TradingRoomWrapper').then((m) => ({ default: m.TradingRoomWrapper }))
);
const NotesView = lazy(() =>
  import('../components/trading/NotesView').then((m) => ({ default: m.NotesView }))
);
const TestTradingRoomShell = lazy(() =>
  import('../components/trading/TestTradingRoomShell').then((m) => ({ default: m.TestTradingRoomShell }))
);
const TestWhiteboardHarness = lazy(() =>
  import('../components/testing/TestWhiteboardHarness').then((m) => ({ default: m.TestWhiteboardHarness }))
);

/** Centered spinner used as the Suspense fallback while a route chunk loads. */
const RouteFallback: FC = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: '#111827',
    }}
  >
    <Spinner label="Loading…" />
  </div>
);

// 🔥 CRITICAL: Hoist ProtectedRoute outside to prevent recreation
interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: FC<ProtectedRouteProps> = ({ children }) => {
  const { session, initialized } = useAuthStore();
  
  if (!initialized) {
    const path = typeof window !== 'undefined' ? window.location.pathname : '';
    // Fast-path: allow test whiteboard route to render immediately without auth/session
    if (path.startsWith('/__test_whiteboard')) {
      return (
        <FluentProvider theme={webDarkTheme} dir="ltr">
          <TestWhiteboard />
        </FluentProvider>
      );
    }
    return (
      <FluentProvider theme={webDarkTheme} dir="ltr">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            backgroundColor: '#111827',
          }}
        >
          <Spinner label="Loading Trading Platform..." />
        </div>
      </FluentProvider>
    );
  }

  if (!session) {
    console.log('[ProtectedRoute] No session, redirecting to login');
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

// Test-session injector for E2E routes (bypasses real auth for deterministic tests)
const InjectTestSession: FC<{ children: ReactNode }> = ({ children }) => {
  const { initialized, session } = useAuthStore();
  useEffect(() => {
    if (initialized && !session) {
      // Minimal fake user/session (satisfies TradingRoom + ProtectedRoute expectations)
      const fakeUser: Partial<User> = {
        id: 'test-user',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        aud: 'authenticated',
        role: 'authenticated',
        email_confirmed_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        is_anonymous: false,
        user_metadata: {},
        app_metadata: {},
      };
      const fakeSession: Partial<Session> = {
        access_token: 'test-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: 'test-refresh-token',
        user: fakeUser as User,
      };
      // Directly set session in store
      useAuthStore.getState().setSession(fakeSession as Session);
    }
  }, [initialized, session]);
  return <>{children}</>;
};

// Test Trading Room route wrapper (grabs param and renders room wrapper)
const TestTradingRoom: FC = () => {
  return (
    <InjectTestSession>
      <TestTradingRoomShell />
    </InjectTestSession>
  );
};

// Test Whiteboard route wrapper (always active overlay + toolbar)
const TestWhiteboard: FC = () => (
  <InjectTestSession>
    <TestWhiteboardHarness />
  </InjectTestSession>
);

// 🔥 CRITICAL: AppRoutes component outside App() to prevent re-creation
const AppRoutes: FC = () => {
  const { session } = useAuthStore();
  const { currentTheme } = useThemeStore();
  const navigate = useNavigate();

  return (
    <FluentProvider theme={(currentTheme as Partial<Theme>) || webDarkTheme} dir="ltr">
      <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* Public routes - session-based check */}
        <Route 
          path="/auth" 
          element={!session ? <EnhancedAuthPage /> : <Navigate to="/" replace />} 
        />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <RoomSelector onSelectRoom={(room) => navigate(`/room/${room.id}`)} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/room/:roomId"
          element={
            <ProtectedRoute>
              <TradingRoomWrapper />
            </ProtectedRoute>
          }
        />

        {/* Test-only NotesView route (now always included for E2E reliability) */}
        <Route
          path="/__test_notes"
          element={
            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
              <NotesView
                roomId="test-room"
                roomName="Test Room"
                isAdmin={true}
                autoInit={true}
              />
            </div>
          }
        />
        {/* Test-only Trading Room route (bypasses ProtectedRoute) */}
        <Route path="/__test_trading/:roomId" element={<TestTradingRoom />} />
        {/* Test-only Whiteboard route */}
        <Route path="/__test_whiteboard" element={<TestWhiteboard />} />
        {/* Default fallback - session-based check */}
        <Route path="*" element={<Navigate to={session ? '/' : '/auth'} replace />} />
      </Routes>
      </Suspense>

      {/* Global toast notifications */}
      <ToastContainer />
      
      {/* Global image modal */}
      <ImageModal />
      
      {/* Theme switcher - only show when logged in */}
      {session && <ThemeSwitcher />}
    </FluentProvider>
  );
};

export function App() {
  const { initialized, initialize } = useAuthStore();

  // Microsoft pattern: Initialize auth on app load
  useEffect(() => {
    initialize();
  }, []);

  // Microsoft Pattern: Don't verify session here - authStore.initialize() is the single source of truth
  // Removed redundant DEBUG auth verification to prevent race conditions

  // Loading state - wait for auth initialization
  if (!initialized) {
    return (
      <FluentProvider theme={webDarkTheme} dir="ltr">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            backgroundColor: '#111827',
          }}
        >
          <Spinner label="Loading Trading Platform..." />
        </div>
      </FluentProvider>
    );
  }

  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
