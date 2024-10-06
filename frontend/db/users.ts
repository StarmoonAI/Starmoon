import { type SupabaseClient, type User } from "@supabase/supabase-js";

export const createUser = async (
    supabase: SupabaseClient,
    user: User,
    userProps: Partial<IUser>
) => {
    // console.log("creating user", user, userProps);

    //   return ;
    const { error } = await supabase.from("users").insert([
        {
            user_id: user.id,
            email: user.email,
            supervisor_name: user.user_metadata?.name ?? "",
            supervisee_name: "",
            supervisee_age: 16,
            supervisee_persona: "",
            toy_id: userProps.toy_id, // selecting default toy
            personality_id: userProps.personality_id, // selecting default personality
            most_recent_chat_group_id: null,
            modules: ["general_trivia"],
            session_time: 0,
            avatar_url:
                user.user_metadata?.avatar_url ??
                `/user_avatar/user_avatar_${Math.floor(Math.random() * 10)}.png`,
        } as IUser,
    ]);

    if (error) {
        // console.log("error", error);
    }
};

export const getUserById = async (supabase: SupabaseClient, id: string) => {
    const { data, error } = await supabase
        .from("users")
        .select("*, toy:toy_id(*), personality:personality_id(*)")
        .eq("user_id", id)
        .single();

    if (error) {
        // console.log("error", error);
    }

    return data as IUser | undefined;
};

export const updateUser = async (
    supabase: SupabaseClient,
    user: Partial<IUser>,
    userId: string
) => {
    const { error } = await supabase
        .from("users")
        .update(user)
        .eq("user_id", userId);

    if (error) {
        // console.log("error", error);
    }
};

export const doesUserExist = async (
    supabase: SupabaseClient,
    authUser: User
) => {
    const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", authUser.email)
        .single();

    if (error) {
        // console.log("error", error);
    }

    return !!user;
};
