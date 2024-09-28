"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { createInbound } from "@/db/inbound";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";

interface ClientProfileFormProps {
    className?: string;
    closeModal: () => void;
}

export const ClientProfileForm: React.FC<ClientProfileFormProps> = ({
    className,
    closeModal,
}) => {
    const { toast } = useToast();
    const [name, setName] = React.useState("");
    const [email, setEmail] = React.useState("");
    const [error, setError] = React.useState("");
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (name && email) {
            await createInbound(supabase, {
                name,
                email,
                type: "demo",
            });
            toast({
                title: "We are excited to demo you the Starmoon device!",
                description:
                    "Thanks for getting in touch. We will reach out within 24 hours.",
                duration: 5000,
                action: <span style={{ fontSize: 32 }}>🎉</span>,
            });
            closeModal();
        } else {
            setError("Please fill in all fields.");
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className={cn("grid items-start gap-4", className)}
        >
            <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                    id="name"
                    placeholder="Mr. Moon McStar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ fontSize: 16 }}
                    className="h-10"
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    type="email"
                    id="email"
                    placeholder={"star@moon.com"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ fontSize: 16 }}
                    className="h-10"
                />
            </div>
            {error && <span className="text-xs text-destructive">{error}</span>}

            <Button type="submit" variant="primary">
                <Sparkles className="mr-2" size={16} fill="white" />
                Request Starmoon Toy Demo
            </Button>
        </form>
    );
};
