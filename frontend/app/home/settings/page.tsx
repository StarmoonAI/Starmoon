import SettingsDashboard from "@/app/components/SettingsDashboard";
import { getUserById } from "@/db/users";
import { createAccessToken } from "@/lib/utils";
import { createClient } from "@/utils/supabase/server";

export default async function Home() {
    const supabase = createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const dbUser = user ? await getUserById(supabase, user.id) : null;
    const accessToken = createAccessToken(process.env.JWT_SECRET_KEY!, {
        user_id: user!.id,
        email: user!.email,
    });
    return (
        <div className="pb-4 flex flex-col gap-2">
            {dbUser && (
                <SettingsDashboard
                    selectedUser={dbUser}
                    accessToken={accessToken}
                />
            )}
        </div>
    );
}
