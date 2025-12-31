import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Wish = {
  id: string;
  content: string;
  author: string | null;
  created_at: string;
  burned_at: string | null;
  position_x: number;
  position_y: number;
};
