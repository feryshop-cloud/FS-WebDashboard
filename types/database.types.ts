export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      accounts: {
        Row: {
          account_number: string | null;
          balance: number;
          created_at: string;
          id: string;
          image_url: string | null;
          is_active: boolean;
          name: string;
          type: string;
          updated_at: string;
        };
        Insert: {
          account_number?: string | null;
          balance?: number;
          created_at?: string;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          name: string;
          type?: string;
          updated_at?: string;
        };
        Update: {
          account_number?: string | null;
          balance?: number;
          created_at?: string;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          name?: string;
          type?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          action: string;
          created_at: string;
          description: string | null;
          id: string;
          ip_address: string | null;
          module: string;
          new_data: Json | null;
          old_data: Json | null;
          related_id: string | null;
          role_name: string | null;
          user_id: string | null;
        };
        Insert: {
          action: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          ip_address?: string | null;
          module: string;
          new_data?: Json | null;
          old_data?: Json | null;
          related_id?: string | null;
          role_name?: string | null;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          ip_address?: string | null;
          module?: string;
          new_data?: Json | null;
          old_data?: Json | null;
          related_id?: string | null;
          role_name?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "public_users";
            referencedColumns: ["id"];
          },
        ];
      };
      categories: {
        Row: {
          created_at: string;
          game_slug: string;
          id: number;
          is_active: boolean | null;
          logo: string | null;
          sort_order: number | null;
          title: string;
        };
        Insert: {
          created_at?: string;
          game_slug: string;
          id?: number;
          is_active?: boolean | null;
          logo?: string | null;
          sort_order?: number | null;
          title: string;
        };
        Update: {
          created_at?: string;
          game_slug?: string;
          id?: number;
          is_active?: boolean | null;
          logo?: string | null;
          sort_order?: number | null;
          title?: string;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          created_at: string;
          email: string | null;
          id: string;
          name: string;
          notes: string | null;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          id?: string;
          name: string;
          notes?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          id?: string;
          name?: string;
          notes?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      deal_items: {
        Row: {
          created_at: string;
          deal_id: string;
          id: string;
          price: number;
          stock_id: string;
        };
        Insert: {
          created_at?: string;
          deal_id: string;
          id?: string;
          price: number;
          stock_id: string;
        };
        Update: {
          created_at?: string;
          deal_id?: string;
          id?: string;
          price?: number;
          stock_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "deal_items_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deal_items_stock_id_fkey";
            columns: ["stock_id"];
            isOneToOne: false;
            referencedRelation: "stocks";
            referencedColumns: ["id"];
          },
        ];
      };
      deals: {
        Row: {
          admin_id: string | null;
          created_at: string;
          customer_contact: string | null;
          customer_id: string | null;
          customer_name: string | null;
          deal_number: string;
          deal_price: number;
          deal_type: string;
          due_date: string | null;
          handled_by: string | null;
          id: string;
          notes: string | null;
          payment_percentage: number;
          remaining_balance: number;
          status: Database["public"]["Enums"]["deal_status"];
          stock_id: string | null;
          total_deal_price: number | null;
          total_paid: number;
          updated_at: string;
        };
        Insert: {
          admin_id?: string | null;
          created_at?: string;
          customer_contact?: string | null;
          customer_id?: string | null;
          customer_name?: string | null;
          deal_number: string;
          deal_price?: number;
          deal_type?: string;
          due_date?: string | null;
          handled_by?: string | null;
          id?: string;
          notes?: string | null;
          payment_percentage?: number;
          remaining_balance?: number;
          status?: Database["public"]["Enums"]["deal_status"];
          stock_id?: string | null;
          total_deal_price?: number | null;
          total_paid?: number;
          updated_at?: string;
        };
        Update: {
          admin_id?: string | null;
          created_at?: string;
          customer_contact?: string | null;
          customer_id?: string | null;
          customer_name?: string | null;
          deal_number?: string;
          deal_price?: number;
          deal_type?: string;
          due_date?: string | null;
          handled_by?: string | null;
          id?: string;
          notes?: string | null;
          payment_percentage?: number;
          remaining_balance?: number;
          status?: Database["public"]["Enums"]["deal_status"];
          stock_id?: string | null;
          total_deal_price?: number | null;
          total_paid?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "deals_admin_id_fkey";
            columns: ["admin_id"];
            isOneToOne: false;
            referencedRelation: "public_users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deals_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deals_handled_by_fkey";
            columns: ["handled_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deals_stock_id_fkey";
            columns: ["stock_id"];
            isOneToOne: false;
            referencedRelation: "stocks";
            referencedColumns: ["id"];
          },
        ];
      };
      email_accounts: {
        Row: {
          created_at: string;
          display_name: string | null;
          email: string;
          id: string;
          is_active: boolean;
          last_synced_at: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          display_name?: string | null;
          email: string;
          id?: string;
          is_active?: boolean;
          last_synced_at?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          display_name?: string | null;
          email?: string;
          id?: string;
          is_active?: boolean;
          last_synced_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      finance_ledger: {
        Row: {
          account_id: string | null;
          admin_id: string | null;
          amount: number;
          created_at: string;
          created_by: string | null;
          deal_id: string | null;
          description: string | null;
          id: string;
          notes: string | null;
          payment_id: string | null;
          ref_id: string | null;
          stock_id: string | null;
          transaction_type: Database["public"]["Enums"]["ledger_transaction_type"];
        };
        Insert: {
          account_id?: string | null;
          admin_id?: string | null;
          amount: number;
          created_at?: string;
          created_by?: string | null;
          deal_id?: string | null;
          description?: string | null;
          id?: string;
          notes?: string | null;
          payment_id?: string | null;
          ref_id?: string | null;
          stock_id?: string | null;
          transaction_type: Database["public"]["Enums"]["ledger_transaction_type"];
        };
        Update: {
          account_id?: string | null;
          admin_id?: string | null;
          amount?: number;
          created_at?: string;
          created_by?: string | null;
          deal_id?: string | null;
          description?: string | null;
          id?: string;
          notes?: string | null;
          payment_id?: string | null;
          ref_id?: string | null;
          stock_id?: string | null;
          transaction_type?: Database["public"]["Enums"]["ledger_transaction_type"];
        };
        Relationships: [
          {
            foreignKeyName: "finance_ledger_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "finance_ledger_admin_id_fkey";
            columns: ["admin_id"];
            isOneToOne: false;
            referencedRelation: "public_users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "finance_ledger_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "finance_ledger_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "finance_ledger_payment_id_fkey";
            columns: ["payment_id"];
            isOneToOne: false;
            referencedRelation: "payments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "finance_ledger_stock_id_fkey";
            columns: ["stock_id"];
            isOneToOne: false;
            referencedRelation: "stocks";
            referencedColumns: ["id"];
          },
        ];
      };
      games: {
        Row: {
          banner: string | null;
          category_id: number;
          code: string | null;
          created_at: string;
          description: string | null;
          developers: string;
          id: string;
          image_url: string | null;
          instructions: Json;
          is_active: boolean;
          is_popular: boolean;
          logo: string | null;
          name: string;
          slug: string;
          sort_order: number;
          title: string | null;
          updated_at: string;
        };
        Insert: {
          banner?: string | null;
          category_id?: number;
          code?: string | null;
          created_at?: string;
          description?: string | null;
          developers?: string;
          id?: string;
          image_url?: string | null;
          instructions?: Json;
          is_active?: boolean;
          is_popular?: boolean;
          logo?: string | null;
          name: string;
          slug: string;
          sort_order?: number;
          title?: string | null;
          updated_at?: string;
        };
        Update: {
          banner?: string | null;
          category_id?: number;
          code?: string | null;
          created_at?: string;
          description?: string | null;
          developers?: string;
          id?: string;
          image_url?: string | null;
          instructions?: Json;
          is_active?: boolean;
          is_popular?: boolean;
          logo?: string | null;
          name?: string;
          slug?: string;
          sort_order?: number;
          title?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      incoming_emails: {
        Row: {
          category: string | null;
          created_at: string;
          email_account_id: string | null;
          id: string;
          is_archived: boolean;
          is_read: boolean;
          message_id: string;
          otp_code: string | null;
          raw_body_snippet: string | null;
          received_at: string;
          recipient_email: string;
          sender_email: string;
          subject: string | null;
          visibility: string;
        };
        Insert: {
          category?: string | null;
          created_at?: string;
          email_account_id?: string | null;
          id?: string;
          is_archived?: boolean;
          is_read?: boolean;
          message_id: string;
          otp_code?: string | null;
          raw_body_snippet?: string | null;
          received_at?: string;
          recipient_email: string;
          sender_email: string;
          subject?: string | null;
          visibility?: string;
        };
        Update: {
          category?: string | null;
          created_at?: string;
          email_account_id?: string | null;
          id?: string;
          is_archived?: boolean;
          is_read?: boolean;
          message_id?: string;
          otp_code?: string | null;
          raw_body_snippet?: string | null;
          received_at?: string;
          recipient_email?: string;
          sender_email?: string;
          subject?: string | null;
          visibility?: string;
        };
        Relationships: [];
      };
      inventory: {
        Row: {
          account_specs: string | null;
          added_by: string | null;
          asking_price: number;
          capital_price: number;
          created_at: string;
          game_id: string;
          id: string;
          image_urls: string[];
          public_id: string;
          screenshot_url: string | null;
          search_vector: unknown;
          sold_at: string | null;
          sold_price: number | null;
          status: Database["public"]["Enums"]["inventory_status"];
          title_reference: string | null;
          title_reference_vector: string | null;
          updated_at: string;
        };
        Insert: {
          account_specs?: string | null;
          added_by?: string | null;
          asking_price?: number;
          capital_price?: number;
          created_at?: string;
          game_id: string;
          id?: string;
          image_urls?: string[];
          public_id?: string | null;
          screenshot_url?: string | null;
          search_vector?: unknown;
          sold_at?: string | null;
          sold_price?: number | null;
          status?: Database["public"]["Enums"]["inventory_status"];
          title_reference?: string | null;
          title_reference_vector?: string | null;
          updated_at?: string;
        };
        Update: {
          account_specs?: string | null;
          added_by?: string | null;
          asking_price?: number;
          capital_price?: number;
          created_at?: string;
          game_id?: string;
          id?: string;
          image_urls?: string[];
          public_id?: string | null;
          screenshot_url?: string | null;
          search_vector?: unknown;
          sold_at?: string | null;
          sold_price?: number | null;
          status?: Database["public"]["Enums"]["inventory_status"];
          title_reference?: string | null;
          title_reference_vector?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_added_by_fkey";
            columns: ["added_by"];
            isOneToOne: false;
            referencedRelation: "public_users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          account_data: Json | null;
          buy_status: string;
          created_at: string;
          discount_price: number | null;
          email: string | null;
          expired_time: number | null;
          fee: number;
          game_slug: string;
          gateway_response: Json | null;
          id: string;
          id_games: string;
          nickname: string | null;
          order_id: string;
          payment_code: string;
          payment_code_display: string | null;
          payment_method_id: string | null;
          payment_name: string;
          payment_status: string;
          price: number;
          pricing_json: Json | null;
          product_id: string;
          product_title: string;
          promo_code: string | null;
          promo_discount: number | null;
          promo_price: number | null;
          qr_image_url: string | null;
          qr_string: string | null;
          quantity: number;
          serial_number: string | null;
          server_games: string | null;
          total_price: number;
          updated_at: string;
          user_id: string | null;
          whatsapp: string | null;
        };
        Insert: {
          account_data?: Json | null;
          buy_status?: string;
          created_at?: string;
          discount_price?: number | null;
          email?: string | null;
          expired_time?: number | null;
          fee?: number;
          game_slug: string;
          gateway_response?: Json | null;
          id?: string;
          id_games: string;
          nickname?: string | null;
          order_id: string;
          payment_code: string;
          payment_code_display?: string | null;
          payment_method_id?: string | null;
          payment_name: string;
          payment_status?: string;
          price: number;
          pricing_json?: Json | null;
          product_id: string;
          product_title: string;
          promo_code?: string | null;
          promo_discount?: number | null;
          promo_price?: number | null;
          qr_image_url?: string | null;
          qr_string?: string | null;
          quantity?: number;
          serial_number?: string | null;
          server_games?: string | null;
          total_price: number;
          updated_at?: string;
          user_id?: string | null;
          whatsapp?: string | null;
        };
        Update: {
          account_data?: Json | null;
          buy_status?: string;
          created_at?: string;
          discount_price?: number | null;
          email?: string | null;
          expired_time?: number | null;
          fee?: number;
          game_slug?: string;
          gateway_response?: Json | null;
          id?: string;
          id_games?: string;
          nickname?: string | null;
          order_id?: string;
          payment_code?: string;
          payment_code_display?: string | null;
          payment_method_id?: string | null;
          payment_name?: string;
          payment_status?: string;
          price?: number;
          pricing_json?: Json | null;
          product_id?: string;
          product_title?: string;
          promo_code?: string | null;
          promo_discount?: number | null;
          promo_price?: number | null;
          qr_image_url?: string | null;
          qr_string?: string | null;
          quantity?: number;
          serial_number?: string | null;
          server_games?: string | null;
          total_price?: number;
          updated_at?: string;
          user_id?: string | null;
          whatsapp?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      payment_methods: {
        Row: {
          badge_text: string | null;
          created_at: string;
          fee: number;
          fee_percent: number;
          group: string;
          id: string;
          images: string;
          instructions: Json | null;
          is_outside_group: boolean | null;
          maximum_amount: number;
          minimum_amount: number;
          name: string;
          outside_sort: number | null;
          payment_id: string;
          sort_order: number | null;
          status: string;
          type: string;
          updated_at: string;
        };
        Insert: {
          badge_text?: string | null;
          created_at?: string;
          fee?: number;
          fee_percent?: number;
          group?: string;
          id: string;
          images: string;
          instructions?: Json | null;
          is_outside_group?: boolean | null;
          maximum_amount?: number;
          minimum_amount?: number;
          name: string;
          outside_sort?: number | null;
          payment_id: string;
          sort_order?: number | null;
          status?: string;
          type: string;
          updated_at?: string;
        };
        Update: {
          badge_text?: string | null;
          created_at?: string;
          fee?: number;
          fee_percent?: number;
          group?: string;
          id?: string;
          images?: string;
          instructions?: Json | null;
          is_outside_group?: boolean | null;
          maximum_amount?: number;
          minimum_amount?: number;
          name?: string;
          outside_sort?: number | null;
          payment_id?: string;
          sort_order?: number | null;
          status?: string;
          type?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          account_id: string | null;
          admin_id: string | null;
          amount: number;
          created_at: string;
          deal_id: string | null;
          handled_by: string | null;
          id: string;
          notes: string | null;
          payment_type: Database["public"]["Enums"]["payment_type"];
          proof_url: string | null;
          status: Database["public"]["Enums"]["payment_status"];
          updated_at: string;
        };
        Insert: {
          account_id?: string | null;
          admin_id?: string | null;
          amount: number;
          created_at?: string;
          deal_id?: string | null;
          handled_by?: string | null;
          id?: string;
          notes?: string | null;
          payment_type?: Database["public"]["Enums"]["payment_type"];
          proof_url?: string | null;
          status?: Database["public"]["Enums"]["payment_status"];
          updated_at?: string;
        };
        Update: {
          account_id?: string | null;
          admin_id?: string | null;
          amount?: number;
          created_at?: string;
          deal_id?: string | null;
          handled_by?: string | null;
          id?: string;
          notes?: string | null;
          payment_type?: Database["public"]["Enums"]["payment_type"];
          proof_url?: string | null;
          status?: Database["public"]["Enums"]["payment_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_admin_id_fkey";
            columns: ["admin_id"];
            isOneToOne: false;
            referencedRelation: "public_users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_handled_by_fkey";
            columns: ["handled_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      permissions: {
        Row: {
          action: string;
          created_at: string;
          description: string | null;
          id: string;
          module: string;
        };
        Insert: {
          action: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          module: string;
        };
        Update: {
          action?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          module?: string;
        };
        Relationships: [];
      };
      problem_cases: {
        Row: {
          case_number: string;
          chronology: string | null;
          created_at: string;
          customer_id: string | null;
          deal_id: string | null;
          handled_by: string | null;
          id: string;
          issue_type: string;
          resolution: string | null;
          status: string;
          stock_id: string | null;
          updated_at: string;
        };
        Insert: {
          case_number: string;
          chronology?: string | null;
          created_at?: string;
          customer_id?: string | null;
          deal_id?: string | null;
          handled_by?: string | null;
          id?: string;
          issue_type: string;
          resolution?: string | null;
          status?: string;
          stock_id?: string | null;
          updated_at?: string;
        };
        Update: {
          case_number?: string;
          chronology?: string | null;
          created_at?: string;
          customer_id?: string | null;
          deal_id?: string | null;
          handled_by?: string | null;
          id?: string;
          issue_type?: string;
          resolution?: string | null;
          status?: string;
          stock_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "problem_cases_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "problem_cases_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "problem_cases_handled_by_fkey";
            columns: ["handled_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "problem_cases_stock_id_fkey";
            columns: ["stock_id"];
            isOneToOne: false;
            referencedRelation: "stocks";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          brand: string | null;
          category_id: number | null;
          cost_price: number | null;
          created_at: string;
          game_slug: string;
          id: string;
          images: string | null;
          is_active: boolean | null;
          is_gangguan: boolean | null;
          logo: string | null;
          promo_price: number | null;
          selling_price: number;
          selling_price_gold: number;
          selling_price_platinum: number;
          sku: string | null;
          sort_order: number | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          brand?: string | null;
          category_id?: number | null;
          cost_price?: number | null;
          created_at?: string;
          game_slug: string;
          id: string;
          images?: string | null;
          is_active?: boolean | null;
          is_gangguan?: boolean | null;
          logo?: string | null;
          promo_price?: number | null;
          selling_price: number;
          selling_price_gold: number;
          selling_price_platinum: number;
          sku?: string | null;
          sort_order?: number | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          brand?: string | null;
          category_id?: number | null;
          cost_price?: number | null;
          created_at?: string;
          game_slug?: string;
          id?: string;
          images?: string | null;
          is_active?: boolean | null;
          is_gangguan?: boolean | null;
          logo?: string | null;
          promo_price?: number | null;
          selling_price?: number;
          selling_price_gold?: number;
          selling_price_platinum?: number;
          sku?: string | null;
          sort_order?: number | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      public_users: {
        Row: {
          created_at: string;
          full_name: string;
          id: string;
          is_active: boolean;
          role_id: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          full_name: string;
          id: string;
          is_active?: boolean;
          role_id?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          full_name?: string;
          id?: string;
          is_active?: boolean;
          role_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "public_users_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
        ];
      };
      rate_limit_attempts: {
        Row: {
          attempt_count: number;
          created_at: string;
          email: string;
          id: string;
          window_start: string;
        };
        Insert: {
          attempt_count?: number;
          created_at?: string;
          email: string;
          id?: string;
          window_start?: string;
        };
        Update: {
          attempt_count?: number;
          created_at?: string;
          email?: string;
          id?: string;
          window_start?: string;
        };
        Relationships: [];
      };
      role_permissions: {
        Row: {
          created_at: string;
          permission_id: string;
          role_id: string;
        };
        Insert: {
          created_at?: string;
          permission_id: string;
          role_id: string;
        };
        Update: {
          created_at?: string;
          permission_id?: string;
          role_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey";
            columns: ["permission_id"];
            isOneToOne: false;
            referencedRelation: "permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
        ];
      };
      roles: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          permissions: Json;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          permissions?: Json;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          permissions?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      settings: {
        Row: {
          description: string | null;
          key: string;
          updated_at: string;
          value: Json;
        };
        Insert: {
          description?: string | null;
          key: string;
          updated_at?: string;
          value: Json;
        };
        Update: {
          description?: string | null;
          key?: string;
          updated_at?: string;
          value?: Json;
        };
        Relationships: [];
      };
      stock_histories: {
        Row: {
          changed_by: string | null;
          created_at: string;
          id: string;
          notes: string | null;
          status: string;
          stock_id: string;
        };
        Insert: {
          changed_by?: string | null;
          created_at?: string;
          id?: string;
          notes?: string | null;
          status: string;
          stock_id: string;
        };
        Update: {
          changed_by?: string | null;
          created_at?: string;
          id?: string;
          notes?: string | null;
          status?: string;
          stock_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "stock_histories_changed_by_fkey";
            columns: ["changed_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_histories_stock_id_fkey";
            columns: ["stock_id"];
            isOneToOne: false;
            referencedRelation: "stocks";
            referencedColumns: ["id"];
          },
        ];
      };
      stocks: {
        Row: {
          account_detail: string | null;
          account_details: string | null;
          admin_id: string | null;
          backup_code: string | null;
          booking_date: string | null;
          buyer_info: string | null;
          capital_price: number;
          category: string;
          created_at: string;
          current_price: number;
          id: string;
          images: string[] | null;
          internal_notes: string | null;
          login_info: string | null;
          managed_by: string | null;
          name: string;
          notes: string | null;
          password: string | null;
          password_info: string | null;
          payment_account_id: string | null;
          post_date: string | null;
          post_price: number;
          promo_price: number | null;
          purchase_date: string | null;
          purchase_payment_status: Database["public"]["Enums"]["purchase_payment_status"] | null;
          seller_info: string | null;
          sku: string | null;
          sold_date: string | null;
          status: Database["public"]["Enums"]["stock_status"];
          updated_at: string;
          username: string | null;
        };
        Insert: {
          account_detail?: string | null;
          account_details?: string | null;
          admin_id?: string | null;
          backup_code?: string | null;
          booking_date?: string | null;
          buyer_info?: string | null;
          capital_price?: number;
          category: string;
          created_at?: string;
          current_price?: number;
          id?: string;
          images?: string[] | null;
          internal_notes?: string | null;
          login_info?: string | null;
          managed_by?: string | null;
          name: string;
          notes?: string | null;
          password?: string | null;
          password_info?: string | null;
          payment_account_id?: string | null;
          post_date?: string | null;
          post_price?: number;
          promo_price?: number | null;
          purchase_date?: string | null;
          purchase_payment_status?: Database["public"]["Enums"]["purchase_payment_status"] | null;
          seller_info?: string | null;
          sku?: string | null;
          sold_date?: string | null;
          status?: Database["public"]["Enums"]["stock_status"];
          updated_at?: string;
          username?: string | null;
        };
        Update: {
          account_detail?: string | null;
          account_details?: string | null;
          admin_id?: string | null;
          backup_code?: string | null;
          booking_date?: string | null;
          buyer_info?: string | null;
          capital_price?: number;
          category?: string;
          created_at?: string;
          current_price?: number;
          id?: string;
          images?: string[] | null;
          internal_notes?: string | null;
          login_info?: string | null;
          managed_by?: string | null;
          name?: string;
          notes?: string | null;
          password?: string | null;
          password_info?: string | null;
          payment_account_id?: string | null;
          post_date?: string | null;
          post_price?: number;
          promo_price?: number | null;
          purchase_date?: string | null;
          purchase_payment_status?: Database["public"]["Enums"]["purchase_payment_status"] | null;
          seller_info?: string | null;
          sku?: string | null;
          sold_date?: string | null;
          status?: Database["public"]["Enums"]["stock_status"];
          updated_at?: string;
          username?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "stocks_admin_id_fkey";
            columns: ["admin_id"];
            isOneToOne: false;
            referencedRelation: "public_users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stocks_managed_by_fkey";
            columns: ["managed_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stocks_payment_account_id_fkey";
            columns: ["payment_account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      trade_in_items: {
        Row: {
          converted_to_stock_id: string | null;
          created_at: string;
          deal_id: string;
          description: string;
          estimated_value: number;
          id: string;
        };
        Insert: {
          converted_to_stock_id?: string | null;
          created_at?: string;
          deal_id: string;
          description: string;
          estimated_value: number;
          id?: string;
        };
        Update: {
          converted_to_stock_id?: string | null;
          created_at?: string;
          deal_id?: string;
          description?: string;
          estimated_value?: number;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "trade_in_items_converted_to_stock_id_fkey";
            columns: ["converted_to_stock_id"];
            isOneToOne: false;
            referencedRelation: "stocks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trade_in_items_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: {
          created_at: string;
          email: string;
          full_name: string;
          id: string;
          role_id: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          full_name: string;
          id: string;
          role_id?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          full_name?: string;
          id?: string;
          role_id?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "users_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      backfill_inventory_vectors: { Args: never; Returns: number };
      inventory_title_vector: {
        Args: { p_dim?: number; p_text: string };
        Returns: string;
      };
      is_admin: { Args: never; Returns: boolean };
      process_account_transfer: {
        Args: {
          p_admin_fee: number;
          p_admin_id: string;
          p_amount: number;
          p_dest_account_id: string;
          p_source_account_id: string;
        };
        Returns: undefined;
      };
      process_payment: {
        Args: {
          p_account_id: string;
          p_admin_id: string;
          p_amount: number;
          p_deal_id: string;
          p_notes: string;
        };
        Returns: undefined;
      };
      process_stock_purchase: {
        Args: {
          p_account_details: string;
          p_admin_id: string;
          p_capital_price: number;
          p_category: string;
          p_current_price: number;
          p_internal_notes: string;
          p_name: string;
          p_password: string;
          p_payment_account_id: string;
          p_post_price: number;
          p_purchase_payment_status: Database["public"]["Enums"]["purchase_payment_status"];
          p_seller_info: string;
          p_username: string;
        };
        Returns: string;
      };
      search_inventory: {
        Args: {
          game_slug_filter?: string;
          match_limit?: number;
          query_text: string;
        };
        Returns: {
          account_specs: string | null;
          added_by: string | null;
          asking_price: number;
          capital_price: number;
          created_at: string;
          game_id: string;
          id: string;
          image_urls: string[];
          screenshot_url: string | null;
          search_vector: unknown;
          sold_at: string | null;
          sold_price: number | null;
          status: Database["public"]["Enums"]["inventory_status"];
          title_reference: string | null;
          title_reference_vector: string | null;
          updated_at: string;
        }[];
        SetofOptions: {
          from: "*";
          to: "inventory";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
    };
    Enums: {
      deal_status:
        | "DRAFT"
        | "BOOKED"
        | "LIMITED_ACCESS"
        | "PAID"
        | "CANCELLED_BY_BUYER"
        | "CANCELLED_BY_SELLER"
        | "REFUND_PARTIAL"
        | "REFUND_FULL"
        | "PROBLEM"
        | "COMPLETED";
      inventory_status: "UNPOSTED" | "AVAILABLE" | "SOLD";
      ledger_transaction_type:
        | "PAYMENT_IN"
        | "PAYMENT_OUT"
        | "REFUND"
        | "CASHBACK"
        | "TRANSFER_IN"
        | "TRANSFER_OUT"
        | "STOCK_PURCHASE"
        | "ADJUSTMENT";
      payment_status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
      payment_type: "IN" | "OUT";
      purchase_payment_status: "LUNAS" | "PENDING";
      stock_status:
        | "AVAILABLE"
        | "BOOKED"
        | "LIMITED_ACCESS"
        | "SOLD"
        | "ON_HOLD"
        | "PROBLEM_ACTION"
        | "PROBLEM_PERMANENT"
        | "CANCELLED";
      user_role: "OWNER" | "ADMIN" | "VIEWER";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      deal_status: [
        "DRAFT",
        "BOOKED",
        "LIMITED_ACCESS",
        "PAID",
        "CANCELLED_BY_BUYER",
        "CANCELLED_BY_SELLER",
        "REFUND_PARTIAL",
        "REFUND_FULL",
        "PROBLEM",
        "COMPLETED",
      ],
      inventory_status: ["UNPOSTED", "AVAILABLE", "SOLD"],
      ledger_transaction_type: [
        "PAYMENT_IN",
        "PAYMENT_OUT",
        "REFUND",
        "CASHBACK",
        "TRANSFER_IN",
        "TRANSFER_OUT",
        "STOCK_PURCHASE",
        "ADJUSTMENT",
      ],
      payment_status: ["PENDING", "COMPLETED", "FAILED", "REFUNDED"],
      payment_type: ["IN", "OUT"],
      purchase_payment_status: ["LUNAS", "PENDING"],
      stock_status: [
        "AVAILABLE",
        "BOOKED",
        "LIMITED_ACCESS",
        "SOLD",
        "ON_HOLD",
        "PROBLEM_ACTION",
        "PROBLEM_PERMANENT",
        "CANCELLED",
      ],
      user_role: ["OWNER", "ADMIN", "VIEWER"],
    },
  },
} as const;
