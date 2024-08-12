import { SupabaseClient } from "@supabase/supabase-js";

export const dbInsertConversation = async (
    supabase: SupabaseClient,
    data: IConversation,
) => {
    const { error } = await supabase.from("conversations").insert([data]);
    if (error) {
        throw error;
    }
};

// Function to get conversations of the last 7 days
export const dbGetConversation = async (
    supabase: SupabaseClient,
    userId: string,
) => {
    // Get the date 7 days ago from today
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Convert the date to ISO string for comparison
    const sevenDaysAgoISO = sevenDaysAgo.toISOString();

    // csort by created_at
    const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", userId)
        .eq("role", "user")
        .gte("created_at", sevenDaysAgoISO);
    // .order("created_at", { ascending: true });

    if (error) {
        throw error;
    }
    return data;
};

// Function to get conversations of the last 10 messages
export const dbGetRecentMessages = async (
    supabase: SupabaseClient,
    userId: string,
    toyId: string,
) => {
    const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", userId)
        .eq("toy_id", toyId)
        .order("created_at", { ascending: false })
        .limit(20);

    if (error) {
        throw error;
    }
    return data;
};
