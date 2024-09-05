"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string;
    title: string;
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
        // console.log(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              pathname === item.href ? "bg-muted" : "",
              // pathname === item.href
              //     ? "bg-muted hover:bg-accent"
              //     : "hover:bg-transparent hover:underline",
              "justify-start rounded-full sm:text-lg text-normal text-stone-700"
            )}
          >
            {item.title}
            {pathname === item.href && <span className="ml-2 text-4xl">·</span>}
          </Link>
        );
      })}
    </nav>
  );
}
