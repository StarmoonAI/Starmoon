import { getHumeAccessToken } from "@/lib/getHumeAccessToken";
import Playground from "../components/Playground";
import supabaseServerClient from "@/db/supabaseServerClient";
import { getUserById } from "@/db/users";
import { getToyById } from "@/db/toys";
import { redirect } from "next/navigation";
import { User } from "@supabase/auth-helpers-nextjs";

async function getData(user: User) {
    const supabase = supabaseServerClient();
    const dbUser = await getUserById(supabase, user!.id);
    // The return value is *not* serialized
    // You can return Date, Map, Set, etc.

    if (!dbUser) {
        // This will activate the closest `error.js` Error Boundary
        throw new Error("Failed to fetch data");
    }

    return dbUser;
}

export default async function Home() {
    const supabase = supabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const dbUser = await getData(user);
    const accessToken = await getHumeAccessToken();

    if (!accessToken) {
        throw new Error();
    }

    return (
        <div className="flex flex-col gap-2 font-baloo2">
            {dbUser && (
                <Playground
                    accessToken={accessToken}
                    selectedUser={dbUser}
                    selectedToy={dbUser.toy!}
                />
            )}
        </div>
    );
}
