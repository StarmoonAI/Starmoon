import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Separator } from "@/components/ui/separator";
import { FaDiscord, FaGithub } from "react-icons/fa";
import Link from "next/link";
import { discordInviteLink, githubPublicLink } from "@/lib/data";

export default function Footer() {
    return (
        <footer className="w-full flex flex-col sm:flex-row items-center sm:justify-center border-t-[1px] border-gray-200 dark:border-gray-800 mx-auto text-center text-xs sm:gap-8 sm:py-1 py-2">
            {/* <footer className="w-full flex items-center justify-center mx-auto text-center text-xs gap-8 py-1"> */}
            <div className="flex flex-row items-center gap-8">
                <a href="https://forms.gle/2QmukEG2FXNwBdee7" target="_blank">
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
                    Starmoon AI © {new Date().getFullYear()} All rights
                    reserved.
                </Label>
            </div>
            {/* <Separator orientation="vertical" /> */}
            <div className="flex flex-row items-center gap-8">
                <div className="flex flex-row items-center gap-2">
                    <Link href={githubPublicLink} passHref>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="w-7 h-7 text-gray-500"
                        >
                            <FaGithub />
                        </Button>
                    </Link>
                    <Link href={discordInviteLink} passHref>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="w-7 h-7 text-gray-500"
                        >
                            <FaDiscord />
                        </Button>
                    </Link>
                </div>

                <a
                    href="/privacy"
                    className="font-sans font-normal underline text-gray-500 text-xs"
                >
                    Privacy Policy
                </a>

                <a
                    href="/terms"
                    className="font-sans font-normal underline text-gray-500 text-xs"
                >
                    Terms of Service
                </a>
            </div>

            {/* <ThemeSwitcher /> */}
        </footer>
    );
}
