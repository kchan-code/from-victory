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
      // FV-13: hand-added. Confirm shape via `supabase gen types typescript
      // --linked` after `supabase db push` applies
      // 20260611000000_auth_rate_limit_events.sql to the linked project.
      // Content-free; bucket column holds HMAC digests only (never raw PII).
      auth_rate_limit_events: {
        Row: {
          id: string
          bucket: string
          action: string
          created_at: string
        }
        Insert: {
          id?: string
          bucket: string
          action: string
          created_at?: string
        }
        Update: {
          id?: string
          bucket?: string
          action?: string
          created_at?: string
        }
        Relationships: []
      }
      // FV-14: hand-added. Confirm shape via `supabase gen types typescript
      // --linked` after `supabase db push` applies
      // 20260607000000_account_deletion_audit.sql to the linked project.
      // No foreign keys in the migration (by design — see table comment).
      account_deletion_events: {
        Row: {
          athletes_deleted: number | null
          actor_parent_id: string
          created_at: string
          event_type: string
          id: string
          target_athlete_id: string | null
        }
        Insert: {
          athletes_deleted?: number | null
          actor_parent_id: string
          created_at?: string
          event_type: string
          id?: string
          target_athlete_id?: string | null
        }
        Update: {
          athletes_deleted?: number | null
          actor_parent_id?: string
          created_at?: string
          event_type?: string
          id?: string
          target_athlete_id?: string | null
        }
        Relationships: []
      }
      athlete_sessions: {
        Row: {
          athlete_id: string
          catalog_id: string
          completed_at: string | null
          created_at: string
          id: string
          started_at: string
          updated_at: string
        }
        Insert: {
          athlete_id: string
          catalog_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          started_at?: string
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          catalog_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          started_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "athlete_sessions_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_sessions_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "training_sessions_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      device_pairings: {
        Row: {
          athlete_id: string
          code: string
          consumed_at: string | null
          created_at: string
          created_by: string
          expires_at: string
        }
        Insert: {
          athlete_id: string
          code: string
          consumed_at?: string | null
          created_at?: string
          created_by: string
          expires_at: string
        }
        Update: {
          athlete_id?: string
          code?: string
          consumed_at?: string | null
          created_at?: string
          created_by?: string
          expires_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_pairings_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_pairings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          athlete_id: string
          athlete_session_id: string
          content: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          athlete_id: string
          athlete_session_id: string
          content: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          athlete_session_id?: string
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_athlete_session_id_fkey"
            columns: ["athlete_session_id"]
            isOneToOne: true
            referencedRelation: "athlete_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_athlete_links: {
        Row: {
          athlete_id: string
          created_at: string
          parent_id: string
        }
        Insert: {
          athlete_id: string
          created_at?: string
          parent_id: string
        }
        Update: {
          athlete_id?: string
          created_at?: string
          parent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_athlete_links_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_athlete_links_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          birthdate: string | null
          created_at: string
          // FV-226: parent rows only. null on athlete rows (constraint).
          // When true, parent is excluded from the weekly digest send.
          digest_opt_out: boolean | null
          // FV-226: parent rows only. null on athlete rows (constraint).
          // UUID used as the unsubscribe link token in digest emails.
          digest_unsubscribe_token: string | null
          first_name: string
          id: string
          role: string
          // FV-27: regenerate via 'supabase gen types --linked' after the
          // migration 20260602000000_athlete_sport.sql is applied to prod.
          // Athlete rows: 'hockey' | 'basketball'. Parent rows: null.
          sport: string | null
          // FV-33: regenerate via 'supabase gen types --linked' after migration
          // 20260603120000_athlete_sport_selected_at.sql is applied to prod.
          // First-run signal: NULL until the athlete affirmatively picks a sport.
          sport_selected_at: string | null
          // FV-228: athlete personalization quiz. Nullable — skipped or not yet set.
          // Never surfaced on the parent dashboard.
          position: string | null
          focus_area: string | null
          updated_at: string
        }
        Insert: {
          birthdate?: string | null
          created_at?: string
          // FV-226: see Row comment above.
          digest_opt_out?: boolean | null
          // FV-226: see Row comment above.
          digest_unsubscribe_token?: string | null
          first_name: string
          id: string
          role: string
          // FV-27: see Row comment above.
          sport?: string | null
          // FV-33: see Row comment above.
          sport_selected_at?: string | null
          // FV-228: see Row comment above.
          position?: string | null
          focus_area?: string | null
          updated_at?: string
        }
        Update: {
          birthdate?: string | null
          created_at?: string
          // FV-226: see Row comment above.
          digest_opt_out?: boolean | null
          // FV-226: see Row comment above.
          digest_unsubscribe_token?: string | null
          first_name?: string
          id?: string
          role?: string
          // FV-27: see Row comment above.
          sport?: string | null
          // FV-33: see Row comment above.
          sport_selected_at?: string | null
          // FV-228: see Row comment above.
          position?: string | null
          focus_area?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      safety_events: {
        Row: {
          athlete_id: string
          athlete_session_id: string
          category: string
          detected_at: string
          id: string
        }
        Insert: {
          athlete_id: string
          athlete_session_id: string
          category: string
          detected_at?: string
          id?: string
        }
        Update: {
          athlete_id?: string
          athlete_session_id?: string
          category?: string
          detected_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "safety_events_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_events_athlete_session_id_fkey"
            columns: ["athlete_session_id"]
            isOneToOne: false
            referencedRelation: "athlete_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          last_stripe_event_at: string | null
          parent_id: string
          price_id: string | null
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          last_stripe_event_at?: string | null
          parent_id: string
          price_id?: string | null
          status: string
          stripe_customer_id: string
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          last_stripe_event_at?: string | null
          parent_id?: string
          price_id?: string | null
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      training_sessions_catalog: {
        Row: {
          created_at: string
          day_number: number
          id: string
          journal_prompt: string
          mental_skill_md: string
          scripture_ref: string
          scripture_text: string
          sport: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_number: number
          id?: string
          journal_prompt: string
          mental_skill_md: string
          scripture_ref: string
          scripture_text: string
          sport?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_number?: number
          id?: string
          journal_prompt?: string
          mental_skill_md?: string
          scripture_ref?: string
          scripture_text?: string
          sport?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      // FV-164: hand-added. Run `supabase db push` then
      // `supabase gen types typescript --linked > apps/web/lib/supabase/types.ts`
      // after the migration 20260612130000_push_subscriptions.sql is applied.
      // One row per athlete (athlete_id PK); endpoint/p256dh/auth are device
      // push keys — never log or expose to the client outside of the save action.
      push_subscriptions: {
        Row: {
          athlete_id: string
          endpoint: string
          p256dh: string
          auth: string
          reminder_hour: number
          timezone: string
          last_sent_on: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          athlete_id: string
          endpoint: string
          p256dh: string
          auth: string
          reminder_hour: number
          timezone: string
          last_sent_on?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          endpoint?: string
          p256dh?: string
          auth?: string
          reminder_hour?: number
          timezone?: string
          last_sent_on?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist_signups: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          note: string | null
          role: string
          sport: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          note?: string | null
          role: string
          sport: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          note?: string | null
          role?: string
          sport?: string
        }
        Relationships: []
      }
    }
    Views: {
      athlete_session_metadata: {
        Row: {
          athlete_id: string | null
          last_completed_at: string | null
          sessions_completed: number | null
          sessions_started: number | null
        }
        Relationships: [
          {
            foreignKeyName: "athlete_sessions_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      // FV-164: SECURITY DEFINER RPC called by the cron route (service-role only).
      // Execute is revoked from anon + authenticated in the migration.
      due_push_reminders: {
        Args: Record<string, never>
        Returns: {
          athlete_id: string
          endpoint: string
          p256dh: string
          auth: string
          timezone: string
        }[]
      }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
