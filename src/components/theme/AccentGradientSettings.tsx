import { Blend, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import { useThemeStore } from "../../store/themeStore";

export function AccentGradientSettings() {
const { colors, setColors } = useThemeStore();

const [from, setFrom] = useState(colors.accent || "#2563eb");
const [to, setTo] = useState("#8b5cf6");
const [angle, setAngle] = useState(35);
const [animated, setAnimated] = useState(true);

// Apply CSS variables for any component that wants to use the accent gradient
useEffect(() => {
const r = document.documentElement.style;
r.setProperty("--accent-from", from);
r.setProperty("--accent-to", to);
r.setProperty("--accent-angle", `${angle}deg`);
r.setProperty("--accent-animated", animated ? "1" : "0");
}, [from, to, angle, animated]);

const applyAccentAsPrimary = () => {
 setColors({ 
  primary: colors.primary, 
  secondary: colors.secondary, 
  accent: from, 
  background: colors.background, 
  surface: colors.surface, 
  text: colors.text, 
  textSecondary: colors.textSecondary, 
  border: colors.border, 
  success: colors.success, 
  warning: colors.warning, 
  error: colors.error, 
  info: colors.info, 
  textPrimary: colors.textPrimary, 
  textMuted: colors.textMuted, 
  backgroundPrimary: colors.backgroundPrimary, 
  backgroundSecondary: colors.backgroundSecondary 
});
};

const reset = () => {
setFrom("#2563eb");
setTo("#8b5cf6");
setAngle(35);
setAnimated(true);
};

return (
<div className="bg-slate-900/60 border border-slate-700 rounded-xl p-5 space-y-6">
<h3 className="text-lg font-semibold text-white flex items-center gap-2">
<Blend className="w-5 h-5 text-blue-400" />
Accent Gradient
</h3>

{/* Color pickers */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
<div>
<label className="block text-sm text-slate-400 mb-1">From</label>
<div className="flex gap-2 items-center">
<input
id="gradient-from-color"
name="gradient-from-color"
type="color"
value={from}
onChange={(e) => setFrom(e.target.value)}
className="w-12 h-10 rounded border border-slate-700"
aria-label="Gradient from color"
/>
<input
id="gradient-from-text"
name="gradient-from-text"
value={from}
onChange={(e) => setFrom(e.target.value)}
className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm"
/>
</div>
</div>
<div>
<label className="block text-sm text-slate-400 mb-1">To</label>
<div className="flex gap-2 items-center">
<input
id="gradient-to-color"
name="gradient-to-color"
type="color"
value={to}
onChange={(e) => setTo(e.target.value)}
className="w-12 h-10 rounded border border-slate-700"
aria-label="Gradient to color"
/>
<input
id="gradient-to-text"
name="gradient-to-text"
value={to}
onChange={(e) => setTo(e.target.value)}
className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm"
/>
</div>
</div>
<div>
<label className="block text-sm text-slate-400 mb-1">Angle</label>
<input
id="gradient-angle"
name="gradient-angle"
type="range"
min={0}
max={360}
value={angle}
onChange={(e) => setAngle(Number(e.target.value))}
aria-label="Gradient angle"
className="w-full accent-blue-500"
/>
<p className="text-xs text-slate-500 mt-1">{angle}°</p>
</div>
</div>

{/* Animation toggle */}
<div className="flex items-center gap-3">
<label htmlFor="gradient-animated" className="inline-flex items-center gap-2 text-slate-300 text-sm">
<input
id="gradient-animated"
name="gradient-animated"
type="checkbox"
checked={animated}
onChange={(e) => setAnimated(e.target.checked)}
className="accent-blue-500"
/>
Animate subtle shimmer
</label>

<button
onClick={reset}
className="ml-auto inline-flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm"
>
<RefreshCw className="w-4 h-4" />
Reset
</button>
</div>

{/* Preview */}
<div
className="h-20 rounded-lg border border-slate-700 overflow-hidden relative"
style={{
background: `linear-gradient(${angle}deg, ${from}, ${to})`,
animation: animated ? "accent-pan 6s linear infinite" : "none",
backgroundSize: animated ? "200% 200%" : "auto",
}}
/>

<style>{`
@keyframes accent-pan {
0% { background-position: 0% 50%; }
50% { background-position: 100% 50%; }
100% { background-position: 0% 50%; }
}
`}</style>

<div className="flex gap-3">
<button
onClick={applyAccentAsPrimary}
className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
>
Use “From” as Accent
</button>
</div>
</div>
);
}