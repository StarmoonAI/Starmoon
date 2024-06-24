import { Separator } from "@/components/ui/separator";
import { SidebarNav } from "../components/SidebarNavItems";
import supabaseServerClient from "@/db/supabaseServerClient";
import { redirect } from "next/navigation";

const sidebarNavItems = [
    {
        title: "Playground",
        href: "/home",
    },
    {
        title: "Insights",
        href: "/home/track",
    },
    {
        title: "For parents",
        href: "/home/parent",
    },
];

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = supabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }
    return (
        <div className="md:max-w-screen-xl mx-auto">
            <div className="block space-y-6 p-6 md:p-12 pb-16">
                <div className="flex flex-col space-y-8 md:flex-row md:space-x-12 md:space-y-0">
                    <aside className="md:w-1/5">
                        <SidebarNav items={sidebarNavItems} />
                    </aside>
                    <div className="flex-1 ">{children}</div>
                    {/* <div className="flex-1 lg:max-w-2xl">{children}</div> */}
                </div>
            </div>
        </div>
    );
}
