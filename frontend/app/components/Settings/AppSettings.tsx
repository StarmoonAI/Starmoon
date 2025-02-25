import { setDeviceOta, setDeviceReset, signOutAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Check, Cog, LogOut, RefreshCw } from "lucide-react";
import AuthTokenModal from "../AuthTokenModal";
import DoctorForm from "./DoctorForm";
import GeneralUserForm from "./UserForm";
import { Slider } from "@/components/ui/slider";
import { updateUser } from "@/db/users";
import { createClient } from "@/utils/supabase/client";
import React from "react";
import _ from "lodash";
import { doesUserHaveADevice } from "@/db/devices";

interface AppSettingsProps {
        selectedUser: IUser;
        heading: React.ReactNode;
}

const AppSettings: React.FC<AppSettingsProps> = ({ selectedUser, heading }) => {
        const supabase = createClient();
        const [isConnected, setIsConnected] = React.useState(false);

        React.useEffect(() => {
                const checkIfUserHasDevice = async () => {
                        setIsConnected(
                                await doesUserHaveADevice(
                                        supabase,
                                        selectedUser.user_id,
                                ),
                        );
                };
                checkIfUserHasDevice();
        }, [selectedUser.user_id]);

        const [volume, setVolume] = React.useState([
                selectedUser.volume_control ?? 50,
        ]);
        const [isReset, setIsReset] = React.useState(selectedUser.is_reset);
        const [isOta, setIsOta] = React.useState(selectedUser.is_ota);

        const debouncedUpdateVolume = _.debounce(async () => {
                await updateUser(
                        supabase,
                        { volume_control: volume[0] },
                        selectedUser.user_id,
                );
        }, 1000); // Adjust the debounce delay as needed

        const updateVolume = (value: number[]) => {
                setVolume(value);
                debouncedUpdateVolume();
        };

        return (
                <>
                        {selectedUser.user_info.user_type === "doctor" ? (
                                <DoctorForm
                                        selectedUser={selectedUser}
                                        heading={heading}
                                        onClickCallback={() => {}}
                                />
                        ) : (
                                <GeneralUserForm
                                        selectedUser={selectedUser}
                                        heading={heading}
                                        onClickCallback={() => {}}
                                />
                        )}
                        <section className="space-y-4 max-w-screen-sm mt-4">
                                <h2 className="text-lg font-semibold border-b border-gray-200 pb-2">
                                        Device settings
                                </h2>
                                <div className="flex flex-col gap-4">
                                        <div className="flex flex-col gap-2">
                                                <Label className="text-sm font-medium text-gray-700">
                                                        Generate Starmoon API
                                                        Key
                                                </Label>
                                                <div className="flex flex-row items-center gap-2 mt-2">
                                                        <AuthTokenModal
                                                                user={
                                                                        selectedUser
                                                                }
                                                        />
                                                </div>
                                                <p className="text-xs text-gray-400">
                                                        This key must be kept
                                                        secret and should not be
                                                        shared.
                                                </p>
                                        </div>
                                        <div className="flex flex-col gap-2 mt-4">
                                                <Label className="text-sm font-medium text-gray-700">
                                                        Logged in as
                                                </Label>
                                                <Input
                                                        // autoFocus
                                                        disabled
                                                        value={
                                                                selectedUser?.email
                                                        }
                                                        className="max-w-screen-sm h-10 bg-white"
                                                        autoComplete="on"
                                                        style={{
                                                                fontSize: 16,
                                                        }}
                                                />
                                        </div>
                                        <div className="flex flex-col gap-4 mt-6">
                                                <Label className="text-sm font-medium text-gray-700">
                                                        Device volume
                                                </Label>
                                                <div className="flex flex-row gap-2 items-center flex-nowrap">
                                                        <Slider
                                                                value={volume}
                                                                onValueChange={
                                                                        updateVolume
                                                                }
                                                                className="sm:w-1/2"
                                                                defaultValue={[
                                                                        50,
                                                                ]}
                                                                max={100}
                                                                min={1}
                                                                step={1}
                                                        />
                                                        <p className="text-gray-500 text-sm">
                                                                {volume}%
                                                        </p>
                                                </div>
                                        </div>
                                        <div className="flex flex-col gap-4 mt-6">
                                                <Label className="text-sm font-medium text-gray-700">
                                                        Device update
                                                </Label>
                                                <div className="flex flex-col gap-4 flex-nowrap">
                                                        <div className="flex flex-col gap-2">
                                                                <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="font-normal flex flex-row items-center gap-2 w-fit"
                                                                        onClick={async () => {
                                                                                setIsOta(
                                                                                        true,
                                                                                );
                                                                                await setDeviceOta(
                                                                                        selectedUser.user_id,
                                                                                );
                                                                        }}
                                                                        disabled={
                                                                                isOta
                                                                        }
                                                                >
                                                                        <RefreshCw
                                                                                size={
                                                                                        16
                                                                                }
                                                                        />
                                                                        <span>
                                                                                Update
                                                                        </span>
                                                                </Button>
                                                                {isOta ? (
                                                                        <p className="text-xs text-gray-400 inline">
                                                                                <Check
                                                                                        size={
                                                                                                16
                                                                                        }
                                                                                        className="inline-block mr-1"
                                                                                />
                                                                                Your
                                                                                device
                                                                                will
                                                                                be
                                                                                updated
                                                                                on
                                                                                next
                                                                                start
                                                                        </p>
                                                                ) : (
                                                                        <p className="text-xs text-gray-400">
                                                                                This
                                                                                will
                                                                                update
                                                                                your
                                                                                device
                                                                                software
                                                                                to
                                                                                the
                                                                                latest
                                                                                version.
                                                                        </p>
                                                                )}
                                                        </div>
                                                        <div className="flex flex-col gap-2">
                                                                <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="font-normal flex flex-row items-center gap-2 w-fit"
                                                                        onClick={async () => {
                                                                                setIsReset(
                                                                                        true,
                                                                                );
                                                                                await setDeviceReset(
                                                                                        selectedUser.user_id,
                                                                                );
                                                                        }}
                                                                        disabled={
                                                                                isReset
                                                                        }
                                                                >
                                                                        <Cog
                                                                                size={
                                                                                        16
                                                                                }
                                                                        />
                                                                        <span>
                                                                                Factory
                                                                                reset
                                                                        </span>
                                                                </Button>
                                                                {isReset ? (
                                                                        <p className="text-xs text-gray-400 inline">
                                                                                <Check
                                                                                        size={
                                                                                                16
                                                                                        }
                                                                                        className="inline-block mr-1"
                                                                                />
                                                                                Your
                                                                                device
                                                                                will
                                                                                be
                                                                                reset
                                                                                on
                                                                                next
                                                                                start
                                                                        </p>
                                                                ) : (
                                                                        <p className="text-xs text-gray-400">
                                                                                Caution:
                                                                                This
                                                                                will
                                                                                reset
                                                                                your
                                                                                device
                                                                                to
                                                                                factory
                                                                                settings.
                                                                        </p>
                                                                )}
                                                        </div>
                                                </div>
                                        </div>
                                        <form
                                                action={signOutAction}
                                                className="mt-8"
                                        >
                                                <Button
                                                        variant="destructive_outline"
                                                        size="sm"
                                                        className="font-medium flex flex-row items-center gap-2 "
                                                >
                                                        <LogOut
                                                                size={18}
                                                                strokeWidth={2}
                                                        />
                                                        <span>Logout</span>
                                                </Button>
                                        </form>
                                </div>
                        </section>
                </>
        );
};

export default AppSettings;
