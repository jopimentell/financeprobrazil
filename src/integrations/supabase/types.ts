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
      accounts: {
        Row: {
          balance: number
          created_at: string
          id: string
          name: string
          type: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          name?: string
          type?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          name?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          type: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          type?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      categorization_rules: {
        Row: {
          category_id: string
          created_at: string
          id: string
          match_type: string
          pattern: string
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          match_type?: string
          pattern: string
          user_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          match_type?: string
          pattern?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_card_expenses: {
        Row: {
          amount: number
          card_id: string
          category: string | null
          created_at: string
          current_installment: number | null
          description: string
          id: string
          installments: number | null
          parent_expense_id: string | null
          purchase_date: string
          total_installments: number | null
          user_id: string
        }
        Insert: {
          amount?: number
          card_id: string
          category?: string | null
          created_at?: string
          current_installment?: number | null
          description?: string
          id?: string
          installments?: number | null
          parent_expense_id?: string | null
          purchase_date?: string
          total_installments?: number | null
          user_id: string
        }
        Update: {
          amount?: number
          card_id?: string
          category?: string | null
          created_at?: string
          current_installment?: number | null
          description?: string
          id?: string
          installments?: number | null
          parent_expense_id?: string | null
          purchase_date?: string
          total_installments?: number | null
          user_id?: string
        }
        Relationships: []
      }
      credit_cards: {
        Row: {
          closing_day: number
          created_at: string
          due_day: number
          id: string
          limit: number
          name: string
          user_id: string
        }
        Insert: {
          closing_day?: number
          created_at?: string
          due_day?: number
          id?: string
          limit?: number
          name?: string
          user_id: string
        }
        Update: {
          closing_day?: number
          created_at?: string
          due_day?: number
          id?: string
          limit?: number
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      debts: {
        Row: {
          created_at: string
          creditor: string
          due_date: string
          id: string
          installments: number
          interest_rate: number
          paid_installments: number
          remaining_amount: number
          total_amount: number
          user_id: string
        }
        Insert: {
          created_at?: string
          creditor?: string
          due_date?: string
          id?: string
          installments?: number
          interest_rate?: number
          paid_installments?: number
          remaining_amount?: number
          total_amount?: number
          user_id: string
        }
        Update: {
          created_at?: string
          creditor?: string
          due_date?: string
          id?: string
          installments?: number
          interest_rate?: number
          paid_installments?: number
          remaining_amount?: number
          total_amount?: number
          user_id?: string
        }
        Relationships: []
      }
      forecast: {
        Row: {
          expected_expenses: number
          expected_income: number
          id: string
          month: string
          projected_balance: number
          user_id: string
        }
        Insert: {
          expected_expenses?: number
          expected_income?: number
          id?: string
          month?: string
          projected_balance?: number
          user_id: string
        }
        Update: {
          expected_expenses?: number
          expected_income?: number
          id?: string
          month?: string
          projected_balance?: number
          user_id?: string
        }
        Relationships: []
      }
      investments: {
        Row: {
          created_at: string
          current_value: number
          id: string
          invested_amount: number
          name: string
          profit: number
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_value?: number
          id?: string
          invested_amount?: number
          name?: string
          profit?: number
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_value?: number
          id?: string
          invested_amount?: number
          name?: string
          profit?: number
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      paid_invoices: {
        Row: {
          amount: number
          card_id: string
          created_at: string
          id: string
          month: string
          paid_at: string
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          card_id: string
          created_at?: string
          id?: string
          month: string
          paid_at: string
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          card_id?: string
          created_at?: string
          id?: string
          month?: string
          paid_at?: string
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      plan_features: {
        Row: {
          enabled: boolean
          feature_key: string
          id: string
          plan_id: string
        }
        Insert: {
          enabled?: boolean
          feature_key: string
          id?: string
          plan_id: string
        }
        Update: {
          enabled?: boolean
          feature_key?: string
          id?: string
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_features_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_limits: {
        Row: {
          id: string
          max_accounts: number
          max_categories: number
          max_goals: number
          max_transactions_per_month: number
          plan_id: string
        }
        Insert: {
          id?: string
          max_accounts?: number
          max_categories?: number
          max_goals?: number
          max_transactions_per_month?: number
          plan_id: string
        }
        Update: {
          id?: string
          max_accounts?: number
          max_categories?: number
          max_goals?: number
          max_transactions_per_month?: number
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_limits_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: true
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_settings: {
        Row: {
          created_at: string
          default_plan_id: string | null
          id: string
          monetization_enabled: boolean
        }
        Insert: {
          created_at?: string
          default_plan_id?: string | null
          id?: string
          monetization_enabled?: boolean
        }
        Update: {
          created_at?: string
          default_plan_id?: string | null
          id?: string
          monetization_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "plan_settings_default_plan_id_fkey"
            columns: ["default_plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          badge: string | null
          color: string | null
          created_at: string
          description: string
          id: string
          is_active: boolean
          is_free: boolean
          name: string
          price_monthly: number
          price_yearly: number
        }
        Insert: {
          badge?: string | null
          color?: string | null
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          is_free?: boolean
          name: string
          price_monthly?: number
          price_yearly?: number
        }
        Update: {
          badge?: string | null
          color?: string | null
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          is_free?: boolean
          name?: string
          price_monthly?: number
          price_yearly?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          closing_day: number
          created_at: string
          currency: string
          email: string
          id: string
          last_login: string | null
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          closing_day?: number
          created_at?: string
          currency?: string
          email?: string
          id: string
          last_login?: string | null
          name?: string
          status?: string
          updated_at?: string
        }
        Update: {
          closing_day?: number
          created_at?: string
          currency?: string
          email?: string
          id?: string
          last_login?: string | null
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_cycle: string
          created_at: string
          end_date: string
          id: string
          plan_id: string
          start_date: string
          status: string
          user_id: string
        }
        Insert: {
          billing_cycle?: string
          created_at?: string
          end_date?: string
          id?: string
          plan_id: string
          start_date?: string
          status?: string
          user_id: string
        }
        Update: {
          billing_cycle?: string
          created_at?: string
          end_date?: string
          id?: string
          plan_id?: string
          start_date?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      system_logs: {
        Row: {
          action: string
          details: string | null
          entity: string | null
          entity_id: string | null
          id: string
          timestamp: string
          user_id: string
          user_name: string
        }
        Insert: {
          action: string
          details?: string | null
          entity?: string | null
          entity_id?: string | null
          id?: string
          timestamp?: string
          user_id: string
          user_name?: string
        }
        Update: {
          action?: string
          details?: string | null
          entity?: string | null
          entity_id?: string | null
          id?: string
          timestamp?: string
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account_id: string | null
          amount: number
          category_id: string | null
          created_at: string
          date: string
          description: string
          id: string
          installments: number | null
          notes: string | null
          origin: string | null
          parcela_atual: number | null
          parcelamento_id: string | null
          recurrence: string
          status: string
          total_parcelas: number | null
          type: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount?: number
          category_id?: string | null
          created_at?: string
          date?: string
          description?: string
          id?: string
          installments?: number | null
          notes?: string | null
          origin?: string | null
          parcela_atual?: number | null
          parcelamento_id?: string | null
          recurrence?: string
          status?: string
          total_parcelas?: number | null
          type?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          category_id?: string | null
          created_at?: string
          date?: string
          description?: string
          id?: string
          installments?: number | null
          notes?: string | null
          origin?: string | null
          parcela_atual?: number | null
          parcelamento_id?: string | null
          recurrence?: string
          status?: string
          total_parcelas?: number | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
