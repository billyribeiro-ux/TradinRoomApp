import { create } from 'zustand';

interface SoundState {
  volume: number;
  muted: boolean;
  // Category toggles
  alertsEnabled: boolean;
  qaEnabled: boolean;
  ntaEnabled: boolean;
  chatEnabled: boolean;
  // Preferences
  subtitlesEnabled: boolean;
  doNotDisturb: boolean;
  // Derived
  effectiveMuted: boolean;

  // Back-compat
  sound: boolean;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleSound: () => void;

  // Setters
  setAlertsEnabled: (enabled: boolean) => void;
  setQaEnabled: (enabled: boolean) => void;
  setNtaEnabled: (enabled: boolean) => void;
  setChatEnabled: (enabled: boolean) => void;
  setSubtitlesEnabled: (enabled: boolean) => void;
  setDoNotDisturb: (enabled: boolean) => void;
}

const STORAGE_KEY = 'wilbur:soundPrefs';

function loadPrefs(): Partial<SoundState> | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    return parsed as Partial<SoundState>;
  } catch {
    return undefined;
  }
}

function computeEffectiveMuted(muted: boolean, doNotDisturb: boolean): boolean {
  return Boolean(muted || doNotDisturb);
}

const initial: SoundState = {
  volume: 50,
  muted: false,
  alertsEnabled: true,
  qaEnabled: true,
  ntaEnabled: true,
  chatEnabled: true,
  subtitlesEnabled: false,
  doNotDisturb: false,
  effectiveMuted: false,
  sound: true,
  setVolume: () => { return; },
  toggleMute: () => { return; },
  toggleSound: () => { return; },
  setAlertsEnabled: () => { return; },
  setQaEnabled: () => { return; },
  setNtaEnabled: () => { return; },
  setChatEnabled: () => { return; },
  setSubtitlesEnabled: () => { return; },
  setDoNotDisturb: () => { return; },
};

const hydrated = loadPrefs();

export const useSoundStore = create<SoundState>((set) => ({
  ...initial,
  ...(hydrated ? {
    ...hydrated,
    effectiveMuted: computeEffectiveMuted(Boolean(hydrated.muted), Boolean(hydrated.doNotDisturb)),
  } : {}),

  setVolume: (volume) => set(() => ({ volume: Math.max(0, Math.min(100, volume)) })),
  toggleMute: () => set((state) => ({ muted: !state.muted, effectiveMuted: computeEffectiveMuted(!state.muted, state.doNotDisturb) })),
  toggleSound: () => set((state) => ({ sound: !state.sound })),

  setAlertsEnabled: (enabled) => set({ alertsEnabled: enabled }),
  setQaEnabled: (enabled) => set({ qaEnabled: enabled }),
  setNtaEnabled: (enabled) => set({ ntaEnabled: enabled }),
  setChatEnabled: (enabled) => set({ chatEnabled: enabled }),
  setSubtitlesEnabled: (enabled) => set({ subtitlesEnabled: enabled }),
  setDoNotDisturb: (enabled) => set((state) => ({ doNotDisturb: enabled, effectiveMuted: computeEffectiveMuted(state.muted, enabled) })),
}));

// Persist changes
useSoundStore.subscribe((state) => {
  try {
    const payload = {
      volume: state.volume,
      muted: state.muted,
      alertsEnabled: state.alertsEnabled,
      qaEnabled: state.qaEnabled,
      ntaEnabled: state.ntaEnabled,
      chatEnabled: state.chatEnabled,
      subtitlesEnabled: state.subtitlesEnabled,
      doNotDisturb: state.doNotDisturb,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {}
});

