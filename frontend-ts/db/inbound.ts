import { type SupabaseClient } from "@supabase/auth-helpers-nextjs";

export const createInbound = async (
    supabase: SupabaseClient,
    inbound: IInbound
) => {
    const { error } = await supabase
        .from("inbound")
        .insert([inbound as IInbound]);

    if (error) {
        console.log("error", error);
    }
};
