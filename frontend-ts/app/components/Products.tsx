"use client";

import { redirect, useRouter } from "next/navigation";
import ToyPicker from "./ToyPicker";
import { updateUser } from "@/db/users";
import { createClient } from "@/utils/supabase/client";

const IMAGE_SIZE = 200;

interface ProductsProps {
    allToys: IToy[];
    toy?: IToy;
    user?: IUser;
}

const Products: React.FC<ProductsProps> = ({ allToys, toy, user }) => {
    const supabase = createClient();
    const router = useRouter();

    const pickToy = async (toy: IToy) => {
        if (user) {
            // await updateUser(
            //     supabase,
            //     { ...user, toy_id: toy.toy_id },
            //     user.user_id,
            // );
            await updateUser(supabase, { toy_id: toy.toy_id }, user.user_id);
            router.push("/home");
        } else {
            router.push(`/login?toy_id=${toy.toy_id}`);
        }
    };

    return (
        <ToyPicker
            allToys={allToys}
            chooseToy={pickToy}
            currentToy={toy}
            imageSize={IMAGE_SIZE}
            buttonText={"Get started"}
            showHelpText={true}
        />
    );
};

export default Products;
