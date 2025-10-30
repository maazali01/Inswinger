export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'visitor' | 'user' | 'streamer' | 'admin';
export type StreamStatus = 'scheduled' | 'live' | 'ended' | 'recorded';
export type StreamVisibility = 'public' | 'private';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';
export type PaymentStatus = 'succeeded' | 'failed' | 'pending' | 'refunded';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: UserRole;
          avatar_url: string | null;
          stripe_customer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: UserRole;
          avatar_url?: string | null;
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: UserRole;
          avatar_url?: string | null;
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      subscription_plans: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price: number;
          currency: string;
          stripe_price_id: string | null;
          features: Json;
          max_concurrent_streams: number;
          max_storage_gb: number;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          price: number;
          currency?: string;
          stripe_price_id?: string | null;
          features?: Json;
          max_concurrent_streams?: number;
          max_storage_gb?: number;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          price?: number;
          currency?: string;
          stripe_price_id?: string | null;
          features?: Json;
          max_concurrent_streams?: number;
          max_storage_gb?: number;
          active?: boolean;
          created_at?: string;
        };
      };
      streamers: {
        Row: {
          id: string;
          profile_id: string;
          bio: string | null;
          verified: boolean;
          subscription_plan_id: string | null;
          stripe_subscription_id: string | null;
          subscription_status: SubscriptionStatus | null;
          subscription_started_at: string | null;
          subscription_ends_at: string | null;
          total_followers: number;
          total_views: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          bio?: string | null;
          verified?: boolean;
          subscription_plan_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_status?: SubscriptionStatus | null;
          subscription_started_at?: string | null;
          subscription_ends_at?: string | null;
          total_followers?: number;
          total_views?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          bio?: string | null;
          verified?: boolean;
          subscription_plan_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_status?: SubscriptionStatus | null;
          subscription_started_at?: string | null;
          subscription_ends_at?: string | null;
          total_followers?: number;
          total_views?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      streams: {
        Row: {
          id: string;
          streamer_id: string;
          title: string;
          slug: string;
          description: string | null;
          category: string;
          start_time: string | null;
          end_time: string | null;
          status: StreamStatus;
          visibility: StreamVisibility;
          subscription_required: boolean;
          recording_url: string | null;
          thumbnail_url: string | null;
          livepeer_stream_id: string | null;
          livepeer_playback_id: string | null;
          view_count: number;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          streamer_id: string;
          title: string;
          slug: string;
          description?: string | null;
          category: string;
          start_time?: string | null;
          end_time?: string | null;
          status?: StreamStatus;
          visibility?: StreamVisibility;
          subscription_required?: boolean;
          recording_url?: string | null;
          thumbnail_url?: string | null;
          livepeer_stream_id?: string | null;
          livepeer_playback_id?: string | null;
          view_count?: number;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          streamer_id?: string;
          title?: string;
          slug?: string;
          description?: string | null;
          category?: string;
          start_time?: string | null;
          end_time?: string | null;
          status?: StreamStatus;
          visibility?: StreamVisibility;
          subscription_required?: boolean;
          recording_url?: string | null;
          thumbnail_url?: string | null;
          livepeer_stream_id?: string | null;
          livepeer_playback_id?: string | null;
          view_count?: number;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      stream_analytics: {
        Row: {
          id: string;
          stream_id: string;
          date: string;
          total_views: number;
          unique_viewers: number;
          avg_watch_time_seconds: number;
          peak_concurrent_viewers: number;
          total_chat_messages: number;
          countries: Json;
          devices: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          stream_id: string;
          date: string;
          total_views?: number;
          unique_viewers?: number;
          avg_watch_time_seconds?: number;
          peak_concurrent_viewers?: number;
          total_chat_messages?: number;
          countries?: Json;
          devices?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          stream_id?: string;
          date?: string;
          total_views?: number;
          unique_viewers?: number;
          avg_watch_time_seconds?: number;
          peak_concurrent_viewers?: number;
          total_chat_messages?: number;
          countries?: Json;
          devices?: Json;
          created_at?: string;
        };
      };
      followers: {
        Row: {
          id: string;
          user_id: string;
          streamer_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          streamer_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          streamer_id?: string;
          created_at?: string;
        };
      };
      chats: {
        Row: {
          id: string;
          stream_id: string;
          user_id: string;
          message: string;
          moderated: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          stream_id: string;
          user_id: string;
          message: string;
          moderated?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          stream_id?: string;
          user_id?: string;
          message?: string;
          moderated?: boolean;
          created_at?: string;
        };
      };
      blogs: {
        Row: {
          id: string;
          slug: string;
          title: string;
          content: string;
          excerpt: string | null;
          author_id: string | null;
          featured_image: string | null;
          meta_description: string | null;
          canonical_url: string | null;
          tags: string[];
          categories: string[];
          published: boolean;
          published_at: string | null;
          view_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          content: string;
          excerpt?: string | null;
          author_id?: string | null;
          featured_image?: string | null;
          meta_description?: string | null;
          canonical_url?: string | null;
          tags?: string[];
          categories?: string[];
          published?: boolean;
          published_at?: string | null;
          view_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          content?: string;
          excerpt?: string | null;
          author_id?: string | null;
          featured_image?: string | null;
          meta_description?: string | null;
          canonical_url?: string | null;
          tags?: string[];
          categories?: string[];
          published?: boolean;
          published_at?: string | null;
          view_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          start_time: string;
          end_time: string | null;
          venue: string | null;
          sport_type: string;
          event_url: string | null;
          thumbnail_url: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          start_time: string;
          end_time?: string | null;
          venue?: string | null;
          sport_type: string;
          event_url?: string | null;
          thumbnail_url?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          start_time?: string;
          end_time?: string | null;
          venue?: string | null;
          sport_type?: string;
          event_url?: string | null;
          thumbnail_url?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          profile_id: string;
          stripe_payment_intent_id: string | null;
          amount: number;
          currency: string;
          status: PaymentStatus;
          description: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          stripe_payment_intent_id?: string | null;
          amount: number;
          currency?: string;
          status?: PaymentStatus;
          description?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          stripe_payment_intent_id?: string | null;
          amount?: number;
          currency?: string;
          status?: PaymentStatus;
          description?: string | null;
          metadata?: Json;
          created_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          profile_id: string;
          plan_id: string;
          status: SubscriptionStatus;
          stripe_subscription_id: string | null;
          current_period_start: string | null;
          current_period_end: string | null;
          canceled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          plan_id: string;
          status?: SubscriptionStatus;
          stripe_subscription_id?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          canceled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          plan_id?: string;
          status?: SubscriptionStatus;
          stripe_subscription_id?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          canceled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      watch_history: {
        Row: {
          id: string;
          user_id: string;
          stream_id: string;
          watch_time_seconds: number;
          last_position_seconds: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stream_id: string;
          watch_time_seconds?: number;
          last_position_seconds?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stream_id?: string;
          watch_time_seconds?: number;
          last_position_seconds?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      site_settings: {
        Row: {
          id: string;
          key: string;
          value: Json;
          description: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          value: Json;
          description?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          value?: Json;
          description?: string | null;
          updated_at?: string;
        };
      };
    };
  };
}
