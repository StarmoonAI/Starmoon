import { Separator } from "@/components/ui/separator";
import { SidebarNav } from "../components/SidebarNavItems";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

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
    <div className="md:max-w-screen-lg mx-auto">
      <div className="block space-y-6 p-6 md:p-12 pb-16">
        <div className="flex flex-col space-y-8 md:flex-row md:space-x-12 md:space-y-0">
          <div className="flex-1 ">{children}</div>
          {/* <div className="flex-1 lg:max-w-2xl">{children}</div> */}
        </div>
      </div>
    </div>
  );
}
