import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Prevent crashes if the user provides an invalid URL in the environment variables
const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return url.startsWith('http://') || url.startsWith('https://');
  } catch (e) {
    return false;
  }
};

export const supabase = (supabaseUrl && isValidUrl(supabaseUrl)) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null as any;
