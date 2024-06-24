"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getToyByName } from "@/db/toys";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Messages from "../login/messages";

const ToyPreview = () => {
    const [toy, setToy] = useState<IToy | undefined>(undefined);
    const searchParams = useSearchParams();
    const toyName = searchParams.get("toy");
    const supabase = createClientComponentClient();

    const getToy = useCallback(async (name: string | null) => {
        if (name) {
            const toy = await getToyByName(supabase, name);
            setToy(toy);
        }
    }, []);

    useEffect(() => {
        getToy(toyName);
    }, [toyName, getToy]);

    return (
        <>
            {toy ? (
                <div className="flex flex-col items-center gap-2 mx-auto font-quicksand">
                    <Image
                        src={"/" + toy.image_src + ".png"}
                        width={100}
                        height={100}
                        alt={toy.name}
                    />
                    <p className="font-medium">
                        You picked{" "}
                        <span className="font-semibold">{toy.name}</span>
                    </p>
                </div>
            ) : null}
        </>
    );
};

export default ToyPreview;
