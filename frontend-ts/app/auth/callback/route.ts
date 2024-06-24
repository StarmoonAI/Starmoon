// import { sendWelcomeEmail } from "@/lib/sendgridEmailClient";
import { createUser, doesUserExist } from "@/db/users";
import { Database } from "@/db/supabase";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import type { NextRequest } from "next/server";
import { defaultToyId } from "@/lib/data";

// export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const queryParamsToyId = requestUrl.searchParams.get("toy_id");
    const next = requestUrl.searchParams.get("next") ?? "/";

    console.log("foobaz", requestUrl.searchParams);

    if (code) {
        const supabase = createRouteHandlerClient<Database>({ cookies });
        await supabase.auth.exchangeCodeForSession(code);

        const {
            data: { user },
        } = await supabase.auth.getUser();

        console.log("fooblar", user);

        if (user) {
            const userExists = await doesUserExist(supabase, user);
            if (!userExists) {
                // Create user if they don't exist
                await createUser(supabase, user, {
                    toy_id:
                        user?.user_metadata?.toy_id ??
                        queryParamsToyId ??
                        defaultToyId,
                });

                console.log("new user", user.email);

                // // Send welcome email to new user
                // user.email && (await sendWelcomeEmail(user.email));

                // Redirect to home page after user is created
                return NextResponse.redirect(`${requestUrl.origin}/home`);
            }
        }
    }

    // URL to redirect to after sign in process completes
    return NextResponse.redirect(`${requestUrl.origin}/home`);
}
