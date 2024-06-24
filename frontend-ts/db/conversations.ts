import { SupabaseClient } from "@supabase/supabase-js";

export const dbInsertConversation = async (
    supabase: SupabaseClient,
    data: IConversation,
) => {
    await supabase.from("conversations").insert([data]);
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

    const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", userId)
        .gte("created_at", sevenDaysAgoISO);

    if (error) {
        throw error;
    }

    return data;
};
