import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tiubtvqmqkvlkscczesz.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_eiUOZFgv-YJwE1i1NW-BQg_ZVELgroG';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
