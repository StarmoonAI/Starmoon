import { createUser, doesUserExist, getUserById } from "@/db/users";
import { getAllToys, getToyById } from "@/db/toys";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { User } from "@supabase/supabase-js";
import { dbGetRecentMessages } from "@/db/conversations";
import Playground from "../components/playground/PlaygroundComponent";
import { defaultToyId } from "@/lib/data";
import { getAllPersonalities } from "@/db/personalities";
import { createAccessToken } from "@/lib/utils";

export default async function Home() {
    const supabase = createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    if (user) {
        const userExists = await doesUserExist(supabase, user);
        if (!userExists) {
            // Create user if they don't exist
            await createUser(supabase, user, {
                toy_id: user?.user_metadata?.toy_id ?? defaultToyId,
            });
            redirect("/onboard");
        }
    }

    const dbUser = await getUserById(supabase, user!.id);
    const allToys = await getAllToys(supabase);
    const allPersonalities = await getAllPersonalities(supabase);

    // const accessToken =
    //     "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Imp1bnJ1eGlvbmdAZ21haWwuY29tIiwidXNlcl9pZCI6ImZkYWY1NWI2LTFkY2QtNDE0OC1iZDVjLTA0MDI0MDQxM2E0MiIsImNyZWF0ZWRfdGltZSI6IjIwMjQtMDktMDNUMTI6Mzg6NTIuNzAyNDUxIn0.91BWSMx69KdUIuS2lHmdnJu70J3Zu4fBpkMoGw4iOY8";

    const jwtSecretKey = process.env.JWT_SECRET_KEY || null;

    let accessToken = null;

    if (jwtSecretKey !== null) {
        accessToken = createAccessToken(jwtSecretKey, {
            user_id: user!.id,
            email: user!.email,
        });
    } else {
        console.error("JWT Secret Key is null");
    }

    if (!accessToken) {
        throw new Error();
    }

    return (
        <div className="">
            {dbUser && (
                <div className="">
                    <Playground
                        allPersonalities={allPersonalities}
                        selectedUser={dbUser}
                        allToys={allToys}
                        accessToken={accessToken}
                    />
                </div>
            )}
        </div>
    );
}
