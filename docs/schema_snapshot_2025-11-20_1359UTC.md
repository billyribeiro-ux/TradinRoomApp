# Wilbur Schema Snapshot — 2025-11-20 13:59 UTC

This document captures the full schema that the Wilbur app references today so we can compare it against the live Supabase project. Sources:

1. `src/types/database.types.ts` (TypeScript-inferred schema used by the app)
2. `supabase/migrations/20251102_210600_add_missing_tables.sql` (latest migration introducing moderation-related tables)

## Public Schema Tables (Type Definitions)

### alerts
- `author` (Json, nullable)
- `author_id` (uuid, nullable)
- `author_role` (text, nullable)
- `body` (text, nullable)
- `created_at` (timestamptz, nullable)
- `has_legal_disclosure` (boolean, nullable)
- `id` (uuid, PK)
- `is_non_trade` (boolean, nullable)
- `legal_disclosure_text` (text, nullable)
- `room_id` (uuid, FK → rooms.id)
- `title` (text, nullable)
- `type` (`alert_type`, nullable)

### branding_audit_log
- `action` (text)
- `changed_at` (timestamptz, nullable)
- `id` (uuid, PK)
- `new_values` (Json, nullable)
- `old_values` (Json, nullable)
- `tenant_id` (uuid, FK → tenants.id)
- `user_id` (uuid, nullable)

### chatmessages
- `body` (text, nullable)
- `content` (text)
- `content_type` (`content_type`, nullable)
- `created_at` (timestamptz, nullable)
- `deleted_at` (timestamptz, nullable)
- `deleted_by` (uuid, nullable → users.id)
- `file_url` (text, nullable)
- `id` (uuid, PK)
- `is_deleted` (boolean, nullable)
- `is_off_topic` (boolean, nullable)
- `pinned_at` (timestamptz, nullable)
- `pinned_by` (uuid, nullable → users.id)
- `room_id` (uuid, FK → rooms.id)
- `user_id` (uuid, FK → users.id)
- `user_role` (`user_role`, nullable)

### mediatrack
- `created_at` (timestamptz, nullable)
- `id` (uuid, PK)
- `is_active` (boolean, nullable)
- `metadata` (Json, nullable)
- `room_id` (uuid, FK → rooms.id)
- `track_id` (text)
- `track_type` (`track_type`)
- `updated_at` (timestamptz, nullable)
- `user_id` (uuid, FK → users.id)

### notes
- `created_at` (timestamptz, nullable)
- `file_type` (text, nullable)
- `file_url` (text)
- `filename` (text)
- `folder_name` (text)
- `id` (uuid, PK)
- `room_id` (uuid, FK → rooms.id)
- `updated_at` (timestamptz, nullable)
- `user_id` (uuid, FK → users.id)

### poll_votes
- `created_at` (timestamptz, nullable)
- `id` (uuid, PK)
- `option_index` (int)
- `poll_id` (uuid, FK → polls.id)
- `user_id` (uuid, FK → users.id)

### polls
- `created_at` (timestamptz, nullable)
- `created_by` (uuid, FK → users.id)
- `description` (text, nullable)
- `expires_at` (timestamptz, nullable)
- `id` (uuid, PK)
- `is_active` (boolean, nullable)
- `options` (text[])
- `room_id` (uuid, FK → rooms.id)
- `title` (text)
- `updated_at` (timestamptz, nullable)

### room_files
- `created_at` (timestamptz, nullable)
- `file_size` (int8)
- `file_type` (text, nullable)
- `file_url` (text)
- `filename` (text)
- `folder_name` (text)
- `id` (uuid, PK)
- `mime_type` (text)
- `room_id` (uuid, FK → rooms.id)
- `updated_at` (timestamptz, nullable)
- `user_id` (uuid, FK → users.id)

### room_memberships
- `city` (text, nullable)
- `country` (text, nullable)
- `country_code` (text, nullable)
- `id` (uuid, PK)
- `joined_at` (timestamptz, nullable)
- `last_location_update` (timestamptz, nullable)
- `region` (text, nullable)
- `role` (`user_role`, nullable)
- `room_id` (uuid, FK → rooms.id)
- `timezone` (text, nullable)
- `user_id` (uuid, FK → users.id)

### rooms
- `button_bg_color` (text, nullable)
- `button_text` (text, nullable)
- `button_text_color` (text, nullable)
- `button_width` (text, nullable)
- `card_bg_color` (text, nullable)
- `card_border_color` (text, nullable)
- `created_at` (timestamptz, nullable)
- `created_by` (uuid, FK → users.id)
- `description` (text, nullable)
- `description_color` (text, nullable)
- `icon_bg_color` (text, nullable)
- `icon_color` (text, nullable)
- `icon_url` (text, nullable)
- `id` (uuid, PK)
- `is_active` (boolean, nullable)
- `name` (text)
- `tags` (text[], nullable)
- `tenant_id` (uuid, FK → tenants.id)
- `title` (text)
- `title_color` (text, nullable)
- `updated_at` (timestamptz, nullable)

### sessions
- `ended_at` (timestamptz, nullable)
- `id` (uuid, PK)
- `last_activity` (timestamptz, nullable)
- `room_id` (uuid, FK → rooms.id)
- `session_token` (text, nullable)
- `started_at` (timestamptz, nullable)
- `user_agent` (text, nullable)
- `user_id` (uuid, FK → users.id)

### system_configuration
- `config_key` (text)
- `config_value` (text)
- `created_at` (timestamptz, nullable)
- `description` (text, nullable)
- `id` (uuid, PK)
- `updated_at` (timestamptz, nullable)

### tenant_configuration
- `config_key` (text)
- `config_value` (text)
- `created_at` (timestamptz, nullable)
- `id` (uuid, PK)
- `tenant_id` (uuid, FK → tenants.id)
- `updated_at` (timestamptz, nullable)

