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
import { useToast } from "@/components/ui/use-toast";
import { updateUser } from "@/db/users";
import { createClient } from "@/utils/supabase/client";
import React from "react";
import {
    userFormAgeDescription,
    userFormAgeLabel,
    userFormPersonaLabel,
    userFormPersonaPlaceholder,
} from "@/lib/data";

interface GeneralUserFormProps {
    selectedUser: IUser;
    heading: React.ReactNode;
    onClickCallback: () => void;
}

export const UserSettingsSchema = z.object({
    supervisee_name: z.string().min(1).max(50),
    supervisee_age: z.number().min(1).max(18),
    supervisee_persona: z.string().max(500).optional(),
    modules: z
        .array(z.enum(["math", "science", "spelling", "general_trivia"]))
        .refine((value) => value.some((item) => item), {
            message: "You have to select at least one item.",
        }),
});

export type GeneralUserInput = z.infer<typeof UserSettingsSchema>;

const GeneralUserForm: React.FC<GeneralUserFormProps> = ({
    selectedUser,
    heading,
    onClickCallback,
}) => {
    const supabase = createClient();
    const { toast } = useToast();
    const form = useForm<GeneralUserInput>({
        defaultValues: {
            supervisee_name: selectedUser?.supervisee_name ?? "",
            supervisee_age: selectedUser?.supervisee_age ?? 0,
            supervisee_persona: selectedUser?.supervisee_persona ?? "",
            modules: selectedUser?.modules ?? [],
        },
    });

    async function onSubmit(values: z.infer<typeof UserSettingsSchema>) {
        await updateUser(
            supabase,
            {
                ...values,
                user_info: {
                    user_type: "user",
                    user_metadata: {},
                },
            },
            selectedUser!.user_id
        );
        toast({
            description: "Your prefereces have been saved. Have a good day!",
        });
        onClickCallback();
    }

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-8 mb-4"
            >
                {heading}
                <FormField
                    control={form.control}
                    name="supervisee_name"
                    render={({ field }) => (
                        <FormItem className="w-full rounded-md">
                            <FormLabel className="flex flex-row gap-4 items-center">
                                {"Your name"}
                            </FormLabel>
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
            </form>
        </Form>
    );
};

export default GeneralUserForm;
