import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogTrigger,
    DialogHeader,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Drawer,
    DrawerTrigger,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
    DrawerClose,
} from "@/components/ui/drawer";
import React from "react";
// import parse, { Element } from "html-react-parser";
import { Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { createInbound } from "@/db/inbound";

function ProfileForm({
    className,
    closeModal,
}: React.ComponentProps<"form"> & { closeModal: () => void }) {
    const { toast } = useToast();
    const [name, setName] = React.useState("");
    const [email, setEmail] = React.useState("");
    const [error, setError] = React.useState("");
    const supabase = createClientComponentClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (name && email) {
            await createInbound(supabase, {
                name,
                email,
                type: "demo",
            });
            toast({
                title: "We can't wait to demo you!",
                description:
                    "Thanks for getting in touch. We will reach out within 24 hours.",
                duration: 5000,
                action: <span style={{ fontSize: 32 }}>🎉</span>,
            });
            closeModal();
        } else {
            setError("Please fill in all fields.");
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className={cn("grid items-start gap-4", className)}
        >
            <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                    id="name"
                    placeholder="Mr. Para Keats"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ fontSize: 16 }}
                    className="h-10"
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    type="email"
                    id="email"
                    placeholder={"parakeats@gmail.com"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ fontSize: 16 }}
                    className="h-10"
                />
            </div>
            {error && <span className="text-xs text-destructive">{error}</span>}

            <Button type="submit" variant="primary">
                <Sparkles className="mr-2" size={16} fill="white" />
                Request Parakeet Toy Demo
            </Button>
        </form>
    );
}

const PlaceOrder: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [open, setOpen] = React.useState(false);
    const isDesktop = useMediaQuery("(min-width: 768px)");

    const closeModal = () => setOpen(false);
    const subText = (
        <>
            {"You can now preorder a Parakeet toy for your child. Get "}
            <span className="font-bold">25% off</span>
            {" when you order now. See a demo first →"}
        </>
    );
    const titleText = "See a demo";

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>{children}</DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{titleText}</DialogTitle>
                        <DialogDescription>{subText}</DialogDescription>
                    </DialogHeader>
                    <ProfileForm closeModal={closeModal} />
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>{children}</DrawerTrigger>
            <DrawerContent>
                <DrawerHeader className="text-left">
                    <DrawerTitle>{titleText}</DrawerTitle>
                    <DrawerDescription>{subText}</DrawerDescription>
                </DrawerHeader>
                <ProfileForm closeModal={closeModal} className="px-4" />
                <DrawerFooter className="pt-2">
                    <DrawerClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
};

export default PlaceOrder;
