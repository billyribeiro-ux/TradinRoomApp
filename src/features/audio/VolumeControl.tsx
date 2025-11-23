import { useSoundStore } from '../../store/soundStore';

export function VolumeControl() {
  const {
    volume,
    setVolume,
    muted,
    toggleMute,
    alertsEnabled,
    qaEnabled,
    ntaEnabled,
    chatEnabled,
    subtitlesEnabled,
    doNotDisturb,
    setAlertsEnabled,
    setQaEnabled,
    setNtaEnabled,
    setChatEnabled,
    setSubtitlesEnabled,
    setDoNotDisturb,
  } = useSoundStore();

  const closeSelfDropdown = (el: HTMLElement) => {
    const ul = el.closest('ul') as HTMLUListElement | undefined;
    if (!ul) return;
    ul.setAttribute('data-open', 'false');
    ul.style.setProperty('--menu-display', 'none');
    const btn = ul.previousElementSibling as HTMLButtonElement | undefined;
    btn?.setAttribute('aria-expanded', 'false');
  };

  const disabled = doNotDisturb;

  return (
    <div
      className="w-full sm:w-80 max-w-[22rem] sm:max-w-md md:max-w-lg select-none bg-slate-900/95 border border-slate-700 rounded-xl p-3 sm:p-4 md:p-6 shadow-2xl backdrop-blur"
      role="dialog"
      aria-label="Volume settings"
      onKeyDown={(e) => {
        if (e.key === 'Escape') closeSelfDropdown(e.currentTarget as unknown as HTMLElement);
      }}
    >
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="text-white text-xl sm:text-2xl font-semibold tracking-tight">Volume</h3>
        <button
          className="text-slate-400 hover:text-white rounded-md px-2 py-1 text-2xl sm:text-xl leading-none touch-manipulation"
          aria-label="Close"
          onClick={(e) => closeSelfDropdown(e.currentTarget as HTMLButtonElement)}
        >
          ×
        </button>
      </div>

      <div className="mb-3 sm:mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-300 text-xs sm:text-sm">Master volume</span>
          <span className="text-slate-400 text-xs sm:text-sm tabular-nums font-semibold">{volume}%</span>
        </div>
        <input
          id="master-volume"
          name="master-volume"
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-full h-2 sm:h-3 cursor-pointer accent-blue-500 touch-manipulation"
          disabled={disabled}
          aria-label="Master volume"
        />
      </div>

      <div className="mb-3 sm:mb-4">
        <button
          className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl w-full sm:w-32 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg touch-manipulation transition-colors"
          onClick={toggleMute}
          disabled={false}
        >
          {muted ? 'Unmute' : 'Mute'}
        </button>
      </div>

      <div className="h-px bg-slate-700/70 my-3" />

      <div className="space-y-2 sm:space-y-3 text-slate-100">
        <label htmlFor="alerts-enabled" className="flex items-center gap-2 sm:gap-3 cursor-pointer touch-manipulation">
          <input id="alerts-enabled" name="alerts-enabled" type="checkbox" className="h-4 w-4 sm:h-5 sm:w-5 accent-blue-500 cursor-pointer" checked={alertsEnabled} onChange={(e) => setAlertsEnabled(e.target.checked)} disabled={disabled} />
          <span className="text-sm sm:text-base">Alert sound on</span>
        </label>
        <label htmlFor="qa-enabled" className="flex items-center gap-2 sm:gap-3 cursor-pointer touch-manipulation">
          <input id="qa-enabled" name="qa-enabled" type="checkbox" className="h-4 w-4 sm:h-5 sm:w-5 accent-blue-500 cursor-pointer" checked={qaEnabled} onChange={(e) => setQaEnabled(e.target.checked)} disabled={disabled} />
          <span className="text-sm sm:text-base">QA sound on</span>
        </label>
        <label htmlFor="nta-enabled" className="flex items-center gap-2 sm:gap-3 cursor-pointer touch-manipulation">
          <input id="nta-enabled" name="nta-enabled" type="checkbox" className="h-4 w-4 sm:h-5 sm:w-5 accent-blue-500 cursor-pointer" checked={ntaEnabled} onChange={(e) => setNtaEnabled(e.target.checked)} disabled={disabled} />
          <span className="text-sm sm:text-base">NTA sound on</span>
        </label>
        <label htmlFor="chat-enabled" className="flex items-center gap-2 sm:gap-3 cursor-pointer touch-manipulation">
          <input id="chat-enabled" name="chat-enabled" type="checkbox" className="h-4 w-4 sm:h-5 sm:w-5 accent-blue-500 cursor-pointer" checked={chatEnabled} onChange={(e) => setChatEnabled(e.target.checked)} disabled={disabled} />
          <span className="text-sm sm:text-base">Chat sound on</span>
        </label>
        <label htmlFor="subtitles-off" className="flex items-center gap-2 sm:gap-3 cursor-pointer touch-manipulation">
          <input
            id="subtitles-off"
            name="subtitles-off"
            type="checkbox"
            className="h-4 w-4 sm:h-5 sm:w-5 accent-blue-500 cursor-pointer"
            checked={!subtitlesEnabled}
            onChange={(e) => setSubtitlesEnabled(!e.target.checked)}
          />
          <span className="text-sm sm:text-base">Subtitles off</span>
        </label>
        <label htmlFor="do-not-disturb" className="flex items-center gap-2 sm:gap-3 cursor-pointer touch-manipulation">
          <input
            id="do-not-disturb"
            name="do-not-disturb"
            type="checkbox"
            className="h-4 w-4 sm:h-5 sm:w-5 accent-blue-500 cursor-pointer"
            checked={doNotDisturb}
            onChange={(e) => setDoNotDisturb(e.target.checked)}
          />
          <span className="text-sm sm:text-base">Don't Disturb</span>
        </label>
      </div>
    </div>
  );
}

