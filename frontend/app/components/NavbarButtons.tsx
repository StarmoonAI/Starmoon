import { Button } from "@/components/ui/button";
import { User } from "@supabase/supabase-js";
import Link from "next/link";
import { LogIn, Home, LogOut } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

interface NavbarButtonsProps {
  user: User | null;
}

const ICON_SIZE = 18;
const STROKE_WIDTH = 3;

const NavbarButtons: React.FC<NavbarButtonsProps> = ({ user }) => {
  const signOut = async () => {
    "use server";

    const supabase = createClient();
    await supabase.auth.signOut();
    return redirect("/");
  };

  return user ? (
    <div className="flex flex-row gap-2 items-center">
      <Link href="/home">
        <Button
          variant="primary"
          size="sm"
          className="font-medium flex flex-row items-center gap-2 rounded-full"
        >
          <Home size={ICON_SIZE} strokeWidth={STROKE_WIDTH} />
          <span className="hidden md:inline">Home</span>
        </Button>
      </Link>
      <form action={signOut}>
        <Button
          variant="link"
          size="sm"
          className="font-medium flex flex-row items-center gap-2 rounded-full"
        >
          <LogOut size={ICON_SIZE} strokeWidth={STROKE_WIDTH} />
          <span className="hidden md:inline">Logout</span>
        </Button>
      </form>
    </div>
  ) : (
    <Link href="/login">
      <Button
        variant="primary"
        size="sm"
        className="font-medium flex flex-row items-center gap-2 rounded-full"
      >
        <LogIn size={ICON_SIZE} strokeWidth={STROKE_WIDTH} />
        <span className="hidden md:inline">Play Online</span>
      </Button>
    </Link>
  );
};

export default NavbarButtons;
