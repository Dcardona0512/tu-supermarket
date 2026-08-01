export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
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
          order_number: number
          payment_method: string
          status: string
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
          order_number?: never
          payment_method?: string
          status?: string
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
          order_number?: never
          payment_method?: string
          status?: string
          total?: number
        }
        Relationships: []
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
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          product_id?: string | null
          product_name: string
          quantity: number
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_entries_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_stock: {
        Args: {
          p_product_id: string
          p_quantity: number
          p_expires_at?: string
        }
        Returns: {
          product_name: string
          new_stock: number
          expires_at: string | null
        }[]
      }
      cash_closing: {
        Args: { p_date?: string }
        Returns: Json
      }
      reset_demo: {
        Args: Record<string, never>
        Returns: Json
      }
      create_order: {
        Args: {
          p_customer_address: string
          p_customer_name: string
          p_customer_phone: string
          p_items: Json
          p_notes: string
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
