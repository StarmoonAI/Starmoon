import Link from "next/link";
import { headers } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { SubmitButton } from "./submit-button";
import { FaGoogle } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
import Messages from "./messages";
import GoogleLoginButton from "../../components/GoogleLoginButton";

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
      return redirect("/login?message=Could not sign up user");
      // await signIn(formData);
    }

    return redirect("/login?message=Check email to continue sign in process");
  };

  const signInOrSignUp = async (formData: FormData) => {
    "use server";

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const supabase = createClient();

    // Try to sign in first
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // If sign in succeeds, redirect to home
    if (!signInError) {
      return redirect("/home");
    }

    // If sign in fails, try to sign up
    const origin = headers().get("origin");
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          toy_id: toy_id,
        },
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });

    if (signUpError) {
      return redirect("/login?message=Could not authenticate user");
    }

    if (process.env.NEXT_PUBLIC_ENV === "local") {
      return redirect("/login?message=Sussessfully signed up");
    } else {
      return redirect("/login?message=Check email to continue sign in process");
    }
  };

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-row gap-1 items-center">
            Start Playground
            <Sparkles size={20} fill="black" />
          </CardTitle>
          <CardDescription>
            Log into your Starmoon AI account to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {/* <ToyPreview /> */}

          {process.env.NEXT_PUBLIC_REDIRECT_URL && (
            <GoogleLoginButton toy_id={toy_id} />
          )}

          <Separator className="mt-4" />
          <form className="flex-1 flex flex-col w-full justify-center gap-4">
            <Label className="text-md" htmlFor="email">
              Email
            </Label>
            <input
              className="rounded-md px-4 py-2 bg-inherit border"
              name="email"
              placeholder="you@example.com"
              required
            />
            <Label className="text-md" htmlFor="email">
              Password
            </Label>

            <input
              className="rounded-md px-4 py-2 bg-inherit border"
              type="password"
              name="password"
              placeholder="••••••••"
              required
            />

            {process.env.NEXT_PUBLIC_ENV !== "local" && (
              <Link
                className="text-xs text-foreground underline"
                href="/forgot-password"
              >
                Forgot Password?
              </Link>
            )}
            <SubmitButton
              formAction={signInOrSignUp}
              className="text-sm font-medium bg-gray-100 hover:bg-gray-50 dark:text-stone-900 border-[0.1px] rounded-md px-4 py-2 text-foreground my-2"
              pendingText="Signing In..."
            >
              Continue with Email
            </SubmitButton>
            {searchParams?.message && (
              <p className="p-4 rounded-md border bg-green-50 border-green-400 text-gray-900 text-center text-sm">
                {searchParams.message}
              </p>
            )}
            {/* <Messages /> */}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
