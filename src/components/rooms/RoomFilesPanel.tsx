// ══════════════════════════════════════════════════════════════════════════════
// RoomFilesPanel.tsx — Fluent Hybrid Adaptive File/Notes Panel (Microsoft Edition)
// Integrated with Supabase Service Layer (roomFiles.ts), ThemeStore, and ToastStore
// ══════════════════════════════════════════════════════════════════════════════

import {
// Fixed: 2025-10-24 - React component type fixes
// Microsoft TypeScript standards - proper ref and element types


// Fixed: 2025-10-24 - Database schema alignment fixes
// Microsoft TypeScript standards - corrected field references


  FileText,
  Files as FilesIcon,
  Image,
  Music,
  Search,
  RefreshCw,
  Upload,
  Download,
  Trash2,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

import { useAuthStore } from "../../store/authStore";
import { useThemeStore } from "../../store/themeStore";
import { useToastStore } from "../../store/toastStore";
// import { useRoomStore } from "../../store/roomStore";
import { clearMicrosoftCache } from "../../utils/cacheManager";

import {
  getRoomFiles,
  uploadRoomFiles,
  deleteRoomFile,
  downloadRoomFile,
  getFileTypeCategory,
  formatFileSize,
  type RoomFile,
} from "./roomFiles";


interface RoomFilesPanelProps {
  leftPanelWidth: number;
  showSidebar: boolean;
  roomId: string;
  roomName: string;
  initialTab?: "notes" | "files";
}
// Reads leftPanelWidth for positioning only; does not write.

export function RoomFilesPanel({
  leftPanelWidth,
  showSidebar,
  roomId,
  roomName: _roomName,
  initialTab = "notes",
}: RoomFilesPanelProps) {
  const user = useAuthStore((s) => s.user);
  const { addToast } = useToastStore();
  // Room management permission (reserved for future admin-only actions)
  // const canManageRoom = useRoomStore((s) => s.canManageRoom);
  useThemeStore(); // Initialize theme store for className values

  const [activeTab, setActiveTab] = useState<"notes" | "files">(initialTab);
  const [activeFileTab, setActiveFileTab] = useState<
    "files" | "images" | "sounds"
  >("files");
  const [searchQuery, setSearchQuery] = useState("");
  const [files, setFiles] = useState<RoomFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [panelLeft, setPanelLeft] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ═══════════════════════════════════════════════
  // Adaptive Position Calculation
  // ═══════════════════════════════════════════════
  useEffect(() => {
    const base = showSidebar ? 320 : 0;
    setPanelLeft(base + Number(leftPanelWidth) + 4);
  }, [showSidebar, leftPanelWidth]);

  // ═══════════════════════════════════════════════
  // Cache Sync
  // ═══════════════════════════════════════════════
  useEffect(() => {
    const checkCache = async () => {
      const lastUpdate = localStorage.getItem("RoomFilesPanel:lastUpdate");
      const now = Date.now();
      if (!lastUpdate || now - parseInt(lastUpdate) > 12 * 60 * 60 * 1000) {
        await clearMicrosoftCache("RoomFilesPanel");
        localStorage.setItem("RoomFilesPanel:lastUpdate", String(now));
        console.info("[RoomFilesPanel] Cache refreshed automatically");
      }
    };
    checkCache();
  }, []);

  // ═══════════════════════════════════════════════
  // Load Files
  // ═══════════════════════════════════════════════
  useEffect(() => {
    if (roomId) loadFiles();
  }, [roomId]);

  const loadFiles = async () => {
    if (!roomId) return;
    setIsLoading(true);
    try {
      const data = await getRoomFiles(roomId);
      setFiles(data);
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "Failed to load files",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ═══════════════════════════════════════════════
  // File Filters
  // ═══════════════════════════════════════════════
  const filteredFiles = files.filter((f) => {
    const type = getFileTypeCategory(f.mime_type);
    const matchesTab =
      (activeFileTab === "files" && type === "file") ||
      (activeFileTab === "images" && type === "image") ||
      (activeFileTab === "sounds" && type === "sound");
    const matchesSearch = f.filename
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const count = {
    files: files.filter((f) => getFileTypeCategory(f.mime_type) === "file")
      .length,
    images: files.filter((f) => getFileTypeCategory(f.mime_type) === "image")
      .length,
    sounds: files.filter((f) => getFileTypeCategory(f.mime_type) === "sound")
      .length,
  };

  // ═══════════════════════════════════════════════
  // Upload / Download / Delete Logic
  // ═══════════════════════════════════════════════
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const uploaded = e.target.files;
    if (!uploaded || !user || !roomId) return;

    setIsUploading(true);
    try {
      addToast(`Uploading ${uploaded.length} file(s)...`, "info");
      const newFiles = await uploadRoomFiles(roomId, user.id, Array.from(uploaded));
      setFiles((prev) => [...newFiles, ...prev]);
      addToast(`Successfully uploaded ${uploaded.length} file(s)`, "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Upload failed", "error");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) (fileInputRef.current).value = "";
    }
  };

  const handleDownload = async (file: RoomFile) => {
    try {
      const url = await downloadRoomFile(file.id);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.filename;
      a.target = "_blank";
      a.click();
      addToast(`Downloading ${file.filename}`, "info");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Download failed", "error");
    }
  };

  const handleDelete = async (file: RoomFile) => {
    if (!user) return;
    if (!confirm(`Delete "${file.filename}"?`)) return;
    try {
      await deleteRoomFile(file.id, user.id);
      setFiles((p) => p.filter((f) => f.id !== file.id));
      addToast("File deleted successfully", "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Delete failed", "error");
    }
  };

  const handleRefresh = async () => {
    addToast("Refreshing...", "info");
    await loadFiles();
    addToast("Files refreshed", "success");
  };

  // ═══════════════════════════════════════════════
  // Notes File Management
  // ═══════════════════════════════════════════════
  // Note: legacy notes upload handlers retained for future expansion but currently unused.
  // Keeping them commented out avoids unused variable errors while preserving implementation.
  /* const _handleNotesUpload = async (_folderId: string, file: File) => {
    if (!user || !roomId || !isAdmin) {
      addToast("Only admins can upload notes", "error");
      return;
    }
    
    try {
      addToast("Uploading note...", "info");
      await uploadRoomFiles(roomId, user.id, [file]);
      addToast("Note uploaded successfully", "success");
      // Refresh notes list
      await loadFiles();
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "Note upload failed",
        "error"
      );
    }
  };

  const _handleNotesDelete = async (fileId: string) => {
    if (!user || !isAdmin) {
      addToast("Only admins can delete notes", "error");
      return;
    }
    
    try {
      await deleteRoomFile(fileId, user.id);
      addToast("Note deleted successfully", "success");
      // Refresh notes list
      await loadFiles();
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "Note delete failed",
        "error"
      );
    }
  }; */

  // const handleDeleteNoteFile = async (id: string) => {
  //   try {
  //     const { error } = await supabase.from("notes").delete().eq("id", id);
  //     if (error) throw error;
  //     addToast("Note file deleted", "success");
  //   } catch (err) {
  //     addToast(err instanceof Error ? err.message : "Delete failed", "error");
  //   }
  // };

  // ═══════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════
  return (
    <>
      {/* Header Tabs */}
      <div
        id="room-files-header"
        className="fixed flex border-b border-border bg-background-secondary transition-all duration-200"
        style={{
          top: "56px",
          left: `${panelLeft}px`,
          right: 0,
          height: "60px",
        }}
      >
        {[
          { key: "notes", label: "Notes", icon: FileText },
          { key: "files", label: "Files", icon: FilesIcon },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as 'notes' | 'files')}
            className={`flex-1 flex items-center justify-center gap-3 font-semibold transition ${
              activeTab === key
                ? "text-white bg-blue-600"
                : "text-text-secondary hover:bg-background-primary hover:text-text-primary"
            }`}
          >
            <Icon className="w-5 h-5" /> {label}
          </button>
        ))}
      </div>

      {/* Sub Tabs for Files */}
      {activeTab === "files" && (
        <div
          className="fixed flex gap-2 border-b border-border bg-background-primary transition-all duration-200"
          style={{
            top: "116px",
            left: `${panelLeft}px`,
            right: 0,
            height: "56px",
          }}
        >
          {(["files", "images", "sounds"] as const).map((tab) => {
            const Icon =
              tab === "files" ? FilesIcon : tab === "images" ? Image : Music;
            const countVal = count[tab];
            return (
              <button
                key={tab}
                onClick={() => setActiveFileTab(tab)}
                className={`flex items-center gap-2 px-5 py-3 font-semibold rounded relative transition ${
                  activeFileTab === tab
                    ? "bg-blue-600 text-white"
                    : "text-text-secondary hover:bg-background-secondary hover:text-text-primary"
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {countVal}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Content */}
      <div
        role="region"
        aria-labelledby="room-files-header"
        className="fixed overflow-y-auto bg-background-primary transition-all duration-200"
        style={{
          top: activeTab === "files" ? "172px" : "116px",
          left: `${panelLeft}px`,
          right: 0,
          bottom: 0,
        }}
      >
          <div className="flex flex-col h-full">
            {/* Search Bar */}
            <div className="flex gap-3 p-4 border-b border-border">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-background-secondary rounded text-sm text-text-primary focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || !user}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {isUploading ? "Uploading..." : "Upload"}
              </button>
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition disabled:opacity-50"
              >
                <RefreshCw className={`${isLoading ? "animate-spin" : ""} w-4 h-4`} />
                Refresh
              </button>
              <input
                ref={fileInputRef as React.RefObject<HTMLInputElement>}
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* File List */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-full text-text-muted">
                  <RefreshCw className="w-12 h-12 animate-spin text-text-muted" />
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="flex items-center justify-center h-full text-text-muted">
                  <div className="text-center px-4">
                    <FilesIcon className="w-16 h-16 mx-auto mb-4 text-text-muted" />
                    <p className="text-base font-medium mb-2">No files found</p>
                    <p className="text-sm text-text-secondary">
                      {searchQuery
                        ? "Try another search"
                        : "Upload files to get started"}
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between px-6 py-4 odd:bg-background-secondary even:bg-background-primary border-b border-border"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-3">
                          <button
                            onClick={() => handleDownload(file)}
                            className="text-blue-400 hover:text-blue-300 font-medium text-sm truncate"
                          >
                            {file.filename}
                          </button>
                          <span className="text-text-muted text-xs">
                            {formatFileSize(file.file_size)}
                          </span>
                        </div>
                        <div className="text-text-muted text-xs mt-1">
                          {file.created_at ? new Date(file.created_at).toLocaleString() : 'Unknown'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleDownload(file)}
                          className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded text-sm transition"
                        >
                          <Download className="w-4 h-4" /> Download
                        </button>
                        {user && file.user_id === user.id && (
                          <button
                            onClick={() => handleDelete(file)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm transition"
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
      </div>
    </>
  );
}
