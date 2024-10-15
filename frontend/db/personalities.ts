import { defaultPersonalityId } from "@/lib/data";
import { SupabaseClient } from "@supabase/supabase-js";

export interface IPersonality {
  personality_id: string;
  // Add other properties of IPersonality here
}

export const getAllPersonalities = async (supabase: SupabaseClient): Promise<IPersonality[]> => {
  try {
    const { data, error } = await supabase.from("personalities").select("*");

    if (error) {
      console.error("Error in getAllPersonalities:", error);
      return [];
    }

    if (!data || !Array.isArray(data)) {
      console.warn("No data returned from personalities table");
      return [];
    }

    // Use reduce for a single pass through the array
    const { defaultPersonality, otherPersonalities } = data.reduce<{
      defaultPersonality: IPersonality | null;
      otherPersonalities: IPersonality[];
    }>(
      (acc, personality: IPersonality) => {
        if (personality.personality_id === defaultPersonalityId) {
          acc.defaultPersonality = personality;
        } else {
          acc.otherPersonalities.push(personality);
        }
        return acc;
      },
      { defaultPersonality: null, otherPersonalities: [] }
    );

    // Place the default personality at the 0th index if it exists
    return defaultPersonality
      ? [defaultPersonality, ...otherPersonalities]
      : otherPersonalities;
  } catch (err) {
    console.error("Unexpected error in getAllPersonalities:", err);
    return [];
  }
};
