import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default function Footer() {
    return (
        <footer className="w-full flex items-center justify-center border-t-[1px] border-gray-200 dark:border-gray-800 mx-auto text-center text-xs gap-8 py-1">
            {/* <footer className="w-full flex items-center justify-center mx-auto text-center text-xs gap-8 py-1"> */}
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
                Starmoon AI © {new Date().getFullYear()} All rights reserved.
            </Label>
            {/* <ThemeSwitcher /> */}
        </footer>
    );
}
