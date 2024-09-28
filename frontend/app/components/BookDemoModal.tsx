import { useMediaQuery } from "@/hooks/useMediaQuery";
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
import { ClientProfileForm } from "./ClientProfileForm";
import React from "react";

interface BookDemoModalProps {
    children: React.ReactNode;
}

const BookDemoModal: React.FC<BookDemoModalProps> = ({ children }) => {
    const [open, setOpen] = React.useState(false);
    const isDesktop = useMediaQuery("(min-width: 768px)");

    const subText = (
        <>
            {
                "Want to use Starmoon for your business? Get enterprise pricing discounts when you order now. See a demo first →"
            }
        </>
    );
    const titleText = "See a demo first";

    const closeModal = () => setOpen(false);

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>{children}</DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{titleText}</DialogTitle>
                        <DialogDescription>{subText}</DialogDescription>
                    </DialogHeader>
                    <ClientProfileForm closeModal={closeModal} />
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
                <ClientProfileForm closeModal={closeModal} className="px-4" />
                <DrawerFooter className="pt-2">
                    <DrawerClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
};

export default BookDemoModal;
