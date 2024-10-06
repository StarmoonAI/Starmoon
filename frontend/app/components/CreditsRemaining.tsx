"use client";

import { Button } from "@/components/ui/button";
import { getCreditsRemaining } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import AddCreditsModal from "./Upsell/AddCreditsModal";
import Link from "next/link";

const CreditsRemaining: React.FC<{ user: IUser }> = ({ user }) => {
    const creditsRemaining = getCreditsRemaining(user);
    const hasNoCredits = creditsRemaining <= 0;
    return (
        <div className="flex flex-row items-center gap-4">
            <p
                className={`text-sm ${hasNoCredits ? "text-gray-400" : "text-gray-600"}`}
            >
                {creditsRemaining} credits remaining
            </p>
            {creditsRemaining <= 50 && (
                <Link href="/products" passHref>
                    <Button
                        variant="upsell_link"
                        className="flex flex-row items-center gap-2 pl-0"
                        size="sm"
                    >
                        <Sparkles size={16} />
                        {hasNoCredits
                            ? "Subscribe to continue"
                            : "Get unlimited access"}
                    </Button>
                </Link>
            )}
        </div>
    );
};

export default CreditsRemaining;
