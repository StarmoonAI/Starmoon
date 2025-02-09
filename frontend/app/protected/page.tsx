import { createClient } from "@/utils/supabase/server";
import { InfoIcon, LogOutIcon, Loader2 } from "lucide-react";
import { redirect } from "next/navigation";
import { useState, useEffect } from "react";

export default async function ProtectedPage() {
  const supabase = createClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      const {
        data: { user },
        error
      } = await supabase.auth.getUser();

      if (error) {
        console.error("Error fetching user:", error);
        setLoading(false);
        return;
      }

      if (!user) {
        redirect("/login");
      } else {
        setUser(user);
        setLoading(false);
      }
    }

    fetchUser();
  }, [supabase]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error);
    } else {
      redirect("/login");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 w-full flex flex-col gap-12 items-center justify-center">
        <Loader2 className="animate-spin" size="32" />
        <p>Loading user details...</p>
      </div>
    );
  }

  if (!user) {
    return redirect("/login");
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-12">
      <div className="w-full">
        <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
          <InfoIcon size="16" strokeWidth={2} />
          This is a protected page that you can only see as an authenticated user
        </div>
      </div>
      <div className="flex flex-col gap-2 items-start">
        <h2 className="font-bold text-2xl mb-4">Your user details</h2>
        <pre className="text-xs font-mono p-3 rounded border max-h-32 overflow-auto">
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>
      <div className="flex flex-col gap-2 items-start">
        <button
          className="bg-red-500 text-white p-3 px-5 rounded-md flex gap-3 items-center"
          onClick={handleLogout}
        >
          <LogOutIcon size="16" strokeWidth={2} />
          Logout
        </button>
      </div>
      <div>
        <h2 className="font-bold text-2xl mb-4">Next steps</h2>
      </div>
    </div>
  );
}
