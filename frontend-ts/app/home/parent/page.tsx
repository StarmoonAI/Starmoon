import ParentDashboard from "@/app/components/ParentDashboard";
import supabaseServerClient from "@/db/supabaseServerClient";
import { getAllToys, getToyById } from "@/db/toys";
import { getUserById } from "@/db/users";

export default async function Home() {
    const supabase = supabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const dbUser = user ? await getUserById(supabase, user.id) : null;
    const allToys = await getAllToys(supabase);

    return (
        <div className="flex flex-col gap-2">
            {dbUser && (
                <ParentDashboard
                    selectedUser={dbUser}
                    selectedToy={dbUser.toy!}
                    allToys={allToys}
                />
            )}
        </div>
    );
}
