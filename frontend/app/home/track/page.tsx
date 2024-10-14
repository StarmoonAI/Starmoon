import Charts from "@/app/components/Insights/Charts";
import { getUserById } from "@/db/users";
import { createClient } from "@/utils/supabase/server";
import CreditsRemaining from "@/app/components/CreditsRemaining";
import HomePageSubtitles from "@/app/components/HomePageSubtitles";

export default async function Home() {
    const supabase = createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const dbUser = user ? await getUserById(supabase, user.id) : undefined;

    return (
        <div className="pb-12 flex flex-col gap-2">
            <div className="flex flex-row items-center gap-4">
                <h1 className="text-3xl font-normal">Trends and insights</h1>
            </div>
            {dbUser && <HomePageSubtitles user={dbUser} page="track" />}

            <Charts user={dbUser!} toy={dbUser?.toy!} filter="days" />
        </div>
    );
}
