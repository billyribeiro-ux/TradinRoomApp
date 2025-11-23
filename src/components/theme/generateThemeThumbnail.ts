export async function generateThemeThumbnails(
themeJson: Record<string, unknown>
): Promise<{ light: string; dark: string }> {
const createCanvasPreview = (theme: Record<string, unknown>, mode: "light" | "dark") => {
const canvas = document.createElement("canvas");
canvas.width = 300;
canvas.height = 180;
const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("Canvas not supported");

// Safe access helpers
const colors = (theme.colors || {}) as Record<string, unknown>;
const typography = (theme.typography || {}) as Record<string, unknown>;

const bg =
mode === "light"
? (colors.backgroundPrimary as string) ?? "#ffffff"
: (colors.backgroundSecondary as string) ?? "#0f172a";

const text =
mode === "light"
? (colors.textPrimary as string) ?? "#0f172a"
: (colors.textSecondary as string) ?? "#e2e8f0";

const accent = (colors.accent as string) ?? "#2563eb";
const fontFamily = (typography.fontFamily as string) ?? "Inter";
const weightNormal = (typography.fontWeightNormal as number) ?? 400;
const weightBold = (typography.fontWeightBold as number) ?? 700;

// Background
ctx.fillStyle = bg;
ctx.fillRect(0, 0, canvas.width, canvas.height);

// Accent footer bar
ctx.fillStyle = accent;
ctx.fillRect(0, canvas.height - 24, canvas.width, 24);

// Heading sample
ctx.font = `${weightBold} 18px ${fontFamily}`;
ctx.fillStyle = text;
ctx.fillText("Aa", 20, 60);

// Body sample
ctx.font = `${weightNormal} 14px ${fontFamily}`;
ctx.fillText("The quick brown fox", 20, 100);
ctx.fillText("jumps over the lazy dog", 20, 120);

return canvas.toDataURL("image/png");
};

return {
light: createCanvasPreview(themeJson, "light"),
dark: createCanvasPreview(themeJson, "dark"),
};
}