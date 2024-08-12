import { SidebarNav } from "../components/SidebarNavItems";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

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
    const supabase = createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }
    return (
        // <div className="md:max-w-screen-xl mx-auto">
        //     <div className="block space-y-6 p-6 md:p-12 pb-16">
        //         <div className="flex flex-col space-y-8 md:flex-row md:space-x-12 md:space-y-0">
        //             <aside className="md:w-1/5">
        //                 <SidebarNav items={sidebarNavItems} />
        //             </aside>
        //             <div className="flex-1 ">{children}</div>
        //             {/* <div className="flex-1 lg:max-w-2xl">{children}</div> */}
        //         </div>
        //     </div>
        // </div>

        <div className="flex flex-col md:flex-row h-[calc(100vh-theme(spacing.16))]">
            <aside className="w-full md:w-[250px] py-6 pl-6 overflow-y-auto">
                <SidebarNav items={sidebarNavItems} />
            </aside>
            <main className="flex-1 overflow-y-auto py-6 px-8 flex justify-center">
                <div className="max-w-4xl w-full">{children}</div>
            </main>
        </div>
    );
}
