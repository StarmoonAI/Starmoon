import { SupabaseClient } from "@supabase/supabase-js";

export const getToyById = async (supabase: SupabaseClient, toy_id: string) => {
  const { data, error } = await supabase
    .from("toys")
    .select("*")
    .eq("toy_id", toy_id)
    .single();

  if (error) {
    console.log("error", error);
  }

  return data as IToy | undefined;
};

export const getToyByName = async (supabase: SupabaseClient, name: string) => {
  const { data, error } = await supabase
    .from("toys")
    .select("*")
    .eq("name", name)
    .single();

  if (error) {
    console.log("error", error);
  }

  return data as IToy | undefined;
};

export const getAllToys = async (supabase: SupabaseClient) => {
  const { data, error } = await supabase
    .from("toys")
    .select("*")
    .neq("image_src", "");

  if (error) {
    console.log("error", error);
  }

  return data as IToy[];
};
