import { Upload, Play, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useRoomStore } from '../../store/roomStore';
import { useToastStore } from '../../store/toastStore';
// Fixed: 2025-01-24 - Eradicated 1 null usage(s) - Microsoft TypeScript standards
// Replaced null with undefined, removed unnecessary null checks, used optional types


interface CustomSound {
  id: string;
  name: string;
  category: string;
  file_url: string;
  created_at?: string;
}

export function CustomSoundUpload() {
  const { user } = useAuthStore();
  const { currentRoom } = useRoomStore();
  const { addToast } = useToastStore();
  const [uploading, setUploading] = useState(false);
  const [customSounds, setCustomSounds] = useState<CustomSound[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('tradeAlerts');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !currentRoom) return;

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      addToast('File size must be less than 5MB', 'error');
      if (e.target) e.target.value = '';
      return;
    }

    // Check file type - be flexible with MP3 types
    const validTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
      'audio/webm',
      'audio/x-m4a',
      'audio/aac',
      'audio/aacp',
      'audio/3gpp',
      'audio/3gpp2'
    ];

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const isAudioFile = validTypes.includes(file.type) ||
                        ['mp3', 'wav', 'ogg', 'webm', 'm4a', 'aac'].includes(fileExt || '');

    if (!isAudioFile) {
      addToast(`File type not supported. Detected: ${file.type || 'unknown'}. Please upload MP3, WAV, OGG, WebM, or M4A files.`, 'error');
      if (e.target) e.target.value = '';
      return;
    }

    setUploading(true);

    try {
      const fileExtension = file.name.split('.').pop();
      const fileName = `${currentRoom.tenant_id}/${user.id}/${Date.now()}.${fileExtension}`;

      console.log('Uploading file:', {
        name: file.name,
        type: file.type,
        size: file.size,
        path: fileName
      });

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('custom-sounds')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || 'audio/mpeg'
        });

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful:', uploadData);

      // Get public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('custom-sounds')
        .getPublicUrl(fileName);

      // Save to room_files database with audio type
      const soundFileName = file.name.replace(/\.[^/.]+$/, '');
      const { data: dbData, error: dbError } = await supabase
        .from('room_files')
        .insert({
          room_id: currentRoom.id,
          user_id: user.id,
          file_url: publicUrl,
          folder_name: 'custom-sounds',
          filename: file.name,
          file_type: 'audio',
          file_size: file.size,
          mime_type: file.type || 'audio/mpeg',
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        addToast('File uploaded but database save failed', 'error');
        return;
      }

      // Convert room_file to CustomSound format
      const newSound: CustomSound = {
        id: dbData.id,
        name: soundFileName,
        category: selectedCategory,
        file_url: dbData.file_url,
        created_at: dbData.created_at || undefined,
      };

      setCustomSounds([...customSounds, newSound]);
      addToast('Sound uploaded successfully!', 'success');
    } catch (error: unknown) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      addToast(`Upload failed: ${errorMessage}`, 'error');
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleDelete = async (soundId: string, fileUrl: string) => {
    if (!confirm('Are you sure you want to delete this sound?')) return;

    try {
      // Delete from storage
      const filePath = fileUrl.split('/').slice(-3).join('/');
      await supabase.storage
        .from('custom-sounds')
        .remove([filePath]);

      // Delete from room_files database
      const { error: dbError } = await supabase
        .from('room_files')
        .delete()
        .eq('id', soundId);

      if (dbError) {
        console.error('Database delete error:', dbError);
        addToast('File deleted from storage but database delete failed', 'error');
        return;
      }

      setCustomSounds(customSounds.filter(s => s.id !== soundId));
      addToast('Sound deleted successfully', 'success');
    } catch (error: unknown) {
      console.error('Delete error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Delete failed';
      addToast(`Delete failed: ${errorMessage}`, 'error');
    }
  };

  const handlePreview = (url: string) => {
    const audio = new Audio(url);
    audio.volume = 0.7;
    audio.play().catch(err => console.error('Playback error:', err));
  };

  return (
    <div className="space-y-4">
      <div className="border-t border-slate-700 pt-4">
        <h3 className="text-sm font-semibold text-white mb-3">Custom Sounds</h3>
        <p className="text-xs text-slate-400 mb-4">
          Upload your own notification sounds (MP3, WAV, OGG - max 5MB)
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-sm text-slate-300 mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="tradeAlerts">Trade Alerts</option>
              <option value="nonTradeAlerts">Non-Trade Alerts</option>
              <option value="chat">Chat Messages</option>
              <option value="polls">Polls</option>
            </select>
          </div>

          <label className="block">
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
            <div className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg cursor-pointer transition-colors ${
              uploading
                ? 'bg-slate-600 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}>
              <Upload className="w-5 h-5 text-white" />
              <span className="text-white font-medium">
                {uploading ? 'Uploading...' : 'Upload Sound File'}
              </span>
            </div>
          </label>
        </div>

        {customSounds.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-xs font-semibold text-slate-400">Your Custom Sounds</h4>
            {customSounds.map((sound) => (
              <div
                key={sound.id}
                className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="text-sm text-white font-medium">{sound.name}</div>
                  <div className="text-xs text-slate-400">{sound.category}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePreview(sound.file_url)}
                    className="p-2 bg-slate-600 hover:bg-slate-500 rounded text-white transition-colors"
                    title="Preview"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(sound.id, sound.file_url)}
                    className="p-2 bg-red-600 hover:bg-red-700 rounded text-white transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
