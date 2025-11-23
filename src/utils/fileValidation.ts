/** Shared utility — SSOT. Do not duplicate logic elsewhere. */

export interface FileValidationSuccess {
  ok: true;
}

export interface FileValidationFailure {
  ok: false;
  reason: string;
}

export type FileValidationResult = FileValidationSuccess | FileValidationFailure;

/**
 * Validates an image file against allowed types and size constraints.
 * Pure function - no DOM or network access.
 * 
 * @param file - The file to validate
 * @param allowedTypes - Array of allowed MIME types (e.g., ['image/png', 'image/jpeg'])
 * @param maxBytes - Maximum file size in bytes
 * @returns Validation result with ok flag and optional reason for failure
 */
export function validateImageFile(
  file: File,
  allowedTypes: readonly string[],
  maxBytes: number
): FileValidationResult {
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      ok: false,
      reason: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  // Check file size
  if (file.size > maxBytes) {
    const maxMB = (maxBytes / (1024 * 1024)).toFixed(1);
    return {
      ok: false,
      reason: `File too large. Maximum size: ${maxMB}MB`,
    };
  }

  return { ok: true };
}
