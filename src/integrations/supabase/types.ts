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
      accounts: {
        Row: {
          balance: number
          id: string
          name: string
          type: Database["public"]["Enums"]["account_type"]
          user_id: string
        }
        Insert: {
          balance?: number
          id?: string
          name: string
          type?: Database["public"]["Enums"]["account_type"]
          user_id: string
        }
        Update: {
          balance?: number
          id?: string
          name?: string
          type?: Database["public"]["Enums"]["account_type"]
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string
          id: string
          name: string
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Insert: {
          color?: string
          id?: string
          name: string
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Update: {
          color?: string
          id?: string
          name?: string
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
        }
        Relationships: []
      }
      credit_card_expenses: {
        Row: {
          amount: number
          card_id: string
          category: string
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
          category?: string
          current_installment?: number | null
          description: string
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
          category?: string
          current_installment?: number | null
          description?: string
          id?: string
          installments?: number | null
          parent_expense_id?: string | null
          purchase_date?: string
          total_installments?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_card_expenses_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
        ]
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
          name: string
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
          creditor: string
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
          month: string
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
          current_value: number
          id: string
          invested_amount: number
          name: string
          profit: number
          type: Database["public"]["Enums"]["investment_type"]
          user_id: string
        }
        Insert: {
          current_value?: number
          id?: string
          invested_amount?: number
          name: string
          profit?: number
          type?: Database["public"]["Enums"]["investment_type"]
          user_id: string
        }
        Update: {
          current_value?: number
          id?: string
          invested_amount?: number
          name?: string
          profit?: number
          type?: Database["public"]["Enums"]["investment_type"]
          user_id?: string
        }
        Relationships: []
      }
      paid_invoices: {
        Row: {
          amount: number
          card_id: string
          id: string
          month: string
          paid_at: string
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          card_id: string
          id?: string
          month: string
          paid_at?: string
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          card_id?: string
          id?: string
          month?: string
          paid_at?: string
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "paid_invoices_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paid_invoices_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
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
          default_plan_id: string | null
          id: string
          monetization_enabled: boolean
        }
        Insert: {
          default_plan_id?: string | null
          id?: string
          monetization_enabled?: boolean
        }
        Update: {
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
          last_login: string
          name: string
          status: string
        }
        Insert: {
          closing_day?: number
          created_at?: string
          currency?: string
          email?: string
          id: string
          last_login?: string
          name?: string
          status?: string
        }
        Update: {
          closing_day?: number
          created_at?: string
          currency?: string
          email?: string
          id?: string
          last_login?: string
          name?: string
          status?: string
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
          end_date: string
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
          action: Database["public"]["Enums"]["log_action"]
          details: string | null
          entity: string | null
          entity_id: string | null
          id: string
          timestamp: string
          user_id: string
          user_name: string
        }
        Insert: {
          action: Database["public"]["Enums"]["log_action"]
          details?: string | null
          entity?: string | null
          entity_id?: string | null
          id?: string
          timestamp?: string
          user_id: string
          user_name?: string
        }
        Update: {
          action?: Database["public"]["Enums"]["log_action"]
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
          date: string
          description: string
          id: string
          installments: number | null
          notes: string | null
          origin: Database["public"]["Enums"]["transaction_origin"] | null
          parcela_atual: number | null
          parcelamento_id: string | null
          recurrence: Database["public"]["Enums"]["transaction_recurrence"]
          status: Database["public"]["Enums"]["transaction_status"]
          total_parcelas: number | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount?: number
          category_id?: string | null
          date?: string
          description: string
          id?: string
          installments?: number | null
          notes?: string | null
          origin?: Database["public"]["Enums"]["transaction_origin"] | null
          parcela_atual?: number | null
          parcelamento_id?: string | null
          recurrence?: Database["public"]["Enums"]["transaction_recurrence"]
          status?: Database["public"]["Enums"]["transaction_status"]
          total_parcelas?: number | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          category_id?: string | null
          date?: string
          description?: string
          id?: string
          installments?: number | null
          notes?: string | null
          origin?: Database["public"]["Enums"]["transaction_origin"] | null
          parcela_atual?: number | null
          parcelamento_id?: string | null
          recurrence?: Database["public"]["Enums"]["transaction_recurrence"]
          status?: Database["public"]["Enums"]["transaction_status"]
          total_parcelas?: number | null
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
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
      account_type: "bank" | "wallet" | "credit_card"
      app_role: "admin" | "moderator" | "user"
      investment_type: "stocks" | "crypto" | "fixed_income"
      log_action:
        | "login"
        | "logout"
        | "register"
        | "create_transaction"
        | "delete_transaction"
        | "update_transaction"
        | "create_category"
        | "delete_category"
        | "create_account"
        | "delete_account"
        | "create_debt"
        | "delete_debt"
        | "create_investment"
        | "delete_investment"
        | "admin_action"
      transaction_origin: "manual" | "parcelamento" | "importacao"
      transaction_recurrence: "none" | "monthly" | "yearly"
      transaction_status: "paid" | "pending"
      transaction_type: "income" | "expense"
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
      account_type: ["bank", "wallet", "credit_card"],
      app_role: ["admin", "moderator", "user"],
      investment_type: ["stocks", "crypto", "fixed_income"],
      log_action: [
        "login",
        "logout",
        "register",
        "create_transaction",
        "delete_transaction",
        "update_transaction",
        "create_category",
        "delete_category",
        "create_account",
        "delete_account",
        "create_debt",
        "delete_debt",
        "create_investment",
        "delete_investment",
        "admin_action",
      ],
      transaction_origin: ["manual", "parcelamento", "importacao"],
      transaction_recurrence: ["none", "monthly", "yearly"],
      transaction_status: ["paid", "pending"],
      transaction_type: ["income", "expense"],
    },
  },
} as const
