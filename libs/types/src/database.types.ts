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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bucket_last_read: {
        Row: {
          bucket: string
          last_read_at: string
          user_id: string
        }
        Insert: {
          bucket: string
          last_read_at?: string
          user_id: string
        }
        Update: {
          bucket?: string
          last_read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bucket_last_read_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      buckets: {
        Row: {
          color: string
          created_at: string
          id: string
          is_pinned: boolean
          is_system: boolean
          label: string
          slug: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          is_system?: boolean
          label: string
          slug: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          is_system?: boolean
          label?: string
          slug?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "buckets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      companions: {
        Row: {
          avatar_id: string
          created_at: string
          name: string
          stage: number
          user_id: string
        }
        Insert: {
          avatar_id: string
          created_at?: string
          name: string
          stage?: number
          user_id: string
        }
        Update: {
          avatar_id?: string
          created_at?: string
          name?: string
          stage?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "companions_avatar_id_fkey"
            columns: ["avatar_id"]
            isOneToOne: false
            referencedRelation: "media_metadata"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_members: {
        Row: {
          convo_id: string
          id: string
          joined_at: string
          last_read_at: string | null
          role: Database["public"]["Enums"]["role_enum"]
          updated_at: string
          user_id: string
        }
        Insert: {
          convo_id: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          role?: Database["public"]["Enums"]["role_enum"]
          updated_at?: string
          user_id: string
        }
        Update: {
          convo_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          role?: Database["public"]["Enums"]["role_enum"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_members_convo_id_fkey"
            columns: ["convo_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          group_avatar_id: string | null
          group_description: string | null
          group_max_members: number
          group_name: string | null
          id: string
          is_group: boolean | null
          last_activity_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          group_avatar_id?: string | null
          group_description?: string | null
          group_max_members?: number
          group_name?: string | null
          id?: string
          is_group?: boolean | null
          last_activity_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          group_avatar_id?: string | null
          group_description?: string | null
          group_max_members?: number
          group_name?: string | null
          id?: string
          is_group?: boolean | null
          last_activity_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_group_avatar_id_fkey"
            columns: ["group_avatar_id"]
            isOneToOne: false
            referencedRelation: "media_metadata"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          description: string
          id: string
          type: string
        }
        Insert: {
          description: string
          id?: string
          type: string
        }
        Update: {
          description?: string
          id?: string
          type?: string
        }
        Relationships: []
      }
      group_invites: {
        Row: {
          created_at: string
          group_id: string
          id: string
          invited_by: string
          invited_email: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          invited_by: string
          invited_email: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          invited_by?: string
          invited_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_invites_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_post_comments_read_receipts: {
        Row: {
          comment_id: string
          delivered_at: string
          id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          comment_id: string
          delivered_at?: string
          id?: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          comment_id?: string
          delivered_at?: string
          id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_post_comments_read_receipts_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "group_posts_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_post_comments_read_receipts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_post_last_seen: {
        Row: {
          comment_count: number
          group_post_id: string
          seen_at: string
          user_id: string
        }
        Insert: {
          comment_count?: number
          group_post_id: string
          seen_at?: string
          user_id: string
        }
        Update: {
          comment_count?: number
          group_post_id?: string
          seen_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_post_last_seen_group_post_id_fkey"
            columns: ["group_post_id"]
            isOneToOne: false
            referencedRelation: "group_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_post_last_seen_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_post_reads: {
        Row: {
          group_post_id: string
          id: string
          read_at: string
          user_id: string
        }
        Insert: {
          group_post_id: string
          id?: string
          read_at?: string
          user_id: string
        }
        Update: {
          group_post_id?: string
          id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_post_reads_group_post_id_fkey"
            columns: ["group_post_id"]
            isOneToOne: false
            referencedRelation: "group_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_post_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_posts: {
        Row: {
          content: string | null
          convo_id: string
          id: string
          logged_item_id: string | null
          note: string | null
          shared_at: string
          shared_by: string
        }
        Insert: {
          content?: string | null
          convo_id: string
          id?: string
          logged_item_id?: string | null
          note?: string | null
          shared_at?: string
          shared_by: string
        }
        Update: {
          content?: string | null
          convo_id?: string
          id?: string
          logged_item_id?: string | null
          note?: string | null
          shared_at?: string
          shared_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_posts_convo_id_fkey"
            columns: ["convo_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_posts_logged_item_id_fkey"
            columns: ["logged_item_id"]
            isOneToOne: false
            referencedRelation: "logged_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_posts_shared_by_fkey"
            columns: ["shared_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_posts_bookmarks: {
        Row: {
          created_at: string
          group_post_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_post_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_post_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_posts_bookmarks_group_post_id_fkey"
            columns: ["group_post_id"]
            isOneToOne: false
            referencedRelation: "group_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_posts_bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_posts_comments: {
        Row: {
          comment_text: string
          created_at: string
          group_post_id: string
          id: string
          parent_comment_id: string | null
          user_id: string
        }
        Insert: {
          comment_text: string
          created_at?: string
          group_post_id: string
          id?: string
          parent_comment_id?: string | null
          user_id: string
        }
        Update: {
          comment_text?: string
          created_at?: string
          group_post_id?: string
          id?: string
          parent_comment_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_posts_comments_group_post_id_fkey"
            columns: ["group_post_id"]
            isOneToOne: false
            referencedRelation: "group_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_posts_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "group_posts_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_posts_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_posts_comments_reactions: {
        Row: {
          comment_id: string
          created_at: string
          emoji: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          emoji: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          emoji?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_posts_comments_reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "group_posts_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_posts_comments_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_posts_likes: {
        Row: {
          created_at: string
          group_post_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_post_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_post_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_posts_likes_group_post_id_fkey"
            columns: ["group_post_id"]
            isOneToOne: false
            referencedRelation: "group_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_posts_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_posts_must_reads: {
        Row: {
          created_at: string
          group_post_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_post_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_post_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_posts_must_reads_group_post_id_fkey"
            columns: ["group_post_id"]
            isOneToOne: false
            referencedRelation: "group_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_posts_must_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      interests: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      logged_categories: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      logged_item_interests: {
        Row: {
          interest_id: string
          logged_item_id: string
        }
        Insert: {
          interest_id: string
          logged_item_id: string
        }
        Update: {
          interest_id?: string
          logged_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "logged_item_interests_interest_id_fkey"
            columns: ["interest_id"]
            isOneToOne: false
            referencedRelation: "interests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logged_item_interests_logged_item_id_fkey"
            columns: ["logged_item_id"]
            isOneToOne: false
            referencedRelation: "logged_items"
            referencedColumns: ["id"]
          },
        ]
      }
      logged_items: {
        Row: {
          category_id: string | null
          content_type: Database["public"]["Enums"]["content_type_enum"]
          created_at: string
          description: string | null
          id: string
          preview_image_url: string | null
          raw_metadata: Json | null
          tags: string[] | null
          title: string
          url: string
          url_hash: string
        }
        Insert: {
          category_id?: string | null
          content_type?: Database["public"]["Enums"]["content_type_enum"]
          created_at?: string
          description?: string | null
          id?: string
          preview_image_url?: string | null
          raw_metadata?: Json | null
          tags?: string[] | null
          title: string
          url: string
          url_hash: string
        }
        Update: {
          category_id?: string | null
          content_type?: Database["public"]["Enums"]["content_type_enum"]
          created_at?: string
          description?: string | null
          id?: string
          preview_image_url?: string | null
          raw_metadata?: Json | null
          tags?: string[] | null
          title?: string
          url?: string
          url_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "logged_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "logged_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      media_metadata: {
        Row: {
          bucket_name: string
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          is_public: boolean | null
          owner_id: string | null
          provider: Database["public"]["Enums"]["provider_enum"]
          updated_at: string | null
        }
        Insert: {
          bucket_name: string
          created_at?: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          is_public?: boolean | null
          owner_id?: string | null
          provider: Database["public"]["Enums"]["provider_enum"]
          updated_at?: string | null
        }
        Update: {
          bucket_name?: string
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          is_public?: boolean | null
          owner_id?: string | null
          provider?: Database["public"]["Enums"]["provider_enum"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_owner"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_read_receipts: {
        Row: {
          delivered_at: string
          id: string
          message_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          delivered_at?: string
          id?: string
          message_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          delivered_at?: string
          id?: string
          message_id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_read_receipts_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_read_receipts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          convo_id: string
          created_at: string
          id: string
          logged_item_id: string | null
          message_parent_id: string | null
          message_text: string
          message_type: Database["public"]["Enums"]["message_type_enum"] | null
          sender_id: string
          updated_at: string
        }
        Insert: {
          convo_id: string
          created_at?: string
          id?: string
          logged_item_id?: string | null
          message_parent_id?: string | null
          message_text: string
          message_type?: Database["public"]["Enums"]["message_type_enum"] | null
          sender_id: string
          updated_at?: string
        }
        Update: {
          convo_id?: string
          created_at?: string
          id?: string
          logged_item_id?: string | null
          message_parent_id?: string | null
          message_text?: string
          message_type?: Database["public"]["Enums"]["message_type_enum"] | null
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_convo_id_fkey"
            columns: ["convo_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_logged_item_id_fkey"
            columns: ["logged_item_id"]
            isOneToOne: false
            referencedRelation: "logged_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_message_parent_id_fkey"
            columns: ["message_parent_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_actors: {
        Row: {
          actor_id: string
          created_at: string | null
          id: string
          notification_id: string | null
        }
        Insert: {
          actor_id: string
          created_at?: string | null
          id?: string
          notification_id?: string | null
        }
        Update: {
          actor_id?: string
          created_at?: string | null
          id?: string
          notification_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_actors_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_actors_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          bookmark_notifications: boolean | null
          co_engagement_notifications: boolean | null
          comment_notifications: boolean | null
          email_enabled: boolean | null
          follow_notifications: boolean | null
          id: string
          like_notifications: boolean | null
          mention_notifications: boolean | null
          must_read_notifications: boolean | null
          new_post_notifications: boolean | null
          push_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bookmark_notifications?: boolean | null
          co_engagement_notifications?: boolean | null
          comment_notifications?: boolean | null
          email_enabled?: boolean | null
          follow_notifications?: boolean | null
          id?: string
          like_notifications?: boolean | null
          mention_notifications?: boolean | null
          must_read_notifications?: boolean | null
          new_post_notifications?: boolean | null
          push_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bookmark_notifications?: boolean | null
          co_engagement_notifications?: boolean | null
          comment_notifications?: boolean | null
          email_enabled?: boolean | null
          follow_notifications?: boolean | null
          id?: string
          like_notifications?: boolean | null
          mention_notifications?: boolean | null
          must_read_notifications?: boolean | null
          new_post_notifications?: boolean | null
          push_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          created_at: string
          event_id: string | null
          event_type: Database["public"]["Enums"]["entity_type_enum"]
          id: string
          is_read: boolean
          message: string | null
          recipient_id: string
          updated_at: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          event_id?: string | null
          event_type: Database["public"]["Enums"]["entity_type_enum"]
          id?: string
          is_read?: boolean
          message?: string | null
          recipient_id: string
          updated_at?: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          event_id?: string | null
          event_type?: Database["public"]["Enums"]["entity_type_enum"]
          id?: string
          is_read?: boolean
          message?: string | null
          recipient_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          about: string | null
          avatar_id: string | null
          created_at: string
          first_name: string | null
          handle: string | null
          id: string
          is_onboarded: boolean
          last_name: string | null
          theme_pref: Database["public"]["Enums"]["theme_pref_enum"]
          updated_at: string
          xp: number
        }
        Insert: {
          about?: string | null
          avatar_id?: string | null
          created_at?: string
          first_name?: string | null
          handle?: string | null
          id: string
          is_onboarded?: boolean
          last_name?: string | null
          theme_pref?: Database["public"]["Enums"]["theme_pref_enum"]
          updated_at?: string
          xp?: number
        }
        Update: {
          about?: string | null
          avatar_id?: string | null
          created_at?: string
          first_name?: string | null
          handle?: string | null
          id?: string
          is_onboarded?: boolean
          last_name?: string | null
          theme_pref?: Database["public"]["Enums"]["theme_pref_enum"]
          updated_at?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_avatar_id_fkey"
            columns: ["avatar_id"]
            isOneToOne: false
            referencedRelation: "media_metadata"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_sessions: {
        Row: {
          completed: boolean
          created_at: string
          duration: number | null
          id: string
          logged_item_id: string
          progress: number
          session_end_time: string | null
          session_start_time: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          duration?: number | null
          id?: string
          logged_item_id: string
          progress?: number
          session_end_time?: string | null
          session_start_time?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          duration?: number | null
          id?: string
          logged_item_id?: string
          progress?: number
          session_end_time?: string | null
          session_start_time?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_sessions_logged_item_id_fkey"
            columns: ["logged_item_id"]
            isOneToOne: false
            referencedRelation: "logged_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stat_snapshots: {
        Row: {
          created_at: string
          id: string
          period_label: string
          slug: string
          stats_json: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          period_label: string
          slug: string
          stats_json?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          period_label?: string
          slug?: string
          stats_json?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stat_snapshots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      thoughts: {
        Row: {
          bucket: string
          bucket_source: Database["public"]["Enums"]["bucket_source"]
          content_type: Database["public"]["Enums"]["thought_content_type"]
          created_at: string
          id: string
          media_id: string | null
          text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bucket?: string
          bucket_source?: Database["public"]["Enums"]["bucket_source"]
          content_type?: Database["public"]["Enums"]["thought_content_type"]
          created_at?: string
          id?: string
          media_id?: string | null
          text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bucket?: string
          bucket_source?: Database["public"]["Enums"]["bucket_source"]
          content_type?: Database["public"]["Enums"]["thought_content_type"]
          created_at?: string
          id?: string
          media_id?: string | null
          text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "thoughts_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media_metadata"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thoughts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_devices: {
        Row: {
          created_at: string | null
          device_type: Database["public"]["Enums"]["device_type_enum"]
          fcm_token: string
          id: string
          last_seen_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          device_type: Database["public"]["Enums"]["device_type_enum"]
          fcm_token: string
          id?: string
          last_seen_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          device_type?: Database["public"]["Enums"]["device_type_enum"]
          fcm_token?: string
          id?: string
          last_seen_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_events: {
        Row: {
          actor_user_id: string
          event_type: string
          id: string
          logged_item_id: string | null
          metadata: Json
          occurred_at: string
          target_user_id: string | null
          url: string | null
        }
        Insert: {
          actor_user_id: string
          event_type: string
          id?: string
          logged_item_id?: string | null
          metadata?: Json
          occurred_at?: string
          target_user_id?: string | null
          url?: string | null
        }
        Update: {
          actor_user_id?: string
          event_type?: string
          id?: string
          logged_item_id?: string | null
          metadata?: Json
          occurred_at?: string
          target_user_id?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_events_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_events_event_type_fkey"
            columns: ["event_type"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["type"]
          },
          {
            foreignKeyName: "user_events_logged_item_id_fkey"
            columns: ["logged_item_id"]
            isOneToOne: false
            referencedRelation: "logged_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_events_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_interests: {
        Row: {
          created_at: string
          id: string
          interest_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interest_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interest_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_interests_interest_id_fkey"
            columns: ["interest_id"]
            isOneToOne: false
            referencedRelation: "interests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_interests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_logged_items: {
        Row: {
          author: string | null
          created_at: string
          id: string
          is_read: boolean
          logged_item_id: string
          remarks: string | null
          save_source: Database["public"]["Enums"]["save_source_enum"]
          saved_from_group: string | null
          shared_by: string | null
          user_id: string
        }
        Insert: {
          author?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          logged_item_id: string
          remarks?: string | null
          save_source?: Database["public"]["Enums"]["save_source_enum"]
          saved_from_group?: string | null
          shared_by?: string | null
          user_id: string
        }
        Update: {
          author?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          logged_item_id?: string
          remarks?: string | null
          save_source?: Database["public"]["Enums"]["save_source_enum"]
          saved_from_group?: string | null
          shared_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_logged_items_author_fkey"
            columns: ["author"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_logged_items_logged_item_id_fkey"
            columns: ["logged_item_id"]
            isOneToOne: false
            referencedRelation: "logged_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_logged_items_saved_from_group_fkey"
            columns: ["saved_from_group"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_logged_items_shared_by_fkey"
            columns: ["shared_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_logged_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_stats_monthly: {
        Row: {
          article_count: number
          computed_at: string
          id: string
          month_start_date: string
          podcast_count: number
          total_logs: number
          total_reading_time: number
          unique_categories: number
          user_id: string
          video_count: number
        }
        Insert: {
          article_count?: number
          computed_at?: string
          id?: string
          month_start_date: string
          podcast_count?: number
          total_logs?: number
          total_reading_time?: number
          unique_categories?: number
          user_id: string
          video_count?: number
        }
        Update: {
          article_count?: number
          computed_at?: string
          id?: string
          month_start_date?: string
          podcast_count?: number
          total_logs?: number
          total_reading_time?: number
          unique_categories?: number
          user_id?: string
          video_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_stats_monthly_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_stats_weekly: {
        Row: {
          article_count: number
          computed_at: string
          id: string
          podcast_count: number
          total_logs: number
          total_reading_time: number
          unique_categories: number
          user_id: string
          video_count: number
          week_start_date: string
        }
        Insert: {
          article_count?: number
          computed_at?: string
          id?: string
          podcast_count?: number
          total_logs?: number
          total_reading_time?: number
          unique_categories?: number
          user_id: string
          video_count?: number
          week_start_date: string
        }
        Update: {
          article_count?: number
          computed_at?: string
          id?: string
          podcast_count?: number
          total_logs?: number
          total_reading_time?: number
          unique_categories?: number
          user_id?: string
          video_count?: number
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_stats_weekly_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _avatar_path: { Args: { p_media_id: string }; Returns: string }
      _display_name: {
        Args: { p_first_name: string; p_handle: string; p_last_name: string }
        Returns: string
      }
      get_all_post_engagers: {
        Args: { p_exclude_users: string[]; p_post_id: string }
        Returns: {
          user_id: string
        }[]
      }
      get_discovery_feed_page: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          comment_count: number
          content: string
          convo_id: string
          did_like: boolean
          did_must_read: boolean
          id: string
          item_content_type: string
          item_description: string
          item_preview_image: string
          item_raw_metadata: Json
          item_title: string
          item_url: string
          like_count: number
          logged_item_id: string
          must_read_count: number
          note: string
          seen_at: string
          shared_at: string
          shared_by: string
          sharer_avatar_path: string
          sharer_display_name: string
          sharer_handle: string
          sharer_id: string
        }[]
      }
      get_dm_unread_counts: {
        Args: { p_user_id: string }
        Returns: {
          convo_id: string
          unread_count: number
        }[]
      }
      get_feed_comment_previews: {
        Args: { p_post_ids: string[] }
        Returns: {
          author_avatar_path: string
          author_display_name: string
          comment_text: string
          created_at: string
          group_post_id: string
        }[]
      }
      get_group_feed_page: {
        Args: {
          p_cursor?: string
          p_group_id: string
          p_limit?: number
          p_user_id: string
        }
        Returns: {
          comment_count: number
          content: string
          convo_id: string
          did_like: boolean
          did_must_read: boolean
          id: string
          item_content_type: string
          item_description: string
          item_preview_image: string
          item_raw_metadata: Json
          item_title: string
          item_url: string
          like_count: number
          logged_item_id: string
          must_read_count: number
          note: string
          seen_at: string
          shared_at: string
          shared_by: string
          sharer_avatar_path: string
          sharer_display_name: string
          sharer_handle: string
          sharer_id: string
        }[]
      }
      get_group_members: {
        Args: { p_group_id: string }
        Returns: {
          convo_id: string
          id: string
          joined_at: string
          profile_avatar_path: string
          profile_display_name: string
          profile_handle: string
          profile_id: string
          role: Database["public"]["Enums"]["role_enum"]
          updated_at: string
          user_id: string
        }[]
      }
      get_group_post_comments: {
        Args: { p_cursor?: string; p_limit?: number; p_post_id: string }
        Returns: {
          author_avatar_path: string
          author_display_name: string
          author_handle: string
          author_id: string
          comment_text: string
          created_at: string
          group_post_id: string
          id: string
          parent_comment_id: string
          user_id: string
        }[]
      }
      get_thought_bucket_summaries: {
        Args: never
        Returns: {
          bucket: string
          bucketLabel: string
          color: string
          isPinned: boolean
          isSystem: boolean
          latestCreatedAt: string
          latestText: string
          totalCount: number
          unreadCount: number
        }[]
      }
      get_user_groups: {
        Args: never
        Returns: {
          avatar_path: string
          group_description: string
          group_name: string
          id: string
          joined_at: string
          last_activity_at: string
          role: Database["public"]["Enums"]["role_enum"]
        }[]
      }
      mark_conversation_read: {
        Args: { p_convo_id: string; p_user_id: string }
        Returns: undefined
      }
      text_array_to_string: {
        Args: { arr: string[]; sep: string }
        Returns: string
      }
    }
    Enums: {
      bucket_source: "auto" | "ai" | "user"
      content_type_enum:
        | "article"
        | "video"
        | "podcast"
        | "tweet"
        | "substack"
        | "spotify"
        | "link"
      device_type_enum: "android" | "ios" | "web"
      entity_type_enum:
        | "like"
        | "must_read"
        | "comment"
        | "new_post"
        | "streak_reminder"
        | "weekly_digest"
        | "bookmark"
        | "also_must_read"
        | "also_commented"
        | "must_read_broadcast"
        | "co_engaged"
      message_type_enum: "text" | "logged_item"
      provider_enum: "supabase" | "s3" | "r2" | "do_spaces" | "gcs"
      role_enum: "owner" | "admin" | "member"
      save_source_enum: "external" | "shares" | "web_extension" | "discovered"
      theme_pref_enum: "light" | "dark" | "auto"
      thought_content_type: "text" | "image" | "voice_note" | "file"
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
  public: {
    Enums: {
      bucket_source: ["auto", "ai", "user"],
      content_type_enum: [
        "article",
        "video",
        "podcast",
        "tweet",
        "substack",
        "spotify",
        "link",
      ],
      device_type_enum: ["android", "ios", "web"],
      entity_type_enum: [
        "like",
        "must_read",
        "comment",
        "new_post",
        "streak_reminder",
        "weekly_digest",
        "bookmark",
        "also_must_read",
        "also_commented",
        "must_read_broadcast",
        "co_engaged",
      ],
      message_type_enum: ["text", "logged_item"],
      provider_enum: ["supabase", "s3", "r2", "do_spaces", "gcs"],
      role_enum: ["owner", "admin", "member"],
      save_source_enum: ["external", "shares", "web_extension", "discovered"],
      theme_pref_enum: ["light", "dark", "auto"],
      thought_content_type: ["text", "image", "voice_note", "file"],
    },
  },
} as const
