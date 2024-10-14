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
import { Button } from "@/components/ui/button";
import { updateUser } from "@/db/users";
import { createClient } from "@/utils/supabase/client";
import React from "react";
import HomePageSubtitles from "../HomePageSubtitles";

interface DoctorFormProps {
    selectedUser: IUser;
    heading: React.ReactNode;
    onClickCallback: () => void;
}

export const doctorSettingsSchema = z.object({
    doctor_name: z.string().min(1).max(50),
    specialization: z.string().min(1).max(500),
    hospital_name: z.string().min(1).max(200),
    favorite_phrases: z.string().min(1).max(200),
});

export type DoctorSettingsInput = z.infer<typeof doctorSettingsSchema>;

const DoctorForm: React.FC<DoctorFormProps> = ({
    selectedUser,
    heading,
    onClickCallback,
}) => {
    const supabase = createClient();
    const { toast } = useToast();

    const userMetadata = selectedUser.user_info
        .user_metadata as IDoctorMetadata;

    const form = useForm<DoctorSettingsInput>({
        defaultValues: {
            doctor_name:
                userMetadata?.doctor_name ?? selectedUser.supervisee_name,
            specialization: userMetadata?.specialization ?? "",
            hospital_name: userMetadata?.hospital_name ?? "",
            favorite_phrases: userMetadata?.favorite_phrases ?? "",
        },
    });

    async function onSubmit(values: z.infer<typeof doctorSettingsSchema>) {
        await updateUser(
            supabase,
            {
                user_info: {
                    user_type: "doctor",
                    user_metadata: values,
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
                    name="doctor_name"
                    render={({ field }) => (
                        <FormItem className="w-full rounded-md">
                            <FormLabel className="flex flex-row gap-4 items-center">
                                {"Your name"}
                            </FormLabel>
                            <FormDescription>
                                Your Starmoon toy will use this name to address
                                you
                            </FormDescription>
                            <FormControl>
                                <Input
                                    // autoFocus
                                    required
                                    placeholder="e.g. Dr. John Doe"
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
                    name="hospital_name"
                    render={({ field }) => (
                        <FormItem className="w-full rounded-md">
                            <FormLabel className="flex flex-row gap-4 items-center">
                                {"Hospital or clinic name(s)"}
                            </FormLabel>
                            <FormControl>
                                <Input
                                    // autoFocus
                                    required
                                    placeholder="e.g. St. Mary's Hospital"
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
                    name="favorite_phrases"
                    render={({ field }) => (
                        <FormItem className="w-full rounded-md">
                            <FormLabel className="flex flex-row gap-4 items-center">
                                {"Your favorite phrases"}
                            </FormLabel>
                            <FormControl>
                                <Textarea
                                    rows={3}
                                    placeholder={
                                        "e.g. 'You're doing great!' or 'Take a deep breath'"
                                    }
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
                    name="specialization"
                    render={({ field }) => (
                        <FormItem className="w-full rounded-md">
                            <FormLabel className="flex flex-row gap-4 items-center">
                                {"Specialization and conditions treated"}
                            </FormLabel>
                            <FormControl>
                                <Textarea
                                    rows={3}
                                    placeholder={
                                        "e.g. Pediatrician neurologist or Cardiologist treating heart conditions"
                                    }
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

export default DoctorForm;
