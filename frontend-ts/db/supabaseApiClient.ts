// supabaseClient.ts
import { Database } from "@/db/supabase";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const privateKey = process.env.SUPABASE_ANON_KEY;
if (!privateKey) throw new Error(`Missing SUPABASE_ANON_KEY`);

const url = process.env.SUPABASE_URL;
if (!url) throw new Error(`Missing SUPABASE_URL`);

const supabaseClient: SupabaseClient<Database, "public", any> =
    createClient<Database>(url, privateKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false,
        },
    });

export default supabaseClient;
