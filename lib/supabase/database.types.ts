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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      aggregator_menu_map: {
        Row: {
          created_at: string
          external_item_id: string
          id: string
          menu_item_id: string
          outlet_id: string
          provider: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          external_item_id: string
          id?: string
          menu_item_id: string
          outlet_id: string
          provider: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          external_item_id?: string
          id?: string
          menu_item_id?: string
          outlet_id?: string
          provider?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "aggregator_menu_map_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aggregator_menu_map_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "v_item_performance"
            referencedColumns: ["menu_item_id"]
          },
          {
            foreignKeyName: "aggregator_menu_map_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      aggregator_orders: {
        Row: {
          external_order_id: string
          id: string
          outlet_id: string
          provider: string
          raw: Json | null
          received_at: string
          status: string
          transaction_id: string | null
          unmapped_items: Json
        }
        Insert: {
          external_order_id: string
          id?: string
          outlet_id: string
          provider: string
          raw?: Json | null
          received_at?: string
          status?: string
          transaction_id?: string | null
          unmapped_items?: Json
        }
        Update: {
          external_order_id?: string
          id?: string
          outlet_id?: string
          provider?: string
          raw?: Json | null
          received_at?: string
          status?: string
          transaction_id?: string | null
          unmapped_items?: Json
        }
        Relationships: [
          {
            foreignKeyName: "aggregator_orders_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aggregator_orders_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      aggregator_stores: {
        Row: {
          created_at: string
          external_store_id: string
          id: string
          is_active: boolean
          outlet_id: string
          provider: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          external_store_id: string
          id?: string
          is_active?: boolean
          outlet_id: string
          provider: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          external_store_id?: string
          id?: string
          is_active?: boolean
          outlet_id?: string
          provider?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "aggregator_stores_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      alerts: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          meta: Json | null
          outlet_id: string
          read_at: string | null
          severity: string
          staff_code_id: string | null
          title: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind: string
          meta?: Json | null
          outlet_id: string
          read_at?: string | null
          severity?: string
          staff_code_id?: string | null
          title: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          meta?: Json | null
          outlet_id?: string
          read_at?: string | null
          severity?: string
          staff_code_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_staff_code_id_fkey"
            columns: ["staff_code_id"]
            isOneToOne: false
            referencedRelation: "staff_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_sessions: {
        Row: {
          closed_at: string | null
          closed_by_id: string | null
          closing_amount: number | null
          closing_checklist: Json | null
          expected_amount: number | null
          id: string
          is_locked: boolean
          notes: string | null
          opened_at: string
          opened_by_id: string | null
          opening_amount: number
          opening_checklist: Json | null
          outlet_id: string
          status: string
          variance: number | null
        }
        Insert: {
          closed_at?: string | null
          closed_by_id?: string | null
          closing_amount?: number | null
          closing_checklist?: Json | null
          expected_amount?: number | null
          id?: string
          is_locked?: boolean
          notes?: string | null
          opened_at?: string
          opened_by_id?: string | null
          opening_amount?: number
          opening_checklist?: Json | null
          outlet_id: string
          status?: string
          variance?: number | null
        }
        Update: {
          closed_at?: string | null
          closed_by_id?: string | null
          closing_amount?: number | null
          closing_checklist?: Json | null
          expected_amount?: number | null
          id?: string
          is_locked?: boolean
          notes?: string | null
          opened_at?: string
          opened_by_id?: string | null
          opening_amount?: number
          opening_checklist?: Json | null
          outlet_id?: string
          status?: string
          variance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_sessions_closed_by_id_fkey"
            columns: ["closed_by_id"]
            isOneToOne: false
            referencedRelation: "staff_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_sessions_opened_by_id_fkey"
            columns: ["opened_by_id"]
            isOneToOne: false
            referencedRelation: "staff_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_sessions_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_transactions: {
        Row: {
          amount: number
          category: string
          created_at: string
          id: string
          outlet_id: string
          reason: string
          session_id: string | null
          staff_code_id: string | null
          type: string
        }
        Insert: {
          amount: number
          category?: string
          created_at?: string
          id?: string
          outlet_id: string
          reason: string
          session_id?: string | null
          staff_code_id?: string | null
          type: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          id?: string
          outlet_id?: string
          reason?: string
          session_id?: string | null
          staff_code_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_transactions_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_transactions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cash_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_transactions_staff_code_id_fkey"
            columns: ["staff_code_id"]
            isOneToOne: false
            referencedRelation: "staff_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      counter_categories: {
        Row: {
          category_id: string
          counter_id: string
        }
        Insert: {
          category_id: string
          counter_id: string
        }
        Update: {
          category_id?: string
          counter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "counter_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "counter_categories_counter_id_fkey"
            columns: ["counter_id"]
            isOneToOne: false
            referencedRelation: "counters"
            referencedColumns: ["id"]
          },
        ]
      }
      counter_items: {
        Row: {
          counter_id: string
          menu_item_id: string
        }
        Insert: {
          counter_id: string
          menu_item_id: string
        }
        Update: {
          counter_id?: string
          menu_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "counter_items_counter_id_fkey"
            columns: ["counter_id"]
            isOneToOne: false
            referencedRelation: "counters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "counter_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "counter_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "v_item_performance"
            referencedColumns: ["menu_item_id"]
          },
        ]
      }
      counters: {
        Row: {
          created_at: string
          id: string
          name: string
          outlet_id: string
          printer_ip: string | null
          sort_order: number
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          outlet_id: string
          printer_ip?: string | null
          sort_order?: number
          type?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          outlet_id?: string
          printer_ip?: string | null
          sort_order?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "counters_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string
          id: string
          loyalty_card_token: string | null
          loyalty_points: number
          name: string | null
          outlet_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          loyalty_card_token?: string | null
          loyalty_points?: number
          name?: string | null
          outlet_id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          loyalty_card_token?: string | null
          loyalty_points?: number
          name?: string | null
          outlet_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_orders: {
        Row: {
          channel: Database["public"]["Enums"]["order_channel"]
          claim_token: string
          created_at: string
          customer_name: string | null
          decided_at: string | null
          decided_by_id: string | null
          id: string
          items: Json
          member_id: string | null
          note: string | null
          outlet_id: string
          reject_reason: string | null
          round_at: string | null
          status: string
          subtotal: number
          table_id: string | null
          transaction_id: string | null
        }
        Insert: {
          channel?: Database["public"]["Enums"]["order_channel"]
          claim_token?: string
          created_at?: string
          customer_name?: string | null
          decided_at?: string | null
          decided_by_id?: string | null
          id?: string
          items: Json
          member_id?: string | null
          note?: string | null
          outlet_id: string
          reject_reason?: string | null
          round_at?: string | null
          status?: string
          subtotal?: number
          table_id?: string | null
          transaction_id?: string | null
        }
        Update: {
          channel?: Database["public"]["Enums"]["order_channel"]
          claim_token?: string
          created_at?: string
          customer_name?: string | null
          decided_at?: string | null
          decided_by_id?: string | null
          id?: string
          items?: Json
          member_id?: string | null
          note?: string | null
          outlet_id?: string
          reject_reason?: string | null
          round_at?: string | null
          status?: string
          subtotal?: number
          table_id?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guest_orders_decided_by_id_fkey"
            columns: ["decided_by_id"]
            isOneToOne: false
            referencedRelation: "staff_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guest_orders_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guest_orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "restaurant_tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guest_orders_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_consumption: {
        Row: {
          consumed_at: string
          id: string
          ingredient_id: string
          lot_id: string | null
          outlet_id: string
          quantity: number
          total_cost: number
          transaction_id: string | null
          unit_cost: number
        }
        Insert: {
          consumed_at?: string
          id?: string
          ingredient_id: string
          lot_id?: string | null
          outlet_id: string
          quantity: number
          total_cost: number
          transaction_id?: string | null
          unit_cost: number
        }
        Update: {
          consumed_at?: string
          id?: string
          ingredient_id?: string
          lot_id?: string | null
          outlet_id?: string
          quantity?: number
          total_cost?: number
          transaction_id?: string | null
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_consumption_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "inventory_ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_consumption_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "v_inventory_valuation"
            referencedColumns: ["ingredient_id"]
          },
          {
            foreignKeyName: "inventory_consumption_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "v_low_stock"
            referencedColumns: ["ingredient_id"]
          },
          {
            foreignKeyName: "inventory_consumption_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "inventory_lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_consumption_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "v_expiring_soon"
            referencedColumns: ["lot_id"]
          },
          {
            foreignKeyName: "inventory_consumption_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_consumption_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_ingredients: {
        Row: {
          barcode: string | null
          created_at: string
          current_stock: number
          id: string
          name: string
          outlet_id: string
          reorder_level: number
          unit: string
          unit_cost: number
          updated_at: string
          yield_percent: number
        }
        Insert: {
          barcode?: string | null
          created_at?: string
          current_stock?: number
          id?: string
          name: string
          outlet_id: string
          reorder_level?: number
          unit: string
          unit_cost?: number
          updated_at?: string
          yield_percent?: number
        }
        Update: {
          barcode?: string | null
          created_at?: string
          current_stock?: number
          id?: string
          name?: string
          outlet_id?: string
          reorder_level?: number
          unit?: string
          unit_cost?: number
          updated_at?: string
          yield_percent?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_ingredients_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_lots: {
        Row: {
          created_at: string
          expiry_date: string | null
          id: string
          ingredient_id: string
          outlet_id: string
          purchase_order_item_id: string | null
          qty_received: number
          qty_remaining: number
          received_at: string
          source: string
          unit_cost: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          expiry_date?: string | null
          id?: string
          ingredient_id: string
          outlet_id: string
          purchase_order_item_id?: string | null
          qty_received: number
          qty_remaining: number
          received_at?: string
          source?: string
          unit_cost?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          expiry_date?: string | null
          id?: string
          ingredient_id?: string
          outlet_id?: string
          purchase_order_item_id?: string | null
          qty_received?: number
          qty_remaining?: number
          received_at?: string
          source?: string
          unit_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_lots_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "inventory_ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_lots_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "v_inventory_valuation"
            referencedColumns: ["ingredient_id"]
          },
          {
            foreignKeyName: "inventory_lots_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "v_low_stock"
            referencedColumns: ["ingredient_id"]
          },
          {
            foreignKeyName: "inventory_lots_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_lots_purchase_order_item_id_fkey"
            columns: ["purchase_order_item_id"]
            isOneToOne: false
            referencedRelation: "purchase_order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_accounts: {
        Row: {
          created_at: string
          current_tier_id: string
          id: string
          points_balance: number
          points_earned: number
          points_redeemed: number
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_tier_id: string
          id?: string
          points_balance?: number
          points_earned?: number
          points_redeemed?: number
          tier?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_tier_id?: string
          id?: string
          points_balance?: number
          points_earned?: number
          points_redeemed?: number
          tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_accounts_current_tier_id_fkey"
            columns: ["current_tier_id"]
            isOneToOne: false
            referencedRelation: "loyalty_tiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_rewards: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          kind: string
          name: string
          points_cost: number
          sort_order: number
          value: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          kind?: string
          name: string
          points_cost: number
          sort_order?: number
          value?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          kind?: string
          name?: string
          points_cost?: number
          sort_order?: number
          value?: number | null
        }
        Relationships: []
      }
      loyalty_tiers: {
        Row: {
          created_at: string
          discount_percentage: number
          id: string
          name: string
          points_required: number
          theme_color: string
        }
        Insert: {
          created_at?: string
          discount_percentage?: number
          id?: string
          name: string
          points_required: number
          theme_color: string
        }
        Update: {
          created_at?: string
          discount_percentage?: number
          id?: string
          name?: string
          points_required?: number
          theme_color?: string
        }
        Relationships: []
      }
      loyalty_transactions: {
        Row: {
          account_id: string
          balance_after: number
          created_at: string
          description: string | null
          id: string
          points: number
          transaction_id: string | null
          type: Database["public"]["Enums"]["loyalty_txn_type"]
          user_id: string
        }
        Insert: {
          account_id: string
          balance_after: number
          created_at?: string
          description?: string | null
          id?: string
          points: number
          transaction_id?: string | null
          type: Database["public"]["Enums"]["loyalty_txn_type"]
          user_id: string
        }
        Update: {
          account_id?: string
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          points?: number
          transaction_id?: string | null
          type?: Database["public"]["Enums"]["loyalty_txn_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "loyalty_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_campaigns: {
        Row: {
          audience: string
          created_at: string
          created_by: string | null
          id: string
          message: string
          recipient_count: number
          title: string
        }
        Insert: {
          audience: string
          created_at?: string
          created_by?: string | null
          id?: string
          message: string
          recipient_count?: number
          title: string
        }
        Update: {
          audience?: string
          created_at?: string
          created_by?: string | null
          id?: string
          message?: string
          recipient_count?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string
          date_of_birth: string | null
          dietary_preferences: string[]
          email: string | null
          email_verified: boolean
          full_name: string | null
          gender: string | null
          id: string
          marketing_consent: boolean | null
          phone: string | null
          phone_verified: boolean
          profile_bonus_claimed: string[]
          role: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          dietary_preferences?: string[]
          email?: string | null
          email_verified?: boolean
          full_name?: string | null
          gender?: string | null
          id: string
          marketing_consent?: boolean | null
          phone?: string | null
          phone_verified?: boolean
          profile_bonus_claimed?: string[]
          role?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          dietary_preferences?: string[]
          email?: string | null
          email_verified?: boolean
          full_name?: string | null
          gender?: string | null
          id?: string
          marketing_consent?: boolean | null
          phone?: string | null
          phone_verified?: boolean
          profile_bonus_claimed?: string[]
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      menu_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          outlet_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          outlet_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          outlet_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_categories_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_item_modifier_groups: {
        Row: {
          created_at: string
          id: string
          menu_item_id: string
          modifier_group_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          menu_item_id: string
          modifier_group_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          menu_item_id?: string
          modifier_group_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_modifier_groups_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_item_modifier_groups_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "v_item_performance"
            referencedColumns: ["menu_item_id"]
          },
          {
            foreignKeyName: "menu_item_modifier_groups_modifier_group_id_fkey"
            columns: ["modifier_group_id"]
            isOneToOne: false
            referencedRelation: "modifier_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          is_available: boolean
          name: string
          outlet_id: string
          price: number
          sst_applicable: boolean
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_available?: boolean
          name: string
          outlet_id: string
          price?: number
          sst_applicable?: boolean
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_available?: boolean
          name?: string
          outlet_id?: string
          price?: number
          sst_applicable?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      modifier_groups: {
        Row: {
          created_at: string
          id: string
          is_required: boolean
          max_select: number | null
          min_select: number
          name: string
          outlet_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_required?: boolean
          max_select?: number | null
          min_select?: number
          name: string
          outlet_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_required?: boolean
          max_select?: number | null
          min_select?: number
          name?: string
          outlet_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "modifier_groups_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      modifiers: {
        Row: {
          created_at: string
          group_id: string
          id: string
          is_available: boolean
          is_default: boolean
          name: string
          price_delta: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          is_available?: boolean
          is_default?: boolean
          name: string
          price_delta?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          is_available?: boolean
          is_default?: boolean
          name?: string
          price_delta?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "modifiers_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "modifier_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      order_voids: {
        Row: {
          amount: number
          created_at: string
          id: string
          menu_item_id: string | null
          outlet_id: string
          quantity: number | null
          reason: string
          scope: string
          transaction_id: string
          voided_by_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          menu_item_id?: string | null
          outlet_id: string
          quantity?: number | null
          reason: string
          scope: string
          transaction_id: string
          voided_by_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          menu_item_id?: string | null
          outlet_id?: string
          quantity?: number | null
          reason?: string
          scope?: string
          transaction_id?: string
          voided_by_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_voids_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_voids_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "v_item_performance"
            referencedColumns: ["menu_item_id"]
          },
          {
            foreignKeyName: "order_voids_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_voids_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_voids_voided_by_id_fkey"
            columns: ["voided_by_id"]
            isOneToOne: false
            referencedRelation: "staff_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      outlet_settings: {
        Row: {
          alert_cash_variance: number
          alert_labor_pct: number
          alert_void_count: number
          blind_close_enabled: boolean
          cash_skim_threshold: number
          closing_checklist: string[]
          created_at: string
          currency: string
          guest_auto_accept: boolean
          guest_ordering_enabled: boolean
          guest_pickup_enabled: boolean
          max_discount_percent: number
          opening_checklist: string[]
          order_flow: string
          outlet_id: string
          quick_notes: string[]
          receipt_footer: string
          receipt_header: string | null
          refund_requires_admin: boolean
          service_charge_enabled: boolean
          service_charge_rate: number
          sst_enabled: boolean
          sst_rate: number
          sst_registration_no: string | null
          target_splh: number
          updated_at: string
        }
        Insert: {
          alert_cash_variance?: number
          alert_labor_pct?: number
          alert_void_count?: number
          blind_close_enabled?: boolean
          cash_skim_threshold?: number
          closing_checklist?: string[]
          created_at?: string
          currency?: string
          guest_auto_accept?: boolean
          guest_ordering_enabled?: boolean
          guest_pickup_enabled?: boolean
          max_discount_percent?: number
          opening_checklist?: string[]
          order_flow?: string
          outlet_id: string
          quick_notes?: string[]
          receipt_footer?: string
          receipt_header?: string | null
          refund_requires_admin?: boolean
          service_charge_enabled?: boolean
          service_charge_rate?: number
          sst_enabled?: boolean
          sst_rate?: number
          sst_registration_no?: string | null
          target_splh?: number
          updated_at?: string
        }
        Update: {
          alert_cash_variance?: number
          alert_labor_pct?: number
          alert_void_count?: number
          blind_close_enabled?: boolean
          cash_skim_threshold?: number
          closing_checklist?: string[]
          created_at?: string
          currency?: string
          guest_auto_accept?: boolean
          guest_ordering_enabled?: boolean
          guest_pickup_enabled?: boolean
          max_discount_percent?: number
          opening_checklist?: string[]
          order_flow?: string
          outlet_id?: string
          quick_notes?: string[]
          receipt_footer?: string
          receipt_header?: string | null
          refund_requires_admin?: boolean
          service_charge_enabled?: boolean
          service_charge_rate?: number
          sst_enabled?: boolean
          sst_rate?: number
          sst_registration_no?: string | null
          target_splh?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "outlet_settings_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: true
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      outlets: {
        Row: {
          address: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_edit_log: {
        Row: {
          created_at: string
          edited_by_id: string | null
          id: string
          new_method: Database["public"]["Enums"]["payment_method"]
          old_method: Database["public"]["Enums"]["payment_method"] | null
          outlet_id: string
          transaction_id: string
        }
        Insert: {
          created_at?: string
          edited_by_id?: string | null
          id?: string
          new_method: Database["public"]["Enums"]["payment_method"]
          old_method?: Database["public"]["Enums"]["payment_method"] | null
          outlet_id: string
          transaction_id: string
        }
        Update: {
          created_at?: string
          edited_by_id?: string | null
          id?: string
          new_method?: Database["public"]["Enums"]["payment_method"]
          old_method?: Database["public"]["Enums"]["payment_method"] | null
          outlet_id?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_edit_log_edited_by_id_fkey"
            columns: ["edited_by_id"]
            isOneToOne: false
            referencedRelation: "staff_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_edit_log_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_edit_log_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_requests: {
        Row: {
          created_at: string
          id: string
          transaction_id: string | null
        }
        Insert: {
          created_at?: string
          id: string
          transaction_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pos_requests_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          loyalty_card_token: string | null
          loyalty_points: number
          outlet_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          loyalty_card_token?: string | null
          loyalty_points?: number
          outlet_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          loyalty_card_token?: string | null
          loyalty_points?: number
          outlet_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          times_used: number
          usage_limit: number | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          discount_type: string
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          times_used?: number
          usage_limit?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          times_used?: number
          usage_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "promo_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      promos: {
        Row: {
          created_at: string
          discount_label: string | null
          id: string
          message: string
          outlet_id: string
          recipient_count: number
          segment: string
          sent_at: string | null
          status: string
          title: string
        }
        Insert: {
          created_at?: string
          discount_label?: string | null
          id?: string
          message: string
          outlet_id: string
          recipient_count?: number
          segment?: string
          sent_at?: string | null
          status?: string
          title: string
        }
        Update: {
          created_at?: string
          discount_label?: string | null
          id?: string
          message?: string
          outlet_id?: string
          recipient_count?: number
          segment?: string
          sent_at?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "promos_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          created_at: string
          id: string
          ingredient_id: string
          purchase_order_id: string
          quantity_ordered: number
          quantity_received: number
          unit_cost: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          ingredient_id: string
          purchase_order_id: string
          quantity_ordered: number
          quantity_received?: number
          unit_cost?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          ingredient_id?: string
          purchase_order_id?: string
          quantity_ordered?: number
          quantity_received?: number
          unit_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "inventory_ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "v_inventory_valuation"
            referencedColumns: ["ingredient_id"]
          },
          {
            foreignKeyName: "purchase_order_items_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "v_low_stock"
            referencedColumns: ["ingredient_id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string
          created_by: string | null
          expected_date: string | null
          id: string
          notes: string | null
          outlet_id: string
          reference: string | null
          status: Database["public"]["Enums"]["po_status"]
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expected_date?: string | null
          id?: string
          notes?: string | null
          outlet_id: string
          reference?: string | null
          status?: Database["public"]["Enums"]["po_status"]
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expected_date?: string | null
          id?: string
          notes?: string | null
          outlet_id?: string
          reference?: string | null
          status?: Database["public"]["Enums"]["po_status"]
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_mapping: {
        Row: {
          component_type: Database["public"]["Enums"]["recipe_component_type"]
          created_at: string
          id: string
          ingredient_id: string | null
          quantity: number
          recipe_id: string
          sub_recipe_id: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          component_type: Database["public"]["Enums"]["recipe_component_type"]
          created_at?: string
          id?: string
          ingredient_id?: string | null
          quantity: number
          recipe_id: string
          sub_recipe_id?: string | null
          unit: string
          updated_at?: string
        }
        Update: {
          component_type?: Database["public"]["Enums"]["recipe_component_type"]
          created_at?: string
          id?: string
          ingredient_id?: string | null
          quantity?: number
          recipe_id?: string
          sub_recipe_id?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_mapping_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "inventory_ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_mapping_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "v_inventory_valuation"
            referencedColumns: ["ingredient_id"]
          },
          {
            foreignKeyName: "recipe_mapping_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "v_low_stock"
            referencedColumns: ["ingredient_id"]
          },
          {
            foreignKeyName: "recipe_mapping_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_mapping_sub_recipe_id_fkey"
            columns: ["sub_recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          created_at: string
          id: string
          is_subrecipe: boolean
          menu_item_id: string | null
          name: string
          outlet_id: string
          updated_at: string
          yield_qty: number
          yield_unit: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_subrecipe?: boolean
          menu_item_id?: string | null
          name: string
          outlet_id: string
          updated_at?: string
          yield_qty?: number
          yield_unit?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_subrecipe?: boolean
          menu_item_id?: string | null
          name?: string
          outlet_id?: string
          updated_at?: string
          yield_qty?: number
          yield_unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipes_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipes_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "v_item_performance"
            referencedColumns: ["menu_item_id"]
          },
          {
            foreignKeyName: "recipes_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          outlet_id: string
          reason: string
          staff_code_id: string | null
          transaction_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          outlet_id: string
          reason: string
          staff_code_id?: string | null
          transaction_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          outlet_id?: string
          reason?: string
          staff_code_id?: string | null
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_staff_code_id_fkey"
            columns: ["staff_code_id"]
            isOneToOne: false
            referencedRelation: "staff_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_sections: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          outlet_id: string
          sort_order: number
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          outlet_id: string
          sort_order?: number
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          outlet_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_sections_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_tables: {
        Row: {
          created_at: string
          current_transaction_id: string | null
          id: string
          label: string
          outlet_id: string
          pos_x: number
          pos_y: number
          qr_token: string
          seats: number
          section_id: string | null
          status: string
        }
        Insert: {
          created_at?: string
          current_transaction_id?: string | null
          id?: string
          label: string
          outlet_id: string
          pos_x?: number
          pos_y?: number
          qr_token?: string
          seats?: number
          section_id?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          current_transaction_id?: string | null
          id?: string
          label?: string
          outlet_id?: string
          pos_x?: number
          pos_y?: number
          qr_token?: string
          seats?: number
          section_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_tables_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_tables_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "restaurant_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          created_at: string
          ends_at: string
          id: string
          note: string | null
          outlet_id: string
          published: boolean
          role: string | null
          staff_code_id: string | null
          starts_at: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          ends_at: string
          id?: string
          note?: string | null
          outlet_id: string
          published?: boolean
          role?: string | null
          staff_code_id?: string | null
          starts_at: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          id?: string
          note?: string | null
          outlet_id?: string
          published?: boolean
          role?: string | null
          staff_code_id?: string | null
          starts_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shifts_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_staff_code_id_fkey"
            columns: ["staff_code_id"]
            isOneToOne: false
            referencedRelation: "staff_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_codes: {
        Row: {
          can_access_dashboard: boolean
          can_access_kds: boolean
          can_access_pos: boolean
          code: string
          created_at: string
          hourly_rate: number
          id: string
          is_active: boolean
          name: string
          outlet_id: string
          role: string
        }
        Insert: {
          can_access_dashboard?: boolean
          can_access_kds?: boolean
          can_access_pos?: boolean
          code: string
          created_at?: string
          hourly_rate?: number
          id?: string
          is_active?: boolean
          name: string
          outlet_id: string
          role: string
        }
        Update: {
          can_access_dashboard?: boolean
          can_access_kds?: boolean
          can_access_pos?: boolean
          code?: string
          created_at?: string
          hourly_rate?: number
          id?: string
          is_active?: boolean
          name?: string
          outlet_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_codes_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_count_items: {
        Row: {
          count_id: string
          counted_qty: number
          created_at: string
          id: string
          ingredient_id: string
          outlet_id: string
          system_qty: number | null
          unit_cost: number | null
          updated_at: string
          variance_qty: number | null
          variance_value: number | null
        }
        Insert: {
          count_id: string
          counted_qty?: number
          created_at?: string
          id?: string
          ingredient_id: string
          outlet_id: string
          system_qty?: number | null
          unit_cost?: number | null
          updated_at?: string
          variance_qty?: number | null
          variance_value?: number | null
        }
        Update: {
          count_id?: string
          counted_qty?: number
          created_at?: string
          id?: string
          ingredient_id?: string
          outlet_id?: string
          system_qty?: number | null
          unit_cost?: number | null
          updated_at?: string
          variance_qty?: number | null
          variance_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_count_items_count_id_fkey"
            columns: ["count_id"]
            isOneToOne: false
            referencedRelation: "stock_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_count_items_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "inventory_ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_count_items_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "v_inventory_valuation"
            referencedColumns: ["ingredient_id"]
          },
          {
            foreignKeyName: "stock_count_items_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "v_low_stock"
            referencedColumns: ["ingredient_id"]
          },
          {
            foreignKeyName: "stock_count_items_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_counts: {
        Row: {
          counted_by_id: string | null
          created_at: string
          finalized_at: string | null
          id: string
          note: string | null
          outlet_id: string
          reference: string | null
          started_at: string
          status: Database["public"]["Enums"]["stock_count_status"]
          total_variance_value: number | null
          updated_at: string
        }
        Insert: {
          counted_by_id?: string | null
          created_at?: string
          finalized_at?: string | null
          id?: string
          note?: string | null
          outlet_id: string
          reference?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["stock_count_status"]
          total_variance_value?: number | null
          updated_at?: string
        }
        Update: {
          counted_by_id?: string | null
          created_at?: string
          finalized_at?: string | null
          id?: string
          note?: string | null
          outlet_id?: string
          reference?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["stock_count_status"]
          total_variance_value?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_counts_counted_by_id_fkey"
            columns: ["counted_by_id"]
            isOneToOne: false
            referencedRelation: "staff_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_counts_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_transfer_items: {
        Row: {
          created_at: string
          id: string
          ingredient_id: string
          quantity: number
          transfer_id: string
          unit_cost: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          ingredient_id: string
          quantity: number
          transfer_id: string
          unit_cost?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          ingredient_id?: string
          quantity?: number
          transfer_id?: string
          unit_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_transfer_items_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "inventory_ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfer_items_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "v_inventory_valuation"
            referencedColumns: ["ingredient_id"]
          },
          {
            foreignKeyName: "stock_transfer_items_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "v_low_stock"
            referencedColumns: ["ingredient_id"]
          },
          {
            foreignKeyName: "stock_transfer_items_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "stock_transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_transfers: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          from_outlet_id: string
          id: string
          notes: string | null
          reference: string | null
          status: Database["public"]["Enums"]["transfer_status"]
          to_outlet_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          from_outlet_id: string
          id?: string
          notes?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["transfer_status"]
          to_outlet_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          from_outlet_id?: string
          id?: string
          notes?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["transfer_status"]
          to_outlet_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_transfers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfers_from_outlet_id_fkey"
            columns: ["from_outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfers_to_outlet_id_fkey"
            columns: ["to_outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          outlet_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          outlet_id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          outlet_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          break_minutes: number
          clock_in: string
          clock_out: string | null
          created_at: string
          hourly_rate: number
          id: string
          note: string | null
          outlet_id: string
          staff_code_id: string
          updated_at: string
        }
        Insert: {
          break_minutes?: number
          clock_in?: string
          clock_out?: string | null
          created_at?: string
          hourly_rate?: number
          id?: string
          note?: string | null
          outlet_id: string
          staff_code_id: string
          updated_at?: string
        }
        Update: {
          break_minutes?: number
          clock_in?: string
          clock_out?: string | null
          created_at?: string
          hourly_rate?: number
          id?: string
          note?: string | null
          outlet_id?: string
          staff_code_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_staff_code_id_fkey"
            columns: ["staff_code_id"]
            isOneToOne: false
            referencedRelation: "staff_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_items: {
        Row: {
          created_at: string
          id: string
          kitchen_status: Database["public"]["Enums"]["kitchen_status"]
          line_total: number
          menu_item_id: string
          modifier_delta: number
          modifier_summary: string | null
          note: string | null
          quantity: number
          transaction_id: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          kitchen_status?: Database["public"]["Enums"]["kitchen_status"]
          line_total: number
          menu_item_id: string
          modifier_delta?: number
          modifier_summary?: string | null
          note?: string | null
          quantity: number
          transaction_id: string
          unit_price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          kitchen_status?: Database["public"]["Enums"]["kitchen_status"]
          line_total?: number
          menu_item_id?: string
          modifier_delta?: number
          modifier_summary?: string | null
          note?: string | null
          quantity?: number
          transaction_id?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "v_item_performance"
            referencedColumns: ["menu_item_id"]
          },
          {
            foreignKeyName: "transaction_items_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_payments: {
        Row: {
          amount: number
          card_token: string | null
          created_at: string
          id: string
          label: string | null
          method: Database["public"]["Enums"]["payment_method"]
          outlet_id: string
          staff_code_id: string | null
          transaction_id: string
        }
        Insert: {
          amount: number
          card_token?: string | null
          created_at?: string
          id?: string
          label?: string | null
          method: Database["public"]["Enums"]["payment_method"]
          outlet_id: string
          staff_code_id?: string | null
          transaction_id: string
        }
        Update: {
          amount?: number
          card_token?: string | null
          created_at?: string
          id?: string
          label?: string | null
          method?: Database["public"]["Enums"]["payment_method"]
          outlet_id?: string
          staff_code_id?: string | null
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_payments_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_payments_staff_code_id_fkey"
            columns: ["staff_code_id"]
            isOneToOne: false
            referencedRelation: "staff_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_payments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          cashier_id: string | null
          channel: Database["public"]["Enums"]["order_channel"]
          completed_at: string | null
          created_at: string
          customer_id: string | null
          discount_amount: number
          discount_reason: string | null
          discount_type: string | null
          discount_value: number | null
          discounted_by_id: string | null
          external_order_id: string | null
          id: string
          inventory_deducted: boolean
          is_split: boolean
          kitchen_status: Database["public"]["Enums"]["kitchen_status"]
          loyalty_awarded: boolean
          member_id: string | null
          note: string | null
          order_source: string
          outlet_id: string
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          refunded_amount: number
          service_charge: number
          sst_amount: number
          staff_code_id: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          subtotal: number
          table_id: string | null
          table_label: string | null
          takeaway_name: string | null
          takeaway_number: string | null
          total: number
          updated_at: string
        }
        Insert: {
          cashier_id?: string | null
          channel?: Database["public"]["Enums"]["order_channel"]
          completed_at?: string | null
          created_at?: string
          customer_id?: string | null
          discount_amount?: number
          discount_reason?: string | null
          discount_type?: string | null
          discount_value?: number | null
          discounted_by_id?: string | null
          external_order_id?: string | null
          id?: string
          inventory_deducted?: boolean
          is_split?: boolean
          kitchen_status?: Database["public"]["Enums"]["kitchen_status"]
          loyalty_awarded?: boolean
          member_id?: string | null
          note?: string | null
          order_source?: string
          outlet_id: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          refunded_amount?: number
          service_charge?: number
          sst_amount?: number
          staff_code_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          subtotal?: number
          table_id?: string | null
          table_label?: string | null
          takeaway_name?: string | null
          takeaway_number?: string | null
          total?: number
          updated_at?: string
        }
        Update: {
          cashier_id?: string | null
          channel?: Database["public"]["Enums"]["order_channel"]
          completed_at?: string | null
          created_at?: string
          customer_id?: string | null
          discount_amount?: number
          discount_reason?: string | null
          discount_type?: string | null
          discount_value?: number | null
          discounted_by_id?: string | null
          external_order_id?: string | null
          id?: string
          inventory_deducted?: boolean
          is_split?: boolean
          kitchen_status?: Database["public"]["Enums"]["kitchen_status"]
          loyalty_awarded?: boolean
          member_id?: string | null
          note?: string | null
          order_source?: string
          outlet_id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          refunded_amount?: number
          service_charge?: number
          sst_amount?: number
          staff_code_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          subtotal?: number
          table_id?: string | null
          table_label?: string | null
          takeaway_name?: string | null
          takeaway_number?: string | null
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_cashier_id_fkey"
            columns: ["cashier_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_discounted_by_id_fkey"
            columns: ["discounted_by_id"]
            isOneToOne: false
            referencedRelation: "staff_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_staff_code_id_fkey"
            columns: ["staff_code_id"]
            isOneToOne: false
            referencedRelation: "staff_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "restaurant_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      vouchers: {
        Row: {
          code: string
          created_at: string
          id: string
          points_spent: number
          reward_id: string | null
          status: string
          title: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          points_spent: number
          reward_id?: string | null
          status?: string
          title: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          points_spent?: number
          reward_id?: string | null
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vouchers_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "loyalty_rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vouchers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          id: string
          type: Database["public"]["Enums"]["wallet_txn_type"]
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          description?: string | null
          id?: string
          type: Database["public"]["Enums"]["wallet_txn_type"]
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          type?: Database["public"]["Enums"]["wallet_txn_type"]
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          currency: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      waste_logs: {
        Row: {
          created_at: string
          id: string
          ingredient_id: string
          logged_by_id: string | null
          note: string | null
          outlet_id: string
          quantity: number
          reason: Database["public"]["Enums"]["waste_reason"]
          stage: string
          total_cost: number
          unit_cost: number
          weight: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          ingredient_id: string
          logged_by_id?: string | null
          note?: string | null
          outlet_id: string
          quantity: number
          reason?: Database["public"]["Enums"]["waste_reason"]
          stage?: string
          total_cost?: number
          unit_cost?: number
          weight?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          ingredient_id?: string
          logged_by_id?: string | null
          note?: string | null
          outlet_id?: string
          quantity?: number
          reason?: Database["public"]["Enums"]["waste_reason"]
          stage?: string
          total_cost?: number
          unit_cost?: number
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "waste_logs_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "inventory_ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waste_logs_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "v_inventory_valuation"
            referencedColumns: ["ingredient_id"]
          },
          {
            foreignKeyName: "waste_logs_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "v_low_stock"
            referencedColumns: ["ingredient_id"]
          },
          {
            foreignKeyName: "waste_logs_logged_by_id_fkey"
            columns: ["logged_by_id"]
            isOneToOne: false
            referencedRelation: "staff_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waste_logs_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_cogs_daily: {
        Row: {
          cogs: number | null
          cogs_date: string | null
          outlet_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_consumption_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      v_expiring_soon: {
        Row: {
          days_to_expiry: number | null
          expiry_date: string | null
          ingredient_id: string | null
          lot_id: string | null
          name: string | null
          outlet_id: string | null
          qty_remaining: number | null
          unit: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_lots_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "inventory_ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_lots_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "v_inventory_valuation"
            referencedColumns: ["ingredient_id"]
          },
          {
            foreignKeyName: "inventory_lots_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "v_low_stock"
            referencedColumns: ["ingredient_id"]
          },
          {
            foreignKeyName: "inventory_lots_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      v_inventory_valuation: {
        Row: {
          avg_unit_cost: number | null
          current_stock: number | null
          ingredient_id: string | null
          lots_on_hand: number | null
          name: string | null
          outlet_id: string | null
          reorder_level: number | null
          stock_value: number | null
          unit: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_ingredients_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      v_item_performance: {
        Row: {
          item_name: string | null
          menu_item_id: string | null
          order_count: number | null
          outlet_id: string | null
          qty_sold: number | null
          revenue: number | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      v_labor_daily: {
        Row: {
          hours: number | null
          labor_cost: number | null
          outlet_id: string | null
          work_date: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      v_low_stock: {
        Row: {
          current_stock: number | null
          ingredient_id: string | null
          name: string | null
          outlet_id: string | null
          reorder_level: number | null
          unit: string | null
        }
        Insert: {
          current_stock?: number | null
          ingredient_id?: string | null
          name?: string | null
          outlet_id?: string | null
          reorder_level?: number | null
          unit?: string | null
        }
        Update: {
          current_stock?: number | null
          ingredient_id?: string | null
          name?: string | null
          outlet_id?: string | null
          reorder_level?: number | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_ingredients_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      v_sales_daily: {
        Row: {
          avg_order_value: number | null
          gross_sales: number | null
          net_sales: number | null
          order_count: number | null
          outlet_id: string | null
          sales_date: string | null
          service_charge_collected: number | null
          sst_collected: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      v_sales_hourly: {
        Row: {
          gross_sales: number | null
          hour_of_day: number | null
          order_count: number | null
          outlet_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      v_staff_performance: {
        Row: {
          avg_order_value: number | null
          cashier_id: string | null
          cashier_name: string | null
          gross_sales: number | null
          order_count: number | null
          outlet_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_cashier_id_fkey"
            columns: ["cashier_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_guest_order: { Args: { p_payload: Json }; Returns: Json }
      admin_list_customers: {
        Args: { p_limit?: number; p_offset?: number; p_search?: string }
        Returns: {
          avatar_url: string
          created_at: string
          email: string
          full_name: string
          id: string
          lifetime_spent: number
          phone: string
          points_balance: number
          role: string
          total_count: number
          wallet_balance: number
        }[]
      }
      admin_send_broadcast: {
        Args: {
          p_audience: string
          p_created_by?: string
          p_message: string
          p_title: string
        }
        Returns: Json
      }
      append_order_items: { Args: { p_payload: Json }; Returns: Json }
      apply_discount: { Args: { p_payload: Json }; Returns: Json }
      claim_guest_order: {
        Args: { p_claim_token: string; p_id: string }
        Returns: Json
      }
      clock_in: { Args: { p_payload: Json }; Returns: Json }
      clock_out: { Args: { p_payload: Json }; Returns: Json }
      close_cash_session: { Args: { p_payload: Json }; Returns: Json }
      complete_stock_transfer: {
        Args: { p_transfer_id: string }
        Returns: undefined
      }
      current_outlet_id: { Args: never; Returns: string }
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      ensure_member: { Args: never; Returns: boolean }
      finalize_stock_count: { Args: { p_payload: Json }; Returns: Json }
      fn_accept_guest_order: {
        Args: { p_id: string; p_staff: string }
        Returns: string
      }
      fn_append_items: {
        Args: { p_items: Json; p_outlet: string; p_tx: string }
        Returns: number
      }
      fn_apply_stock_delta: {
        Args: { p_delta: number; p_ingredient: string; p_outlet: string }
        Returns: number
      }
      fn_cash_session_summary: { Args: { p_session: string }; Returns: Json }
      fn_consume_ingredient_fifo: {
        Args: {
          p_ingredient: string
          p_outlet: string
          p_qty: number
          p_tx: string
        }
        Returns: undefined
      }
      fn_create_order: {
        Args: { p_cashier: string; p_outlet: string; p_payload: Json }
        Returns: string
      }
      fn_day_report: { Args: { p_date?: string }; Returns: Json }
      fn_deduct_inventory_for_transaction: {
        Args: { p_transaction_id: string }
        Returns: undefined
      }
      fn_price_guest_items: {
        Args: { p_items: Json; p_outlet: string }
        Returns: Json
      }
      fn_recompute_totals: { Args: { p_tx: string }; Returns: number }
      fn_resolve_or_create_ingredient: {
        Args: { p_name: string; p_outlet: string; p_unit: string }
        Returns: string
      }
      fn_resolve_raw_ingredients: {
        Args: { p_multiplier: number; p_recipe_id: string }
        Returns: {
          ingredient_id: string
          quantity: number
        }[]
      }
      fn_set_discount: {
        Args: {
          p_reason: string
          p_staff: string
          p_tx: string
          p_type: string
          p_value: number
        }
        Returns: number
      }
      guest_get_menu: {
        Args: { p_outlet?: string; p_token?: string }
        Returns: Json
      }
      guest_order_status: {
        Args: { p_claim_token: string; p_id: string }
        Returns: Json
      }
      guest_place_order: { Args: { p_payload: Json }; Returns: Json }
      ingest_external_order: { Args: { p_payload: Json }; Returns: string }
      is_manager: { Args: never; Returns: boolean }
      is_wallet_owner: { Args: never; Returns: boolean }
      log_waste: { Args: { p_payload: Json }; Returns: Json }
      move_table_order: { Args: { p_payload: Json }; Returns: Json }
      pos_checkout: { Args: { p_payload: Json }; Returns: string }
      provision_member: { Args: { p_user_id: string }; Returns: undefined }
      provision_owner_workspace: {
        Args: { p_outlet_name?: string }
        Returns: {
          created_at: string
          full_name: string | null
          id: string
          loyalty_card_token: string | null
          loyalty_points: number
          outlet_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      raise_panic: { Args: { p_payload: Json }; Returns: Json }
      redeem_reward: {
        Args: { p_reward_id: string; p_user_id: string }
        Returns: Json
      }
      refund_order: { Args: { p_payload: Json }; Returns: Json }
      reject_guest_order: { Args: { p_payload: Json }; Returns: Json }
      set_item_availability: { Args: { p_payload: Json }; Returns: Json }
      settle_transaction: { Args: { p_payload: Json }; Returns: Json }
      top_up_wallet: {
        Args: { p_amount: number; p_description?: string; p_user_id: string }
        Returns: Json
      }
      void_order: { Args: { p_payload: Json }; Returns: undefined }
    }
    Enums: {
      kitchen_status: "queued" | "preparing" | "ready" | "served"
      loyalty_txn_type: "earn" | "redeem" | "adjust" | "expire"
      order_channel:
        | "dine_in"
        | "takeaway"
        | "grabfood"
        | "foodpanda"
        | "shopeefood"
      payment_method:
        | "cash"
        | "duitnow_qr"
        | "card"
        | "grabfood"
        | "foodpanda"
        | "shopeefood"
      po_status: "draft" | "ordered" | "partial" | "received" | "cancelled"
      recipe_component_type: "ingredient" | "sub_recipe"
      stock_count_status: "counting" | "finalized" | "cancelled"
      transaction_status: "open" | "completed" | "voided" | "refunded"
      transfer_status: "pending" | "in_transit" | "received" | "cancelled"
      user_role: "owner" | "manager" | "cashier" | "kitchen"
      wallet_txn_type: "credit" | "debit"
      waste_reason:
        | "spoilage"
        | "expired"
        | "overcooked"
        | "dropped"
        | "prep"
        | "breakage"
        | "theft"
        | "other"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      kitchen_status: ["queued", "preparing", "ready", "served"],
      loyalty_txn_type: ["earn", "redeem", "adjust", "expire"],
      order_channel: [
        "dine_in",
        "takeaway",
        "grabfood",
        "foodpanda",
        "shopeefood",
      ],
      payment_method: [
        "cash",
        "duitnow_qr",
        "card",
        "grabfood",
        "foodpanda",
        "shopeefood",
      ],
      po_status: ["draft", "ordered", "partial", "received", "cancelled"],
      recipe_component_type: ["ingredient", "sub_recipe"],
      stock_count_status: ["counting", "finalized", "cancelled"],
      transaction_status: ["open", "completed", "voided", "refunded"],
      transfer_status: ["pending", "in_transit", "received", "cancelled"],
      user_role: ["owner", "manager", "cashier", "kitchen"],
      wallet_txn_type: ["credit", "debit"],
      waste_reason: [
        "spoilage",
        "expired",
        "overcooked",
        "dropped",
        "prep",
        "breakage",
        "theft",
        "other",
      ],
    },
  },
} as const
