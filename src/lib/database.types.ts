// Generado desde el esquema de Supabase, con dos ajustes hechos a mano que hay
// que volver a aplicar si se regenera:
//
//  1. `store_id` es opcional en los Insert. En la base es NOT NULL, pero lo
//     rellena el trigger `set_store_id` con la tienda del usuario, así que el
//     código no tiene que pasarlo.
//  2. El bloque "Alias de conveniencia" del final no lo genera Supabase.

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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_id: string | null
          store_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          store_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          store_id: string
          subtotal: number
          unit_cost: number
          unit_price: number
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          store_id?: string
          subtotal: number
          unit_cost?: number
          unit_price: number
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          store_id?: string
          subtotal?: number
          unit_cost?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount_received: number | null
          channel: string
          created_at: string
          customer_address: string | null
          customer_name: string | null
          customer_phone: string | null
          delivered_at: string | null
          delivery_fee: number
          id: string
          notes: string | null
          order_number: number | null
          payment_method: string
          status: string
          store_id: string
          total: number
        }
        Insert: {
          amount_received?: number | null
          channel?: string
          created_at?: string
          customer_address?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivered_at?: string | null
          delivery_fee?: number
          id?: string
          notes?: string | null
          order_number?: number | null
          payment_method?: string
          status?: string
          store_id?: string
          total?: number
        }
        Update: {
          amount_received?: number | null
          channel?: string
          created_at?: string
          customer_address?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivered_at?: string | null
          delivery_fee?: number
          id?: string
          notes?: string | null
          order_number?: number | null
          payment_method?: string
          status?: string
          store_id?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          brand: string | null
          category_id: string | null
          cost_price: number
          created_at: string
          description: string | null
          discount_price: number | null
          expires_at: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          price: number
          stock: number
          store_id: string
          unit: string
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          brand?: string | null
          category_id?: string | null
          cost_price?: number
          created_at?: string
          description?: string | null
          discount_price?: number | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          price: number
          stock?: number
          store_id?: string
          unit?: string
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          brand?: string | null
          category_id?: string | null
          cost_price?: number
          created_at?: string
          description?: string | null
          discount_price?: number | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          price?: number
          stock?: number
          store_id?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_entries: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          product_id: string | null
          product_name: string
          quantity: number
          store_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          product_id?: string | null
          product_name: string
          quantity: number
          store_id?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_entries_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_entries_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_admins: {
        Row: { created_at: string; user_id: string }
        Insert: { created_at?: string; user_id: string }
        Update: { created_at?: string; user_id?: string }
        Relationships: []
      }
      store_invites: {
        Row: {
          code: string
          created_at: string
          created_by: string
          email: string | null
          expires_at: string
          id: string
          slug: string
          store_name: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by: string
          email?: string | null
          expires_at?: string
          id?: string
          slug: string
          store_name: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          email?: string | null
          expires_at?: string
          id?: string
          slug?: string
          store_name?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      stores: {
        Row: {
          address: string | null
          brand_color: string
          created_at: string
          delivery_fee: number
          id: string
          is_published: boolean
          logo_url: string | null
          name: string
          owner_id: string
          phone: string | null
          slug: string
          tagline: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          brand_color?: string
          created_at?: string
          delivery_fee?: number
          id?: string
          is_published?: boolean
          logo_url?: string | null
          name: string
          owner_id: string
          phone?: string | null
          slug: string
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          brand_color?: string
          created_at?: string
          delivery_fee?: number
          id?: string
          is_published?: boolean
          logo_url?: string | null
          name?: string
          owner_id?: string
          phone?: string | null
          slug?: string
          tagline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_stock: {
        Args: {
          p_expires_at?: string
          p_product_id: string
          p_quantity: number
        }
        Returns: {
          expires_at: string
          new_stock: number
          product_name: string
        }[]
      }
      cash_closing: { Args: { p_date?: string }; Returns: Json }
      canjear_invitacion: { Args: { p_code: string }; Returns: Json }
      generar_codigo_invitacion: { Args: Record<string, never>; Returns: string }
      is_platform_admin: { Args: Record<string, never>; Returns: boolean }
      my_store_id: { Args: Record<string, never>; Returns: string }
      create_order: {
        Args: {
          p_customer_address: string
          p_customer_name: string
          p_customer_phone: string
          p_items: Json
          p_notes: string
          p_store_id: string
        }
        Returns: {
          order_id: string
          order_number: number
        }[]
      }
      create_pos_sale: {
        Args: {
          p_amount_received?: number
          p_customer_name?: string
          p_items: Json
          p_payment_method?: string
        }
        Returns: {
          order_id: string
          order_number: number
          total: number
        }[]
      }
      get_order_public: { Args: { p_order_id: string }; Returns: Json }
      next_order_number: { Args: { p_store_id: string }; Returns: number }
      seed_store_catalog: { Args: { p_store_id: string }; Returns: Json }
      sales_report: {
        Args: { p_from?: string; p_granularity?: string; p_to?: string }
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

// --- Alias de conveniencia ---
export type Category = Database["public"]["Tables"]["categories"]["Row"]
export type Product = Database["public"]["Tables"]["products"]["Row"]
export type Order = Database["public"]["Tables"]["orders"]["Row"]
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"]
export type Store = Database["public"]["Tables"]["stores"]["Row"]

export type OrderStatus = "pendiente" | "entregado" | "cancelado"

// --- Informe de ventas (RPC sales_report) ---
export type ReportGranularity = "day" | "week" | "month"

export type ReportPoint = {
  bucket: string // YYYY-MM-DD (inicio del periodo)
  revenue: number
  cost: number
  profit: number
  orders: number
}

export type ReportTotals = {
  /** Solo productos: el domicilio no cuenta como venta del supermercado */
  revenue: number
  cost: number
  profit: number
  orders: number
  units: number
  /** Domicilios cobrados en el periodo, aparte de las ventas */
  delivery: number
  avg_ticket: number
}

export type ReportTopProduct = {
  name: string
  quantity: number
  revenue: number
  profit: number
}

export type ReportChannelStats = { revenue: number; orders: number }

export type SalesReport = {
  granularity: ReportGranularity
  from: string
  to: string
  series: ReportPoint[]
  totals: ReportTotals
  /** Ventas separadas por origen: "linea" (web) y "tienda" (caja) */
  by_channel: Partial<Record<SalesChannel, ReportChannelStats>>
  top_products: ReportTopProduct[]
}

/** Origen de la venta */
export type SalesChannel = "linea" | "tienda"

/** Cómo paga el cliente */
export type PaymentMethod = "efectivo" | "transferencia"

export type StockEntry = Database["public"]["Tables"]["stock_entries"]["Row"]

// --- Cierre de caja (RPC cash_closing) ---
export type CashClosingSale = {
  order_number: number
  channel: SalesChannel
  payment_method: string
  customer_name: string | null
  /** Venta sin el domicilio */
  total: number
  delivery_fee: number
  delivered_at: string
}

export type CashClosing = {
  date: string
  totals: {
    /** Solo productos: el domicilio no entra en la caja */
    revenue: number
    orders: number
    cash: number
    transfer: number
    /** Domicilios cobrados, informativo */
    delivery: number
  }
  by_payment: Record<string, { revenue: number; orders: number }>
  by_channel: Partial<Record<SalesChannel, { revenue: number; orders: number }>>
  sales: CashClosingSale[]
}
