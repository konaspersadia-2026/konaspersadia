import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Handle if user only inputs the project ID instead of the full URL
const supabaseUrl = rawUrl.startsWith('http') 
  ? rawUrl 
  : (rawUrl ? `https://${rawUrl}.supabase.co` : 'https://placeholder.supabase.co');
  
const supabaseAnonKey = rawKey ? rawKey : 'placeholder';

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
