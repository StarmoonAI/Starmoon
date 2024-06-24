"use client";

import { Button } from "@/components/ui/button";
import { User } from "@supabase/supabase-js";
import Link from "next/link";
import { LogIn, Home, LogOut, Sparkles, Bird } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface NavbarButtonsProps {
    user: User | null;
}

const ICON_SIZE = 18;
const STROKE_WIDTH = 3;

const NavbarButtons: React.FC<NavbarButtonsProps> = ({ user }) => {
    const isDesktop = useMediaQuery("(min-width: 768px)");
    return user ? (
        <div className="flex flex-row gap-2 items-center">
            <Link href="/home">
                {isDesktop ? (
                    <Button
                        variant="primary"
                        size="sm"
                        className="font-bold flex flex-row items-center gap-2"
                    >
                        <Home size={ICON_SIZE} strokeWidth={STROKE_WIDTH} />
                        Home
                    </Button>
                ) : (
                    <Button variant="primary" size="icon">
                        <Home size={ICON_SIZE} strokeWidth={STROKE_WIDTH} />
                    </Button>
                )}
            </Link>
            <form action="/auth/sign-out" method="post">
                {isDesktop ? (
                    <Button
                        variant="link"
                        size="sm"
                        className="font-bold flex flex-row items-center gap-2"
                    >
                        <LogOut size={ICON_SIZE} strokeWidth={STROKE_WIDTH} />
                        Logout
                    </Button>
                ) : (
                    <Button variant="link" size="icon">
                        <LogOut size={ICON_SIZE} strokeWidth={STROKE_WIDTH} />
                    </Button>
                )}
            </form>
        </div>
    ) : (
        <Link href="/login">
            {isDesktop ? (
                <Button
                    variant="primary"
                    size="sm"
                    className="font-bold flex flex-row items-center gap-2"
                >
                    <LogIn size={ICON_SIZE} strokeWidth={STROKE_WIDTH} />
                    Login
                </Button>
            ) : (
                <Button variant="primary" size="icon">
                    <LogIn size={ICON_SIZE} strokeWidth={STROKE_WIDTH} />
                </Button>
            )}
        </Link>
        // <Bird size={28} strokeWidth={2} className="text-amber-600" />
    );
};

export default NavbarButtons;
