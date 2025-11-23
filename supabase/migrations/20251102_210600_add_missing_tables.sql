-- ============================================================================
-- Migration: Add Missing Database Tables
-- Date: 2025-11-02
-- Time: 21:06:00 EST
-- Author: L65+ Microsoft Principal Engineer
-- ============================================================================
-- Purpose: Add 5 missing tables referenced in code but not in schema
-- Tables: banned_users, moderation_log, reported_content, notifications, 
--         private_chats, private_messages
-- Note: NO read/unread tracking - timestamps only
-- ============================================================================

-- ============================================================================
-- BANNED_USERS TABLE
-- Track banned users per room with expiration support
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.banned_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  banned_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  banned_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, room_id)
);

CREATE INDEX IF NOT EXISTS idx_banned_users_user_id ON public.banned_users(user_id);
CREATE INDEX IF NOT EXISTS idx_banned_users_room_id ON public.banned_users(room_id);
CREATE INDEX IF NOT EXISTS idx_banned_users_expires_at ON public.banned_users(expires_at) WHERE expires_at IS NOT NULL;

ALTER TABLE public.banned_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Banned users viewable by room admins" ON public.banned_users;
CREATE POLICY "Banned users viewable by room admins" ON public.banned_users FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.room_memberships 
    WHERE room_id = banned_users.room_id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'moderator')
  )
);

DROP POLICY IF EXISTS "Only admins can ban users" ON public.banned_users;
CREATE POLICY "Only admins can ban users" ON public.banned_users FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.room_memberships 
    WHERE room_id = banned_users.room_id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'moderator')
  )
);

-- ============================================================================
-- MODERATION_LOG TABLE
-- Complete audit trail for all moderation actions
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.moderation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  moderator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('kick', 'ban', 'mute', 'warn', 'unban', 'unmute')),
  reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_moderation_log_room_id ON public.moderation_log(room_id);
CREATE INDEX IF NOT EXISTS idx_moderation_log_target_user_id ON public.moderation_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_log_created_at ON public.moderation_log(created_at DESC);

ALTER TABLE public.moderation_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Moderation log viewable by room admins" ON public.moderation_log;
CREATE POLICY "Moderation log viewable by room admins" ON public.moderation_log FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.room_memberships 
    WHERE room_id = moderation_log.room_id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'moderator')
  )
);

DROP POLICY IF EXISTS "Only admins can create moderation logs" ON public.moderation_log;
CREATE POLICY "Only admins can create moderation logs" ON public.moderation_log FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.room_memberships 
    WHERE room_id = moderation_log.room_id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'moderator')
  )
);

-- ============================================================================
-- REPORTED_CONTENT TABLE
-- User reporting system with review workflow
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.reported_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('message', 'alert', 'user', 'room')),
  content_id TEXT NOT NULL,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')) DEFAULT 'pending',
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reported_content_room_id ON public.reported_content(room_id);
CREATE INDEX IF NOT EXISTS idx_reported_content_status ON public.reported_content(status);
CREATE INDEX IF NOT EXISTS idx_reported_content_created_at ON public.reported_content(created_at DESC);

ALTER TABLE public.reported_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create reports" ON public.reported_content;
CREATE POLICY "Users can create reports" ON public.reported_content FOR INSERT WITH CHECK (auth.uid() = reported_by);

DROP POLICY IF EXISTS "Reports viewable by room admins" ON public.reported_content;
CREATE POLICY "Reports viewable by room admins" ON public.reported_content FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.room_memberships 
    WHERE room_id = reported_content.room_id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'moderator')
  )
);

DROP POLICY IF EXISTS "Only admins can update reports" ON public.reported_content;
CREATE POLICY "Only admins can update reports" ON public.reported_content FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.room_memberships 
    WHERE room_id = reported_content.room_id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'moderator')
  )
);

-- ============================================================================
-- NOTIFICATIONS TABLE
-- User notification system (NO read tracking - timestamps only)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('mention', 'reply', 'broadcast_alert', 'room_invite', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
  alert_id TEXT,
  link TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- ============================================================================
-- PRIVATE_CHATS TABLE
-- Private chat conversations between users
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.private_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id < user2_id)
);

CREATE INDEX IF NOT EXISTS idx_private_chats_user1 ON public.private_chats(user1_id);
CREATE INDEX IF NOT EXISTS idx_private_chats_user2 ON public.private_chats(user2_id);

ALTER TABLE public.private_chats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own chats" ON public.private_chats;
CREATE POLICY "Users can view own chats" ON public.private_chats FOR SELECT USING (
  auth.uid() = user1_id OR auth.uid() = user2_id
);

DROP POLICY IF EXISTS "Users can create chats" ON public.private_chats;
CREATE POLICY "Users can create chats" ON public.private_chats FOR INSERT WITH CHECK (
  auth.uid() = user1_id OR auth.uid() = user2_id
);

-- ============================================================================
-- PRIVATE_MESSAGES TABLE
-- Messages in private chats (NO read tracking - timestamps only)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.private_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.private_chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_private_messages_chat_id ON public.private_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_sender_id ON public.private_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_created_at ON public.private_messages(created_at DESC);

ALTER TABLE public.private_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages in their chats" ON public.private_messages;
CREATE POLICY "Users can view messages in their chats" ON public.private_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.private_chats 
    WHERE id = private_messages.chat_id 
      AND (user1_id = auth.uid() OR user2_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can send messages in their chats" ON public.private_messages;
CREATE POLICY "Users can send messages in their chats" ON public.private_messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.private_chats 
    WHERE id = private_messages.chat_id 
      AND (user1_id = auth.uid() OR user2_id = auth.uid())
  )
);

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE public.banned_users IS 'Tracks banned users per room with expiration support';
COMMENT ON TABLE public.moderation_log IS 'Complete audit trail for all moderation actions';
COMMENT ON TABLE public.reported_content IS 'User reporting system with review workflow';
COMMENT ON TABLE public.notifications IS 'User notification system - NO read tracking';
COMMENT ON TABLE public.private_chats IS 'Private chat conversations between users';
COMMENT ON TABLE public.private_messages IS 'Messages in private chats - NO read tracking';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
