// TypeScript types for Supabase tables
// Matches database schema after migration

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          role_id: string
          permissions: string[] | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          phone?: string | null
          role_id: string
          permissions?: string[] | null
          is_active?: boolean
        }
        Update: {
          full_name?: string | null
          phone?: string | null
          role_id?: string
          permissions?: string[] | null
          is_active?: boolean
        }
      }

      categories: {
        Row: {
          id: string
          name: string
          slug: string
          parent_id: string | null
          description: string | null
          image: string | null
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          parent_id?: string | null
          description?: string | null
          image?: string | null
          display_order?: number
        }
        Update: {
          name?: string
          slug?: string
          parent_id?: string | null
          description?: string | null
          image?: string | null
          display_order?: number
        }
      }
      products: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          subtitle: string | null
          price: number | null
          image: string | null
          category_id: string | null
          stock: number
          status: string
          is_clearance: boolean
          low_stock_threshold: number
          assigned_code: string | null
          material: string | null
          size: string | null
          finish: string | null
          thickness: string | null
          sqm_per_box: string | null
          application_area: string | null
          package_included: string | null
          has_led: boolean | null
          brand: string | null
          availability: string | null
          panel_length: string | null
          panel_width: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          subtitle?: string | null
          price?: number | null
          image?: string | null
          category_id?: string | null
          stock?: number
          status?: string
          is_clearance?: boolean
          low_stock_threshold?: number
          assigned_code?: string | null
          material?: string | null
          size?: string | null
          finish?: string | null
          thickness?: string | null
          sqm_per_box?: string | null
          application_area?: string | null
          package_included?: string | null
          has_led?: boolean | null
          brand?: string | null
          availability?: string | null
          panel_length?: string | null
          panel_width?: string | null
        }
        Update: {
          name?: string
          slug?: string
          description?: string | null
          subtitle?: string | null
          price?: number | null
          image?: string | null
          category_id?: string | null
          stock?: number
          status?: string
          is_clearance?: boolean
          low_stock_threshold?: number
          assigned_code?: string | null
          material?: string | null
          size?: string | null
          finish?: string | null
          thickness?: string | null
          sqm_per_box?: string | null
          application_area?: string | null
          package_included?: string | null
          has_led?: boolean | null
          brand?: string | null
          availability?: string | null
          panel_length?: string | null
          panel_width?: string | null
        }
      }
      orders: {
        Row: {
          id: string
          order_number: string
          user_id: string | null
          customer_id: string
          customer_name: string
          customer_email: string
          customer_phone: string | null
          subtotal: number
          tax: number
          shipping_fee: number
          discount: number
          total: number
          payment_method: string | null
          payment_status: string
          paid_amount: number
          status: string
          delivery_address: Record<string, unknown>
          items: Record<string, unknown>[]
          status_history: Record<string, unknown>[]
          coupon_code: string | null
          invoice_file_id: string | null
          source: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number: string
          user_id?: string | null
          customer_id: string
          customer_name: string
          customer_email: string
          customer_phone?: string | null
          subtotal: number
          tax?: number
          shipping_fee?: number
          discount?: number
          total: number
          payment_method?: string | null
          payment_status?: string
          paid_amount?: number
          status?: string
          delivery_address: Record<string, unknown>
          items: Record<string, unknown>[]
          status_history?: Record<string, unknown>[]
          coupon_code?: string | null
          invoice_file_id?: string | null
          source?: string | null
        }
        Update: {
          status?: string
          payment_status?: string
          paid_amount?: number
          updated_at?: string
        }
      }
      customer_addresses: {
        Row: {
          id: string
          user_id: string
          label: string | null
          full_name: string
          phone: string
          street: string
          city: string
          state: string
          pincode: string
          country: string | null
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          label?: string | null
          full_name: string
          phone: string
          street: string
          city: string
          state: string
          pincode: string
          country?: string | null
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          label?: string | null
          full_name?: string
          phone?: string
          street?: string
          city?: string
          state?: string
          pincode?: string
          country?: string | null
          is_default?: boolean
          updated_at?: string
        }
      }
      wishlist_items: {
        Row: {
          id: string
          user_id: string
          product_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          created_at?: string
        }
        Update: {
          product_id?: string
        }
      }
      cart_items: {
        Row: {
          id: string
          user_id: string
          product_id: string
          variant_id: string | null
          product_name: string
          product_price: number
          product_image: string | null
          quantity: number
          reserved_until: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          variant_id?: string | null
          product_name: string
          product_price: number
          product_image?: string | null
          quantity?: number
          reserved_until?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          quantity?: number
          updated_at?: string
        }
      }
      coupons: {
        Row: {
          id: string
          code: string
          description: string | null
          discount_type: 'percentage' | 'fixed'
          discount_value: number
          min_order_value: number | null
          usage_limit: number | null
          used_count: number
          expires_at: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          description?: string | null
          discount_type: 'percentage' | 'fixed'
          discount_value: number
          min_order_value?: number | null
          usage_limit?: number | null
          used_count?: number
          expires_at?: string | null
          status?: string
        }
        Update: {
          code?: string
          description?: string | null
          discount_type?: 'percentage' | 'fixed'
          discount_value?: number
          min_order_value?: number | null
          usage_limit?: number | null
          used_count?: number
          expires_at?: string | null
          status?: string
        }
      }
      roles: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
        }
        Update: {
          name?: string
          description?: string | null
        }
      }
      product_images: {
        Row: {
          id: string
          product_id: string
          image_url: string | null
          display_order: number
          is_primary: boolean
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          image_url?: string | null
          display_order?: number
          is_primary?: boolean
        }
        Update: {
          image_url?: string | null
          display_order?: number
          is_primary?: boolean
        }
      }

      reviews: {
        Row: {
          id: string
          product_id: string
          customer_id: string
          rating: number
          comment: string | null
          status: 'pending' | 'published' | 'rejected'
          admin_response: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          customer_id: string
          rating: number
          comment?: string | null
          status?: 'pending' | 'published' | 'rejected'
          admin_response?: string | null
        }
        Update: {
          rating?: number
          comment?: string | null
          status?: 'pending' | 'published' | 'rejected'
          admin_response?: string | null
        }
      }

      site_settings: {
        Row: {
          id: number
          store_name: string
          store_email: string
          store_phone: string
          store_address: string
          currency_symbol: string
          tax_rate: number
          free_shipping_threshold: number
          email_on_new_orders: boolean
          low_stock_alerts: boolean
          customer_reviews_notifications: boolean
          updated_at: string
        }
        Insert: {
          id?: number
          store_name?: string
          store_email?: string
          store_phone?: string
          store_address?: string
          currency_symbol?: string
          tax_rate?: number
          free_shipping_threshold?: number
          email_on_new_orders?: boolean
          low_stock_alerts?: boolean
          customer_reviews_notifications?: boolean
          updated_at?: string
        }
        Update: {
          store_name?: string
          store_email?: string
          store_phone?: string
          store_address?: string
          currency_symbol?: string
          tax_rate?: number
          free_shipping_threshold?: number
          email_on_new_orders?: boolean
          low_stock_alerts?: boolean
          customer_reviews_notifications?: boolean
          updated_at?: string
        }
      }

      newsletter_subscriptions: {
        Row: {
          id: string
          email: string
          name: string | null
          status: string
          subscribed_at: string
          unsubscribed_at: string | null
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          status?: string
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Update: {
          name?: string | null
          status?: string
          unsubscribed_at?: string | null
        }
      }
    }
  }
}

// Helper types
export type Category = Database['public']['Tables']['categories']['Row'] & {
  children?: Category[]
}
export type Product = Database['public']['Tables']['products']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type Coupon = Database['public']['Tables']['coupons']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Review = Database['public']['Tables']['reviews']['Row']
export type NewsletterSubscription = Database['public']['Tables']['newsletter_subscriptions']['Row']
