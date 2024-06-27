import Link from "next/link";
import { headers } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { SubmitButton } from "./submit-button";
import { loginWithGoogle } from "@/app/components/GoogleAuth";
import { FaGoogle } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import _ from "lodash";
import { getToyById } from "@/db/toys";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { Label } from "@/components/ui/label";
import { createUser, doesUserExist } from "@/db/users";
import GoogleLoginButton from "../components/GoogleLoginButton";
import Messages from "./messages";

interface LoginProps {
    searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function Login({ searchParams }: LoginProps) {
    const toy_id = searchParams?.toy_id as string | undefined;
    console.log("+++++", toy_id);

    const signIn = async (formData: FormData) => {
        "use server";

        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const supabase = createClient();

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return redirect("/login?message=Could not authenticate user");
        }

        return redirect("/home");
    };

    const signUp = async (formData: FormData) => {
        "use server";

        const origin = headers().get("origin");
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const supabase = createClient();

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    toy_id: toy_id,
                },
                emailRedirectTo: `${origin}/auth/callback`,
            },
        });

        if (error) {
            return redirect("/login?message=Could not authenticate user");
        }

        return redirect(
            "/login?message=Check email to continue sign in process"
        );
    };

    return (
        <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2">
            <Card>
                <CardHeader>
                    <CardTitle className="flex flex-row gap-1 items-center">
                        Log In / Sign Up to Starmoon AI
                        <Sparkles size={20} fill="black" />
                    </CardTitle>
                    <CardDescription>
                        Log into your Starmoon AI account to continue.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    {/* <ToyPreview /> */}
                    <GoogleLoginButton toy_id={toy_id} />
                    <Separator className="mt-4" />
                    <form
                        className="flex-1 flex flex-col w-full justify-center gap-4"
                        action="/auth/sign-in"
                        method="post"
                    >
                        <Label className="text-md" htmlFor="email">
                            Email
                        </Label>
                        <input
                            className="rounded-md px-4 py-2 bg-inherit border"
                            name="email"
                            placeholder="you@example.com"
                            required
                        />
                        <input
                            type="hidden"
                            name="toy_id"
                            value={toy_id ?? ("" as string)}
                        />
                        <Button variant="secondary">Continue with email</Button>
                        <Messages />
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