### tenants
- `accent_color` (text, nullable)
- `background_color` (text, nullable)
- `background_primary` (text, nullable)
- `background_secondary` (text, nullable)
- `body_weight` (int, nullable)
- `border_color` (text, nullable)
- `business_name` (text)
- `created_at` (timestamptz, nullable)
- `font_family` (text, nullable)
- `font_size_base` (text, nullable)
- `font_size_heading` (text, nullable)
- `font_weight_bold` (int, nullable)
- `font_weight_normal` (int, nullable)
- `heading_font` (text, nullable)
- `heading_weight` (int, nullable)
- `icon_size` (text, nullable)
- `icon_style` (text, nullable)
- `id` (uuid, PK)
- `logo_url` (text, nullable)
- `primary_color` (text, nullable)
- `room_icon` (text, nullable)
- `scale` (int, nullable)
- `secondary_color` (text, nullable)
- `text_color_muted` (text, nullable)
- `text_color_primary` (text, nullable)
- `text_color_secondary` (text, nullable)
- `updated_at` (timestamptz, nullable)

### user_integrations
- `access_token` (text)
- `connected_at` (timestamptz, nullable)
- `created_at` (timestamptz, nullable)
- `id` (uuid, PK)
- `integration_type` (`integration_type`)
- `is_active` (boolean, nullable)
- `last_refreshed_at` (timestamptz, nullable)
- `metadata` (Json, nullable)
- `refresh_token` (text, nullable)
- `token_expires_at` (timestamptz, nullable)
- `updated_at` (timestamptz, nullable)
- `user_id` (uuid, FK → users.id)

### user_themes
- `created_at` (timestamptz, nullable)
- `description` (text, nullable)
- `id` (uuid, PK)
- `name` (text)
- `theme_json` (Json)
- `thumbnail_dark` (text, nullable)
- `thumbnail_light` (text, nullable)
- `updated_at` (timestamptz, nullable)
- `user_id` (uuid, FK → users.id)

### private_chats
- `id` (uuid, PK)
- `user1_id` (uuid, FK → users.id)
- `user2_id` (uuid, FK → users.id)
- `created_at` (timestamptz, nullable)
- `updated_at` (timestamptz, nullable)

### private_messages
- `id` (uuid, PK)
- `chat_id` (uuid, FK → private_chats.id)
- `sender_id` (uuid, FK → users.id)
- `content` (text)
- `created_at` (timestamptz, nullable)

### users
- `avatar_url` (text, nullable)
- `created_at` (timestamptz, nullable)
- `display_name` (text, nullable)
- `email` (text, unique)
- `id` (uuid, PK)
- `role` (`user_role`, nullable)
- `updated_at` (timestamptz, nullable)

## Views
### branding_change_summary
- `business_name`, `id`, `last_changed`, `total_changes`, `unique_editors`

## Functions
- `check_rate_limit(p_user_id uuid) → boolean`

## Enums (public schema)
- `aal_level`: aal1 | aal2 | aal3
- `alert_type`: text | url | media
- `content_type`: text | image | file
- `fontfamilyoption`: Segoe UI | Inter | Montserrat | Roboto | Open Sans | Poppins | Lato | Raleway
- `integration_type`: spotify | x | linkedin
- `member_status`: active | banned | timeout
- `poll_status`: active | ended
- `profile_status`: active | suspended | deleted
- `profilestatus`: active | inactive | banned
- `recording_layout`: director | grid
- `recording_status`: recording | processing | ready | failed
- `recording_visibility`: members | private
- `room_visibility`: public | private
- `track_type`: audio | video | screen
- `user_role`: admin | host | moderator | member
- `user_status`: active | suspended | deleted
- `userrole`: host | moderator | member

## Moderation & Notification Tables (Latest Migration — 2025-11-02 21:06 EST)

### banned_users
- Columns: `id`, `user_id`, `room_id`, `banned_by`, `reason`, `banned_at`, `expires_at`, `created_at`
- Constraints: PK on `id`, unique (`user_id`, `room_id`), FKs to `users` and `rooms`
- Indexes: user_id, room_id, expires_at
- RLS: room admins can view/insert

### moderation_log
- Columns: `id`, `room_id`, `moderator_id`, `target_user_id`, `action`, `reason`, `metadata`, `created_at`
- Indexes: room_id, target_user_id, created_at
- RLS: admins/moderators can view/insert

### reported_content
- Columns: `id`, `content_type`, `content_id`, `room_id`, `reported_by`, `reason`, `status`, `reviewed_by`, `reviewed_at`, `resolution_notes`, `created_at`, `updated_at`
- Indexes: room_id, status, created_at
- RLS: reporters can insert; admins/moderators can read/update

### notifications
- Columns: `id`, `user_id`, `type`, `title`, `message`, `room_id`, `alert_id`, `link`, `metadata`, `created_at`
- Indexes: user_id, created_at
- RLS: users can view/update their notifications; system can insert

### private_chats (migration confirms)
- Reinforces existing table with unique (`user1_id`,`user2_id`) and ordering check (`user1_id < user2_id`)
- RLS: participants can view/insert

### private_messages (migration confirms)
- Adds indexes on `chat_id`, `sender_id`, `created_at`
- RLS: restricted to participants per chat

## How to Use This Snapshot
- **Compare against Supabase**: export schema from Supabase dashboard and diff against this file to find missing tables/columns or duplicates.
- **Regenerate `database.types.ts`**: once Supabase schema is confirmed, run `supabase gen types typescript --project-id <project> > src/types/database.types.ts` to keep TypeScript definitions in sync.
- **Future snapshots**: duplicate this file with a new timestamp whenever the schema changes.
