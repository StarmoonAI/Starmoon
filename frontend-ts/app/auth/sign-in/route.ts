import { getToyById } from "@/db/toys";
import { defaultToyId } from "@/lib/data";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// export const dynamic = "force-dynamic";

export async function POST(request: Request) {
    const requestUrl = new URL(request.url);
    const formData = await request.formData();
    const email = String(formData.get("email"));
    const toy_id = String(formData.get("toy_id"));
    const supabase = createRouteHandlerClient({ cookies });

    // const { data, error } = await supabase.auth.signInWithOtp({
    //   email: 'example@email.com',
    //   options: {
    //     // set this to false if you do not want the user to be automatically signed up
    //     shouldCreateUser: false,
    //     emailRedirectTo: 'https://example.com/welcome',
    //   },
    // })

    const toy = await getToyById(supabase, toy_id);

    const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
            emailRedirectTo: `${requestUrl.origin}`,
            data: {
                toy_id: toy ? toy.toy_id : defaultToyId,
            },
        },
    });

    if (error) {
        return NextResponse.redirect(
            `${requestUrl.origin}/login?error=${error.message}&toy_id=${toy_id}`,
            {
                // a 301 status is required to redirect from a POST to a GET route
                status: 301,
            }
        );
    }

    return NextResponse.redirect(
        `${requestUrl.origin}/login?&toy_id=${toy_id}&message=Check email to continue sign in process`,
        {
            // a 301 status is required to redirect from a POST to a GET route
            status: 301,
        }
    );
}
