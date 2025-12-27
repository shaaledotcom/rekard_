export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:9999",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
} as const;

