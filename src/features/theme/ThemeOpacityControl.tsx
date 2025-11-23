import { useThemeStore } from '../../store/themeStore';

export function ThemeOpacityControl(): React.ReactElement {
  const { themeOpacity, setThemeOpacity } = useThemeStore();

  return (
    <div className="flex items-center gap-2 bg-slate-800/80 text-slate-200 px-3 py-2 rounded-lg shadow-lg backdrop-blur-md border border-white/10">
      <input
        id="theme-opacity"
        name="theme-opacity"
        type="range"
        min={0}
        max={100}
        value={themeOpacity}
        onChange={(e) => setThemeOpacity(Number(e.target.value))}
        className="w-28 accent-blue-500"
        aria-label="Theme opacity"
      />
      <span className="tabular-nums text-xs w-10 text-right opacity-80">{themeOpacity}%</span>
    </div>
  );
}


