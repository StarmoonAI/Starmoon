import ParentDashboard from "@/app/components/ParentDashboard";
import { getAllToys, getToyById } from "@/db/toys";
import { getUserById } from "@/db/users";
import { createClient } from "@/utils/supabase/server";

export default async function Home() {
    const supabase = createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const dbUser = user ? await getUserById(supabase, user.id) : null;
    const allToys = await getAllToys(supabase);

    return (
        <div className="pb-4 flex flex-col gap-2">
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
