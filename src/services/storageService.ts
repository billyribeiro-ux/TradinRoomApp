/** Shared utility — SSOT. Do not duplicate logic elsewhere. */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface UploadAssetParams {
  supabase: SupabaseClient;
  bucket: string;
  path: string;
  file: File;
  upsert?: boolean;
}

export type UploadAssetResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

/**
 * Uploads a file to Supabase Storage and returns the public URL.
 * No direct UI or store access - pure service function.
 * Returns typed result instead of throwing.
 * 
 * @param params - Upload parameters
 * @returns Promise resolving to typed result
 */
export async function uploadPublicAsset(
  params: UploadAssetParams
): Promise<UploadAssetResult> {
  const { supabase, bucket, path, file, upsert = false } = params;

  try {
    // Upload file to storage
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert });

    if (uploadError) {
      return {
        ok: false,
        error: `Storage upload failed: ${uploadError.message || 'Unknown error'}`,
      };
    }

    // Get public URL
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);

    if (!data?.publicUrl) {
      return {
        ok: false,
        error: 'Failed to retrieve public URL after upload',
      };
    }

    return { ok: true, url: data.publicUrl };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Upload failed',
    };
  }
}
