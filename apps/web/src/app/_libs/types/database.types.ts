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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      companions: {
        Row: {
          avatar_url: string
          created_at: string
          name: string
          stage: number
          user_id: string
        }
        Insert: {
          avatar_url: string
          created_at?: string
          name: string
          stage?: number
          user_id: string
        }
        Update: {
          avatar_url?: string
          created_at?: string
          name?: string
          stage?: number
          user_id?: string
        }
        Relationships: [
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
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          convo_id: string
          id?: string
          joined_at?: string
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          convo_id?: string
          id?: string
          joined_at?: string
          role?: string | null
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
          group_description: string | null
          group_max_members: number
          group_name: string | null
          id: string
          invite_code: string
          is_group: boolean | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          group_description?: string | null
          group_max_members?: number
          group_name?: string | null
          id?: string
          invite_code: string
          is_group?: boolean | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          group_description?: string | null
          group_max_members?: number
          group_name?: string | null
          id?: string
          invite_code?: string
          is_group?: boolean | null
          updated_at?: string
        }
        Relationships: []
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
      group_post_comments_read_receipts: {
        Row: {
          comment_id: string
          delivered_at: string
          id: string
          read_at: string
          user_id: string
        }
        Insert: {
          comment_id: string
          delivered_at?: string
          id?: string
          read_at?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          delivered_at?: string
          id?: string
          read_at?: string
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
      group_post_reads: {
        Row: {
          created_at: string
          group_post_id: string
          id: string
          read_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_post_id: string
          id?: string
          read_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
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
          convo_id: string
          id: string
          logged_item_id: string | null
          note: string | null
          shared_at: string
          shared_by: string
        }
        Insert: {
          convo_id: string
          id?: string
          logged_item_id?: string | null
          note?: string | null
          shared_at?: string
          shared_by: string
        }
        Update: {
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
          read_at: string
          user_id: string
        }
        Insert: {
          delivered_at?: string
          id?: string
          message_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          delivered_at?: string
          id?: string
          message_id?: string
          read_at?: string
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
      profiles: {
        Row: {
          about: string | null
          avtar_url: string | null
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
          avtar_url?: string | null
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
          avtar_url?: string | null
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
        Relationships: []
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
            isOneToOne: true
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
      text_array_to_string: {
        Args: { arr: string[]; sep: string }
        Returns: string
      }
    }
    Enums: {
      content_type_enum: "article" | "video" | "podcast"
      message_type_enum: "text" | "logged_item"
      save_source_enum: "external" | "shares" | "web_extension" | "discovered"
      theme_pref_enum: "light" | "dark" | "auto"
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
      content_type_enum: ["article", "video", "podcast"],
      message_type_enum: ["text", "logged_item"],
      save_source_enum: ["external", "shares", "web_extension", "discovered"],
      theme_pref_enum: ["light", "dark", "auto"],
    },
  },
} as const
