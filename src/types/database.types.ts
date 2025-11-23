export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          author: Json | null
          author_id: string | null
          author_role: string | null
          body: string | null
          created_at: string | null
          has_legal_disclosure: boolean | null
          id: string
          is_non_trade: boolean | null
          legal_disclosure_text: string | null
          room_id: string
          title: string | null
          type: string | null
        }
        Insert: {
          author?: Json | null
          author_id?: string | null
          author_role?: string | null
          body?: string | null
          created_at?: string | null
          has_legal_disclosure?: boolean | null
          id?: string
          is_non_trade?: boolean | null
          legal_disclosure_text?: string | null
          room_id: string
          title?: string | null
          type?: string | null
        }
        Update: {
          author?: Json | null
          author_id?: string | null
          author_role?: string | null
          body?: string | null
          created_at?: string | null
          has_legal_disclosure?: boolean | null
          id?: string
          is_non_trade?: boolean | null
          legal_disclosure_text?: string | null
          room_id?: string
          title?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      branding_audit_log: {
        Row: {
          action: string
          changed_at: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changed_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changed_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branding_audit_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "branding_change_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branding_audit_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      chatmessages: {
        Row: {
          body: string | null
          content: string
          content_type: Database["public"]["Enums"]["content_type"] | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          file_url: string | null
          id: string
          is_deleted: boolean | null
          is_off_topic: boolean | null
          pinned_at: string | null
          pinned_by: string | null
          room_id: string
          user_id: string
          user_role: Database["public"]["Enums"]["user_role"] | null
        }
        Insert: {
          body?: string | null
          content: string
          content_type?: Database["public"]["Enums"]["content_type"] | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          file_url?: string | null
          id?: string
          is_deleted?: boolean | null
          is_off_topic?: boolean | null
          pinned_at?: string | null
          pinned_by?: string | null
          room_id: string
          user_id: string
          user_role?: Database["public"]["Enums"]["user_role"] | null
        }
        Update: {
          body?: string | null
          content?: string
          content_type?: Database["public"]["Enums"]["content_type"] | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          file_url?: string | null
          id?: string
          is_deleted?: boolean | null
          is_off_topic?: boolean | null
          pinned_at?: string | null
          pinned_by?: string | null
          room_id?: string
          user_id?: string
          user_role?: Database["public"]["Enums"]["user_role"] | null
        }
        Relationships: [
          {
            foreignKeyName: "chatmessages_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatmessages_pinned_by_fkey"
            columns: ["pinned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatmessages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatmessages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mediatrack: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          room_id: string
          track_id: string
          track_type: Database["public"]["Enums"]["track_type"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          room_id: string
          track_id: string
          track_type: Database["public"]["Enums"]["track_type"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          room_id?: string
          track_id?: string
          track_type?: Database["public"]["Enums"]["track_type"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mediatrack_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mediatrack_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          created_at: string | null
          file_type: string | null
          file_url: string
          filename: string
          folder_name: string
          id: string
          room_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          file_type?: string | null
          file_url: string
          filename: string
          folder_name: string
          id?: string
          room_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          file_type?: string | null
          file_url?: string
          filename?: string
          folder_name?: string
          id?: string
          room_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_votes: {
        Row: {
          created_at: string | null
          id: string
          option_index: number
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          option_index: number
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          option_index?: number
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          options: string[]
          room_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          options: string[]
          room_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          options?: string[]
          room_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "polls_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "polls_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_files: {
        Row: {
          created_at: string | null
          file_size: number
          file_type: string | null
          file_url: string
          filename: string
          folder_name: string
          id: string
          mime_type: string
          room_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          file_size: number
          file_type?: string | null
          file_url: string
          filename: string
          folder_name: string
          id?: string
          mime_type: string
          room_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          file_size?: number
          file_type?: string | null
          file_url?: string
          filename?: string
          folder_name?: string
          id?: string
          mime_type?: string
          room_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_files_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_files_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      room_memberships: {
        Row: {
          city: string | null
          country: string | null
          country_code: string | null
          id: string
          joined_at: string | null
          last_location_update: string | null
          region: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          room_id: string
          timezone: string | null
          user_id: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          country_code?: string | null
          id?: string
          joined_at?: string | null
          last_location_update?: string | null
          region?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          room_id: string
          timezone?: string | null
          user_id: string
        }
        Update: {
          city?: string | null
          country?: string | null
          country_code?: string | null
          id?: string
          joined_at?: string | null
          last_location_update?: string | null
          region?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          room_id?: string
          timezone?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_memberships_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          button_bg_color: string | null
          button_text: string | null
          button_text_color: string | null
          button_width: string | null
          card_bg_color: string | null
          card_border_color: string | null
          created_at: string | null
          created_by: string
          description: string | null
          description_color: string | null
          icon_bg_color: string | null
          icon_color: string | null
          icon_url: string | null
          id: string
          is_active: boolean | null
          name: string
          tags: string[] | null
          tenant_id: string
          title: string
          title_color: string | null
          updated_at: string | null
        }
        Insert: {
          button_bg_color?: string | null
          button_text?: string | null
          button_text_color?: string | null
          button_width?: string | null
          card_bg_color?: string | null
          card_border_color?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          description_color?: string | null
          icon_bg_color?: string | null
          icon_color?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          tags?: string[] | null
          tenant_id: string
          title: string
          title_color?: string | null
          updated_at?: string | null
        }
        Update: {
          button_bg_color?: string | null
          button_text?: string | null
          button_text_color?: string | null
          button_width?: string | null
          card_bg_color?: string | null
          card_border_color?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          description_color?: string | null
          icon_bg_color?: string | null
          icon_color?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          tags?: string[] | null
          tenant_id?: string
          title?: string
          title_color?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rooms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "branding_change_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          ended_at: string | null
          id: string
          last_activity: string | null
          room_id: string
          session_token: string | null
          started_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          ended_at?: string | null
          id?: string
          last_activity?: string | null
          room_id: string
          session_token?: string | null
          started_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          ended_at?: string | null
          id?: string
          last_activity?: string | null
          room_id?: string
          session_token?: string | null
          started_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      system_configuration: {
        Row: {
          config_key: string
          config_value: string
          created_at: string | null
          description: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          config_key: string
          config_value: string
          created_at?: string | null
          description?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          config_key?: string
          config_value?: string
          created_at?: string | null
          description?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tenant_configuration: {
        Row: {
          config_key: string
          config_value: string
          created_at: string | null
          id: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          config_key: string
          config_value: string
          created_at?: string | null
          id?: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          config_key?: string
          config_value?: string
          created_at?: string | null
          id?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_configuration_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "branding_change_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_configuration_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          accent_color: string | null
          background_color: string | null
          background_primary: string | null
          background_secondary: string | null
          body_weight: number | null
          border_color: string | null
          business_name: string
          created_at: string | null
          font_family: string | null
          font_size_base: string | null
          font_size_heading: string | null
          font_weight_bold: number | null
          font_weight_normal: number | null
          heading_font: string | null
          heading_weight: number | null
          icon_size: string | null
          icon_style: string | null
          id: string
          logo_url: string | null
          primary_color: string | null
          room_icon: string | null
          scale: number | null
          secondary_color: string | null
          text_color_muted: string | null
          text_color_primary: string | null
          text_color_secondary: string | null
          updated_at: string | null
        }
        Insert: {
          accent_color?: string | null
          background_color?: string | null
          background_primary?: string | null
          background_secondary?: string | null
          body_weight?: number | null
          border_color?: string | null
          business_name: string
          created_at?: string | null
          font_family?: string | null
          font_size_base?: string | null
          font_size_heading?: string | null
          font_weight_bold?: number | null
          font_weight_normal?: number | null
          heading_font?: string | null
          heading_weight?: number | null
          icon_size?: string | null
          icon_style?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          room_icon?: string | null
          scale?: number | null
          secondary_color?: string | null
          text_color_muted?: string | null
          text_color_primary?: string | null
          text_color_secondary?: string | null
          updated_at?: string | null
        }
        Update: {
          accent_color?: string | null
          background_color?: string | null
          background_primary?: string | null
          background_secondary?: string | null
          body_weight?: number | null
          border_color?: string | null
          business_name?: string
          created_at?: string | null
          font_family?: string | null
          font_size_base?: string | null
          font_size_heading?: string | null
          font_weight_bold?: number | null
          font_weight_normal?: number | null
          heading_font?: string | null
          heading_weight?: number | null
          icon_size?: string | null
          icon_style?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          room_icon?: string | null
          scale?: number | null
          secondary_color?: string | null
          text_color_muted?: string | null
          text_color_primary?: string | null
          text_color_secondary?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_integrations: {
        Row: {
          access_token: string
          connected_at: string | null
          created_at: string | null
          id: string
          integration_type: Database["public"]["Enums"]["integration_type"]
          is_active: boolean | null
          last_refreshed_at: string | null
          metadata: Json | null
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          connected_at?: string | null
          created_at?: string | null
          id?: string
          integration_type: Database["public"]["Enums"]["integration_type"]
          is_active?: boolean | null
          last_refreshed_at?: string | null
          metadata?: Json | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          connected_at?: string | null
          created_at?: string | null
          id?: string
          integration_type?: Database["public"]["Enums"]["integration_type"]
          is_active?: boolean | null
          last_refreshed_at?: string | null
          metadata?: Json | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_integrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_themes: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          theme_json: Json
          thumbnail_dark: string | null
          thumbnail_light: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          theme_json: Json
          thumbnail_dark?: string | null
          thumbnail_light?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          theme_json?: Json
          thumbnail_dark?: string | null
          thumbnail_light?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_themes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      private_chats: {
        Row: {
          id: string
          user1_id: string
          user2_id: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user1_id: string
          user2_id: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user1_id?: string
          user2_id?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "private_chats_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_chats_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      private_messages: {
        Row: {
          id: string
          chat_id: string
          sender_id: string
          content: string
          created_at: string | null
        }
        Insert: {
          id?: string
          chat_id: string
          sender_id: string
          content: string
          created_at?: string | null
        }
        Update: {
          id?: string
          chat_id?: string
          sender_id?: string
          content?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "private_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "private_chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          email: string
          id: string
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      branding_change_summary: {
        Row: {
          business_name: string | null
          id: string | null
          last_changed: string | null
          total_changes: number | null
          unique_editors: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_rate_limit: { Args: { p_user_id: string }; Returns: boolean }
    }
    Enums: {
      aal_level: "aal1" | "aal2" | "aal3"
      alert_type: "text" | "url" | "media"
      content_type: "text" | "image" | "file"
      fontfamilyoption:
        | "Segoe UI"
        | "Inter"
        | "Montserrat"
        | "Roboto"
        | "Open Sans"
        | "Poppins"
        | "Lato"
        | "Raleway"
      integration_type: "spotify" | "x" | "linkedin"
      member_status: "active" | "banned" | "timeout"
      poll_status: "active" | "ended"
      profile_status: "active" | "suspended" | "deleted"
      profilestatus: "active" | "inactive" | "banned"
      recording_layout: "director" | "grid"
      recording_status: "recording" | "processing" | "ready" | "failed"
      recording_visibility: "members" | "private"
      room_visibility: "public" | "private"
      track_type: "audio" | "video" | "screen"
      user_role: "admin" | "host" | "moderator" | "member"
      user_status: "active" | "suspended" | "deleted"
      userrole: "host" | "moderator" | "member"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      aal_level: ["aal1", "aal2", "aal3"],
      alert_type: ["text", "url", "media"],
      content_type: ["text", "image", "file"],
      fontfamilyoption: [
        "Segoe UI",
        "Inter",
        "Montserrat",
        "Roboto",
        "Open Sans",
        "Poppins",
        "Lato",
        "Raleway",
      ],
      integration_type: ["spotify", "x", "linkedin"],
      member_status: ["active", "banned", "timeout"],
      poll_status: ["active", "ended"],
      profile_status: ["active", "suspended", "deleted"],
      profilestatus: ["active", "inactive", "banned"],
      recording_layout: ["director", "grid"],
      recording_status: ["recording", "processing", "ready", "failed"],
      recording_visibility: ["members", "private"],
      room_visibility: ["public", "private"],
      track_type: ["audio", "video", "screen"],
      user_role: ["admin", "host", "moderator", "member"],
      user_status: ["active", "suspended", "deleted"],
      userrole: ["host", "moderator", "member"],
    },
  },
} as const


// ============================================================================
// Type Exports for Convenience
// ============================================================================
export type ChatMessage = Database["public"]["Tables"]["chatmessages"]["Row"];
export type Alert = Database["public"]["Tables"]["alerts"]["Row"];
export type User = Database["public"]["Tables"]["users"]["Row"];
export type Room = Database["public"]["Tables"]["rooms"]["Row"];
export type Poll = Database["public"]["Tables"]["polls"]["Row"];
export type Tenant = Database["public"]["Tables"]["tenants"]["Row"];
export type RoomMembership = Database["public"]["Tables"]["room_memberships"]["Row"];
export type MediaTrack = Database["public"]["Tables"]["mediatrack"]["Row"];

// ============================================================================
// NEW TABLES - Added 2025-11-02 21:06:00
// ============================================================================
// Note: These types are placeholders until migration is applied and types regenerated
export type BannedUser = {
  id: string;
  user_id: string;
  room_id: string;
  banned_by: string;
  reason: string;
  banned_at: string | null;
  expires_at: string | null;
  created_at: string | null;
};

export type ModerationLog = {
  id: string;
  room_id: string;
  moderator_id: string;
  target_user_id: string;
  action: 'kick' | 'ban' | 'mute' | 'warn' | 'unban' | 'unmute';
  reason: string | null;
  metadata: Record<string, unknown>;
  created_at: string | null;
};

export type ReportedContent = {
  id: string;
  content_type: 'message' | 'alert' | 'user' | 'room';
  content_id: string;
  room_id: string;
  reported_by: string;
  reason: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  reviewed_by: string | null;
  reviewed_at: string | null;
  resolution_notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type Notification = {
  id: string;
  user_id: string;
  type: 'mention' | 'reply' | 'broadcast_alert' | 'room_invite' | 'system';
  title: string;
  message: string;
  room_id: string | null;
  alert_id: string | null;
  link: string | null;
  metadata: Record<string, unknown>;
  created_at: string | null;
};

export type PrivateChat = {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string | null;
  updated_at: string | null;
};

export type PrivateMessage = {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string | null;
};

