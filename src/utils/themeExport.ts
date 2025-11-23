/** Shared utility — SSOT. Do not duplicate logic elsewhere. */

/**
 * Downloads theme data as a JSON file.
 * Creates a Blob, triggers download via temporary <a> element, then cleans up.
 * 
 * @param filename - Name for the downloaded file (e.g., 'theme-export.json')
 * @param data - Theme data to serialize
 */
export function downloadThemeJson(filename: string, data: unknown): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  
  URL.revokeObjectURL(url);
}

/**
 * Parses a theme JSON file.
 * Reads file contents and parses as JSON.
 * 
 * @param file - File object to parse
 * @returns Promise resolving to parsed JSON data
 * @throws Error if file cannot be read or JSON is invalid
 */
export function parseThemeJson(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          reject(new Error('Failed to read file as text'));
          return;
        }
        
        const parsed = JSON.parse(text);
        resolve(parsed);
      } catch (err) {
        reject(new Error(`Invalid JSON: ${err instanceof Error ? err.message : 'Parse error'}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
}
