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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      chat_members: {
        Row: {
          created_at: string
          FK_chat_id: string
          FK_user_id: string
          member_id: number
        }
        Insert: {
          created_at?: string
          FK_chat_id?: string
          FK_user_id?: string
          member_id?: number
        }
        Update: {
          created_at?: string
          FK_chat_id?: string
          FK_user_id?: string
          member_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "chat_members_FK_chat_id_fkey"
            columns: ["FK_chat_id"]
            isOneToOne: false
            referencedRelation: "chat_room"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "chat_members_FK_user_id_fkey"
            columns: ["FK_user_id"]
            isOneToOne: false
            referencedRelation: "user_profile"
            referencedColumns: ["user_id"]
          },
        ]
      }
      chat_room: {
        Row: {
          chat_id: string
          chat_type: Database["public"]["Enums"]["ChatType"]
          FK_group_id: string | null
          name: string | null
        }
        Insert: {
          chat_id?: string
          chat_type?: Database["public"]["Enums"]["ChatType"]
          FK_group_id?: string | null
          name?: string | null
        }
        Update: {
          chat_id?: string
          chat_type?: Database["public"]["Enums"]["ChatType"]
          FK_group_id?: string | null
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_room_FK_group_id_fkey"
            columns: ["FK_group_id"]
            isOneToOne: false
            referencedRelation: "group_room"
            referencedColumns: ["group_id"]
          },
        ]
      }
      group_members: {
        Row: {
          created_at: string
          FK_group_id: string
          FK_user_id: string
          user_role: Database["public"]["Enums"]["ChatPrivileges"] | null
        }
        Insert: {
          created_at?: string
          FK_group_id?: string
          FK_user_id?: string
          user_role?: Database["public"]["Enums"]["ChatPrivileges"] | null
        }
        Update: {
          created_at?: string
          FK_group_id?: string
          FK_user_id?: string
          user_role?: Database["public"]["Enums"]["ChatPrivileges"] | null
        }
        Relationships: [
          {
            foreignKeyName: "group_members_FK_group_id_fkey"
            columns: ["FK_group_id"]
            isOneToOne: false
            referencedRelation: "group_room"
            referencedColumns: ["group_id"]
          },
          {
            foreignKeyName: "group_members_FK_user_id_fkey"
            columns: ["FK_user_id"]
            isOneToOne: false
            referencedRelation: "user_profile"
            referencedColumns: ["user_id"]
          },
        ]
      }
      group_room: {
        Row: {
          created_at: string
          group_id: string
          group_name: string
        }
        Insert: {
          created_at?: string
          group_id?: string
          group_name: string
        }
        Update: {
          created_at?: string
          group_id?: string
          group_name?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          FK_author_id: string
          FK_chat_id: string
          id: number
          read: boolean
        }
        Insert: {
          content: string
          created_at?: string
          FK_author_id?: string
          FK_chat_id?: string
          id?: number
          read?: boolean
        }
        Update: {
          content?: string
          created_at?: string
          FK_author_id?: string
          FK_chat_id?: string
          id?: number
          read?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "messages_FK_author_id_fkey"
            columns: ["FK_author_id"]
            isOneToOne: false
            referencedRelation: "user_profile"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "messages_FK_chat_id_fkey"
            columns: ["FK_chat_id"]
            isOneToOne: false
            referencedRelation: "chat_room"
            referencedColumns: ["chat_id"]
          },
        ]
      }
      user_profile: {
        Row: {
          dni: string | null
          nie: string | null
          notifications_enabled: boolean | null
          phone: string
          push_token: string | null
          user_id: string
          user_role: Database["public"]["Enums"]["UserType"]
          username: string
        }
        Insert: {
          dni?: string | null
          nie?: string | null
          notifications_enabled?: boolean | null
          phone: string
          push_token?: string | null
          user_id?: string
          user_role?: Database["public"]["Enums"]["UserType"]
          username: string
        }
        Update: {
          dni?: string | null
          nie?: string | null
          notifications_enabled?: boolean | null
          phone?: string
          push_token?: string | null
          user_id?: string
          user_role?: Database["public"]["Enums"]["UserType"]
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      ChatPrivileges: "ADMIN" | "MEMBER" | "CLASS_REP"
      ChatType: "PRIVATE" | "PUBLIC" | "ANNOUNCEMENTS"
      UserType: "ADMIN" | "TEACHER" | "STUDENT"
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
      ChatPrivileges: ["ADMIN", "MEMBER", "CLASS_REP"],
      ChatType: ["PRIVATE", "PUBLIC", "ANNOUNCEMENTS"],
      UserType: ["ADMIN", "TEACHER", "STUDENT"],
    },
  },
} as const
