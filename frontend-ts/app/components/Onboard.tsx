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
import ToyPicker from "./ToyPicker";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { updateUser } from "@/db/users";
import { useEffect } from "react";
import { getCreditsRemaining } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

interface OnboardProps {
    selectedUser: IUser;
}

export const parentDashboardSchema = z.object({
    child_name: z.string().min(1).max(50),
    child_age: z.number().min(1).max(18),
    child_persona: z.string().max(500).optional(),
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

export type ParentFormInput = z.infer<typeof parentDashboardSchema>;

const Onboard: React.FC<OnboardProps> = ({ selectedUser }) => {
    const [progress, setProgress] = React.useState(40);
    const supabase = createClient();
    const { toast } = useToast();
    const router = useRouter();
    const form = useForm<ParentFormInput>({
        defaultValues: {
            child_name: selectedUser?.child_name ?? "",
            child_age: selectedUser?.child_age ?? 0,
            child_persona: selectedUser?.child_persona ?? "",
            modules: selectedUser?.modules ?? [],
        },
    });

    async function onSubmit(values: z.infer<typeof parentDashboardSchema>) {
        await updateUser(supabase, values, selectedUser!.user_id);
        setProgress(100);
        toast({
            description: "Your prefereces have been saved.",
        });
        router.push("/home");
    }

    return (
        <div className="overflow-hidden w-full flex-auto flex flex-col font-quicksand pl-1">
            <Progress value={progress} />
            <p className="text-3xl font-bold mt-5">
                To get started, enter supervision details to get your
                child&apos;s companion set up
            </p>
            <p className="text-md text-gray-500 font-medium">
                Parenting can be hard. It can be even harder when you&apos;re
                trying to balance work, life, and your child&apos;s development.
                Starmoon AI is here to help
            </p>
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="flex flex-col gap-8 mb-4 mt-4"
                >
                    <FormField
                        control={form.control}
                        name="child_name"
                        render={({ field }) => (
                            <FormItem className="w-full rounded-md">
                                <FormLabel className="flex flex-row gap-4 items-center">
                                    {"Your child's name"}
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
                        name="child_age"
                        render={({ field }) => (
                            <FormItem className="w-full rounded-md">
                                <FormLabel className="flex flex-row gap-4 items-center">
                                    {"Your child's age"}
                                </FormLabel>
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
                        name="child_persona"
                        render={({ field }) => (
                            <FormItem className="w-full rounded-md">
                                <FormLabel className="flex flex-row gap-4 items-center">
                                    Briefly describe your child&apos;s
                                    interests, personality, and learning style
                                </FormLabel>
                                <FormControl>
                                    <Textarea
                                        rows={4}
                                        placeholder="e.g. I would like the plushie to be friendly and encouraging, and to use positive reinforcement to help my child learn."
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
                    <FormField
                        control={form.control}
                        name="modules"
                        render={() => (
                            <FormItem>
                                <div className="mb-4">
                                    <FormLabel className="text-base">
                                        Learning modules
                                    </FormLabel>
                                    <FormDescription>
                                        Select your learning modules
                                    </FormDescription>
                                </div>
                                {learningModules.map((item) => (
                                    <FormField
                                        key={item.id}
                                        control={form.control}
                                        name="modules"
                                        render={({ field }) => {
                                            return (
                                                <FormItem
                                                    key={item.id}
                                                    className="flex flex-row items-center space-x-3 space-y-0"
                                                >
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value?.includes(
                                                                item.id,
                                                            )}
                                                            onCheckedChange={(
                                                                checked,
                                                            ) => {
                                                                return checked
                                                                    ? field.onChange(
                                                                          [
                                                                              ...field.value,
                                                                              item.id,
                                                                          ],
                                                                      )
                                                                    : field.onChange(
                                                                          field.value?.filter(
                                                                              (
                                                                                  value,
                                                                              ) =>
                                                                                  value !==
                                                                                  item.id,
                                                                          ),
                                                                      );
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">
                                                        {item.label}
                                                    </FormLabel>
                                                </FormItem>
                                            );
                                        }}
                                    />
                                ))}
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
