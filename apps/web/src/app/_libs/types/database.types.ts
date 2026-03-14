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
      comments: {
        Row: {
          content: string
          created_at: string
          group_share_id: string
          id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          group_share_id: string
          id?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          group_share_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_group_share_id_fkey"
            columns: ["group_share_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
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
          conversation_id: string
          id: string
          joined_at: string
          role: string
          user_handle: string
          user_id: string | null
          user_name: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          role?: string
          user_handle: string
          user_id?: string | null
          user_name: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_handle?: string
          user_id?: string | null
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          is_admin: boolean
          joined_at: string | null
          role: string
          status: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          is_admin?: boolean
          joined_at?: string | null
          role?: string
          status?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          is_admin?: boolean
          joined_at?: string | null
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_shares: {
        Row: {
          group_id: string
          id: string
          logged_item_id: string
          note: string | null
          shared_at: string
          shared_by: string
        }
        Insert: {
          group_id: string
          id?: string
          logged_item_id: string
          note?: string | null
          shared_at?: string
          shared_by: string
        }
        Update: {
          group_id?: string
          id?: string
          logged_item_id?: string
          note?: string | null
          shared_at?: string
          shared_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_shares_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_shares_logged_item_id_fkey"
            columns: ["logged_item_id"]
            isOneToOne: false
            referencedRelation: "logged_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_shares_shared_by_fkey"
            columns: ["shared_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          invite_code: string
          max_members: number
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          invite_code: string
          max_members?: number
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          invite_code?: string
          max_members?: number
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_created_by_fkey"
            columns: ["created_by"]
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
          author: string | null
          category_id: string | null
          content_type: string
          created_at: string
          id: string
          preview_image: string | null
          raw_metadata: Json | null
          read_time: string | null
          remarks: string | null
          save_source: string
          shared_from_handle: string | null
          shared_from_name: string | null
          shared_to_groups: string[] | null
          source: string | null
          tags: string[] | null
          title: string | null
          url: string
          user_id: string
        }
        Insert: {
          author?: string | null
          category_id?: string | null
          content_type?: string
          created_at?: string
          id?: string
          preview_image?: string | null
          raw_metadata?: Json | null
          read_time?: string | null
          remarks?: string | null
          save_source?: string
          shared_from_handle?: string | null
          shared_from_name?: string | null
          shared_to_groups?: string[] | null
          source?: string | null
          tags?: string[] | null
          title?: string | null
          url: string
          user_id: string
        }
        Update: {
          author?: string | null
          category_id?: string | null
          content_type?: string
          created_at?: string
          id?: string
          preview_image?: string | null
          raw_metadata?: Json | null
          read_time?: string | null
          remarks?: string | null
          save_source?: string
          shared_from_handle?: string | null
          shared_from_name?: string | null
          shared_to_groups?: string[] | null
          source?: string | null
          tags?: string[] | null
          title?: string | null
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "logged_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "logged_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logged_items_user_id_fkey"
            columns: ["user_id"]
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
          user_handle: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_handle: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_handle?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_read_receipts: {
        Row: {
          id: string
          message_id: string
          read_at: string
          user_handle: string
        }
        Insert: {
          id?: string
          message_id: string
          read_at?: string
          user_handle: string
        }
        Update: {
          id?: string
          message_id?: string
          read_at?: string
          user_handle?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_read_receipts_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          forwarded_from: Json | null
          id: string
          image_url: string | null
          link_preview: Json | null
          message_type: string
          sender_handle: string
          sender_id: string | null
          sender_name: string
          updated_at: string
        }
        Insert: {
          content?: string
          conversation_id: string
          created_at?: string
          forwarded_from?: Json | null
          id?: string
          image_url?: string | null
          link_preview?: Json | null
          message_type?: string
          sender_handle: string
          sender_id?: string | null
          sender_name: string
          updated_at?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          forwarded_from?: Json | null
          id?: string
          image_url?: string | null
          link_preview?: Json | null
          message_type?: string
          sender_handle?: string
          sender_id?: string | null
          sender_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      person_shares: {
        Row: {
          content_type: string
          id: string
          preview_image: string | null
          read_time: string | null
          received_from_handle: string | null
          received_from_name: string | null
          recipient_handle: string
          recipient_name: string
          shared_at: string
          sharer_id: string
          source: string | null
          title: string | null
          url: string
        }
        Insert: {
          content_type?: string
          id?: string
          preview_image?: string | null
          read_time?: string | null
          received_from_handle?: string | null
          received_from_name?: string | null
          recipient_handle: string
          recipient_name: string
          shared_at?: string
          sharer_id: string
          source?: string | null
          title?: string | null
          url: string
        }
        Update: {
          content_type?: string
          id?: string
          preview_image?: string | null
          read_time?: string | null
          received_from_handle?: string | null
          received_from_name?: string | null
          recipient_handle?: string
          recipient_name?: string
          shared_at?: string
          sharer_id?: string
          source?: string | null
          title?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "person_shares_sharer_id_fkey"
            columns: ["sharer_id"]
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
          first_name: string
          handle: string
          id: string
          interests: string[] | null
          is_onboarded: boolean
          last_name: string
          theme_pref: string | null
          updated_at: string
          xp: number
        }
        Insert: {
          about?: string | null
          avtar_url?: string | null
          created_at?: string
          first_name: string
          handle: string
          id: string
          interests?: string[] | null
          is_onboarded?: boolean
          last_name: string
          theme_pref?: string | null
          updated_at?: string
          xp?: number
        }
        Update: {
          about?: string | null
          avtar_url?: string | null
          created_at?: string
          first_name?: string
          handle?: string
          id?: string
          interests?: string[] | null
          is_onboarded?: boolean
          last_name?: string
          theme_pref?: string | null
          updated_at?: string
          xp?: number
        }
        Relationships: []
      }
      reactions: {
        Row: {
          comment_id: string
          created_at: string
          group_share_id: string
          id: string
          type: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          group_share_id: string
          id?: string
          type?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          group_share_id?: string
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactions_group_share_id_fkey"
            columns: ["group_share_id"]
            isOneToOne: false
            referencedRelation: "group_shares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
