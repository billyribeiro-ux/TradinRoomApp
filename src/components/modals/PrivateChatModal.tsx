import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faComments } from '@fortawesome/free-solid-svg-icons';
import { supabase } from '../../lib/supabase';

interface PrivateChatModalProps {
  chatId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  currentUserId: string;
  onClose: () => void;
}

interface PrivateMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string | null;
}

export function PrivateChatModal({
  chatId,
  userId: _userId,
  userName,
  userAvatar,
  currentUserId,
  onClose
}: PrivateChatModalProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch messages
  useEffect(() => {
    if (!chatId) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('private_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data);
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`private_chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'private_messages',
          filter: `chat_id=eq.${chatId}`
        },
        (payload: { new: PrivateMessage }) => {
          setMessages(prev => [...prev, payload.new as PrivateMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim() || !chatId) return;

    try {
      const { error } = await supabase
        .from('private_messages')
        .insert({
          chat_id: chatId,
          sender_id: currentUserId,
          content: message.trim(),
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div 
      className={`fixed bottom-0 right-4 w-[600px] max-w-[95vw] bg-slate-900 rounded-t-lg shadow-2xl border-2 border-blue-500 transition-all duration-300 z-[99999] ${
        isMinimized ? 'h-[60px]' : 'h-[500px]'
      }`}
    >
      {/* Header */}
      <div 
        className="bg-slate-800 px-4 py-3 flex items-center justify-between rounded-t-lg cursor-pointer hover:bg-slate-750 transition-colors"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-3">
          <FontAwesomeIcon icon={faComments} className="text-white w-5 h-5" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center overflow-hidden relative">
              {userAvatar ? (
                <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-sm">👤</span>
              )}
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-800"></div>
            </div>
            <span className="text-white font-semibold">{userName}</span>
          </div>
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="text-slate-400 hover:text-white transition-colors p-2"
          aria-label="Close private chat"
        >
          <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
        </button>
      </div>

      {/* Chat Content */}
      {!isMinimized && (
        <>
          {/* Messages Area */}
          <div className="flex-1 bg-slate-900 p-4 overflow-y-auto h-[380px]">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                No messages yet. Start the conversation!
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => {
                  const isOwn = msg.sender_id === currentUserId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-2 rounded-lg ${
                          isOwn
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 text-white'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {!isOwn && (
                            <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center flex-shrink-0">
                              {userAvatar ? (
                                <img src={userAvatar} alt={userName} className="w-full h-full object-cover rounded-full" />
                              ) : (
                                <span className="text-xs">👤</span>
                              )}
                            </div>
                          )}
                          <div className="flex-1">
                            {!isOwn && (
                              <div className="text-xs font-semibold mb-1">{userName}</div>
                            )}
                            <div className="text-sm">{msg.content}</div>
                            <div className={`text-xs mt-1 ${
                              isOwn ? 'text-blue-200' : 'text-slate-400'
                            }`}>
                              {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              }) : 'Just now'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="bg-slate-800 border-t border-slate-700 p-4">
            <div className="flex gap-2">
              <input 
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <button
                onClick={handleSendMessage}
                disabled={!message.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium focus:outline-none focus:ring-0"
              >
                Send
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
