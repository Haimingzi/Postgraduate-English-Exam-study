import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// 检查是否配置了真实的 Supabase 凭证
export const isSupabaseConfigured = 
  process.env.NEXT_PUBLIC_SUPABASE_URL && 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      history_records: {
        Row: {
          id: string
          user_id: string
          word_list: string
          article: string
          options: any
          options_detail: any
          annotations: any
          answers: any
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          word_list: string
          article: string
          options: any
          options_detail?: any
          annotations?: any
          answers?: any
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          word_list?: string
          article?: string
          options?: any
          options_detail?: any
          annotations?: any
          answers?: any
          created_at?: string
        }
      }
      word_cache: {
        Row: {
          id: string
          user_id: string
          word: string
          phonetic: string
          part_of_speech: string
          meaning: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          word: string
          phonetic: string
          part_of_speech: string
          meaning: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          word?: string
          phonetic?: string
          part_of_speech?: string
          meaning?: string
          created_at?: string
        }
      }
    }
  }
}
