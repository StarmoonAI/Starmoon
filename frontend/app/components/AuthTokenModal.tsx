import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy } from "lucide-react";
import { generateStarmoonAuthKey } from "../actions";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

interface AuthTokenModalProps {
    user: IUser;
}

const AuthTokenModal: React.FC<AuthTokenModalProps> = ({ user }) => {
    const { toast } = useToast();

    const [apiKey, setApiKey] = useState<string | null>(null);
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    size="sm"
                    variant="secondary"
                    onClick={async () => {
                        setApiKey(await generateStarmoonAuthKey(user));
                    }}
                >
                    Generate API Key
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Your Starmoon API Key</DialogTitle>
                    <DialogDescription>
                        This key will be hidden once you close this dialog. Keep
                        it safe!
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-row gap-2 py-4">
                    <Input
                        id="api_key"
                        value={apiKey ?? ""}
                        disabled
                        placeholder="API Key"
                    />
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                            navigator.clipboard.writeText(apiKey ?? "");
                            toast({
                                description:
                                    "Starmoon API Key copied to clipboard",
                            });
                        }}
                    >
                        <Copy size={18} />
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default AuthTokenModal;
