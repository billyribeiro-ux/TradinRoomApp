/**
 * sessionManager.ts
 * Microsoft Enterprise-Grade Session Management Service
 * 
 * Purpose: Centralized session monitoring and management
 * Created: October 25, 2025
 * Status: Production Ready
 */

export interface SessionData {
  userId: string;
  sessionId: string;
  startTime: number;
  lastActivity: number;
  isActive: boolean;
  metadata?: Record<string, unknown>;
}

export interface SessionManagerConfig {
  sessionTimeout: number; // milliseconds
  checkInterval: number; // milliseconds
  maxSessions: number;
}

export class SessionManager {
  private static instance: SessionManager;
  private sessions: Map<string, SessionData> = new Map();
  private config: SessionManagerConfig;
  private monitoringInterval: NodeJS.Timeout | undefined;
  private isMonitoring: boolean = false;

  private constructor() {
    this.config = {
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      checkInterval: 60 * 1000, // 1 minute
      maxSessions: 1000
    };
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  public startMonitoring(): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, this.config.checkInterval);

    console.log('Session monitoring started');
  }

  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isMonitoring = false;
    console.log('Session monitoring stopped');
  }

  public createSession(userId: string, metadata?: Record<string, unknown>): string {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    const sessionData: SessionData = {
      userId,
      sessionId,
      startTime: now,
      lastActivity: now,
      isActive: true,
      metadata
    };

    this.sessions.set(sessionId, sessionData);
    this.cleanupOldSessions();

    console.log(`Session created: ${sessionId} for user: ${userId}`);
    return sessionId;
  }

  public updateSessionActivity(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    session.lastActivity = Date.now();
    session.isActive = true;
    return true;
  }

  public endSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    session.isActive = false;
    console.log(`Session ended: ${sessionId}`);
    return true;
  }

  public getSession(sessionId: string): SessionData | undefined {
    return this.sessions.get(sessionId);
  }

  public getActiveSessions(): SessionData[] {
    return Array.from(this.sessions.values()).filter(session => session.isActive);
  }

  public getSessionsForUser(userId: string): SessionData[] {
    return Array.from(this.sessions.values()).filter(session => session.userId === userId);
  }

  private cleanupExpiredSessions(): void {
    const now = Date.now();
    const expiredSessions: string[] = [];

    for (const [sessionId, session] of this.sessions) {
      if (now - session.lastActivity > this.config.sessionTimeout) {
        expiredSessions.push(sessionId);
      }
    }

    expiredSessions.forEach(sessionId => {
      const session = this.sessions.get(sessionId);
      if (session) {
        session.isActive = false;
        console.log(`Session expired: ${sessionId}`);
      }
    });
  }

  private cleanupOldSessions(): void {
    if (this.sessions.size <= this.config.maxSessions) {
      return;
    }

    // Remove oldest inactive sessions
    const inactiveSessions = Array.from(this.sessions.entries())
      .filter(([_, session]) => !session.isActive)
      .sort((a, b) => a[1].lastActivity - b[1].lastActivity);

    const sessionsToRemove = inactiveSessions.slice(0, this.sessions.size - this.config.maxSessions);
    sessionsToRemove.forEach(([sessionId]) => {
      this.sessions.delete(sessionId);
    });
  }

  public getSessionStats(): {
    totalSessions: number;
    activeSessions: number;
    expiredSessions: number;
  } {
    const sessions = Array.from(this.sessions.values());
    return {
      totalSessions: sessions.length,
      activeSessions: sessions.filter(s => s.isActive).length,
      expiredSessions: sessions.filter(s => !s.isActive).length
    };
  }

  public configure(config: Partial<SessionManagerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();
