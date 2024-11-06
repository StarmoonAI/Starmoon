"use client";

import { Button } from "@/components/ui/button";
import React from "react";
import { Package } from "lucide-react";
import HomePageSubtitles from "../HomePageSubtitles";
import { Toggle } from "@/components/ui/toggle";
import AppSettings from "./AppSettings";
import DeviceSettings from "./DeviceSettings";

interface SettingsDashboardProps {
    selectedUser: IUser;
}

const SettingsDashboard: React.FC<SettingsDashboardProps> = ({
    selectedUser,
}) => {
    const [deviceSetupMode, setDeviceSetupMode] = React.useState(false);

    const toggleDeviceMode = () => {
        setDeviceSetupMode(!deviceSetupMode);
    };

    const Heading = () => {
        return (
            <div className="flex flex-col gap-2">
                <div className="flex flex-row gap-4 items-center">
                    <h1 className="text-3xl font-normal">Settings</h1>
                    <div className="flex flex-row gap-4 justify-between items-center">
                        <Button variant="default" size="sm" type="submit">
                            Save
                        </Button>
                        <Toggle
                            size="sm"
                            type="button"
                            pressed={deviceSetupMode}
                            className={`flex flex-row items-center gap-2`}
                            onPressedChange={() => toggleDeviceMode()}
                        >
                            <Package size={18} /> Device
                        </Toggle>
                    </div>
                </div>
                <HomePageSubtitles user={selectedUser} page="settings" />
            </div>
        );
    };

    return (
        <div className="overflow-hidden pb-2 w-full flex-auto flex flex-col pl-1">
            {deviceSetupMode ? (
                <DeviceSettings
                    heading={<Heading />}
                    selectedUser={selectedUser}
                />
            ) : (
                <AppSettings
                    heading={<Heading />}
                    selectedUser={selectedUser}
                />
            )}
        </div>
    );
};

export default SettingsDashboard;
