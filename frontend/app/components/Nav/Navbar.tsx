"use client";

import { useEffect, useState } from "react";
import NavbarButtons from "./NavbarButtons";
import { User } from "@supabase/supabase-js";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { usePathname } from "next/navigation";
import LeftNavbarButtons from "./LeftNavbarButtons";

export function Navbar({
        user,
        stars,
}: {
        user: User | null;
        stars: number | null;
}) {
        const [isVisible, setIsVisible] = useState(true);
        const [lastScrollY, setLastScrollY] = useState(0);
        const isMobile = useMediaQuery("(max-width: 768px)");
        const isHome = usePathname().includes("/home");
        const isProduct = usePathname().includes("/products");

        useEffect(() => {
                if (typeof window !== "undefined" && isMobile) {
                        const handleScroll = () => {
                                const currentScrollY = window.scrollY;
                                setIsVisible(
                                        currentScrollY <= 0 ||
                                                currentScrollY < lastScrollY,
                                );
                                setLastScrollY(currentScrollY);
                        };

                        window.addEventListener("scroll", handleScroll, {
                                passive: true,
                        });
                        return () =>
                                window.removeEventListener(
                                        "scroll",
                                        handleScroll,
                                );
                }
        }, [lastScrollY, isMobile]);

        return (
                <div
                        className={`backdrop-blur-[3px] flex-none flex items-center sticky top-0 z-50 transition-transform duration-300 ${
                                isVisible
                                        ? "translate-y-0"
                                        : "-translate-y-full"
                        } ${isProduct ? "h-[120px]" : "h-[60px]"}`}
                >
                        {isProduct && (
                                <div className="fixed h-8 top-0 flex items-center justify-center w-full bg-yellow-100 dark:bg-yellow-900/30 px-4 py-2 text-center font-medium text-yellow-800 dark:text-yellow-200 z-40 gap-2 text-sm">
                                        🔥 Our Kickstarter pre-launch!{" "}
                                        <s>$99.99</s> $57.99 only!
                                </div>
                        )}
                        <nav className="mx-auto w-full max-w-[1440px] px-4 flex items-center justify-between">
                                <LeftNavbarButtons />
                                <NavbarButtons
                                        user={user}
                                        stars={stars}
                                        isHome={isHome}
                                />
                        </nav>
                </div>
        );
}
