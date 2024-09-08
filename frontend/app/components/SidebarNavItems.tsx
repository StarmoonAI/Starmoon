"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dot } from "lucide-react";

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
    items: {
        href: string;
        title: string;
        icon: string;
    }[];
}

export function SidebarNav({ className, items, ...props }: SidebarNavProps) {
    const pathname = usePathname();

    return (
        <nav
            className={cn(
                "flex space-x-2 justify-center sm:justify-start md:flex-col md:space-x-0 md:space-y-6 rounded-xl",
                className
            )}
            {...props}
        >
            {items.map((item) => {
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            buttonVariants({ variant: "ghost" }),
                            pathname === item.href ? "bg-muted" : "",
                            "justify-start rounded-full text-md sm:text-xl text-normal text-stone-700"
                        )}
                    >
                        <span className="mr-1">{item.icon}</span>
                        {item.title}
                        {pathname === item.href && (
                            <Dot className="hidden sm:block" size={48} />
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}
