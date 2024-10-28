import { defaultPersonalityId } from "@/lib/data";
import { SupabaseClient } from "@supabase/supabase-js";

export const getAllPersonalities = async (supabase: SupabaseClient) => {
    const { data, error } = await supabase.from("personalities").select("*");

    if (error) {
        // console.log("error getAllPersonalities", error);
        return [];
    }

    // Filter out the default personality
    const defaultPersonality = data.find(
        (personality: IPersonality) =>
            personality.personality_id === defaultPersonalityId
    );
    const otherPersonalities = data.filter(
        (personality: IPersonality) =>
            personality.personality_id !== defaultPersonalityId
    );

    // Place the default personality at the 0th index
    const sortedData = defaultPersonality
        ? [defaultPersonality, ...otherPersonalities]
        : otherPersonalities;

    return sortedData as IPersonality[];
};
