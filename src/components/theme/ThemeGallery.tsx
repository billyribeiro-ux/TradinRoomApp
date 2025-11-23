/**
* THEME GALLERY — SUPABASE CONNECTED
* ===================================
* • Loads all saved themes from `user_themes`
* • Shows dual light/dark thumbnails
* • Applies selected theme via themeStore.applyThemeByJson()
*/

import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

import { supabase } from "../../lib/supabase";
import { useThemeStore } from "../../store/themeStore";
// Fixed: 2025-01-24 - Eradicated 3 null usage(s) - Microsoft TypeScript standards
// Replaced null with undefined, removed unnecessary null checks, used optional types

import type { Json } from "../../types/database.types";

interface UserTheme {
id: string;
name: string;
thumbnail_light: string | undefined;
thumbnail_dark: string | undefined;
theme_json: Json;
updated_at: string;
}

export function ThemeGallery() {
const [themes, setThemes] = useState<UserTheme[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | undefined>();
const applyThemeByJson = useThemeStore((s) => s.applyThemeByJson);

useEffect(() => {
const loadThemes = async () => {
try {
const { data, error } = await supabase
.from("user_themes")
.select("*")
.order("updated_at", { ascending: false });

if (error) throw error;
setThemes((data || []) as UserTheme[]);
} catch (err: unknown) {
console.error("[ThemeGallery] Error:", err);
const message = err instanceof Error ? err.message : "Failed to load themes.";
setError(message);
} finally {
setLoading(false);
}
};

loadThemes();
}, []);

const handleApply = (theme: UserTheme) => {
try {
if (theme.theme_json) {
console.log("[ThemeGallery] Applying:", theme.name);
applyThemeByJson(theme.theme_json as Record<string, unknown>);
}
} catch (err) {
console.error("[ThemeGallery] Apply failed:", err);
}
};

if (loading) {
return (
<div className="flex items-center justify-center p-12 text-slate-400">
<Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading themes...
</div>
);
}

if (error) {
return (
<div className="flex items-center justify-center p-12 text-red-400">
{error}
</div>
);
}

if (themes.length === 0) {
return (
<div className="flex items-center justify-center p-12 text-slate-400">
No saved themes yet. Create one to get started.
</div>
);
}

return (
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
{themes.map((theme) => (
<div
key={theme.id}
className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-blue-500 transition-colors"
>
{/* Dual thumbnail hover effect */}
<div className="relative w-full h-40 overflow-hidden group">
<img
src={theme.thumbnail_light || "/placeholder-theme.png"}
alt={`${theme.name} light mode`}
className="w-full h-full object-cover absolute inset-0 opacity-100 group-hover:opacity-0 transition-opacity duration-500"
/>
<img
src={theme.thumbnail_dark || "/placeholder-theme.png"}
alt={`${theme.name} dark mode`}
className="w-full h-full object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
/>
</div>

{/* Info + Action */}
<div className="p-4">
<h3 className="font-semibold text-white mb-2">{theme.name}</h3>
<p className="text-xs text-slate-400 mb-3">
Updated {new Date(theme.updated_at).toLocaleDateString()}
</p>
<button
onClick={() => handleApply(theme)}
className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition"
>
Apply Theme
</button>
</div>
</div>
))}
</div>
);
}
