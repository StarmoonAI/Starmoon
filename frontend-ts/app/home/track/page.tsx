import Charts from "@/app/components/Insights/Charts";
import { Badge } from "@/components/ui/badge";
import { getUserById } from "@/db/users";
import { defaultToyId } from "@/lib/data";
import { getAllToys, getToyById } from "@/db/toys";
import supabaseServerClient from "@/db/supabaseServerClient";

export default async function Home() {
    const supabase = supabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const dbUser = user ? await getUserById(supabase, user.id) : undefined;
    const toy = await getToyById(supabase, dbUser?.toy_id ?? defaultToyId);

    return (
        <div className="flex flex-col gap-2 font-baloo2">
            <div className="flex flex-row items-center gap-4">
                <h1 className="text-4xl font-semibold">Insights</h1>
                {/* <Badge variant="default">Coming soon</Badge> */}
            </div>

            <div className="">
                <Charts user={dbUser!} toy={toy!} filter="days" />
                {/* <Charts user={dbUser} selectedToy={null} filter="days" /> */}
            </div>
        </div>
    );
}
