import supabaseServerClient from "@/db/supabaseServerClient";
import Onboard from "../components/Onboard";
import { getUserById } from "@/db/users";

export default async function Home() {
    const supabase = supabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const dbUser = user ? await getUserById(supabase, user.id) : undefined;

    return (
        <div className="flex flex-col gap-2 font-quicksand">
            {dbUser && <Onboard selectedUser={dbUser} />}
        </div>
    );
}
