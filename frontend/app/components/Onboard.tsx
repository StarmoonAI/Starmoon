"use client";

import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { updateUser } from "@/db/users";
import { getCreditsRemaining } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
    userFormAgeDescription,
    userFormAgeLabel,
    userFormNameLabel,
    userFormPersonaLabel,
    userFormPersonaPlaceholder,
} from "@/lib/data";

interface OnboardProps {
    selectedUser: IUser;
}

export const settingsDashboardSchema = z.object({
    supervisee_name: z.string().min(1).max(50),
    supervisee_age: z.number().min(1).max(18),
    supervisee_persona: z.string().max(500).optional(),
    modules: z
        .array(z.enum(["math", "science", "spelling", "general_trivia"]))
        .refine((value) => value.some((item) => item), {
            message: "You have to select at least one item.",
        }),
});

const learningModules = [
    {
        id: "math",
        label: "Math",
    },
    {
        id: "science",
        label: "Science",
    },
    {
        id: "spelling",
        label: "Spelling",
    },
    {
        id: "general_trivia",
        label: "General trivia",
    },
] as { id: Module; label: string }[];

export type SettingsFormInput = z.infer<typeof settingsDashboardSchema>;

const Onboard: React.FC<OnboardProps> = ({ selectedUser }) => {
    const [progress, setProgress] = React.useState(40);
    const supabase = createClient();
    const { toast } = useToast();
    const router = useRouter();
    const form = useForm<SettingsFormInput>({
        defaultValues: {
            supervisee_name: selectedUser?.supervisee_name ?? "",
            supervisee_age: selectedUser?.supervisee_age ?? 0,
            supervisee_persona: selectedUser?.supervisee_persona ?? "",
            modules: selectedUser?.modules ?? [],
        },
    });

    async function onSubmit(values: z.infer<typeof settingsDashboardSchema>) {
        await updateUser(supabase, values, selectedUser!.user_id);
        setProgress(100);
        toast({
            description: "Your prefereces have been saved.",
        });
        router.push("/home");
    }

    return (
        <div className="overflow-hidden max-w-lg flex-auto flex flex-col gap-2 font-quicksand px-1">
            <Progress value={progress} />
            <p className="text-3xl font-bold mt-5">
                To get started, enter your details to get your companion set up
            </p>
            <p className="text-md text-gray-500 font-medium">
                {/* Parenting can be hard. It can be even harder when you&apos;re
                trying to balance work, life, and your child&apos;s development.
                Starmoon AI is here to help */}
                Whether you are buying a Starmoon for yourself or for your loved
                one, we want to make sure that your Starmoon is set up to
                provide the best experience possible.
            </p>
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="flex flex-col gap-8 mb-4 mt-4"
                >
                    <FormField
                        control={form.control}
                        name="supervisee_name"
                        render={({ field }) => (
                            <FormItem className="w-full rounded-md">
                                <FormLabel className="flex flex-row gap-4 items-center">
                                    {userFormNameLabel}
                                </FormLabel>
                                {/* <FormDescription>
                            Give your newsletter a name that describes its
                            content.
                        </FormDescription> */}
                                <FormControl>
                                    <Input
                                        // autoFocus
                                        required
                                        placeholder="e.g. John Doe"
                                        {...field}
                                        className="max-w-screen-sm h-10 bg-white"
                                        autoComplete="on"
                                        style={{
                                            fontSize: 16,
                                        }}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {/* for child age */}
                    <FormField
                        control={form.control}
                        name="supervisee_age"
                        render={({ field }) => (
                            <FormItem className="w-full rounded-md">
                                <FormLabel className="flex flex-row gap-4 items-center">
                                    {userFormAgeLabel}
                                </FormLabel>
                                <FormDescription>
                                    {userFormAgeDescription}
                                </FormDescription>
                                <FormControl>
                                    <Input
                                        // autoFocus
                                        required
                                        placeholder="e.g. 8"
                                        {...field}
                                        className="max-w-screen-sm h-10 bg-white"
                                        autoComplete="on"
                                        style={{
                                            fontSize: 16,
                                        }}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="supervisee_persona"
                        render={({ field }) => (
                            <FormItem className="w-full rounded-md">
                                <FormLabel className="flex flex-row gap-4 items-center">
                                    {userFormPersonaLabel}
                                </FormLabel>
                                <FormControl>
                                    <Textarea
                                        rows={6}
                                        placeholder={userFormPersonaPlaceholder}
                                        {...field}
                                        className="max-w-screen-sm bg-white"
                                        autoComplete="on"
                                        style={{
                                            fontSize: 16,
                                        }}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button
                        variant="primary"
                        className="w-fit flex flex-row items-center gap-4 font-semibold"
                    >
                        Next <ArrowRight size={20} />
                    </Button>
                </form>
            </Form>
        </div>
    );
};

export default Onboard;
