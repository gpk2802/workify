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
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          role: string;
          is_active: boolean;
          created_at: string;
          last_login: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          role?: string;
          is_active?: boolean;
          created_at?: string;
          last_login?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          role?: string;
          is_active?: boolean;
          created_at?: string;
          last_login?: string | null;
        };
      };
      profiles: {
        Row: {
          id: string;
          user_id: string;
          master_resume_text: string | null;
          skills: Json | null;
          education: Json | null;
          experience: Json | null;
          profile_hash: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          master_resume_text?: string | null;
          skills?: Json | null;
          education?: Json | null;
          experience?: Json | null;
          profile_hash?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          master_resume_text?: string | null;
          skills?: Json | null;
          education?: Json | null;
          experience?: Json | null;
          profile_hash?: string | null;
        };
      };
      intents: {
        Row: {
          id: string;
          user_id: string;
          roles: Json | null;
          dream_companies: Json | null;
          locations: Json | null;
          work_type: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          roles?: Json | null;
          dream_companies?: Json | null;
          locations?: Json | null;
          work_type?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          roles?: Json | null;
          dream_companies?: Json | null;
          locations?: Json | null;
          work_type?: string | null;
        };
      };
      jobs: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          company: string;
          description: string;
          status: string;
          user_submitted_url: string | null;
          job_description_text: string | null;
          job_parsed_meta: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          company: string;
          description: string;
          status?: string;
          user_submitted_url?: string | null;
          job_description_text?: string | null;
          job_parsed_meta?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          company?: string;
          description?: string;
          status?: string;
          user_submitted_url?: string | null;
          job_description_text?: string | null;
          job_parsed_meta?: Json | null;
          created_at?: string;
        };
      };
      tailors: {
        Row: {
          id: string;
          user_id: string;
          job_id: string;
          tailored_resume: string | null;
          cover_letter: string | null;
          portfolio: string | null;
          fit_score: number | null;
          token_usage: number | null;
          status: string;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          job_id: string;
          tailored_resume?: string | null;
          cover_letter?: string | null;
          portfolio?: string | null;
          fit_score?: number | null;
          token_usage?: number | null;
          status?: string;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          job_id?: string;
          tailored_resume?: string | null;
          cover_letter?: string | null;
          portfolio?: string | null;
          fit_score?: number | null;
          token_usage?: number | null;
          status?: string;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      applications: {
        Row: {
          id: string;
          user_id: string;
          job_id: string;
          tailor_id: string;
          status: string;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          job_id: string;
          tailor_id: string;
          status?: string;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          job_id?: string;
          tailor_id?: string;
          status?: string;
          created_at?: string;
          updated_at?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
};