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
      app_banners: {
        Row: {
          action: string
          company_id: string
          created_at: string
          ends_on: string | null
          id: string
          image_url: string
          is_active: boolean
          outlet_id: string | null
          promo_code: string | null
          show_from: string | null
          show_until: string | null
          sort_order: number
          starts_on: string | null
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          action?: string
          company_id: string
          created_at?: string
          ends_on?: string | null
          id?: string
          image_url: string
          is_active?: boolean
          outlet_id?: string | null
          promo_code?: string | null
          show_from?: string | null
          show_until?: string | null
          sort_order?: number
          starts_on?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          action?: string
          company_id?: string
          created_at?: string
          ends_on?: string | null
          id?: string
          image_url?: string
          is_active?: boolean
          outlet_id?: string | null
          promo_code?: string | null
          show_from?: string | null
          show_until?: string | null
          sort_order?: number
          starts_on?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_banners_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_banners_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_devices: {
        Row: {
          active: boolean
          branch: string
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          last_seen_at: string | null
          name: string
          token_hash: string
        }
        Insert: {
          active?: boolean
          branch?: string
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          last_seen_at?: string | null
          name: string
          token_hash: string
        }
        Update: {
          active?: boolean
          branch?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          last_seen_at?: string | null
          name?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_devices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_events: {
        Row: {
          client_event_id: string
          clock_trusted: boolean
          company_id: string
          created_by: string | null
          device_id: string | null
          employee_id: string
          event_type: string
          id: string
          method: string
          note: string
          occurred_at: string
          received_at: string
        }
        Insert: {
          client_event_id?: string
          clock_trusted?: boolean
          company_id: string
          created_by?: string | null
          device_id?: string | null
          employee_id: string
          event_type?: string
          id?: string
          method: string
          note?: string
          occurred_at: string
          received_at?: string
        }
        Update: {
          client_event_id?: string
          clock_trusted?: boolean
          company_id?: string
          created_by?: string | null
          device_id?: string | null
          employee_id?: string
          event_type?: string
          id?: string
          method?: string
          note?: string
          occurred_at?: string
          received_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_events_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "attendance_devices"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_voids: {
        Row: {
          company_id: string
          event_id: string
          reason: string
          voided_at: string
          voided_by: string | null
        }
        Insert: {
          company_id: string
          event_id: string
          reason: string
          voided_at?: string
          voided_by?: string | null
        }
        Update: {
          company_id?: string
          event_id?: string
          reason?: string
          voided_at?: string
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_voids_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_voids_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "attendance_events"
            referencedColumns: ["id"]
          },
        ]
      }
      billplz_fee_rates: {
        Row: {
          fee: number
          from_at: string
          outlet_id: string
        }
        Insert: {
          fee: number
          from_at: string
          outlet_id: string
        }
        Update: {
          fee?: number
          from_at?: string
          outlet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billplz_fee_rates_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      birthday_sends: {
        Row: {
          company_id: string
          member_id: string
          sent_at: string
          voucher_id: string | null
          year: number
        }
        Insert: {
          company_id: string
          member_id: string
          sent_at?: string
          voucher_id?: string | null
          year: number
        }
        Update: {
          company_id?: string
          member_id?: string
          sent_at?: string
          voucher_id?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "birthday_sends_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "birthday_sends_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "birthday_sends_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers"
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
      catering_links: {
        Row: {
          menu_item_id: string
          name_key: string
          outlet_id: string
        }
        Insert: {
          menu_item_id: string
          name_key: string
          outlet_id: string
        }
        Update: {
          menu_item_id?: string
          name_key?: string
          outlet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catering_links_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catering_links_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "v_item_performance"
            referencedColumns: ["menu_item_id"]
          },
          {
            foreignKeyName: "catering_links_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      catering_served: {
        Row: {
          auto: boolean
          day_id: string
          outlet_id: string
          served_at: string
          served_by: string | null
        }
        Insert: {
          auto?: boolean
          day_id: string
          outlet_id: string
          served_at?: string
          served_by?: string | null
        }
        Update: {
          auto?: boolean
          day_id?: string
          outlet_id?: string
          served_at?: string
          served_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catering_served_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          id: string
          join_code: string
          name: string
          owner_email: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          join_code?: string
          name: string
          owner_email?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          join_code?: string
          name?: string
          owner_email?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      company_apps: {
        Row: {
          app: string
          company_id: string
          enabled_at: string
        }
        Insert: {
          app: string
          company_id: string
          enabled_at?: string
        }
        Update: {
          app?: string
          company_id?: string
          enabled_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_apps_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_lalamove: {
        Row: {
          api_key: string
          api_secret: string
          company_id: string
          error: string | null
          status: string
          updated_at: string
        }
        Insert: {
          api_key: string
          api_secret: string
          company_id: string
          error?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          api_key?: string
          api_secret?: string
          company_id?: string
          error?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_lalamove_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_members: {
        Row: {
          company_id: string
          consent_at: string | null
          joined_at: string
          marketing_consent: boolean
          member_id: string
          ref_code: string | null
          source: string
        }
        Insert: {
          company_id: string
          consent_at?: string | null
          joined_at?: string
          marketing_consent?: boolean
          member_id: string
          ref_code?: string | null
          source?: string
        }
        Update: {
          company_id?: string
          consent_at?: string | null
          joined_at?: string
          marketing_consent?: boolean
          member_id?: string
          ref_code?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
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
      deliveries: {
        Row: {
          address: string
          booked_at: string | null
          completed_at: string | null
          cost: number | null
          created_at: string
          distance_m: number | null
          driver: Json | null
          driver_note: string | null
          fee: number
          force_price: boolean
          guest_order_id: string | null
          id: string
          lalamove_order_id: string | null
          lalamove_price: number
          own: boolean
          lat: number
          lng: number
          outlet_id: string
          picked_up_at: string | null
          problem: string | null
          quotation_id: string | null
          quote_expires_at: string
          recipient_name: string | null
          recipient_phone: string | null
          share_link: string | null
          status: string
          unit: string | null
          updated_at: string
        }
        Insert: {
          address: string
          booked_at?: string | null
          completed_at?: string | null
          cost?: number | null
          created_at?: string
          distance_m?: number | null
          driver?: Json | null
          driver_note?: string | null
          fee: number
          force_price?: boolean
          guest_order_id?: string | null
          id?: string
          lalamove_order_id?: string | null
          lalamove_price: number
          own?: boolean
          lat: number
          lng: number
          outlet_id: string
          picked_up_at?: string | null
          problem?: string | null
          quotation_id?: string | null
          quote_expires_at: string
          recipient_name?: string | null
          recipient_phone?: string | null
          share_link?: string | null
          status?: string
          unit?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          booked_at?: string | null
          completed_at?: string | null
          cost?: number | null
          created_at?: string
          distance_m?: number | null
          driver?: Json | null
          driver_note?: string | null
          fee?: number
          force_price?: boolean
          guest_order_id?: string | null
          id?: string
          lalamove_order_id?: string | null
          lalamove_price?: number
          own?: boolean
          lat?: number
          lng?: number
          outlet_id?: string
          picked_up_at?: string | null
          problem?: string | null
          quotation_id?: string | null
          quote_expires_at?: string
          recipient_name?: string | null
          recipient_phone?: string | null
          share_link?: string | null
          status?: string
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_guest_order_id_fkey"
            columns: ["guest_order_id"]
            isOneToOne: true
            referencedRelation: "guest_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_shifts: {
        Row: {
          break_minutes: number
          company_id: string
          employee_id: string
          end_time: string
          start_time: string
          weekday: number
        }
        Insert: {
          break_minutes?: number
          company_id: string
          employee_id: string
          end_time: string
          start_time: string
          weekday: number
        }
        Update: {
          break_minutes?: number
          company_id?: string
          employee_id?: string
          end_time?: string
          start_time?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "employee_shifts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_orders: {
        Row: {
          amount_due: number | null
          channel: Database["public"]["Enums"]["order_channel"]
          claim_token: string
          created_at: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          decided_at: string | null
          decided_by_id: string | null
          delivery_fee: number | null
          dining: string | null
          discount_amount: number | null
          id: string
          items: Json
          kiosk_id: string | null
          member_id: string | null
          note: string | null
          number: number | null
          outlet_id: string
          paid_at: string | null
          paid_back_at: string | null
          payment_ref: string | null
          pickup_at: string | null
          promo_code_id: string | null
          reject_reason: string | null
          release_at: string | null
          round_at: string | null
          status: string
          subtotal: number
          table_id: string | null
          transaction_id: string | null
          voucher_id: string | null
        }
        Insert: {
          amount_due?: number | null
          channel?: Database["public"]["Enums"]["order_channel"]
          claim_token?: string
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          decided_at?: string | null
          decided_by_id?: string | null
          delivery_fee?: number | null
          dining?: string | null
          discount_amount?: number | null
          id?: string
          items: Json
          kiosk_id?: string | null
          member_id?: string | null
          note?: string | null
          number?: number | null
          outlet_id: string
          paid_at?: string | null
          paid_back_at?: string | null
          payment_ref?: string | null
          pickup_at?: string | null
          promo_code_id?: string | null
          reject_reason?: string | null
          release_at?: string | null
          round_at?: string | null
          status?: string
          subtotal?: number
          table_id?: string | null
          transaction_id?: string | null
          voucher_id?: string | null
        }
        Update: {
          amount_due?: number | null
          channel?: Database["public"]["Enums"]["order_channel"]
          claim_token?: string
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          decided_at?: string | null
          decided_by_id?: string | null
          delivery_fee?: number | null
          dining?: string | null
          discount_amount?: number | null
          id?: string
          items?: Json
          kiosk_id?: string | null
          member_id?: string | null
          note?: string | null
          number?: number | null
          outlet_id?: string
          paid_at?: string | null
          paid_back_at?: string | null
          payment_ref?: string | null
          pickup_at?: string | null
          promo_code_id?: string | null
          reject_reason?: string | null
          release_at?: string | null
          round_at?: string | null
          status?: string
          subtotal?: number
          table_id?: string | null
          transaction_id?: string | null
          voucher_id?: string | null
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
            foreignKeyName: "guest_orders_kiosk_id_fkey"
            columns: ["kiosk_id"]
            isOneToOne: false
            referencedRelation: "kiosks"
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
            foreignKeyName: "guest_orders_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
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
          {
            foreignKeyName: "guest_orders_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      hub_config: {
        Row: {
          company_id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          company_id: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          company_id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "hub_config_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      hub_records: {
        Row: {
          company_id: string
          data: Json
          id: string
          kind: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          company_id: string
          data: Json
          id: string
          kind: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          company_id?: string
          data?: Json
          id?: string
          kind?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hub_records_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      hub_users: {
        Row: {
          active: boolean
          company_id: string
          created_at: string
          display_id: string
          email: string
          employee_id: string | null
          full_name: string
          modules: string[]
          role: string
          user_code: string
          user_id: string
        }
        Insert: {
          active?: boolean
          company_id: string
          created_at?: string
          display_id: string
          email?: string
          employee_id?: string | null
          full_name?: string
          modules?: string[]
          role?: string
          user_code: string
          user_id: string
        }
        Update: {
          active?: boolean
          company_id?: string
          created_at?: string
          display_id?: string
          email?: string
          employee_id?: string | null
          full_name?: string
          modules?: string[]
          role?: string
          user_code?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hub_users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_keys: {
        Row: {
          company_id: string
          created_at: string
          id: string
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          revoked_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          revoked_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          revoked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_keys_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_consumption: {
        Row: {
          catering_day: string | null
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
          catering_day?: string | null
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
          catering_day?: string | null
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
          kitchen: string | null
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
          kitchen?: string | null
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
          kitchen?: string | null
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
      kiosks: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          outlet_id: string
          pay_modes: string[]
          token: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          outlet_id: string
          pay_modes?: string[]
          token?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          outlet_id?: string
          pay_modes?: string[]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "kiosks_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      kitchen_stations: {
        Row: {
          created_at: string
          id: string
          name: string
          outlet_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          outlet_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          outlet_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "kitchen_stations_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          days: number
          decided_at: string | null
          decided_by: string | null
          decision_note: string
          employee_id: string
          end_date: string
          half_day: boolean
          id: string
          leave_type_id: string
          reason: string
          start_date: string
          status: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          days: number
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string
          employee_id: string
          end_date: string
          half_day?: boolean
          id?: string
          leave_type_id: string
          reason?: string
          start_date: string
          status?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          days?: number
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string
          employee_id?: string
          end_date?: string
          half_day?: boolean
          id?: string
          leave_type_id?: string
          reason?: string
          start_date?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_balances"
            referencedColumns: ["leave_type_id"]
          },
          {
            foreignKeyName: "leave_requests_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_types: {
        Row: {
          active: boolean
          company_id: string
          created_at: string
          days_per_year: number
          id: string
          name: string
          paid: boolean
        }
        Insert: {
          active?: boolean
          company_id: string
          created_at?: string
          days_per_year?: number
          id?: string
          name: string
          paid?: boolean
        }
        Update: {
          active?: boolean
          company_id?: string
          created_at?: string
          days_per_year?: number
          id?: string
          name?: string
          paid?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "leave_types_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_accounts: {
        Row: {
          company_id: string
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
          company_id: string
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
          company_id?: string
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
            foreignKeyName: "loyalty_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
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
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_programs: {
        Row: {
          birthday_reward_id: string | null
          company_id: string
          is_enabled: boolean
          points_per_rm: number
          referral_points: number | null
          updated_at: string
          welcome_points: number
          welcome_reward_id: string | null
          winback_days: number | null
          winback_reward_id: string | null
        }
        Insert: {
          birthday_reward_id?: string | null
          company_id: string
          is_enabled?: boolean
          points_per_rm?: number
          referral_points?: number | null
          updated_at?: string
          welcome_points?: number
          welcome_reward_id?: string | null
          winback_days?: number | null
          winback_reward_id?: string | null
        }
        Update: {
          birthday_reward_id?: string | null
          company_id?: string
          is_enabled?: boolean
          points_per_rm?: number
          referral_points?: number | null
          updated_at?: string
          welcome_points?: number
          welcome_reward_id?: string | null
          winback_days?: number | null
          winback_reward_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_programs_birthday_reward_id_fkey"
            columns: ["birthday_reward_id"]
            isOneToOne: false
            referencedRelation: "loyalty_rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_programs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_programs_welcome_reward_id_fkey"
            columns: ["welcome_reward_id"]
            isOneToOne: false
            referencedRelation: "loyalty_rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_programs_winback_reward_id_fkey"
            columns: ["winback_reward_id"]
            isOneToOne: false
            referencedRelation: "loyalty_rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_rewards: {
        Row: {
          company_id: string
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
          company_id: string
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
          company_id?: string
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
        Relationships: [
          {
            foreignKeyName: "loyalty_rewards_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_tiers: {
        Row: {
          company_id: string
          created_at: string
          discount_percentage: number
          id: string
          name: string
          points_required: number
          theme_color: string
        }
        Insert: {
          company_id: string
          created_at?: string
          discount_percentage?: number
          id?: string
          name: string
          points_required: number
          theme_color: string
        }
        Update: {
          company_id?: string
          created_at?: string
          discount_percentage?: number
          id?: string
          name?: string
          points_required?: number
          theme_color?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_tiers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_transactions: {
        Row: {
          account_id: string
          balance_after: number
          bill_payment_id: string | null
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
          bill_payment_id?: string | null
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
          bill_payment_id?: string | null
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
            foreignKeyName: "loyalty_transactions_bill_payment_id_fkey"
            columns: ["bill_payment_id"]
            isOneToOne: false
            referencedRelation: "wallet_bill_payments"
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
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          message: string
          recipient_count: number
          title: string
        }
        Insert: {
          audience: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          message: string
          recipient_count?: number
          title: string
        }
        Update: {
          audience?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          message?: string
          recipient_count?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_campaigns_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          counter_section: boolean
          created_at: string
          id: string
          is_hidden: boolean
          kitchen: string | null
          kitchen_names: Json
          menu_group: string | null
          name: string
          no_takeaway: boolean
          outlet_id: string
          sort_order: number
          station_id: string | null
          updated_at: string
        }
        Insert: {
          counter_section?: boolean
          created_at?: string
          id?: string
          is_hidden?: boolean
          kitchen?: string | null
          kitchen_names?: Json
          menu_group?: string | null
          name: string
          no_takeaway?: boolean
          outlet_id: string
          sort_order?: number
          station_id?: string | null
          updated_at?: string
        }
        Update: {
          counter_section?: boolean
          created_at?: string
          id?: string
          is_hidden?: boolean
          kitchen?: string | null
          kitchen_names?: Json
          menu_group?: string | null
          name?: string
          no_takeaway?: boolean
          outlet_id?: string
          sort_order?: number
          station_id?: string | null
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
          {
            foreignKeyName: "menu_categories_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "kitchen_stations"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_deals: {
        Row: {
          category_id: string | null
          created_at: string
          ends_at: string | null
          id: string
          is_active: boolean
          kind: string
          menu_item_id: string | null
          outlet_id: string
          starts_at: string
          title: string | null
          value: number
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          kind: string
          menu_item_id?: string | null
          outlet_id: string
          starts_at?: string
          title?: string | null
          value: number
        }
        Update: {
          category_id?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          kind?: string
          menu_item_id?: string | null
          outlet_id?: string
          starts_at?: string
          title?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "menu_deals_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_deals_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_deals_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "v_item_performance"
            referencedColumns: ["menu_item_id"]
          },
          {
            foreignKeyName: "menu_deals_outlet_id_fkey"
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
          archived_at: string | null
          avail_days: number[] | null
          avail_from: string | null
          avail_until: string | null
          category_id: string | null
          combo_of: string | null
          cost_estimate: number | null
          counter_sort: number | null
          created_at: string
          description: string | null
          free_from_spend: number | null
          free_spend_category_ids: string[]
          id: string
          image_url: string | null
          is_available: boolean
          is_vegetarian: boolean
          kitchen_names: Json
          name: string
          no_takeaway: boolean
          outlet_id: string
          price: number
          regular_price: number | null
          rush_pause: boolean
          rush_paused_at: string | null
          sched_on: boolean | null
          sort_order: number
          sst_applicable: boolean
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          avail_days?: number[] | null
          avail_from?: string | null
          avail_until?: string | null
          category_id?: string | null
          combo_of?: string | null
          cost_estimate?: number | null
          counter_sort?: number | null
          created_at?: string
          description?: string | null
          free_from_spend?: number | null
          free_spend_category_ids?: string[]
          id?: string
          image_url?: string | null
          is_available?: boolean
          is_vegetarian?: boolean
          kitchen_names?: Json
          name: string
          no_takeaway?: boolean
          outlet_id: string
          price?: number
          regular_price?: number | null
          rush_pause?: boolean
          rush_paused_at?: string | null
          sched_on?: boolean | null
          sort_order?: number
          sst_applicable?: boolean
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          avail_days?: number[] | null
          avail_from?: string | null
          avail_until?: string | null
          category_id?: string | null
          combo_of?: string | null
          cost_estimate?: number | null
          counter_sort?: number | null
          created_at?: string
          description?: string | null
          free_from_spend?: number | null
          free_spend_category_ids?: string[]
          id?: string
          image_url?: string | null
          is_available?: boolean
          is_vegetarian?: boolean
          kitchen_names?: Json
          name?: string
          no_takeaway?: boolean
          outlet_id?: string
          price?: number
          regular_price?: number | null
          rush_pause?: boolean
          rush_paused_at?: string | null
          sched_on?: boolean | null
          sort_order?: number
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
            foreignKeyName: "menu_items_combo_of_fkey"
            columns: ["combo_of"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_combo_of_fkey"
            columns: ["combo_of"]
            isOneToOne: false
            referencedRelation: "v_item_performance"
            referencedColumns: ["menu_item_id"]
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
          kitchen_names: Json
          menu_item_id: string | null
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
          kitchen_names?: Json
          menu_item_id?: string | null
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
          kitchen_names?: Json
          menu_item_id?: string | null
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
          {
            foreignKeyName: "modifiers_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modifiers_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "v_item_performance"
            referencedColumns: ["menu_item_id"]
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
      order_counters: {
        Row: {
          day: string
          n: number
          outlet_id: string
        }
        Insert: {
          day: string
          n?: number
          outlet_id: string
        }
        Update: {
          day?: string
          n?: number
          outlet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_counters_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      order_voids: {
        Row: {
          amount: number
          approved_by_id: string | null
          created_at: string
          id: string
          item_name: string | null
          items: Json | null
          kitchen_status: string | null
          menu_item_id: string | null
          modifier_summary: string | null
          outlet_id: string
          quantity: number | null
          reason: string
          round_at: string | null
          scope: string
          transaction_id: string
          voided_by_id: string | null
        }
        Insert: {
          amount: number
          approved_by_id?: string | null
          created_at?: string
          id?: string
          item_name?: string | null
          items?: Json | null
          kitchen_status?: string | null
          menu_item_id?: string | null
          modifier_summary?: string | null
          outlet_id: string
          quantity?: number | null
          reason: string
          round_at?: string | null
          scope: string
          transaction_id: string
          voided_by_id?: string | null
        }
        Update: {
          amount?: number
          approved_by_id?: string | null
          created_at?: string
          id?: string
          item_name?: string | null
          items?: Json | null
          kitchen_status?: string | null
          menu_item_id?: string | null
          modifier_summary?: string | null
          outlet_id?: string
          quantity?: number | null
          reason?: string
          round_at?: string | null
          scope?: string
          transaction_id?: string
          voided_by_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_voids_approved_by_id_fkey"
            columns: ["approved_by_id"]
            isOneToOne: false
            referencedRelation: "staff_codes"
            referencedColumns: ["id"]
          },
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
          billplz_fee: number
          blind_close_enabled: boolean
          booking_capacity_pct: number
          booking_days_ahead: number
          booking_deposit_cap: number
          booking_deposit_per_guest: number
          booking_dining_minutes: number
          booking_free_cancel_hours: number
          booking_hold_minutes: number
          booking_lead_minutes: number
          booking_max_party: number
          booking_min_party: number
          booking_refund_excess: boolean
          booking_slot_minutes: number
          bookings_enabled: boolean
          cash_skim_threshold: number
          closing_checklist: string[]
          counter_enabled: boolean
          created_at: string
          currency: string
          delivery_enabled: boolean
          delivery_free_above: number | null
          own_delivery_fee: number
          own_delivery_hours: string[] | null
          own_delivery_km: number | null
          delivery_markup_pct: number
          delivery_markup_rm: number
          delivery_max_km: number
          eod_email: string | null
          eod_whatsapp: string | null
          guest_auto_accept: boolean
          guest_ordering_enabled: boolean
          guest_pickup_enabled: boolean
          hide_bill_call: boolean
          hide_call_staff: boolean
          hide_feedback: boolean
          kitchen_languages: string[]
          kitchen_mode: string
          last_order_minutes: number | null
          max_discount_percent: number
          opening_checklist: string[]
          order_flow: string
          outlet_id: string
          pickup_ahead_enabled: boolean
          pickup_days_ahead: number
          pickup_lead_minutes: number
          pickup_prep_minutes: number
          pickup_slot_minutes: number
          pickup_slot_orders: number
          pos_time_clock_enabled: boolean
          quick_notes: string[]
          receipt_footer: string
          receipt_header: string | null
          refund_method: string
          refund_requires_admin: boolean
          rounding_step: number
          rush_pause_at: number | null
          rush_paused_since: string | null
          service_charge_enabled: boolean
          service_charge_rate: number
          sst_enabled: boolean
          sst_rate: number
          sst_registration_no: string | null
          staff_price_percent: number | null
          staff_service_charge: boolean
          store_address: string | null
          store_cover_url: string | null
          store_hours: Json | null
          store_lat: number | null
          store_lng: number | null
          store_maps_url: string | null
          store_phone: string | null
          store_review_url: string | null
          store_tagline: string | null
          store_wifi_name: string | null
          store_wifi_password: string | null
          table_ask_party: boolean
          table_auto_cleaning: boolean
          table_seat_step: boolean
          table_turn_target_minutes: number
          target_splh: number
          updated_at: string
          vip_spend: number | null
        }
        Insert: {
          alert_cash_variance?: number
          alert_labor_pct?: number
          alert_void_count?: number
          billplz_fee?: number
          blind_close_enabled?: boolean
          booking_capacity_pct?: number
          booking_days_ahead?: number
          booking_deposit_cap?: number
          booking_deposit_per_guest?: number
          booking_dining_minutes?: number
          booking_free_cancel_hours?: number
          booking_hold_minutes?: number
          booking_lead_minutes?: number
          booking_max_party?: number
          booking_min_party?: number
          booking_refund_excess?: boolean
          booking_slot_minutes?: number
          bookings_enabled?: boolean
          cash_skim_threshold?: number
          closing_checklist?: string[]
          counter_enabled?: boolean
          created_at?: string
          currency?: string
          delivery_enabled?: boolean
          delivery_free_above?: number | null
          own_delivery_fee?: number
          own_delivery_hours?: string[] | null
          own_delivery_km?: number | null
          delivery_markup_pct?: number
          delivery_markup_rm?: number
          delivery_max_km?: number
          eod_email?: string | null
          eod_whatsapp?: string | null
          guest_auto_accept?: boolean
          guest_ordering_enabled?: boolean
          guest_pickup_enabled?: boolean
          hide_bill_call?: boolean
          hide_call_staff?: boolean
          hide_feedback?: boolean
          kitchen_languages?: string[]
          kitchen_mode?: string
          last_order_minutes?: number | null
          max_discount_percent?: number
          opening_checklist?: string[]
          order_flow?: string
          outlet_id: string
          pickup_ahead_enabled?: boolean
          pickup_days_ahead?: number
          pickup_lead_minutes?: number
          pickup_prep_minutes?: number
          pickup_slot_minutes?: number
          pickup_slot_orders?: number
          pos_time_clock_enabled?: boolean
          quick_notes?: string[]
          receipt_footer?: string
          receipt_header?: string | null
          refund_method?: string
          refund_requires_admin?: boolean
          rounding_step?: number
          rush_pause_at?: number | null
          rush_paused_since?: string | null
          service_charge_enabled?: boolean
          service_charge_rate?: number
          sst_enabled?: boolean
          sst_rate?: number
          sst_registration_no?: string | null
          staff_price_percent?: number | null
          staff_service_charge?: boolean
          store_address?: string | null
          store_cover_url?: string | null
          store_hours?: Json | null
          store_lat?: number | null
          store_lng?: number | null
          store_maps_url?: string | null
          store_phone?: string | null
          store_review_url?: string | null
          store_tagline?: string | null
          store_wifi_name?: string | null
          store_wifi_password?: string | null
          table_ask_party?: boolean
          table_auto_cleaning?: boolean
          table_seat_step?: boolean
          table_turn_target_minutes?: number
          target_splh?: number
          updated_at?: string
          vip_spend?: number | null
        }
        Update: {
          alert_cash_variance?: number
          alert_labor_pct?: number
          alert_void_count?: number
          billplz_fee?: number
          blind_close_enabled?: boolean
          booking_capacity_pct?: number
          booking_days_ahead?: number
          booking_deposit_cap?: number
          booking_deposit_per_guest?: number
          booking_dining_minutes?: number
          booking_free_cancel_hours?: number
          booking_hold_minutes?: number
          booking_lead_minutes?: number
          booking_max_party?: number
          booking_min_party?: number
          booking_refund_excess?: boolean
          booking_slot_minutes?: number
          bookings_enabled?: boolean
          cash_skim_threshold?: number
          closing_checklist?: string[]
          counter_enabled?: boolean
          created_at?: string
          currency?: string
          delivery_enabled?: boolean
          delivery_free_above?: number | null
          own_delivery_fee?: number
          own_delivery_hours?: string[] | null
          own_delivery_km?: number | null
          delivery_markup_pct?: number
          delivery_markup_rm?: number
          delivery_max_km?: number
          eod_email?: string | null
          eod_whatsapp?: string | null
          guest_auto_accept?: boolean
          guest_ordering_enabled?: boolean
          guest_pickup_enabled?: boolean
          hide_bill_call?: boolean
          hide_call_staff?: boolean
          hide_feedback?: boolean
          kitchen_languages?: string[]
          kitchen_mode?: string
          last_order_minutes?: number | null
          max_discount_percent?: number
          opening_checklist?: string[]
          order_flow?: string
          outlet_id?: string
          pickup_ahead_enabled?: boolean
          pickup_days_ahead?: number
          pickup_lead_minutes?: number
          pickup_prep_minutes?: number
          pickup_slot_minutes?: number
          pickup_slot_orders?: number
          pos_time_clock_enabled?: boolean
          quick_notes?: string[]
          receipt_footer?: string
          receipt_header?: string | null
          refund_method?: string
          refund_requires_admin?: boolean
          rounding_step?: number
          rush_pause_at?: number | null
          rush_paused_since?: string | null
          service_charge_enabled?: boolean
          service_charge_rate?: number
          sst_enabled?: boolean
          sst_rate?: number
          sst_registration_no?: string | null
          staff_price_percent?: number | null
          staff_service_charge?: boolean
          store_address?: string | null
          store_cover_url?: string | null
          store_hours?: Json | null
          store_lat?: number | null
          store_lng?: number | null
          store_maps_url?: string | null
          store_phone?: string | null
          store_review_url?: string | null
          store_tagline?: string | null
          store_wifi_name?: string | null
          store_wifi_password?: string | null
          table_ask_party?: boolean
          table_auto_cleaning?: boolean
          table_seat_step?: boolean
          table_turn_target_minutes?: number
          target_splh?: number
          updated_at?: string
          vip_spend?: number | null
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
          company_id: string | null
          created_at: string
          hub_key: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          company_id?: string | null
          created_at?: string
          hub_key?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          company_id?: string | null
          created_at?: string
          hub_key?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "outlets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_edit_log: {
        Row: {
          approved_by_id: string | null
          created_at: string
          edited_by_id: string | null
          id: string
          new_method: Database["public"]["Enums"]["payment_method"]
          old_method: Database["public"]["Enums"]["payment_method"] | null
          outlet_id: string
          transaction_id: string
        }
        Insert: {
          approved_by_id?: string | null
          created_at?: string
          edited_by_id?: string | null
          id?: string
          new_method: Database["public"]["Enums"]["payment_method"]
          old_method?: Database["public"]["Enums"]["payment_method"] | null
          outlet_id: string
          transaction_id: string
        }
        Update: {
          approved_by_id?: string | null
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
            foreignKeyName: "payment_edit_log_approved_by_id_fkey"
            columns: ["approved_by_id"]
            isOneToOne: false
            referencedRelation: "staff_codes"
            referencedColumns: ["id"]
          },
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
      plan_focus_sessions: {
        Row: {
          created_at: string
          id: string
          item_id: string | null
          minutes: number
          owner_id: string
          space_id: string
          started_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id?: string | null
          minutes: number
          owner_id: string
          space_id: string
          started_at: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string | null
          minutes?: number
          owner_id?: string
          space_id?: string
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_focus_sessions_item_id_owner_id_fkey"
            columns: ["item_id", "owner_id"]
            isOneToOne: false
            referencedRelation: "plan_items"
            referencedColumns: ["id", "owner_id"]
          },
          {
            foreignKeyName: "plan_focus_sessions_space_id_owner_id_fkey"
            columns: ["space_id", "owner_id"]
            isOneToOne: false
            referencedRelation: "plan_spaces"
            referencedColumns: ["id", "owner_id"]
          },
        ]
      }
      plan_habit_logs: {
        Row: {
          day: string
          habit_id: string
          owner_id: string
          skipped: boolean
          updated_at: string
          value: number
        }
        Insert: {
          day: string
          habit_id: string
          owner_id: string
          skipped?: boolean
          updated_at?: string
          value?: number
        }
        Update: {
          day?: string
          habit_id?: string
          owner_id?: string
          skipped?: boolean
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "plan_habit_logs_habit_id_owner_id_fkey"
            columns: ["habit_id", "owner_id"]
            isOneToOne: false
            referencedRelation: "plan_habits"
            referencedColumns: ["id", "owner_id"]
          },
        ]
      }
      plan_habits: {
        Row: {
          archived_at: string | null
          created_at: string
          cue: string | null
          days: number
          freq: string
          id: string
          kind: string
          name: string
          owner_id: string
          part: string
          paused_until: string | null
          per_week: number
          remind_at: string | null
          sort: number
          space_id: string | null
          target: number
          unit: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          cue?: string | null
          days?: number
          freq?: string
          id?: string
          kind?: string
          name: string
          owner_id: string
          part?: string
          paused_until?: string | null
          per_week?: number
          remind_at?: string | null
          sort?: number
          space_id?: string | null
          target?: number
          unit?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          cue?: string | null
          days?: number
          freq?: string
          id?: string
          kind?: string
          name?: string
          owner_id?: string
          part?: string
          paused_until?: string | null
          per_week?: number
          remind_at?: string | null
          sort?: number
          space_id?: string | null
          target?: number
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_habits_space_id_owner_id_fkey"
            columns: ["space_id", "owner_id"]
            isOneToOne: false
            referencedRelation: "plan_spaces"
            referencedColumns: ["id", "owner_id"]
          },
        ]
      }
      plan_hub_attempts: {
        Row: {
          at: string
          owner_id: string
        }
        Insert: {
          at?: string
          owner_id: string
        }
        Update: {
          at?: string
          owner_id?: string
        }
        Relationships: []
      }
      plan_hub_codes: {
        Row: {
          code_hash: string
          company_id: string
          expires_at: string
          hub_user_id: string
        }
        Insert: {
          code_hash: string
          company_id: string
          expires_at: string
          hub_user_id: string
        }
        Update: {
          code_hash?: string
          company_id?: string
          expires_at?: string
          hub_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_hub_codes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_hub_codes_hub_user_id_fkey"
            columns: ["hub_user_id"]
            isOneToOne: true
            referencedRelation: "hub_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      plan_hub_links: {
        Row: {
          company_id: string
          hub_user_id: string
          linked_at: string
          owner_id: string
          prefs: Json
        }
        Insert: {
          company_id: string
          hub_user_id: string
          linked_at?: string
          owner_id: string
          prefs?: Json
        }
        Update: {
          company_id?: string
          hub_user_id?: string
          linked_at?: string
          owner_id?: string
          prefs?: Json
        }
        Relationships: [
          {
            foreignKeyName: "plan_hub_links_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_hub_links_hub_user_id_fkey"
            columns: ["hub_user_id"]
            isOneToOne: false
            referencedRelation: "hub_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      plan_item_assignments: {
        Row: {
          assignee_id: string
          created_at: string
          done_at: string | null
          item_id: string
          owner_id: string
          proof: string | null
          status: string
        }
        Insert: {
          assignee_id: string
          created_at?: string
          done_at?: string | null
          item_id: string
          owner_id: string
          proof?: string | null
          status?: string
        }
        Update: {
          assignee_id?: string
          created_at?: string
          done_at?: string | null
          item_id?: string
          owner_id?: string
          proof?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_item_assignments_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "plan_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "plan_item_assignments_item_id_owner_id_fkey"
            columns: ["item_id", "owner_id"]
            isOneToOne: false
            referencedRelation: "plan_items"
            referencedColumns: ["id", "owner_id"]
          },
        ]
      }
      plan_item_invites: {
        Row: {
          created_at: string
          invitee_id: string
          item_id: string
          owner_id: string
          status: string
        }
        Insert: {
          created_at?: string
          invitee_id: string
          item_id: string
          owner_id: string
          status?: string
        }
        Update: {
          created_at?: string
          invitee_id?: string
          item_id?: string
          owner_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_item_invites_invitee_id_fkey"
            columns: ["invitee_id"]
            isOneToOne: false
            referencedRelation: "plan_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "plan_item_invites_item_id_owner_id_fkey"
            columns: ["item_id", "owner_id"]
            isOneToOne: false
            referencedRelation: "plan_items"
            referencedColumns: ["id", "owner_id"]
          },
        ]
      }
      plan_items: {
        Row: {
          created_at: string
          done_at: string | null
          due_on: string | null
          end_at: string | null
          estimate_min: number | null
          id: string
          important: boolean
          kind: string
          location: string | null
          notes: string | null
          owner_id: string
          parent_id: string | null
          reminder_min: number | null
          repeat: string | null
          repeat_until: string | null
          series_id: string | null
          space_id: string
          start_at: string | null
          suggested: boolean
          title: string
          travel_min: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          done_at?: string | null
          due_on?: string | null
          end_at?: string | null
          estimate_min?: number | null
          id?: string
          important?: boolean
          kind: string
          location?: string | null
          notes?: string | null
          owner_id: string
          parent_id?: string | null
          reminder_min?: number | null
          repeat?: string | null
          repeat_until?: string | null
          series_id?: string | null
          space_id: string
          start_at?: string | null
          suggested?: boolean
          title: string
          travel_min?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          done_at?: string | null
          due_on?: string | null
          end_at?: string | null
          estimate_min?: number | null
          id?: string
          important?: boolean
          kind?: string
          location?: string | null
          notes?: string | null
          owner_id?: string
          parent_id?: string | null
          reminder_min?: number | null
          repeat?: string | null
          repeat_until?: string | null
          series_id?: string | null
          space_id?: string
          start_at?: string | null
          suggested?: boolean
          title?: string
          travel_min?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_items_parent_id_owner_id_fkey"
            columns: ["parent_id", "owner_id"]
            isOneToOne: false
            referencedRelation: "plan_items"
            referencedColumns: ["id", "owner_id"]
          },
          {
            foreignKeyName: "plan_items_space_id_owner_id_fkey"
            columns: ["space_id", "owner_id"]
            isOneToOne: false
            referencedRelation: "plan_spaces"
            referencedColumns: ["id", "owner_id"]
          },
        ]
      }
      plan_profiles: {
        Row: {
          created_at: string
          day_end: string
          day_start: string
          display_name: string
          handle: string
          reminder_min: number
          user_id: string
        }
        Insert: {
          created_at?: string
          day_end?: string
          day_start?: string
          display_name?: string
          handle: string
          reminder_min?: number
          user_id: string
        }
        Update: {
          created_at?: string
          day_end?: string
          day_start?: string
          display_name?: string
          handle?: string
          reminder_min?: number
          user_id?: string
        }
        Relationships: []
      }
      plan_push_queue: {
        Row: {
          body: string
          fire_at: string
          id: number
          owner_id: string
          title: string
          url: string
        }
        Insert: {
          body: string
          fire_at: string
          id?: never
          owner_id: string
          title: string
          url?: string
        }
        Update: {
          body?: string
          fire_at?: string
          id?: never
          owner_id?: string
          title?: string
          url?: string
        }
        Relationships: []
      }
      plan_push_subs: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          owner_id: string
          p256dh: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          owner_id: string
          p256dh: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          owner_id?: string
          p256dh?: string
        }
        Relationships: []
      }
      plan_spaces: {
        Row: {
          archived_at: string | null
          color: string
          exams: boolean
          hub_outlet: string | null
          icon: string | null
          id: string
          kind: string
          name: string
          owner_id: string
          parent_id: string | null
          sort: number
          term_ends_on: string | null
          timetable: boolean
        }
        Insert: {
          archived_at?: string | null
          color: string
          exams?: boolean
          hub_outlet?: string | null
          icon?: string | null
          id?: string
          kind: string
          name: string
          owner_id: string
          parent_id?: string | null
          sort?: number
          term_ends_on?: string | null
          timetable?: boolean
        }
        Update: {
          archived_at?: string | null
          color?: string
          exams?: boolean
          hub_outlet?: string | null
          icon?: string | null
          id?: string
          kind?: string
          name?: string
          owner_id?: string
          parent_id?: string | null
          sort?: number
          term_ends_on?: string | null
          timetable?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "plan_spaces_parent_fk"
            columns: ["parent_id", "owner_id"]
            isOneToOne: false
            referencedRelation: "plan_spaces"
            referencedColumns: ["id", "owner_id"]
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
      print_agents: {
        Row: {
          created_at: string
          id: string
          last_seen_at: string | null
          name: string
          outlet_id: string
          platform: string
          token: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_seen_at?: string | null
          name: string
          outlet_id: string
          platform: string
          token?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_seen_at?: string | null
          name?: string
          outlet_id?: string
          platform?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "print_agents_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      print_jobs: {
        Row: {
          attempts: number
          created_at: string
          doc: Json
          done_at: string | null
          id: string
          kind: string
          outlet_id: string
          printer_id: string
          sent_at: string | null
          status: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          doc: Json
          done_at?: string | null
          id?: string
          kind: string
          outlet_id: string
          printer_id: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          doc?: Json
          done_at?: string | null
          id?: string
          kind?: string
          outlet_id?: string
          printer_id?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "print_jobs_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "print_jobs_printer_id_fkey"
            columns: ["printer_id"]
            isOneToOne: false
            referencedRelation: "printers"
            referencedColumns: ["id"]
          },
        ]
      }
      printers: {
        Row: {
          address: string | null
          agent_id: string | null
          connection: string
          created_at: string
          id: string
          last_error: string | null
          last_printed_at: string | null
          last_seen_at: string | null
          name: string
          outlet_id: string
          paper_mm: number
          receipts: boolean
          station_ids: string[]
          token: string
        }
        Insert: {
          address?: string | null
          agent_id?: string | null
          connection?: string
          created_at?: string
          id?: string
          last_error?: string | null
          last_printed_at?: string | null
          last_seen_at?: string | null
          name: string
          outlet_id: string
          paper_mm?: number
          receipts?: boolean
          station_ids?: string[]
          token?: string
        }
        Update: {
          address?: string | null
          agent_id?: string | null
          connection?: string
          created_at?: string
          id?: string
          last_error?: string | null
          last_printed_at?: string | null
          last_seen_at?: string | null
          name?: string
          outlet_id?: string
          paper_mm?: number
          receipts?: boolean
          station_ids?: string[]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "printers_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "print_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "printers_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
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
          company_id: string
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
          company_id?: string
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
          company_id?: string
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
            foreignKeyName: "promo_codes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_bill_lines: {
        Row: {
          bill_id: string
          id: string
          ingredient_id: string | null
          item_key: string
          item_name: string
          lot_id: string | null
          outlet_id: string
          qty: number
          status: string
          stock_qty: number | null
          stock_unit_cost: number | null
          unit: string | null
          unit_price: number
        }
        Insert: {
          bill_id: string
          id?: string
          ingredient_id?: string | null
          item_key: string
          item_name: string
          lot_id?: string | null
          outlet_id: string
          qty: number
          status?: string
          stock_qty?: number | null
          stock_unit_cost?: number | null
          unit?: string | null
          unit_price: number
        }
        Update: {
          bill_id?: string
          id?: string
          ingredient_id?: string | null
          item_key?: string
          item_name?: string
          lot_id?: string | null
          outlet_id?: string
          qty?: number
          status?: string
          stock_qty?: number | null
          stock_unit_cost?: number | null
          unit?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_bill_lines_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "purchase_bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_bill_lines_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "inventory_ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_bill_lines_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "v_inventory_valuation"
            referencedColumns: ["ingredient_id"]
          },
          {
            foreignKeyName: "purchase_bill_lines_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "v_low_stock"
            referencedColumns: ["ingredient_id"]
          },
          {
            foreignKeyName: "purchase_bill_lines_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "inventory_lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_bill_lines_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "v_expiring_soon"
            referencedColumns: ["lot_id"]
          },
          {
            foreignKeyName: "purchase_bill_lines_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_bills: {
        Row: {
          bought_at: string
          company_id: string
          created_at: string
          external_id: string
          id: string
          kitchen: string | null
          outlet_id: string
          photo_url: string | null
          source: string
          store: string | null
          total: number | null
        }
        Insert: {
          bought_at: string
          company_id: string
          created_at?: string
          external_id: string
          id?: string
          kitchen?: string | null
          outlet_id: string
          photo_url?: string | null
          source: string
          store?: string | null
          total?: number | null
        }
        Update: {
          bought_at?: string
          company_id?: string
          created_at?: string
          external_id?: string
          id?: string
          kitchen?: string | null
          outlet_id?: string
          photo_url?: string | null
          source?: string
          store?: string | null
          total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_bills_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_bills_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_connections: {
        Row: {
          company_id: string
          created_at: string
          id: string
          key_hash: string
          key_hint: string
          last_used_at: string | null
          revoked_at: string | null
          source: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          key_hash: string
          key_hint: string
          last_used_at?: string | null
          revoked_at?: string | null
          source?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          key_hash?: string
          key_hint?: string
          last_used_at?: string | null
          revoked_at?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_connections_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_item_links: {
        Row: {
          created_at: string
          factor: number
          ingredient_id: string | null
          item_key: string
          outlet_id: string
          source: string
        }
        Insert: {
          created_at?: string
          factor?: number
          ingredient_id?: string | null
          item_key: string
          outlet_id: string
          source: string
        }
        Update: {
          created_at?: string
          factor?: number
          ingredient_id?: string | null
          item_key?: string
          outlet_id?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_item_links_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "inventory_ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_item_links_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "v_inventory_valuation"
            referencedColumns: ["ingredient_id"]
          },
          {
            foreignKeyName: "purchase_item_links_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "v_low_stock"
            referencedColumns: ["ingredient_id"]
          },
          {
            foreignKeyName: "purchase_item_links_outlet_id_fkey"
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
      qr_carts: {
        Row: {
          created_at: string
          id: string
          items: Json
          outlet_id: string
          table_id: string
          updated_at: string
          value: number
        }
        Insert: {
          created_at?: string
          id: string
          items?: Json
          outlet_id: string
          table_id: string
          updated_at?: string
          value?: number
        }
        Update: {
          created_at?: string
          id?: string
          items?: Json
          outlet_id?: string
          table_id?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "qr_carts_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_carts_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "restaurant_tables"
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
          confirmed_at: string | null
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
          confirmed_at?: string | null
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
          confirmed_at?: string | null
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
      referrals: {
        Row: {
          company_id: string
          created_at: string
          friend_id: string
          referrer_id: string
          rewarded_at: string | null
          transaction_id: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          friend_id: string
          referrer_id: string
          rewarded_at?: string | null
          transaction_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          friend_id?: string
          referrer_id?: string
          rewarded_at?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      refund_payouts: {
        Row: {
          account_number: string | null
          amount: number | null
          bank_code: string | null
          created_at: string
          details_at: string | null
          details_by: string | null
          error: string | null
          holder_name: string | null
          id: string
          id_number: string | null
          kind: string
          link_sent_at: string | null
          method: string | null
          outlet_id: string
          paid_at: string | null
          paid_by: string | null
          reference: string | null
          sent_at: string | null
          source_id: string
          status: string
          token: string
        }
        Insert: {
          account_number?: string | null
          amount?: number | null
          bank_code?: string | null
          created_at?: string
          details_at?: string | null
          details_by?: string | null
          error?: string | null
          holder_name?: string | null
          id?: string
          id_number?: string | null
          kind: string
          link_sent_at?: string | null
          method?: string | null
          outlet_id: string
          paid_at?: string | null
          paid_by?: string | null
          reference?: string | null
          sent_at?: string | null
          source_id: string
          status?: string
          token?: string
        }
        Update: {
          account_number?: string | null
          amount?: number | null
          bank_code?: string | null
          created_at?: string
          details_at?: string | null
          details_by?: string | null
          error?: string | null
          holder_name?: string | null
          id?: string
          id_number?: string | null
          kind?: string
          link_sent_at?: string | null
          method?: string | null
          outlet_id?: string
          paid_at?: string | null
          paid_by?: string | null
          reference?: string | null
          sent_at?: string | null
          source_id?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "refund_payouts_outlet_id_fkey"
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
          paid_back_at: string | null
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
          paid_back_at?: string | null
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
          paid_back_at?: string | null
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
          current_session_id: string | null
          current_transaction_id: string | null
          height: number
          id: string
          label: string
          moved_to: string | null
          outlet_id: string
          party_size: number | null
          pos_x: number
          pos_y: number
          qr_token: string
          seated_at: string | null
          seats: number
          section_id: string | null
          shape: string
          status: string
          status_since: string
          width: number
        }
        Insert: {
          created_at?: string
          current_session_id?: string | null
          current_transaction_id?: string | null
          height?: number
          id?: string
          label: string
          moved_to?: string | null
          outlet_id: string
          party_size?: number | null
          pos_x?: number
          pos_y?: number
          qr_token?: string
          seated_at?: string | null
          seats?: number
          section_id?: string | null
          shape?: string
          status?: string
          status_since?: string
          width?: number
        }
        Update: {
          created_at?: string
          current_session_id?: string | null
          current_transaction_id?: string | null
          height?: number
          id?: string
          label?: string
          moved_to?: string | null
          outlet_id?: string
          party_size?: number | null
          pos_x?: number
          pos_y?: number
          qr_token?: string
          seated_at?: string | null
          seats?: number
          section_id?: string | null
          shape?: string
          status?: string
          status_since?: string
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_tables_current_session_id_fkey"
            columns: ["current_session_id"]
            isOneToOne: false
            referencedRelation: "table_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_tables_moved_to_fkey"
            columns: ["moved_to"]
            isOneToOne: false
            referencedRelation: "restaurant_tables"
            referencedColumns: ["id"]
          },
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
          meal_allowance: number | null
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
          meal_allowance?: number | null
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
          meal_allowance?: number | null
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
      table_bookings: {
        Row: {
          booked_for: string
          code: string
          created_at: string
          deposit_applied: number
          deposit_due: number
          deposit_paid_at: string | null
          deposit_ref: string | null
          deposit_status: string
          expires_at: string | null
          free_cancel_until: string | null
          id: string
          member_id: string | null
          name: string
          note: string | null
          outlet_id: string
          paid_back_at: string | null
          party_size: number
          phone: string | null
          refund_amount: number
          refund_at: string | null
          refund_excess: boolean
          seated_at: string | null
          source: string
          status: string
          table_id: string | null
          token: string
          transaction_id: string | null
        }
        Insert: {
          booked_for: string
          code?: string
          created_at?: string
          deposit_applied?: number
          deposit_due?: number
          deposit_paid_at?: string | null
          deposit_ref?: string | null
          deposit_status?: string
          expires_at?: string | null
          free_cancel_until?: string | null
          id?: string
          member_id?: string | null
          name: string
          note?: string | null
          outlet_id: string
          paid_back_at?: string | null
          party_size: number
          phone?: string | null
          refund_amount?: number
          refund_at?: string | null
          refund_excess?: boolean
          seated_at?: string | null
          source?: string
          status?: string
          table_id?: string | null
          token?: string
          transaction_id?: string | null
        }
        Update: {
          booked_for?: string
          code?: string
          created_at?: string
          deposit_applied?: number
          deposit_due?: number
          deposit_paid_at?: string | null
          deposit_ref?: string | null
          deposit_status?: string
          expires_at?: string | null
          free_cancel_until?: string | null
          id?: string
          member_id?: string | null
          name?: string
          note?: string | null
          outlet_id?: string
          paid_back_at?: string | null
          party_size?: number
          phone?: string | null
          refund_amount?: number
          refund_at?: string | null
          refund_excess?: boolean
          seated_at?: string | null
          source?: string
          status?: string
          table_id?: string | null
          token?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "table_bookings_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_bookings_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "restaurant_tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_bookings_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      table_sessions: {
        Row: {
          cleared_at: string | null
          first_order_at: string | null
          id: string
          merged_into: string | null
          outcome: string | null
          outlet_id: string
          paid_at: string | null
          party_size: number | null
          seated_at: string
          table_id: string | null
          transaction_id: string | null
          waitlist_id: string | null
        }
        Insert: {
          cleared_at?: string | null
          first_order_at?: string | null
          id?: string
          merged_into?: string | null
          outcome?: string | null
          outlet_id: string
          paid_at?: string | null
          party_size?: number | null
          seated_at?: string
          table_id?: string | null
          transaction_id?: string | null
          waitlist_id?: string | null
        }
        Update: {
          cleared_at?: string | null
          first_order_at?: string | null
          id?: string
          merged_into?: string | null
          outcome?: string | null
          outlet_id?: string
          paid_at?: string | null
          party_size?: number | null
          seated_at?: string
          table_id?: string | null
          transaction_id?: string | null
          waitlist_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "table_sessions_merged_into_fkey"
            columns: ["merged_into"]
            isOneToOne: false
            referencedRelation: "table_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_sessions_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_sessions_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "restaurant_tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_sessions_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
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
          modifier_ids: string[]
          modifier_summary: string | null
          note: string | null
          parent_item_id: string | null
          part_pos: number | null
          print_claimed_at: string | null
          printed_at: string | null
          quantity: number
          ready_at: string | null
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
          modifier_ids?: string[]
          modifier_summary?: string | null
          note?: string | null
          parent_item_id?: string | null
          part_pos?: number | null
          print_claimed_at?: string | null
          printed_at?: string | null
          quantity: number
          ready_at?: string | null
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
          modifier_ids?: string[]
          modifier_summary?: string | null
          note?: string | null
          parent_item_id?: string | null
          part_pos?: number | null
          print_claimed_at?: string | null
          printed_at?: string | null
          quantity?: number
          ready_at?: string | null
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
            foreignKeyName: "transaction_items_parent_item_id_fkey"
            columns: ["parent_item_id"]
            isOneToOne: false
            referencedRelation: "transaction_items"
            referencedColumns: ["id"]
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
          counter_tag: number | null
          created_at: string
          delivery_fee: number
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
          meal_covered: number | null
          meal_decided_at: string | null
          meal_decided_by: string | null
          meal_kind: string | null
          meal_note: string | null
          meal_recorded_by: string | null
          meal_reject_reason: string | null
          meal_staff_id: string | null
          meal_status: string | null
          meal_value: number | null
          member_id: string | null
          merged_tags: number[]
          note: string | null
          order_source: string
          outlet_id: string
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          promo_code_id: string | null
          refunded_amount: number
          rounding_amount: number
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
          voucher_id: string | null
        }
        Insert: {
          cashier_id?: string | null
          channel?: Database["public"]["Enums"]["order_channel"]
          completed_at?: string | null
          counter_tag?: number | null
          created_at?: string
          delivery_fee?: number
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
          meal_covered?: number | null
          meal_decided_at?: string | null
          meal_decided_by?: string | null
          meal_kind?: string | null
          meal_note?: string | null
          meal_recorded_by?: string | null
          meal_reject_reason?: string | null
          meal_staff_id?: string | null
          meal_status?: string | null
          meal_value?: number | null
          member_id?: string | null
          merged_tags?: number[]
          note?: string | null
          order_source?: string
          outlet_id: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          promo_code_id?: string | null
          refunded_amount?: number
          rounding_amount?: number
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
          voucher_id?: string | null
        }
        Update: {
          cashier_id?: string | null
          channel?: Database["public"]["Enums"]["order_channel"]
          completed_at?: string | null
          counter_tag?: number | null
          created_at?: string
          delivery_fee?: number
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
          meal_covered?: number | null
          meal_decided_at?: string | null
          meal_decided_by?: string | null
          meal_kind?: string | null
          meal_note?: string | null
          meal_recorded_by?: string | null
          meal_reject_reason?: string | null
          meal_staff_id?: string | null
          meal_status?: string | null
          meal_value?: number | null
          member_id?: string | null
          merged_tags?: number[]
          note?: string | null
          order_source?: string
          outlet_id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          promo_code_id?: string | null
          refunded_amount?: number
          rounding_amount?: number
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
          voucher_id?: string | null
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
            foreignKeyName: "transactions_discounted_by_id_fkey"
            columns: ["discounted_by_id"]
            isOneToOne: false
            referencedRelation: "staff_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_meal_decided_by_fkey"
            columns: ["meal_decided_by"]
            isOneToOne: false
            referencedRelation: "staff_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_meal_recorded_by_fkey"
            columns: ["meal_recorded_by"]
            isOneToOne: false
            referencedRelation: "staff_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_meal_staff_id_fkey"
            columns: ["meal_staff_id"]
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
            foreignKeyName: "transactions_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
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
          {
            foreignKeyName: "transactions_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      vouchers: {
        Row: {
          code: string
          company_id: string
          created_at: string
          id: string
          kind: string | null
          points_spent: number
          reward_id: string | null
          status: string
          title: string
          transaction_id: string | null
          used_at: string | null
          user_id: string
          value: number | null
        }
        Insert: {
          code: string
          company_id: string
          created_at?: string
          id?: string
          kind?: string | null
          points_spent: number
          reward_id?: string | null
          status?: string
          title: string
          transaction_id?: string | null
          used_at?: string | null
          user_id: string
          value?: number | null
        }
        Update: {
          code?: string
          company_id?: string
          created_at?: string
          id?: string
          kind?: string | null
          points_spent?: number
          reward_id?: string | null
          status?: string
          title?: string
          transaction_id?: string | null
          used_at?: string | null
          user_id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vouchers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vouchers_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "loyalty_rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vouchers_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
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
      waitlist: {
        Row: {
          created_at: string
          id: string
          name: string
          note: string | null
          outlet_id: string
          party_size: number
          phone: string | null
          quoted_minutes: number | null
          seated_at: string | null
          status: string
          table_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          note?: string | null
          outlet_id: string
          party_size: number
          phone?: string | null
          quoted_minutes?: number | null
          seated_at?: string | null
          status?: string
          table_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          note?: string | null
          outlet_id?: string
          party_size?: number
          phone?: string | null
          quoted_minutes?: number | null
          seated_at?: string | null
          status?: string
          table_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "restaurant_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_bill_payments: {
        Row: {
          amount: number
          cancel_requested_at: string | null
          created_at: string
          id: string
          member_id: string | null
          outlet_id: string
          paid_at: string | null
          paid_back_at: string | null
          payment_ref: string | null
          settled_at: string | null
          share: Json
          status: string
          transaction_id: string
        }
        Insert: {
          amount: number
          cancel_requested_at?: string | null
          created_at?: string
          id?: string
          member_id?: string | null
          outlet_id: string
          paid_at?: string | null
          paid_back_at?: string | null
          payment_ref?: string | null
          settled_at?: string | null
          share?: Json
          status?: string
          transaction_id: string
        }
        Update: {
          amount?: number
          cancel_requested_at?: string | null
          created_at?: string
          id?: string
          member_id?: string | null
          outlet_id?: string
          paid_at?: string | null
          paid_back_at?: string | null
          payment_ref?: string | null
          settled_at?: string | null
          share?: Json
          status?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_bill_payments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_bill_payments_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_bill_payments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_booking_bills: {
        Row: {
          bill_id: string
          created_at: string
          token: string
        }
        Insert: {
          bill_id: string
          created_at?: string
          token: string
        }
        Update: {
          bill_id?: string
          created_at?: string
          token?: string
        }
        Relationships: []
      }
      wallet_feedback: {
        Row: {
          comment: string | null
          company_id: string
          created_at: string
          id: string
          member_id: string | null
          outlet_id: string
          rating: number
          read_at: string | null
          recovered_at: string | null
          recovery_voucher_id: string | null
          table_label: string | null
        }
        Insert: {
          comment?: string | null
          company_id: string
          created_at?: string
          id?: string
          member_id?: string | null
          outlet_id: string
          rating: number
          read_at?: string | null
          recovered_at?: string | null
          recovery_voucher_id?: string | null
          table_label?: string | null
        }
        Update: {
          comment?: string | null
          company_id?: string
          created_at?: string
          id?: string
          member_id?: string | null
          outlet_id?: string
          rating?: number
          read_at?: string | null
          recovered_at?: string | null
          recovery_voucher_id?: string | null
          table_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallet_feedback_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_feedback_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_feedback_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_feedback_recovery_voucher_id_fkey"
            columns: ["recovery_voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_game_scores: {
        Row: {
          created_at: string
          day: string
          game: string
          id: string
          member_id: string | null
          outlet_id: string
          player: string | null
          score: number
          table_label: string
        }
        Insert: {
          created_at?: string
          day?: string
          game: string
          id?: string
          member_id?: string | null
          outlet_id: string
          player?: string | null
          score: number
          table_label: string
        }
        Update: {
          created_at?: string
          day?: string
          game?: string
          id?: string
          member_id?: string | null
          outlet_id?: string
          player?: string | null
          score?: number
          table_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_game_scores_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_game_scores_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_pay_codes: {
        Row: {
          amount: number | null
          code: string
          created_at: string
          expires_at: string
          member_id: string
          outlet_id: string | null
          transaction_id: string | null
          used_at: string | null
        }
        Insert: {
          amount?: number | null
          code: string
          created_at?: string
          expires_at: string
          member_id: string
          outlet_id?: string | null
          transaction_id?: string | null
          used_at?: string | null
        }
        Update: {
          amount?: number | null
          code?: string
          created_at?: string
          expires_at?: string
          member_id?: string
          outlet_id?: string | null
          transaction_id?: string | null
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallet_pay_codes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_pay_codes_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_pay_codes_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_receipt_claims: {
        Row: {
          claimed_at: string | null
          claimed_by: string | null
          code: string
          created_at: string
          transaction_id: string
        }
        Insert: {
          claimed_at?: string | null
          claimed_by?: string | null
          code?: string
          created_at?: string
          transaction_id: string
        }
        Update: {
          claimed_at?: string | null
          claimed_by?: string | null
          code?: string
          created_at?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_receipt_claims_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_receipt_claims_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: true
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_table_calls: {
        Row: {
          created_at: string
          done_at: string | null
          id: string
          kind: string
          member_id: string | null
          note: string | null
          outlet_id: string
          table_id: string
        }
        Insert: {
          created_at?: string
          done_at?: string | null
          id?: string
          kind: string
          member_id?: string | null
          note?: string | null
          outlet_id: string
          table_id: string
        }
        Update: {
          created_at?: string
          done_at?: string | null
          id?: string
          kind?: string
          member_id?: string | null
          note?: string | null
          outlet_id?: string
          table_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_table_calls_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_table_calls_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_table_calls_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "restaurant_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_topups: {
        Row: {
          amount: number
          bonus: number
          created_at: string
          id: string
          paid_at: string | null
          payment_ref: string | null
          status: string
          user_id: string
          wallet_transaction_id: string | null
        }
        Insert: {
          amount: number
          bonus?: number
          created_at?: string
          id?: string
          paid_at?: string | null
          payment_ref?: string | null
          status?: string
          user_id: string
          wallet_transaction_id?: string | null
        }
        Update: {
          amount?: number
          bonus?: number
          created_at?: string
          id?: string
          paid_at?: string | null
          payment_ref?: string | null
          status?: string
          user_id?: string
          wallet_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallet_topups_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_topups_wallet_transaction_id_fkey"
            columns: ["wallet_transaction_id"]
            isOneToOne: false
            referencedRelation: "wallet_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          company_id: string | null
          created_at: string
          description: string | null
          id: string
          outlet_id: string | null
          type: Database["public"]["Enums"]["wallet_txn_type"]
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          outlet_id?: string | null
          type: Database["public"]["Enums"]["wallet_txn_type"]
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          outlet_id?: string | null
          type?: Database["public"]["Enums"]["wallet_txn_type"]
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
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
      winback_sends: {
        Row: {
          company_id: string
          id: string
          last_visit: string
          member_id: string
          sent_at: string
          voucher_id: string | null
        }
        Insert: {
          company_id: string
          id?: string
          last_visit: string
          member_id: string
          sent_at?: string
          voucher_id?: string | null
        }
        Update: {
          company_id?: string
          id?: string
          last_visit?: string
          member_id?: string
          sent_at?: string
          voucher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "winback_sends_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "winback_sends_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "winback_sends_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      attendance_days: {
        Row: {
          company_id: string | null
          employee_id: string | null
          first_in: string | null
          has_manual: boolean | null
          last_in: string | null
          last_out: string | null
          late: boolean | null
          open: boolean | null
          scans: number | null
          scheduled: boolean | null
          shift_end: string | null
          shift_start: string | null
          untrusted_clock: boolean | null
          work_date: string | null
          worked_minutes: number | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_balances: {
        Row: {
          company_id: string | null
          employee_id: string | null
          entitled: number | null
          leave_type_id: string | null
          pending: number | null
          remaining: number | null
          taken: number | null
          year: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hub_records_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      on_shift_now: {
        Row: {
          branch: string | null
          company_id: string | null
          employee_id: string | null
          employee_name: string | null
          since: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
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
      agent_job_result: {
        Args: {
          p_error?: string
          p_job_ids: string[]
          p_ok: boolean
          p_token: string
        }
        Returns: undefined
      }
      agent_poll: { Args: { p_token: string }; Returns: Json }
      append_order_items: { Args: { p_payload: Json }; Returns: Json }
      apply_discount: { Args: { p_payload: Json }; Returns: Json }
      apply_promo_code: { Args: { p_payload: Json }; Returns: Json }
      apply_voucher: { Args: { p_payload: Json }; Returns: Json }
      booking_cancel: { Args: { p_token: string }; Returns: Json }
      booking_claim: {
        Args: { p_phone?: string; p_table_token: string }
        Returns: Json
      }
      booking_config: { Args: { p_outlet: string }; Returns: Json }
      booking_confirm_deposit: {
        Args: { p_paid: number; p_ref: string; p_token: string }
        Returns: Json
      }
      booking_create: {
        Args: {
          p_name: string
          p_note?: string
          p_outlet: string
          p_party: number
          p_phone: string
          p_when: string
        }
        Returns: Json
      }
      booking_get: { Args: { p_token: string }; Returns: Json }
      booking_refund_link: { Args: { p_token: string }; Returns: string }
      booking_slots: {
        Args: { p_date: string; p_outlet: string; p_party: number }
        Returns: {
          available: boolean
          slot: string
        }[]
      }
      branch_logins: { Args: never; Returns: Json }
      change_payment_method: { Args: { p_payload: Json }; Returns: Json }
      check_join_code: { Args: { p_code: string }; Returns: string }
      check_promo_code: { Args: { p_code: string }; Returns: Json }
      check_voucher: { Args: { p_code: string }; Returns: Json }
      claim_guest_order: {
        Args: { p_claim_token: string; p_id: string }
        Returns: Json
      }
      claim_station_tickets: {
        Args: { p_station_ids: string[] }
        Returns: Json
      }
      clock_in: { Args: { p_payload: Json }; Returns: Json }
      clock_out: { Args: { p_payload: Json }; Returns: Json }
      close_cash_session: { Args: { p_payload: Json }; Returns: Json }
      company_customers: {
        Args: { p_limit?: number; p_offset?: number; p_search?: string }
        Returns: {
          email: string
          full_name: string
          id: string
          last_visit: string
          marketing_consent: boolean
          member_since: string
          phone: string
          points_balance: number
          spent: number
          tier: string
          total_count: number
          visits: number
        }[]
      }
      company_guest_contacts: {
        Args: { p_limit?: number; p_search?: string }
        Returns: {
          email: string
          last_order: string
          name: string
          orders: number
          phone: string
        }[]
      }
      company_members: { Args: never; Returns: Json }
      company_send_broadcast: {
        Args: { p_audience: string; p_message: string; p_title: string }
        Returns: Json
      }
      complete_stock_transfer: {
        Args: { p_transfer_id: string }
        Returns: undefined
      }
      confirm_station_tickets: {
        Args: { p_item_ids: string[] }
        Returns: undefined
      }
      counter_add_plate: { Args: { p_payload: Json }; Returns: Json }
      create_branch_login: {
        Args: { p_outlet: string; p_password: string; p_user_id: string }
        Returns: string
      }
      create_integration_key: { Args: { p_name: string }; Returns: string }
      current_company_id: { Args: never; Returns: string }
      current_outlet_id: { Args: never; Returns: string }
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      dashboard_overview: {
        Args: {
          p_channels?: string[]
          p_from: string
          p_outlets?: string[]
          p_to: string
        }
        Returns: Json
      }
      decide_meals: { Args: { p_payload: Json }; Returns: Json }
      delete_branch_login: { Args: { p_user: string }; Returns: undefined }
      deliveries_list: { Args: { p_from: string; p_to: string }; Returns: Json }
      delivery_action: {
        Args: { p_action: string; p_id: string }
        Returns: undefined
      }
      ensure_member: { Args: never; Returns: boolean }
      export_sales_daily: {
        Args: { p_from: string; p_key: string; p_to: string }
        Returns: Json
      }
      export_transactions: {
        Args: { p_key: string; p_limit?: number; p_since: string }
        Returns: Json
      }
      finalize_stock_count: { Args: { p_payload: Json }; Returns: Json }
      fn_accept_guest_order: {
        Args: { p_id: string; p_staff: string }
        Returns: string
      }
      fn_append_items: {
        Args: { p_items: Json; p_outlet: string; p_tx: string }
        Returns: number
      }
      fn_apply_menu_deals: { Args: { p_outlet?: string }; Returns: undefined }
      fn_apply_menu_schedules: { Args: never; Returns: undefined }
      fn_apply_promo: {
        Args: { p_code: string; p_staff: string; p_tx: string }
        Returns: number
      }
      fn_apply_rush_pause: { Args: never; Returns: undefined }
      fn_apply_stock_delta: {
        Args: { p_delta: number; p_ingredient: string; p_outlet: string }
        Returns: number
      }
      fn_apply_voucher: {
        Args: {
          p_amount: number
          p_code: string
          p_staff: string
          p_tx: string
        }
        Returns: number
      }
      fn_award_points: {
        Args: {
          p_amount: number
          p_member: string
          p_outlet: string
          p_share?: string
          p_tx: string
        }
        Returns: number
      }
      fn_bill_app_payments: {
        Args: { p_mark?: boolean; p_transaction_id: string }
        Returns: Json
      }
      fn_bill_held: { Args: { p_tx: string }; Returns: number }
      fn_bill_payment_holds: {
        Args: { p: Database["public"]["Tables"]["wallet_bill_payments"]["Row"] }
        Returns: boolean
      }
      fn_bill_points: {
        Args: { p_tx: Database["public"]["Tables"]["transactions"]["Row"] }
        Returns: number
      }
      fn_bill_unshared: {
        Args: { p_tx: Database["public"]["Tables"]["transactions"]["Row"] }
        Returns: number
      }
      fn_billplz_fee_at: {
        Args: { p_at: string; p_outlet: string }
        Returns: number
      }
      fn_birthday_summary: { Args: never; Returns: Json }
      fn_booking_capacity: { Args: { p_outlet: string }; Returns: number }
      fn_booking_link: { Args: { p_booking: string }; Returns: undefined }
      fn_booking_load: {
        Args: {
          p_exclude: string
          p_from: string
          p_outlet: string
          p_to: string
        }
        Returns: number
      }
      fn_branch_login_check: { Args: { p_user: string }; Returns: undefined }
      fn_cash_session_summary: { Args: { p_session: string }; Returns: Json }
      fn_catering_apply: {
        Args: { p_auto: boolean; p_by: string; p_day: string; p_outlet: string }
        Returns: number
      }
      fn_catering_lines: {
        Args: { p_from: string; p_outlet: string; p_to: string }
        Returns: {
          confirmed: boolean
          customer: string
          day_id: string
          event_date: string
          item_name: string
          menu_item_id: string
          pax: number
          qty: number
          quotation_id: string
          recipe_id: string
          served_at: string
          serving_style: string
          session_label: string
          session_time: string
          yield_qty: number
        }[]
      }
      fn_catering_link: {
        Args: { p_item: string; p_name: string }
        Returns: undefined
      }
      fn_catering_list: { Args: { p_days?: number }; Returns: Json }
      fn_catering_need: {
        Args: { p_from: string; p_outlet: string; p_to: string }
        Returns: {
          ingredient_id: string
          qty: number
        }[]
      }
      fn_catering_serve: { Args: { p_day: string }; Returns: number }
      fn_claim_station_tickets:
        | { Args: { p_outlet: string; p_station_ids: string[] }; Returns: Json }
        | {
            Args: {
              p_lease: boolean
              p_outlet: string
              p_station_ids: string[]
            }
            Returns: Json
          }
      fn_company_overview: { Args: { p_date?: string }; Returns: Json }
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
      fn_dash_kpis: {
        Args: {
          p_channels: string[]
          p_from: string
          p_outlets: string[]
          p_to: string
        }
        Returns: Json
      }
      fn_day_report: { Args: { p_date?: string }; Returns: Json }
      fn_deduct_inventory_for_transaction: {
        Args: { p_transaction_id: string }
        Returns: undefined
      }
      fn_delivery_sync: { Args: { p_id: string }; Returns: undefined }
      fn_expire_bookings: { Args: never; Returns: undefined }
      fn_feedback_make_good: {
        Args: { p_feedback: string; p_note?: string; p_reward: string }
        Returns: Json
      }
      fn_give_points: {
        Args: {
          p_company: string
          p_member: string
          p_points: number
          p_why: string
        }
        Returns: undefined
      }
      fn_guest_item_groups: { Args: { p_item: string }; Returns: Json }
      fn_guest_menu: {
        Args: {
          p_hide_no_takeaway: boolean
          p_outlet: string
          p_table_id: string
          p_table_label: string
        }
        Returns: Json
      }
      fn_guest_order_label: {
        Args: { g: Database["public"]["Tables"]["guest_orders"]["Row"] }
        Returns: string
      }
      fn_guest_payment_expired: {
        Args: { p_created: string }
        Returns: boolean
      }
      fn_guest_quote: {
        Args: {
          p_dine_in: boolean
          p_items: Json
          p_outlet: string
          p_promo: string
          p_voucher?: number
        }
        Returns: Json
      }
      fn_guest_round: { Args: { p_round: string; p_tx: string }; Returns: Json }
      fn_guest_switch_to_counter: { Args: { p_id: string }; Returns: Json }
      fn_guest_voucher: {
        Args: { p_code: string; p_outlet: string }
        Returns: {
          code: string
          company_id: string
          created_at: string
          id: string
          kind: string | null
          points_spent: number
          reward_id: string | null
          status: string
          title: string
          transaction_id: string | null
          used_at: string | null
          user_id: string
          value: number | null
        }
        SetofOptions: {
          from: "*"
          to: "vouchers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      fn_integration_company: { Args: { p_key: string }; Returns: string }
      fn_is_promo_code: {
        Args: { p_code: string; p_outlet: string }
        Returns: boolean
      }
      fn_is_waiter_code: { Args: { p_staff: string }; Returns: boolean }
      fn_item_round: { Args: { p_at: string; p_tx: string }; Returns: string }
      fn_join_company: {
        Args: { p_company: string; p_member: string; p_source: string }
        Returns: {
          company_id: string
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
        SetofOptions: {
          from: "*"
          to: "loyalty_accounts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      fn_kitchen_load: { Args: { p_outlet: string }; Returns: number }
      fn_kitchen_resort: { Args: { p_outlet: string }; Returns: undefined }
      fn_kitchen_resort_mine: { Args: never; Returns: undefined }
      fn_kitchen_set_category: {
        Args: { p_category: string; p_kitchen: string }
        Returns: undefined
      }
      fn_line_options: { Args: { p_item: string }; Returns: string }
      fn_meal_allowance_left: { Args: { p_staff: string }; Returns: number }
      fn_menu_deal_price: {
        Args: {
          p_category: string
          p_item: string
          p_outlet: string
          p_regular: number
        }
        Returns: number
      }
      fn_next_order_number: { Args: { p_outlet: string }; Returns: number }
      fn_norm_phone: { Args: { p: string }; Returns: string }
      fn_opt_deals: { Args: { p_days?: number }; Returns: Json }
      fn_opt_delivery: { Args: { p_days?: number }; Returns: Json }
      fn_opt_hours: { Args: { p_days?: number }; Returns: Json }
      fn_opt_kitchen: { Args: { p_days?: number }; Returns: Json }
      fn_opt_menu: { Args: { p_days?: number }; Returns: Json }
      fn_opt_month: { Args: { p_month: string }; Returns: Json }
      fn_opt_pairs: { Args: { p_days?: number }; Returns: Json }
      fn_opt_prep: { Args: { p_date: string }; Returns: Json }
      fn_opt_staff: { Args: { p_days?: number }; Returns: Json }
      fn_opt_stock: { Args: { p_days?: number }; Returns: Json }
      fn_opt_suppliers: { Args: never; Returns: Json }
      fn_opt_tables: { Args: { p_days?: number }; Returns: Json }
      fn_opt_upsell: { Args: { p_days?: number }; Returns: Json }
      fn_price_guest_items: {
        Args: { p_items: Json; p_outlet: string }
        Returns: Json
      }
      fn_promo_lookup: {
        Args: { p_code: string; p_outlet: string }
        Returns: {
          code: string
          company_id: string
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
        SetofOptions: {
          from: "*"
          to: "promo_codes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      fn_purchase_apply_line: { Args: { p_line: string }; Returns: string }
      fn_purchase_connections: { Args: never; Returns: Json }
      fn_purchase_ingest: {
        Args: { p_bill: Json; p_key: string }
        Returns: Json
      }
      fn_purchase_key_create: { Args: { p_source?: string }; Returns: string }
      fn_purchase_key_hash: { Args: { p_key: string }; Returns: string }
      fn_purchase_key_revoke: { Args: { p_id: string }; Returns: undefined }
      fn_purchase_link_item: {
        Args: {
          p_factor?: number
          p_ignore?: boolean
          p_ingredient: string
          p_item_key: string
          p_new_name?: string
          p_new_unit?: string
          p_source: string
        }
        Returns: number
      }
      fn_purchase_needs: {
        Args: { p_branch: string; p_key: string; p_kitchen?: string }
        Returns: Json
      }
      fn_queue_void_slip: {
        Args: {
          p_item_ids: string[]
          p_qty: Json
          p_tx: Database["public"]["Tables"]["transactions"]["Row"]
        }
        Returns: undefined
      }
      fn_quote_guest_items: {
        Args: { p_dine_in: boolean; p_items: Json; p_outlet: string }
        Returns: number
      }
      fn_recipe_drafts_import: { Args: { p_drafts: Json }; Returns: number }
      fn_recipe_drafts_load: {
        Args: { p_drafts: Json; p_outlet: string }
        Returns: number
      }
      fn_recompute_totals: { Args: { p_tx: string }; Returns: number }
      fn_referral_summary: { Args: never; Returns: Json }
      fn_refund_details: {
        Args: {
          p_account: string
          p_bank: string
          p_by: string
          p_holder: string
          p_id_number: string
          r: Database["public"]["Tables"]["refund_payouts"]["Row"]
        }
        Returns: undefined
      }
      fn_refund_payout: {
        Args: { p_id: string; p_kind: string; p_outlet: string }
        Returns: {
          account_number: string | null
          amount: number | null
          bank_code: string | null
          created_at: string
          details_at: string | null
          details_by: string | null
          error: string | null
          holder_name: string | null
          id: string
          id_number: string | null
          kind: string
          link_sent_at: string | null
          method: string | null
          outlet_id: string
          paid_at: string | null
          paid_by: string | null
          reference: string | null
          sent_at: string | null
          source_id: string
          status: string
          token: string
        }
        SetofOptions: {
          from: "*"
          to: "refund_payouts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      fn_refund_set_paid: {
        Args: {
          p_id: string
          p_kind: string
          p_outlet: string
          p_paid: boolean
        }
        Returns: undefined
      }
      fn_refunds: {
        Args: { p_outlet: string }
        Returns: {
          amount: number
          at: string
          customer_name: string
          email: string
          id: string
          kind: string
          paid_back_at: string
          payment_ref: string
          phone: string
          reason: string
          transaction_id: string
        }[]
      }
      fn_release_scheduled_orders: { Args: never; Returns: undefined }
      fn_require_cash_drawer: { Args: { p_outlet: string }; Returns: undefined }
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
      fn_run_birthdays: { Args: never; Returns: number }
      fn_run_catering: { Args: never; Returns: number }
      fn_run_winback: { Args: never; Returns: number }
      fn_seed_company_loyalty: {
        Args: { p_company: string }
        Returns: undefined
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
      fn_settle_paid_in_app: {
        Args: { p_transaction_id: string }
        Returns: Json
      }
      fn_settle_tenders: {
        Args: {
          p_app_paid?: number
          p_outlet: string
          p_payments: Json
          p_staff: string
          p_tx_id: string
        }
        Returns: Json
      }
      fn_spot_check_list: { Args: never; Returns: Json }
      fn_stock_health: { Args: never; Returns: Json }
      fn_stock_rows: {
        Args: { p_outlet: string }
        Returns: {
          buy_name: string
          buy_qty: number
          buy_unit: string
          confidence: number
          cover_days: number
          daily_use: number
          days_left: number
          id: string
          last_bought: string
          last_counted: string
          name: string
          stock: number
          suggest: number
          unit: string
          unit_cost: number
        }[]
      }
      fn_store_open_now: { Args: { p_hours: Json }; Returns: Json }
      fn_store_ordering: {
        Args: { p_hours: Json; p_last_order_minutes?: number }
        Returns: Json
      }
      fn_sync_booking_credit: { Args: { p_tx: string }; Returns: undefined }
      fn_table_by_token: {
        Args: { p_token: string }
        Returns: {
          created_at: string
          current_session_id: string | null
          current_transaction_id: string | null
          height: number
          id: string
          label: string
          moved_to: string | null
          outlet_id: string
          party_size: number | null
          pos_x: number
          pos_y: number
          qr_token: string
          seated_at: string | null
          seats: number
          section_id: string | null
          shape: string
          status: string
          status_since: string
          width: number
        }
        SetofOptions: {
          from: "*"
          to: "restaurant_tables"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      fn_table_clear: { Args: { p_table: string }; Returns: undefined }
      fn_table_release: {
        Args: { p_status: string; p_table: string; p_tx: string }
        Returns: undefined
      }
      fn_table_turnover: {
        Args: { p_from: string; p_to: string }
        Returns: Json
      }
      fn_table_vacate: { Args: { p_table: string }; Returns: undefined }
      fn_took_part: {
        Args: { p_member: string; p_tx: string }
        Returns: boolean
      }
      fn_void_staff: {
        Args: { p_outlet: string; p_payload: Json; p_started: boolean }
        Returns: Record<string, unknown>
      }
      fn_voucher_lookup: {
        Args: { p_code: string; p_outlet: string }
        Returns: {
          code: string
          company_id: string
          created_at: string
          id: string
          kind: string | null
          points_spent: number
          reward_id: string | null
          status: string
          title: string
          transaction_id: string | null
          used_at: string | null
          user_id: string
          value: number | null
        }
        SetofOptions: {
          from: "*"
          to: "vouchers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      fn_wallet_charge_code: {
        Args: { p_amount: number; p_code: string; p_transaction_id: string }
        Returns: Json
      }
      fn_wallet_credit: {
        Args: {
          p_amount: number
          p_description: string
          p_message: string
          p_outlet: string
          p_title: string
          p_user: string
        }
        Returns: string
      }
      fn_wallet_tag_charge: {
        Args: { p_charge: Json; p_tx: string }
        Returns: undefined
      }
      fn_weekly_briefing: { Args: { p_week_start: string }; Returns: Json }
      fn_winback_summary: { Args: { p_days?: number }; Returns: Json }
      guest_call_staff: {
        Args: { p_kind: string; p_token: string }
        Returns: Json
      }
      guest_cancel_order: {
        Args: { p_claim_token: string; p_id: string }
        Returns: Json
      }
      guest_check_promo: { Args: { p_payload: Json }; Returns: Json }
      fn_own_delivery_on: { Args: { p_outlet: string }; Returns: boolean }
      guest_delivery_info: { Args: { p_outlet: string }; Returns: Json }
      guest_game_board: {
        Args: { p_game?: string; p_token: string }
        Returns: Json
      }
      guest_game_submit: {
        Args: {
          p_game: string
          p_player?: string
          p_score: number
          p_token: string
        }
        Returns: Json
      }
      guest_get_menu: {
        Args: { p_outlet?: string; p_token?: string }
        Returns: Json
      }
      guest_kiosk: { Args: { p_token: string }; Returns: Json }
      guest_list_outlets: { Args: { p_company?: string }; Returns: Json }
      guest_menu_suggestions: { Args: { p_outlet: string }; Returns: Json }
      guest_order_status: {
        Args: { p_claim_token: string; p_id: string }
        Returns: Json
      }
      guest_pickup_slots: {
        Args: { p_date: string; p_outlet: string }
        Returns: {
          slot: string
        }[]
      }
      guest_place_order: { Args: { p_payload: Json }; Returns: Json }
      guest_send_feedback: {
        Args: { p_comment?: string; p_rating: number; p_token: string }
        Returns: undefined
      }
      guest_store: { Args: { p_outlet: string }; Returns: Json }
      guest_store_dishes: { Args: { p_outlet: string }; Returns: Json }
      guest_table_bill: { Args: { p_token: string }; Returns: Json }
      guest_table_home: { Args: { p_token: string }; Returns: Json }
      hub_add_manual_event: {
        Args: { p_employee_id: string; p_note: string; p_occurred_at: string }
        Returns: string
      }
      hub_apply_changes: {
        Args: { p_deletes: Json; p_upserts: Json }
        Returns: undefined
      }
      hub_branches: {
        Args: never
        Returns: {
          address: string
          hub_key: string
          id: string
          is_active: boolean
          name: string
        }[]
      }
      hub_cancel_leave: { Args: { p_id: string }; Returns: undefined }
      hub_current_company: { Args: never; Returns: string }
      hub_current_employee: { Args: never; Returns: string }
      hub_decide_leave: {
        Args: { p_approve: boolean; p_id: string; p_note: string }
        Returns: undefined
      }
      hub_has_module: { Args: { m: string }; Returns: boolean }
      hub_is_branch_key: { Args: { k: string }; Returns: boolean }
      hub_is_staff: { Args: never; Returns: boolean }
      hub_kaida_code: { Args: never; Returns: string }
      hub_kaida_linked: { Args: never; Returns: boolean }
      hub_kaida_unlink: { Args: never; Returns: number }
      hub_kind_module: { Args: { k: string }; Returns: string }
      hub_leave_days: {
        Args: {
          p_company: string
          p_employee: string
          p_end: string
          p_half: boolean
          p_start: string
        }
        Returns: number
      }
      hub_link_candidates: { Args: never; Returns: Json }
      hub_link_from_pos: {
        Args: never
        Returns: {
          active: boolean
          company_id: string
          created_at: string
          display_id: string
          email: string
          employee_id: string | null
          full_name: string
          modules: string[]
          role: string
          user_code: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "hub_users"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      hub_replace_config: { Args: { p_config: Json }; Returns: undefined }
      hub_request_leave: {
        Args: {
          p_end: string
          p_half_day: boolean
          p_leave_type_id: string
          p_reason: string
          p_start: string
        }
        Returns: string
      }
      hub_session: { Args: never; Returns: Json }
      hub_set_shift: {
        Args: { p_days: Json; p_employee_id: string }
        Returns: undefined
      }
      hub_shift_on: {
        Args: { p_company: string; p_day: string; p_employee: string }
        Returns: {
          end_time: string
          scheduled: boolean
          start_time: string
        }[]
      }
      hub_void_event: {
        Args: { p_event_id: string; p_reason: string }
        Returns: undefined
      }
      hub_work_date: { Args: { t: string }; Returns: string }
      ingest_external_order: { Args: { p_payload: Json }; Returns: string }
      is_company_owner: { Args: never; Returns: boolean }
      is_manager: { Args: never; Returns: boolean }
      is_wallet_owner: { Args: never; Returns: boolean }
      join_company: {
        Args: { p_company: string; p_marketing_consent?: boolean }
        Returns: Json
      }
      lease_station_tickets: {
        Args: { p_station_ids: string[] }
        Returns: Json
      }
      log_waste: { Args: { p_payload: Json }; Returns: Json }
      mark_online_refund_paid: {
        Args: {
          p_id: string
          p_kind: string
          p_paid?: boolean
          p_reference?: string
        }
        Returns: undefined
      }
      menu_slow_movers: {
        Args: { p_days?: number; p_outlet: string }
        Returns: {
          category: string
          last_sold: string
          menu_item_id: string
          name: string
          price: number
          regular_price: number
          sold: number
          stock: string
        }[]
      }
      move_table_order: { Args: { p_payload: Json }; Returns: Json }
      online_payments: { Args: { p_from: string; p_to: string }; Returns: Json }
      online_refunds_due: { Args: never; Returns: Json }
      outlet_receipt_logo: { Args: never; Returns: string }
      plan_assignment_decide: {
        Args: { p_approve: boolean; p_item: string }
        Returns: undefined
      }
      plan_assignment_done: {
        Args: { p_item: string; p_proof: string }
        Returns: undefined
      }
      plan_bootstrap: {
        Args: { p_handle: string; p_name: string }
        Returns: {
          created_at: string
          day_end: string
          day_start: string
          display_name: string
          handle: string
          reminder_min: number
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "plan_profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      plan_delete_my_data: { Args: never; Returns: undefined }
      plan_find_user: {
        Args: { p_handle: string }
        Returns: {
          display_name: string
          handle: string
          user_id: string
        }[]
      }
      plan_handle_available: { Args: { p_handle: string }; Returns: boolean }
      plan_hub_feed: { Args: never; Returns: Json }
      plan_invite_people: {
        Args: never
        Returns: {
          display_name: string
          handle: string
          user_id: string
        }[]
      }
      plan_link_hub: { Args: { p_code: string }; Returns: Json }
      plan_push_config: { Args: never; Returns: Json }
      plan_push_replace: { Args: { p_rows: Json }; Returns: undefined }
      plan_push_subscribe: {
        Args: { p_auth: string; p_endpoint: string; p_p256dh: string }
        Returns: undefined
      }
      plan_push_take: {
        Args: never
        Returns: {
          auth: string
          body: string
          endpoint: string
          p256dh: string
          title: string
          url: string
        }[]
      }
      plan_unlink_hub: { Args: never; Returns: undefined }
      pos_bill_app_payments: {
        Args: { p_transaction_id: string }
        Returns: Json
      }
      pos_bill_phone_paying: {
        Args: { p_transaction_id: string }
        Returns: Json
      }
      pos_booking_act: { Args: { p_payload: Json }; Returns: Json }
      pos_cancel_phone_payment: { Args: { p_id: string }; Returns: Json }
      pos_checkout: { Args: { p_payload: Json }; Returns: string }
      pos_link_from_hub: {
        Args: { p_branch_name?: string; p_outlet?: string }
        Returns: {
          company_id: string | null
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
      pos_wallet_lookup: { Args: { p_code: string }; Returns: Json }
      printer_job_result: {
        Args: { p_job_ids: string[]; p_ok: boolean; p_token: string }
        Returns: undefined
      }
      printer_poll: { Args: { p_token: string }; Returns: Json }
      provision_member: { Args: { p_user_id: string }; Returns: undefined }
      provision_owner_workspace: {
        Args: {
          p_company_name?: string
          p_join_code?: string
          p_outlet_name?: string
        }
        Returns: {
          company_id: string | null
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
      receipt_points_code: { Args: { p_transaction_id: string }; Returns: Json }
      record_meal: { Args: { p_payload: Json }; Returns: Json }
      redeem_reward: {
        Args: { p_reward_id: string; p_user_id: string }
        Returns: Json
      }
      refund_banks: { Args: never; Returns: Json }
      refund_get: { Args: { p_token: string }; Returns: Json }
      refund_order: { Args: { p_payload: Json }; Returns: Json }
      refund_payout_link: {
        Args: { p_id: string; p_kind: string }
        Returns: string
      }
      refund_payout_reset: {
        Args: { p_id: string; p_kind: string }
        Returns: undefined
      }
      refund_payout_send: {
        Args: { p_id: string; p_kind: string }
        Returns: Json
      }
      refund_payout_set_details: {
        Args: {
          p_account: string
          p_bank: string
          p_holder: string
          p_id: string
          p_id_number?: string
          p_kind: string
        }
        Returns: undefined
      }
      refund_submit: {
        Args: {
          p_account: string
          p_bank: string
          p_holder: string
          p_id_number?: string
          p_token: string
        }
        Returns: Json
      }
      reject_guest_order: { Args: { p_payload: Json }; Returns: Json }
      reorder_counter_items: { Args: { p_ids: string[] }; Returns: undefined }
      reorder_menu_categories: { Args: { p_ids: string[] }; Returns: undefined }
      reorder_menu_items: { Args: { p_ids: string[] }; Returns: undefined }
      revoke_integration_key: { Args: { p_id: string }; Returns: undefined }
      rotate_join_code: { Args: never; Returns: string }
      seat_table: { Args: { p_payload: Json }; Returns: Json }
      set_billplz_fee: {
        Args: { p_fee: number; p_past?: boolean }
        Returns: undefined
      }
      set_branch_login_password: {
        Args: { p_password: string; p_user: string }
        Returns: undefined
      }
      set_company_consent: {
        Args: { p_company: string; p_consent: boolean }
        Returns: undefined
      }
      set_item_availability: { Args: { p_payload: Json }; Returns: Json }
      set_lalamove_keys: {
        Args: { p_key: string; p_secret: string }
        Returns: undefined
      }
      set_member_role: { Args: { p_payload: Json }; Returns: Json }
      set_table_state: { Args: { p_payload: Json }; Returns: Json }
      settle_transaction: { Args: { p_payload: Json }; Returns: Json }
      switch_outlet: { Args: { p_outlet: string }; Returns: undefined }
      top_up_wallet: {
        Args: { p_amount: number; p_description?: string; p_user_id: string }
        Returns: Json
      }
      void_order: { Args: { p_payload: Json }; Returns: undefined }
      void_order_items: { Args: { p_payload: Json }; Returns: Json }
      wallet_active_orders: { Args: never; Returns: Json }
      wallet_banners: { Args: { p_outlet?: string }; Returns: Json }
      wallet_bill_pay_start: {
        Args: { p_share: Json; p_token: string }
        Returns: Json
      }
      wallet_booking_due: { Args: { p_table_token: string }; Returns: boolean }
      wallet_cancel_bill_payment: { Args: { p_ref: string }; Returns: Json }
      wallet_cart_ping: {
        Args: { p_cart: string; p_items?: Json; p_token: string }
        Returns: undefined
      }
      wallet_claim_receipt: { Args: { p_code: string }; Returns: Json }
      wallet_confirm_bill_payment: {
        Args: { p_paid: number; p_ref: string }
        Returns: Json
      }
      wallet_confirm_order_payment: {
        Args: { p_paid: number; p_ref: string }
        Returns: Json
      }
      wallet_confirm_topup: {
        Args: { p_paid: number; p_ref: string }
        Returns: Json
      }
      wallet_deals: { Args: { p_outlet: string }; Returns: Json }
      wallet_hook_secret_ok: { Args: { p_secret: string }; Returns: boolean }
      wallet_my_bill: { Args: { p_id: string }; Returns: Json }
      wallet_my_bills: {
        Args: { p_limit?: number; p_outlet?: string }
        Returns: Json
      }
      wallet_my_places: { Args: never; Returns: Json }
      wallet_nearby_outlets: {
        Args: { p_lat: number; p_lng: number }
        Returns: Json
      }
      wallet_order_item_names: {
        Args: { p_transaction_id: string }
        Returns: Json
      }
      wallet_outlet_logos: {
        Args: never
        Returns: {
          logo_url: string
          outlet_id: string
        }[]
      }
      wallet_pay_code: { Args: never; Returns: Json }
      wallet_pay_order: {
        Args: { p_claim_token: string; p_id: string }
        Returns: Json
      }
      wallet_payout_details: { Args: { p_id: string }; Returns: Json }
      wallet_payout_update: {
        Args: {
          p_error?: string
          p_id: string
          p_ref?: string
          p_status: string
        }
        Returns: Json
      }
      wallet_receipt_preview: { Args: { p_code: string }; Returns: Json }
      wallet_referral_claim: { Args: { p_code: string }; Returns: Json }
      wallet_referral_code: { Args: { p_company: string }; Returns: Json }
      wallet_table_visit: {
        Args: {
          p_order?: string
          p_since?: string
          p_token: string
          p_visit?: string
        }
        Returns: Json
      }
      wallet_topup_bonuses: { Args: never; Returns: Json }
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
        | "delivery"
      payment_method:
        | "cash"
        | "duitnow_qr"
        | "card"
        | "grabfood"
        | "foodpanda"
        | "shopeefood"
        | "online"
        | "wallet"
        | "meal"
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
        "delivery",
      ],
      payment_method: [
        "cash",
        "duitnow_qr",
        "card",
        "grabfood",
        "foodpanda",
        "shopeefood",
        "online",
        "wallet",
        "meal",
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
