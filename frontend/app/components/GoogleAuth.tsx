"use client";
import { createClient } from "@/utils/supabase/client";

export const loginWithGoogle = async (toy_id?: string) => {
  const supabase = createClient();

  const redirectTo =
    process.env.NEXT_PUBLIC_REDIRECT_URL || `${location.origin}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
    },
  });
};
