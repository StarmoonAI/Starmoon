"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import { FaGoogle } from "react-icons/fa";
import { getBaseUrl } from "@/lib/utils";
import { defaultToyId } from "@/lib/data";

interface GoogleOAuthProps {
    toy_id?: string;
}

const GoogleOAuth: React.FC<GoogleOAuthProps> = ({ toy_id }) => {
    const supabase = createClientComponentClient();
    // console.log(new URL(getBaseUrl() + "/home").href);

    console.log("toy_id", toy_id);

    const googleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                // queryParams: {
                //     access_type: "offline",
                //     prompt: "consent",
                // },
                // redirectTo: new URL(getBaseUrl() + "/auth/callback").href,
                redirectTo: `${location.origin}/auth/callback`,
                queryParams: {
                    toy_id: toy_id ?? defaultToyId,
                },
            },
        });
    };

    return (
        <Button variant="default" onClick={googleLogin}>
            <FaGoogle className="w-4 h-4 mr-4" />
            <span>Continue with Google</span>
        </Button>
    );
};

export default GoogleOAuth;
