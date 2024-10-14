import { Button } from "@/components/ui/button";
import { User } from "@supabase/supabase-js";
import Link from "next/link";
import { LogIn, Home } from "lucide-react";
import { Gamepad2, ShoppingCart } from "lucide-react";

interface NavbarButtonsProps {
    user: User | null;
}

const ICON_SIZE = 18;
const STROKE_WIDTH = 3;

const NavbarButtons: React.FC<NavbarButtonsProps> = ({ user }) => {
    return user ? (
        <Link href="/home">
            <Button
                variant="secondary"
                size="sm"
                className="flex flex-row items-center gap-2 rounded-full bg-nav-bar"
            >
                <Home size={ICON_SIZE} />
                <span className="hidden sm:block">Home</span>
            </Button>
        </Link>
    ) : (
        <Link href="/login">
            <Button
                variant="secondary"
                size="sm"
                className="font-medium flex flex-row items-center gap-2 rounded-full bg-nav-bar"
            >
                {/* <LogIn size={ICON_SIZE} strokeWidth={STROKE_WIDTH} /> */}
                <Gamepad2 size={22} />
                <span className="hidden sm:block">Try Online</span>
            </Button>
        </Link>
    );
};

export default NavbarButtons;
