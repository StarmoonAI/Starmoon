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
import { getCreditsRemaining } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";

interface SettingsDashboardProps {
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

const SettingsDashboard: React.FC<SettingsDashboardProps> = ({
    selectedUser,
}) => {
    const supabase = createClient();
    const { toast } = useToast();
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
        toast({
            description: "Your prefereces have been saved.",
        });
    }

    return (
        <div className="overflow-hidden w-full flex-auto flex flex-col pl-1">
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="flex flex-col gap-8 mb-4"
                >
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-row gap-4 items-center">
                            <h1 className="text-3xl font-normal">
                                Preferences
                            </h1>
                            <div className="flex flex-row gap-2 justify-between items-center">
                                <Button
                                    variant="default"
                                    size="sm"
                                    type="submit"
                                >
                                    Save
                                </Button>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600">
                            {getCreditsRemaining(selectedUser)} credits
                            remaining
                        </p>
                    </div>
                    <FormField
                        control={form.control}
                        name="supervisee_name"
                        render={({ field }) => (
                            <FormItem className="w-full rounded-md">
                                <FormLabel className="flex flex-row gap-4 items-center">
                                    {"The user's name"}
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
                                    {"The user's age"}
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
                        name="supervisee_persona"
                        render={({ field }) => (
                            <FormItem className="w-full rounded-md">
                                <FormLabel className="flex flex-row gap-4 items-center">
                                    Briefly describe the user&apos;s interests,
                                    personality, and learning style
                                </FormLabel>
                                <FormControl>
                                    <Textarea
                                        rows={4}
                                        placeholder="e.g. I would like the AI to be friendly and encouraging, and to use positive reinforcement to help my child learn."
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
                    {/* <FormField
            control={form.control}
            name="supervisee_persona"
            render={({ field }) => (
              <FormItem className="w-full rounded-md">
                <FormLabel className="flex flex-row gap-4 items-center">
                  Banned topics
                </FormLabel>
                <FormControl>
                  <Textarea
                    rows={4}
                    placeholder="e.g. I would like the AI to be friendly and encouraging, and to use positive reinforcement to help my child learn."
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
          /> */}
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
                                                                item.id
                                                            )}
                                                            onCheckedChange={(
                                                                checked
                                                            ) => {
                                                                return checked
                                                                    ? field.onChange(
                                                                          [
                                                                              ...field.value,
                                                                              item.id,
                                                                          ]
                                                                      )
                                                                    : field.onChange(
                                                                          field.value?.filter(
                                                                              (
                                                                                  value
                                                                              ) =>
                                                                                  value !==
                                                                                  item.id
                                                                          )
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
                    <FormField
                        control={form.control}
                        name="supervisee_name"
                        render={({ field }) => (
                            <FormItem className="w-full rounded-md">
                                <FormLabel className="flex flex-row gap-4 items-center">
                                    Logged in as
                                </FormLabel>
                                {/* <FormDescription>
                            Give your newsletter a name that describes its
                            content.
                        </FormDescription> */}
                                <FormControl>
                                    <Input
                                        // autoFocus
                                        disabled
                                        value={selectedUser?.email}
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
                </form>
            </Form>
        </div>
    );
};

export default SettingsDashboard;
