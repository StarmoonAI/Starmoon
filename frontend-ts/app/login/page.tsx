import { Button } from "@/components/ui/button";
import Messages from "./messages";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import ToyPreview from "../components/ToyPreview";
import supabaseServerClient from "@/db/supabaseServerClient";
import { getToyById } from "@/db/toys";
import { defaultToyId } from "@/lib/data";
import { Separator } from "@/components/ui/separator";
import GoogleOAuth from "@/app/components/GoogleOAuth";

export const dynamic = "force-dynamic";

export default async function Login({
    params,
    searchParams,
}: {
    params: { slug: string };
    searchParams?: { [key: string]: string | string[] | undefined };
}) {
    const supabase = supabaseServerClient();
    const toy_id = searchParams?.toy_id;
    const toy = await getToyById(supabase, (toy_id ?? defaultToyId) as string);

    return (
        <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2">
            <Card>
                <CardHeader>
                    <CardTitle className="flex flex-row gap-1 items-center">
                        Log In / Sign Up to Parakeet AI
                        <Sparkles size={20} fill="black" />
                    </CardTitle>
                    <CardDescription>
                        Log into your Parakeet AI account to continue.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    {/* <ToyPreview /> */}
                    {toy && toy_id ? (
                        <div className="flex flex-col items-center gap-2 mx-auto font-quicksand">
                            <Image
                                src={"/" + toy.image_src + ".png"}
                                width={100}
                                height={100}
                                alt={toy.name}
                            />
                            <p className="font-medium">
                                You picked{" "}
                                <span className="font-semibold">
                                    {toy.name}
                                </span>
                            </p>
                        </div>
                    ) : null}
                    <GoogleOAuth />
                    <Separator />
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
                {/* <CardFooter>
                    <p className="text-sm">
                        By signing up, you agree to our{" "}
                        <a href="/terms" className="underline">
                            Terms of Service
                        </a>{" "}
                        and{" "}
                        <a href="/privacy" className="underline">
                            Privacy Policy
                        </a>
                        .
                    </p>
                </CardFooter> */}
            </Card>
        </div>
    );
}
