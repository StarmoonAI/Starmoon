import { connectUserToDevice } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    CircleCheck,
    ScanBarcode,
    ShoppingCart,
    Volume2,
    WifiHigh,
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
    const [deviceCode, setDeviceCode] = React.useState("");
    return (
        <>
            {heading}
            <div className="mt-6 font-quicksand flex flex-col gap-6 font-normal text-xl">
                <p className="inline">
                    1. If you have not yet purchased your device, please visit
                    the{" "}
                    <Link href="/products" passHref className="inline-block">
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
                    2. Power{" "}
                    <div className="inline-block">
                        <Button
                            variant="secondary"
                            className="cursor-default flex flex-row item-center gap-2 font-bold"
                        >
                            <CircleCheck size={18} className="text-green-600" />
                            ON
                        </Button>
                    </div>{" "}
                    your device and connect it to any personal{" "}
                    <WifiHigh className="inline-block align-baseline" /> WiFi
                    network.
                </p>
                <p className="inline">
                    3. Once your device is connected to the internet, lets
                    connect to your unique device code.{" "}
                    <ScanBarcode
                        className="inline-block align-baseline"
                        size={18}
                    />
                </p>
                <div className="flex flex-row items-center gap-2 w-full md:w-1/2">
                    <Input
                        className="w-3/4 h-9"
                        placeholder="Enter your unique device code"
                        type="text"
                        value={deviceCode}
                        onChange={(e) => setDeviceCode(e.target.value)}
                    />
                    <div className="w-1/4">
                        <Button
                            className="flex flex-row items-center gap-2"
                            variant="primary"
                            size="sm"
                            onClick={async () => {
                                await connectUserToDevice(
                                    selectedUser.user_id,
                                    deviceCode
                                );
                            }}
                        >
                            Connect
                        </Button>
                    </div>
                </div>
                <p className="inline">
                    4. Voila! Press the button to talk{" "}
                    <Volume2 className="inline-block mx-2" size={18} /> to
                    Starmoon.
                </p>
            </div>
        </>
    );
};

export default DeviceSettings;
