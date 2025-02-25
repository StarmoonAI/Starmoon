import { defaultPersonalityId } from "@/lib/data";
import { SupabaseClient } from "@supabase/supabase-js";

export const getAllPersonalities = async (supabase: SupabaseClient) => {
    const { data, error } = await supabase.from("personalities").select(
        `
        personality_id,
        is_doctor,
        key,
        personalities_translations (
          personalities_translation_id,
          personality_key,
          title,
          subtitle,
          trait_short_description,
          language_code
        )
        `,
    );
    if (error) {
        console.log("error getAllPersonalities", error);
        return [];
    }

    return data as IPersonality[];
};
