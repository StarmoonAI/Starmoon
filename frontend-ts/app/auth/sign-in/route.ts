import { getToyById } from "@/db/toys";
import { defaultToyId } from "@/lib/data";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import _ from "lodash";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

// export const dynamic = "force-dynamic";

export async function POST(request: Request) {
    // const headers = new Headers(request.headers);
    const origin = headers().get("origin");
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

    const toy = _.isEmpty(toy_id)
        ? undefined
        : await getToyById(supabase, toy_id as string);

    const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
            emailRedirectTo: `${origin}`,
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
        `${requestUrl.origin}/login?message=Check email to continue sign in process&toy_id=${toy_id}`,
        {
            // a 301 status is required to redirect from a POST to a GET route
            status: 301,
        }
    );
}
