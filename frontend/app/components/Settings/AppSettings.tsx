import { signOutAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { LogOut } from "lucide-react";
import AuthTokenModal from "../AuthTokenModal";
import DoctorForm from "./DoctorForm";
import GeneralUserForm from "./UserForm";

interface AppSettingsProps {
    selectedUser: IUser;
    heading: React.ReactNode;
}

const AppSettings: React.FC<AppSettingsProps> = ({ selectedUser, heading }) => {
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
            <Separator className="mt-4 mb-6" />
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
            <Separator className="mt-4 mb-6" />
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
        </>
    );
};

export default AppSettings;
