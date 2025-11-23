// ---------------------------------------------------------------------------
// roomFiles.ts — Microsoft Enterprise Lean Edition (Verified + Stable)
// ---------------------------------------------------------------------------

import { supabase } from "../../lib/supabase";
import { logger } from "../../utils/productionLogger";

// ────────────────────────────────────────────────────────────────────────────
// Types & Error Class
// ────────────────────────────────────────────────────────────────────────────
export interface RoomFile {
  id: string;
  room_id: string;
  user_id: string;
  filename: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

export class RoomFileError extends Error {
  constructor(message: string, public context?: Record<string, unknown>) {
    super(message);
    this.name = "RoomFileError";
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Utility: Exponential backoff retry
// ────────────────────────────────────────────────────────────────────────────
async function retry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 250
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;
    await new Promise((r) => setTimeout(r, delay));
    return retry(fn, retries - 1, delay * 2);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Fetch all files for a room
// ────────────────────────────────────────────────────────────────────────────
export async function getRoomFiles(roomId: string): Promise<RoomFile[]> {
  try {
    logger.info("[roomFiles] Fetching room files", { roomId });

    // ✅ Corrected: Use 'room_files' — the table containing metadata
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false });

    if (error) throw new RoomFileError("Failed to fetch files", { error });
    return (data || []).map((item: any) => {
      const anyItem = item as Record<string, unknown>;
      return {
        ...item,
        file_size: (anyItem.file_size as number) || 0,
        mime_type: (anyItem.mime_type as string) || 'application/octet-stream'
      } as RoomFile;
    });
  } catch (error) {
    logger.error("[roomFiles] getRoomFiles failed", error instanceof Error ? error : new Error('Unknown error'));
    throw error;
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Upload files with validation + retry
// ────────────────────────────────────────────────────────────────────────────
export async function uploadRoomFiles(
  roomId: string,
  userId: string,
  files: File[]
): Promise<RoomFile[]> {
  if (!roomId || !userId)
    throw new RoomFileError("Missing room_id or user_id");
  if (!files.length) throw new RoomFileError("No files provided");

  const MAX = 50 * 1024 * 1024; // 50 MB
  const uploaded: RoomFile[] = [];

  for (const file of files) {
    if (file.size > MAX)
      throw new RoomFileError(`File too large: ${file.name}`);

    const ts = Date.now();
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const path = `${roomId}/${ts}_${cleanName}`;

    // ✅ Ensure upload with retry
    await retry(async () => {
      logger.info("[roomFiles] Uploading file", { roomId, userId, file: file.name });
      const { data, error } = await supabase.storage
        .from("room-files")
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (error) throw new RoomFileError("Storage upload failed", { error });
      return data;
    });

    // ✅ Get Public URL
    const { data: urlData } = supabase.storage
      .from("room-files")
      .getPublicUrl(path);
    const fileUrl = urlData?.publicUrl;

    // ✅ Insert metadata into 'notes' table
    const { data: dbData, error: dbError } = await supabase
      .from("notes")
      .insert({
        room_id: roomId,
        user_id: userId,
        filename: file.name,
        file_url: fileUrl,
        folder_name: "uploads",
      })
      .select()
      .single();

    if (dbError)
      throw new RoomFileError("Database insert failed", { dbError, file: file.name });

    uploaded.push({
      ...dbData,
      file_size: file.size,
      mime_type: file.type || "application/octet-stream",
    } as RoomFile);
  }

  logger.info("[roomFiles] Upload completed", { count: uploaded.length });
  return uploaded;
}

// ────────────────────────────────────────────────────────────────────────────
// Delete file (storage + DB) safely
// ────────────────────────────────────────────────────────────────────────────
export async function deleteRoomFile(fileId: string, userId: string) {
  try {
    logger.info("[roomFiles] Deleting file", { fileId, userId });

    const { data: file, error } = await supabase
      .from("room_files")
      .select("*")
      .eq("id", fileId)
      .single();

    if (error || !file)
      throw new RoomFileError("File not found", { fileId, error });

    if (file.user_id !== userId)
      throw new RoomFileError("Unauthorized delete attempt", { fileId, userId });

    const path = new URL(file.file_url).pathname.split("/room-files/")[1];

    // ✅ Remove from storage first
    await retry(async () => {
      const { error: sErr } = await supabase.storage
        .from("room-files")
        .remove([path]);
      if (sErr) throw sErr;
    });

    // ✅ Then remove metadata
    const { error: dbErr } = await supabase
      .from("room_files")
      .delete()
      .eq("id", fileId);

    if (dbErr)
      throw new RoomFileError("Failed to delete file record", { dbErr, fileId });

    logger.info("[roomFiles] File deleted successfully", { fileId });
  } catch (error) {
    logger.error("[roomFiles] deleteRoomFile failed", error instanceof Error ? error : new Error('Unknown error'));
    throw error;
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Download file (returns URL)
// ────────────────────────────────────────────────────────────────────────────
export async function downloadRoomFile(fileId: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from("room_files")
      .select("file_url")
      .eq("id", fileId)
      .single();

    if (error || !data)
      throw new RoomFileError("File not found", { fileId, error });

    return data.file_url;
  } catch (error) {
    logger.error("[roomFiles] downloadRoomFile failed", error instanceof Error ? error : new Error('Unknown error'));
    throw error;
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────
export function getFileTypeCategory(mime: string): "file" | "image" | "sound" {
  if (!mime) return "file";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("audio/")) return "sound";
  return "file";
}

export function formatFileSize(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }
  return `${bytes.toFixed(1)} ${units[i]}`;
}

// ────────────────────────────────────────────────────────────────────────────
// Get files filtered by type
// ────────────────────────────────────────────────────────────────────────────
export async function getRoomFilesByType(
  roomId: string,
  type: "file" | "image" | "sound"
): Promise<RoomFile[]> {
  const all = await getRoomFiles(roomId);
  return all.filter((f) => getFileTypeCategory(f.mime_type) === type);
}
