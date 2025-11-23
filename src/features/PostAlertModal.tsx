import { X, Link as LinkIcon, Upload, Image as ImageIcon } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

import { ValidationError } from '../lib/errors';
import { createAlert, uploadAlertMedia } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useRoomStore } from '../store/roomStore';
import { useToastStore } from '../store/toastStore';

interface PostAlertModalProps {
  onClose: () => void;
}

type AlertTabType = 'text' | 'url' | 'media';

export function PostAlertModal({ onClose }: PostAlertModalProps) {
  const user = useAuthStore(state => state.user);
  const { currentRoom } = useRoomStore();
  const { addToast } = useToastStore();

  const [activeTab, setActiveTab] = useState<AlertTabType>('text');
  const [alertText, setAlertText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | undefined>(undefined);
  const [uploadedMediaUrl, setUploadedMediaUrl] = useState<string | undefined>(undefined);
  const [isUploading, setIsUploading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const [keepWindowOpen, setKeepWindowOpen] = useState(false);
  const [postToX, setPostToX] = useState(false);
  const [postToLinkedIn, setPostToLinkedIn] = useState(false);
  const [skipNotification, setSkipNotification] = useState(false);
  const [isNonTrade, setIsNonTrade] = useState(false);
  const [hasLegalDisclosure, setHasLegalDisclosure] = useState(false);
  
  // Load saved legal disclosure text from localStorage, or use default
  const [legalDisclosureText, setLegalDisclosureText] = useState(() => {
    try {
      const saved = localStorage.getItem('legal_disclosure_text');
      return saved || 'FOR EDUCATIONAL PURPOSES ONLY, NOT FINANCIAL ADVICE';
    } catch {
      return 'FOR EDUCATIONAL PURPOSES ONLY, NOT FINANCIAL ADVICE';
    }
  });

  // ============================================================================
  // X POSTING SYSTEM - Microsoft Enterprise Standard
  // ============================================================================
  
  // Load X post template from localStorage
  const [xPostTemplate, setXPostTemplate] = useState(() => {
    try {
      const saved = localStorage.getItem('x_post_template');
      return saved || '🚨 TRADING ALERT 🚨\n\n{alert}\n\n{hashtags}';
    } catch {
      return '🚨 TRADING ALERT 🚨\n\n{alert}\n\n{hashtags}';
    }
  });
  
  // Load hashtag database from localStorage
  const [availableHashtags, setAvailableHashtags] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('x_hashtags');
      return saved ? JSON.parse(saved) : [
        '#Trading',
        '#StockMarket',
        '#Alerts',
        '#DayTrading',
        '#Investing',
        '#Finance',
        '#StockAlerts',
        '#TradingView'
      ];
    } catch {
      return ['#Trading', '#StockMarket', '#Alerts', '#DayTrading'];
    }
  });
  
  // Selected hashtags for current post
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('x_selected_hashtags');
      return saved ? JSON.parse(saved) : ['#Trading', '#StockMarket', '#Alerts'];
    } catch {
      return ['#Trading', '#StockMarket', '#Alerts'];
    }
  });
  
  // New hashtag input
  const [newHashtag, setNewHashtag] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // ============================================================================
  // HASHTAG MANAGEMENT FUNCTIONS - Microsoft Enterprise Standard
  // ============================================================================
  
  const toggleHashtag = (hashtag: string) => {
    setSelectedHashtags(prev => 
      prev.includes(hashtag)
        ? prev.filter(h => h !== hashtag)
        : [...prev, hashtag]
    );
  };
  
  const addNewHashtag = () => {
    const formatted = newHashtag.trim().startsWith('#') 
      ? newHashtag.trim() 
      : `#${newHashtag.trim()}`;
    
    if (formatted.length > 1 && !availableHashtags.includes(formatted)) {
      setAvailableHashtags(prev => [...prev, formatted]);
      setSelectedHashtags(prev => [...prev, formatted]);
      setNewHashtag('');
    }
  };
  
  const removeHashtag = (hashtag: string) => {
    setAvailableHashtags(prev => prev.filter(h => h !== hashtag));
    setSelectedHashtags(prev => prev.filter(h => h !== hashtag));
  };
  
  const buildXPost = (): string => {
    const now = new Date();
    const hashtags = selectedHashtags.join(' ');
    
    return xPostTemplate
      .replace('{alert}', alertText.trim())
      .replace('{hashtags}', hashtags)
      .replace('{date}', now.toLocaleDateString())
      .replace('{time}', now.toLocaleTimeString());
  };
  
  // Save legal disclosure text to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('legal_disclosure_text', legalDisclosureText);
    } catch (error) {
      console.error('Failed to save legal disclosure text:', error);
    }
  }, [legalDisclosureText]);
  
  // Save X post template to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('x_post_template', xPostTemplate);
    } catch (error) {
      console.error('Failed to save X template:', error);
    }
  }, [xPostTemplate]);
  
  // Save hashtag database to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('x_hashtags', JSON.stringify(availableHashtags));
    } catch (error) {
      console.error('Failed to save hashtags:', error);
    }
  }, [availableHashtags]);
  
  // Save selected hashtags to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('x_selected_hashtags', JSON.stringify(selectedHashtags));
    } catch (error) {
      console.error('Failed to save selected hashtags:', error);
    }
  }, [selectedHashtags]);

  const handleFileSelect = async (file: File) => {
    if (!user || !currentRoom) {
      addToast('User or room not found', 'error');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      addToast('Invalid file type. Allowed: JPG, PNG, GIF, WEBP, MP4, WEBM', 'error');
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      addToast('File size exceeds 10MB limit', 'error');
      return;
    }

    setIsUploading(true);
    setUploadedFile(undefined);
    setUploadedMediaUrl(undefined);

    try {
       const uploadedUrl = await uploadAlertMedia(file, currentRoom.tenant_id, currentRoom.id, user.id);

      if (uploadedUrl) {
        setUploadedFile(file);
        setUploadedMediaUrl(uploadedUrl);
        addToast('File uploaded successfully', 'success');
      } else {
        throw new ValidationError('Upload failed - no URL returned', 'uploadUrl');
      }
    } catch (error) {
      setUploadedFile(undefined);
      setUploadedMediaUrl(undefined);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
      addToast(errorMessage, 'error');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const removeUploadedFile = () => {
    setUploadedFile(undefined);
    setUploadedMediaUrl(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = (): boolean => {
    if (activeTab === 'text') {
      if (!alertText.trim()) {
        addToast('Please enter alert text', 'error');
        return false;
      }
    } else if (activeTab === 'url') {
      if (!linkUrl.trim()) {
        addToast('Please enter a URL', 'error');
        return false;
      }
      if (!alertText.trim()) {
        addToast('Please enter alert text', 'error');
        return false;
      }
    } else if (activeTab === 'media') {
      if (!mediaUrl.trim() && !uploadedMediaUrl) {
        addToast('Please provide a media URL or upload a file', 'error');
        return false;
      }
      if (!alertText.trim()) {
        addToast('Please enter alert text', 'error');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!user || !currentRoom) {
      addToast('User or room not found', 'error');
      return;
    }

    if (!validateForm()) return;

    setIsPosting(true);

    try {
      // Map data to match actual database schema
      // Store URL or media in body field, use type to differentiate
      const bodyContent = activeTab === 'url' 
        ? linkUrl.trim() 
        : activeTab === 'media' 
          ? (uploadedMediaUrl || mediaUrl.trim()) 
          : alertText.trim();

      const alertData = {
        room_id: currentRoom.id,
        author_id: user.id,  // Track the alert author
        title: alertText.trim().substring(0, 100),
        body: bodyContent,
        type: activeTab,  // Correct field name (was alert_type)
        is_non_trade: isNonTrade,
        has_legal_disclosure: hasLegalDisclosure,
        legal_disclosure_text: hasLegalDisclosure ? legalDisclosureText.trim() : undefined,
        // REMOVED: url, media_url, keep_window_open, post_to_x, skip_notification
        // These fields don't exist in the database schema
      };

      const newAlert = await createAlert(alertData);

      // Optimistic update - add alert immediately to store
      if (newAlert) {
        const { addAlert } = useRoomStore.getState();
        addAlert(newAlert);
      }

      addToast('Alert posted successfully', 'success');
      
      // ============================================================================
      // SOCIAL MEDIA SHARING - Web Intents (FREE!)
      // ============================================================================
      
      // Post to X (Twitter) using Web Intent with Template System - No API costs!
      if (postToX) {
        const fullPost = buildXPost();
        const maxLength = 280;
        const truncatedText = fullPost.length > maxLength 
          ? fullPost.substring(0, maxLength - 3) + '...' 
          : fullPost;
        
        // Open X compose window with pre-filled text using template
        const xIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(truncatedText)}`;
        window.open(xIntentUrl, '_blank', 'width=550,height=420');
      }
      
      // Post to LinkedIn using Web Intent - No API costs!
      if (postToLinkedIn) {
        // LinkedIn share dialog
        const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`;
        window.open(linkedInUrl, '_blank', 'width=550,height=520');
      }
      
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to post alert';
      addToast(errorMessage, 'error');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 sm:p-6 md:p-8">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-[95vw] sm:max-w-xl md:max-w-2xl max-h-[90vh] md:max-h-[85vh] border border-slate-700 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-white">Post Alert</h2>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors touch-manipulation"
              disabled={isPosting}
            >
              <X className="w-5 h-5 text-slate-400 hover:text-white" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-700 bg-slate-900">
          <button
            onClick={() => setActiveTab('text')}
            className={`flex-1 px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors touch-manipulation ${
              activeTab === 'text'
                ? 'text-teal-400 border-b-2 border-teal-400 bg-slate-800'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            Text Alert
          </button>
          <button
            onClick={() => setActiveTab('url')}
            className={`flex-1 px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors touch-manipulation ${
              activeTab === 'url'
                ? 'text-teal-400 border-b-2 border-teal-400 bg-slate-800'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            Text Url
          </button>
          <button
            onClick={() => setActiveTab('media')}
            className={`flex-1 px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors touch-manipulation ${
              activeTab === 'media'
                ? 'text-teal-400 border-b-2 border-teal-400 bg-slate-800'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            Image / GIF / Video
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
          {/* Text Alert Tab */}
          {activeTab === 'text' && (
            <div>
              <textarea
                value={alertText}
                onChange={(e) => setAlertText(e.target.value)}
                placeholder="Alert Text..."
                className="w-full h-40 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 resize-none touch-manipulation"
                maxLength={5000}
              />
            </div>
          )}

          {/* Text Url Tab */}
          {activeTab === 'url' && (
            <div className="space-y-4">
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="Link / URL to send to users"
                  className="w-full pl-11 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 touch-manipulation"
                />
              </div>
              <textarea
                value={alertText}
                onChange={(e) => setAlertText(e.target.value)}
                placeholder="Alert Text..."
                className="w-full h-32 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 resize-none touch-manipulation"
                maxLength={5000}
              />
            </div>
          )}

          {/* Image / GIF / Video Tab */}
          {activeTab === 'media' && (
            <div className="space-y-4">
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="url"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="Image or Video Link to show"
                  className="w-full pl-11 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 touch-manipulation"
                />
              </div>

              <div className="text-center text-slate-400 text-sm font-medium">OR...</div>

              {/* File Upload Area */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  dragActive
                    ? 'border-teal-400 bg-teal-400/10'
                    : 'border-slate-600 hover:border-slate-500 bg-slate-900'
                }`}
              >
                <input
                  id="alert-media-upload"
                  name="alert-media-upload"
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm"
                  onChange={handleFileInputChange}
                  className="hidden"
                  aria-label="Upload media for alert"
                />
                {isUploading ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-3 border-teal-400 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-slate-400">Uploading...</p>
                  </div>
                ) : uploadedFile ? (
                  <div className="flex flex-col items-center gap-3">
                    {uploadedMediaUrl && uploadedFile.type.startsWith('image/') && (
                      <img
                        src={uploadedMediaUrl}
                        alt="Preview"
                        className="max-w-full max-h-48 rounded-lg object-contain"
                      />
                    )}
                    {uploadedMediaUrl && uploadedFile.type.startsWith('video/') && (
                      <video
                        src={uploadedMediaUrl}
                        className="max-w-full max-h-48 rounded-lg"
                        controls
                      />
                    )}
                    {!uploadedMediaUrl && <ImageIcon className="w-12 h-12 text-teal-400" />}
                    <div>
                      <p className="text-sm text-white font-medium">{uploadedFile.name}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeUploadedFile();
                      }}
                      className="text-xs text-red-400 hover:text-red-300 underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <Upload className="w-12 h-12 text-slate-500" />
                    <div>
                      <p className="text-sm text-white font-medium">Click to select images to upload</p>
                      <p className="text-xs text-slate-400 mt-1">or drop an image here</p>
                    </div>
                    <p className="text-xs text-slate-500">Max 10MB • JPG, PNG, GIF, WEBP, MP4, WEBM</p>
                  </div>
                )}
              </div>

              <textarea
                value={alertText}
                onChange={(e) => setAlertText(e.target.value)}
                placeholder="Alert Text..."
                className="w-full h-24 px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 resize-none"
                maxLength={5000}
              />
            </div>
          )}

          {/* Checkbox Options */}
          <div className="space-y-3 pt-4 border-t border-slate-700">
            <label htmlFor="keep-window-open" className="flex items-center gap-3 cursor-pointer group">
              <input
                id="keep-window-open"
                name="keep-window-open"
                type="checkbox"
                checked={keepWindowOpen}
                onChange={(e) => setKeepWindowOpen(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
              <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                Keep alert window open?
              </span>
            </label>

            <div className="space-y-3">
              <label htmlFor="post-to-x" className="flex items-center gap-3 cursor-pointer group">
                <input
                  id="post-to-x"
                  name="post-to-x"
                  type="checkbox"
                  checked={postToX}
                  onChange={(e) => setPostToX(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
                <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                  Post on X? (tweet)
                </span>
              </label>

              {/* X Posting Configuration - Microsoft Enterprise UI */}
              {postToX && (
                <div className="ml-7 space-y-3 p-3 bg-slate-900/50 rounded-lg border border-slate-600">
                  {/* Template Editor */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">
                      X Post Template (use {'{alert}'}, {'{hashtags}'}, {'{date}'}, {'{time}'})
                    </label>
                    <textarea
                      value={xPostTemplate}
                      onChange={(e) => setXPostTemplate(e.target.value)}
                      placeholder="🚨 ALERT 🚨&#10;&#10;{alert}&#10;&#10;{hashtags}"
                      className="w-full h-20 px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 resize-none font-mono"
                    />
                  </div>

                  {/* Hashtag Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">
                      Select Hashtags
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableHashtags.map(hashtag => (
                        <button
                          key={hashtag}
                          type="button"
                          onClick={() => toggleHashtag(hashtag)}
                          className={`px-2 py-1 text-xs rounded-full transition-all ${
                            selectedHashtags.includes(hashtag)
                              ? 'bg-teal-500 text-white'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          {hashtag}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeHashtag(hashtag);
                            }}
                            className="ml-1 text-xs opacity-70 hover:opacity-100"
                          >
                            ×
                          </button>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Add New Hashtag */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newHashtag}
                      onChange={(e) => setNewHashtag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addNewHashtag())}
                      placeholder="Add hashtag..."
                      className="flex-1 px-3 py-1.5 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                    />
                    <button
                      type="button"
                      onClick={addNewHashtag}
                      className="px-3 py-1.5 text-sm bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
                    >
                      Add
                    </button>
                  </div>

                  {/* Preview */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">
                      Preview ({buildXPost().length}/280)
                    </label>
                    <div className="px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-slate-300 whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {buildXPost() || 'Enter alert text to see preview...'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <label htmlFor="post-to-linkedin" className="flex items-center gap-3 cursor-pointer group">
              <input
                id="post-to-linkedin"
                name="post-to-linkedin"
                type="checkbox"
                checked={postToLinkedIn}
                onChange={(e) => setPostToLinkedIn(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
              <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                Post on LinkedIn?
              </span>
            </label>

            <label htmlFor="skip-notification" className="flex items-center gap-3 cursor-pointer group">
              <input
                id="skip-notification"
                name="skip-notification"
                type="checkbox"
                checked={skipNotification}
                onChange={(e) => setSkipNotification(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
              <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                Don't send to push notification?
              </span>
            </label>

            <label htmlFor="is-non-trade" className="flex items-center gap-3 cursor-pointer group">
              <input
                id="is-non-trade"
                name="is-non-trade"
                type="checkbox"
                checked={isNonTrade}
                onChange={(e) => setIsNonTrade(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
              <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                Non-trade alert? (Different Sound)
              </span>
            </label>

            <div className="space-y-2">
              <label htmlFor="enable-timer" className="flex items-center gap-3 cursor-pointer group">
                <input
                  id="enable-timer"
                  name="enable-timer"
                  type="checkbox"
                  checked={hasLegalDisclosure}
                  onChange={(e) => setHasLegalDisclosure(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
                <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                  Add Legal Disclosure?
                </span>
              </label>

              {hasLegalDisclosure && (
                <textarea
                  value={legalDisclosureText}
                  onChange={(e) => setLegalDisclosureText(e.target.value)}
                  placeholder="Legal disclosure text..."
                  className="w-full h-24 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 resize-none touch-manipulation ml-7"
                  maxLength={500}
                />
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-700 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={isPosting || isUploading}
            className="px-6 py-2.5 bg-teal-500 hover:bg-teal-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
          >
            {isPosting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Posting...</span>
              </>
            ) : (
              <span>Post Alert</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
