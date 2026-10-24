export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = "driver" | "owner"
export type BookingStatus =
  | "pending_payment"
  | "confirmed"
  | "checked_in"
  | "completed"
  | "cancelled"
export type PaymentStatus = "unpaid" | "paid" | "refunded"

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          phone: string | null
          role: UserRole
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          phone?: string | null
          role?: UserRole
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          phone?: string | null
          role?: UserRole
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      parking_spaces: {
        Row: {
          id: string
          owner_id: string
          title: string
          description: string | null
          address: string
          latitude: number
          longitude: number
          price_per_hour: number
          photo_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          title: string
          description?: string | null
          address: string
          latitude: number
          longitude: number
          price_per_hour: number
          photo_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          title?: string
          description?: string | null
          address?: string
          latitude?: number
          longitude?: number
          price_per_hour?: number
          photo_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      space_availability: {
        Row: {
          id: string
          space_id: string
          day_of_week: number
          start_time: string
          end_time: string
          created_at: string
        }
        Insert: {
          id?: string
          space_id: string
          day_of_week: number
          start_time: string
          end_time: string
          created_at?: string
        }
        Update: {
          id?: string
          space_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          created_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          space_id: string
          driver_id: string
          start_time: string
          end_time: string
          total_price: number
          status: BookingStatus
          payment_status: PaymentStatus
          otp_code: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          space_id: string
          driver_id: string
          start_time: string
          end_time: string
          total_price: number
          status?: BookingStatus
          payment_status?: PaymentStatus
          otp_code?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          space_id?: string
          driver_id?: string
          start_time?: string
          end_time?: string
          total_price?: number
          status?: BookingStatus
          payment_status?: PaymentStatus
          otp_code?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          booking_id: string
          space_id: string
          driver_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          space_id: string
          driver_id: string
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          space_id?: string
          driver_id?: string
          rating?: number
          comment?: string | null
          created_at?: string
        }
      }
    }
  }
}
