import { connectUserToDevice } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { doesUserHaveADevice } from "@/db/devices";
import { updateUser } from "@/db/users";
import { createClient } from "@/utils/supabase/client";
import _ from "lodash";
import {
    Check,
    CircleCheck,
    ScanBarcode,
    ShoppingCart,
    Volume2,
    WifiHigh,
    X,
} from "lucide-react";
import Link from "next/link";
import React from "react";

interface DeviceSettingsProps {
    selectedUser: IUser;
    heading: React.ReactNode;
}

const DeviceSettings: React.FC<DeviceSettingsProps> = ({
    selectedUser,
    heading,
}) => {
    const supabase = createClient();
    const [deviceCode, setDeviceCode] = React.useState("");
    const [isConnected, setIsConnected] = React.useState(false);

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

    React.useEffect(() => {
        const checkIfUserHasDevice = async () => {
            setIsConnected(
                await doesUserHaveADevice(supabase, selectedUser.user_id)
            );
        };
        checkIfUserHasDevice();
    }, [selectedUser.user_id]);

    return (
        <div>
            {heading}
            <div className="flex flex-col gap-4 mt-6 font-quicksand">
                <Label className="flex flex-row gap-4 items-center font-semibold">
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
            {/* <div className="mt-10 font-quicksand">
                <Label className="flex flex-row gap-4 items-center font-semibold">
                    Setup instructions
                </Label>
                <div className="flex flex-col gap-6 font-normal text-sm">
                    <p className="inline">
                        1. If you have not yet purchased your device, please
                        visit the{" "}
                        <Link
                            href="/products"
                            passHref
                            className="inline-block"
                        >
                            <Button
                                variant="secondary"
                                className="flex flex-row items-center gap-2 font-bold"
                                size="sm"
                            >
                                <ShoppingCart size={18} /> Preorder
                            </Button>
                        </Link>{" "}
                        page to get your device.
                    </p>

                    <p className="inline">
                        2. Before your device is turned on, lets connect to your
                        unique device code.{" "}
                        <ScanBarcode
                            className="inline-block align-baseline"
                            size={18}
                        />
                    </p>
                    <div className="flex flex-col gap-1">
                        <div className="flex flex-row items-center gap-2 w-full md:w-1/2">
                            <Input
                                className="w-3/4 h-9"
                                placeholder="Enter your unique device code"
                                type="text"
                                required
                                style={{ fontSize: 16 }}
                                value={deviceCode}
                                onChange={(e) => setDeviceCode(e.target.value)}
                            />
                            <div className="w-1/4">
                                <Button
                                    className="flex flex-row items-center gap-2"
                                    variant="primary"
                                    size="sm"
                                    onClick={async () => {
                                        if (deviceCode) {
                                            const connectStatus =
                                                await connectUserToDevice(
                                                    selectedUser.user_id,
                                                    deviceCode
                                                );
                                            setIsConnected(connectStatus);
                                        }
                                    }}
                                >
                                    Connect
                                </Button>
                            </div>
                        </div>
                        {isConnected ? (
                            <p className="text-xs inline">
                                <Check
                                    className="inline-block text-green-600"
                                    size={14}
                                />
                                your device is connected!
                            </p>
                        ) : (
                            <p className="text-xs inline">
                                <X
                                    className="inline-block text-red-600"
                                    size={14}
                                />
                                no connected device
                            </p>
                        )}
                    </div>
                    <p className="inline">
                        3. Now power{" "}
                        <span className="inline-block">
                            <Button
                                variant="secondary"
                                className="cursor-default flex flex-row item-center gap-2 font-bold"
                            >
                                <CircleCheck
                                    size={18}
                                    className="text-green-600"
                                />
                                ON
                            </Button>
                        </span>{" "}
                        your device and connect it to any personal{" "}
                        <WifiHigh className="inline-block align-baseline" />{" "}
                        WiFi network.
                    </p>
                    <p className="inline">
                        4. Voila! Press the button to talk{" "}
                        <Volume2 className="inline-block mx-2" size={18} /> to
                        Starmoon.
                    </p>
                </div>
            </div> */}
        </div>
    );
};

export default DeviceSettings;
