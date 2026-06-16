/**
 * lib/supabase/database.types.ts
 *
 * Typescripts types that mirror Supabase schema.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      help_videos: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          title: string;
          slug: string;
          description: string | null;
          category: string;
          video_url: string;
          is_published: boolean;
          position: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          title: string;
          slug: string;
          description?: string | null;
          category: string;
          video_url: string;
          is_published?: boolean;
          position?: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          title?: string;
          slug?: string;
          description?: string | null;
          category?: string;
          video_url?: string;
          is_published?: boolean;
          position?: number;
        };
      };

      categories: {
        Row: {
          id: string;
          created_at: string;
          name: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export type HelpVideo = Database["public"]["Tables"]["help_videos"]["Row"];

export type HelpVideoInsert =
  Database["public"]["Tables"]["help_videos"]["Insert"];
