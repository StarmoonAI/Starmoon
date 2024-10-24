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
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import { updateUser } from "@/db/users";
import { createClient } from "@/utils/supabase/client";
import React from "react";
import {
  userFormAgeDescription,
  userFormAgeLabel,
  userFormPersonaLabel,
  userFormPersonaPlaceholder,
} from "@/lib/data";
import { LogOut } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import _ from "lodash";
import CreditsRemaining from "../CreditsRemaining";
import AuthTokenModal from "../AuthTokenModal";
import { signOutAction } from "@/app/actions";

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
  const [volume, setVolume] = React.useState([
    selectedUser.volume_control ?? 50,
  ]);

  const debouncedUpdateVolume = _.debounce(async () => {
    await updateUser(
      supabase,
      { volume_control: volume[0] },
      selectedUser.user_id
    );
  }, 1000); // Adjust the debounce delay as needed

  const updateVolume = (value: number[]) => {
    setVolume(value);
    debouncedUpdateVolume();
  };

  async function onSubmit(values: z.infer<typeof settingsDashboardSchema>) {
    await updateUser(supabase, values, selectedUser!.user_id);
    toast({
      description: "We saved your preferences.",
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
              <h1 className="text-3xl font-normal">Settings</h1>
              <div className="flex flex-row gap-2 justify-between items-center">
                <Button variant="default" size="sm" type="submit">
                  Save
                </Button>
              </div>
            </div>
            <CreditsRemaining user={selectedUser} />
          </div>
          <FormField
            control={form.control}
            name="supervisee_name"
            render={({ field }) => (
              <FormItem className="w-full rounded-md">
                <FormLabel className="flex flex-row gap-4 items-center">
                  {"Your name"}
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
                <FormDescription>{userFormAgeDescription}</FormDescription>
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
      <div className="flex flex-col gap-8">
        <Separator />
        <div className="flex flex-col gap-2">
          <Label className="flex flex-row gap-4 items-center">
            Generate Starmoon API Key
          </Label>
          <div className="flex flex-row items-center gap-2 mt-2">
            <AuthTokenModal user={selectedUser} />
          </div>
          <p className="text-xs text-gray-400">
            This key must be kept secret and should not be shared.
          </p>
        </div>
        <Separator />
        <div className="flex flex-col gap-2">
          <Label className="flex flex-row gap-4 items-center">
            Logged in as
          </Label>
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
        </div>
        <div className="flex flex-col gap-4">
          <Label className="flex flex-row gap-4 items-center">
            Device volume
          </Label>
          <div className="flex flex-row gap-2 items-center flex-nowrap">
            <Slider
              value={volume}
              onValueChange={updateVolume}
              className="sm:w-1/2"
              defaultValue={[50]}
              max={100}
              min={1}
              step={1}
            />
            <p className="text-gray-500 text-sm">{volume}%</p>
          </div>
        </div>
        <form action={signOutAction} className="mt-4">
          <Button
            variant="destructive_outline"
            size="sm"
            className="font-medium flex flex-row items-center gap-2 "
          >
            <LogOut size={18} strokeWidth={2} />
            <span>Logout</span>
          </Button>
        </form>
      </div>
    </div>
  );
};

export default SettingsDashboard;
