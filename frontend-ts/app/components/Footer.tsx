import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

export default function Footer() {
    return (
        <footer className="px-2 py-2 border-t flex flex-col sm:flex-row items-center">
            <a href="mailto:akad3b@gmail.com" target="_blank">
                <Button
                    variant="link"
                    size="sm"
                    className="font-sans font-normal text-grey-700 text-xs"
                    aria-label="Mail"
                >
                    <Mail size={18} className="mr-2" />
                    Send feedback
                </Button>
            </a>
            <Label className="font-normal text-xs text-gray-500">
                Starmoon AI (a project of HeyHaddock Inc.) ©{" "}
                {new Date().getFullYear()} All rights reserved.
            </Label>
        </footer>
    );
}
