import { useState } from 'react';

/**
 * TestTradingRoomShell
 * Minimal, deterministic shell to satisfy E2E selectors without backend.
 * Provides:
 * - [data-trading-room] root
 * - mic toggle: [data-testid="mic-toggle"] (aria-pressed)
 * - screenshare toggle: [data-testid="screenshare-toggle"] toggles tile [data-testid="screenshare-tile"]
 * - chat input: [data-testid="chat-input"], send button [data-testid="send-message"], messages [data-testid="chat-message"]
 * - panels: [data-testid="alerts-panel"], [data-testid="chat-panel"], [data-testid="video-stage"], [data-testid="participants-list"]
 */
export function TestTradingRoomShell() {
  const [micOn, setMicOn] = useState(false);
  const [shareOn, setShareOn] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [showBranding, setShowBranding] = useState(false);
  const [activeTab, setActiveTab] = useState<'Basic' | 'Colors' | 'Typography'>('Basic');
  const [businessName, setBusinessName] = useState('');

  return (
    <div data-trading-room style={{ minHeight: '100vh', display: 'grid', gridTemplateRows: 'auto 1fr', background: '#0f172a', color: '#e2e8f0' }}>
      {/* Header with controls */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 12, borderBottom: '1px solid #334155' }}>
        <button
          data-testid="mic-toggle"
          aria-pressed={micOn ? 'true' : 'false'}
          onClick={() => setMicOn(v => !v)}
          style={{ padding: '8px 12px', background: micOn ? '#16a34a' : '#334155', borderRadius: 8 }}
        >
          {micOn ? 'Mic On' : 'Mic Muted'}
        </button>
        <button
          data-testid="screenshare-toggle"
          aria-pressed={shareOn ? 'true' : 'false'}
          onClick={() => setShareOn(v => !v)}
          style={{ padding: '8px 12px', background: shareOn ? '#0ea5e9' : '#334155', borderRadius: 8 }}
        >
          {shareOn ? 'Stop Share' : 'Start Share'}
        </button>
        <button
          data-testid="theme-settings"
          style={{ padding: '8px 12px', background: '#334155', borderRadius: 8 }}
          onClick={() => setShowBranding(true)}
        >
          Theme
        </button>
      </div>

      {/* Main content */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 300px', gap: 12, padding: 12 }}>
        {/* Alerts panel */}
        <aside data-testid="alerts-panel" className="alerts-panel" style={{ background: '#1f2937', borderRadius: 12, padding: 12, minHeight: 160, overflow: 'hidden' }}>
          <h3 style={{ margin: 0, fontSize: 14, opacity: 0.8 }}>Alerts</h3>
          <div style={{ height: 120, marginTop: 8, overflow: 'auto' }}>
            <div style={{ height: 60, background: '#374151', borderRadius: 8 }} />
          </div>
        </aside>

        {/* Video stage */}
        <section data-testid="video-stage" className="video-stage" style={{ background: '#111827', borderRadius: 12, padding: 12, minHeight: 240, position: 'relative' }}>
          <h3 style={{ margin: 0, fontSize: 14, opacity: 0.8 }}>Stage</h3>
          {shareOn && (
            <div data-testid="screenshare-tile" className="screenshare-tile" style={{ position: 'absolute', inset: 12, background: '#0ea5e9', borderRadius: 8 }} />
          )}
        </section>

        {/* Chat panel */}
        <aside data-testid="chat-panel" className="chat-panel" style={{ background: '#1f2937', borderRadius: 12, padding: 12, minHeight: 240 }}>
          <h3 style={{ margin: 0, fontSize: 14, opacity: 0.8 }}>Chat</h3>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input
              data-testid="chat-input"
              placeholder="Type a message"
              value={input}
              onChange={e => setInput(e.target.value)}
              style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #334155', background: '#0b1220', color: '#e2e8f0' }}
            />
            <button
              data-testid="send-message"
              onClick={() => {
                if (input.trim()) {
                  setMessages(m => [...m, input.trim()]);
                  setInput('');
                }
              }}
              style={{ padding: '8px 12px', background: '#334155', borderRadius: 8 }}
            >
              Send
            </button>
          </div>
          <div style={{ marginTop: 12, display: 'grid', gap: 6 }}>
            {messages.map((m, idx) => (
              <div key={idx} data-testid="chat-message" className="message-item" style={{ background: '#0b1220', padding: 8, borderRadius: 8 }}>
                {m}
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* Participants list (optional) */}
      <div data-testid="participants-list" className="users-panel" style={{ display: 'none' }} />

      {/* Simple Branding Modal for E2E */}
      {showBranding && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'grid', placeItems: 'center' }}>
          <div className="modal" style={{ width: 640, maxWidth: '90vw', background: '#0b1220', color: '#e2e8f0', borderRadius: 12, border: '1px solid #334155', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottom: '1px solid #1f2937' }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>Advanced Branding</h2>
              <button aria-label="Close" onClick={() => setShowBranding(false)} style={{ padding: 8, borderRadius: 8, background: '#111827', color: '#e2e8f0' }}>✕</button>
            </div>
            <div style={{ display: 'flex', gap: 12, padding: 16 }}>
              {/* Tabs */}
              <div role="tablist" aria-label="Branding Tabs" style={{ display: 'flex', gap: 8 }}>
                {(['Basic','Colors','Typography'] as const).map(tab => (
                  <button
                    key={tab}
                    role="tab"
                    aria-selected={activeTab === tab}
                    className="fluent-tab"
                    onClick={() => setActiveTab(tab)}
                    style={{ padding: '8px 12px', borderRadius: 8, background: activeTab === tab ? '#1f2937' : '#111827', color: '#e2e8f0', border: '1px solid #334155' }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ padding: 16, borderTop: '1px solid #1f2937' }}>
              {activeTab === 'Basic' && (
                <div style={{ display: 'grid', gap: 12 }}>
                  <label style={{ display: 'grid', gap: 6 }}>
                    <span>Business Name</span>
                    <input
                      placeholder="Enter business name"
                      value={businessName}
                      onChange={e => setBusinessName(e.target.value)}
                      style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #334155', background: '#0b1220', color: '#e2e8f0' }}
                    />
                  </label>
                  <label style={{ display: 'grid', gap: 6 }}>
                    <span>Logo Upload</span>
                    <input type="file" />
                  </label>
                </div>
              )}
              {activeTab === 'Colors' && (
                <div style={{ display: 'grid', gap: 12 }}>
                  <div>Primary Color</div>
                  <input type="color" defaultValue="#0ea5e9" />
                </div>
              )}
              {activeTab === 'Typography' && (
                <div style={{ display: 'grid', gap: 12 }}>
                  <div>Font Family</div>
                  <select defaultValue="Inter" style={{ padding: '8px 12px', borderRadius: 8, background: '#0b1220', color: '#e2e8f0', border: '1px solid #334155' }}>
                    <option>Inter</option>
                    <option>system-ui</option>
                    <option>Georgia</option>
                  </select>
                </div>
              )}
            </div>
            <div style={{ padding: 16, borderTop: '1px solid #1f2937', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setShowBranding(false)} style={{ padding: '8px 12px', borderRadius: 8, background: '#111827', color: '#e2e8f0' }}>Close</button>
              <button onClick={() => setShowBranding(false)} style={{ padding: '8px 12px', borderRadius: 8, background: '#16a34a', color: '#0b1220' }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
