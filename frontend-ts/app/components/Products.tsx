"use client";

import { useRouter } from "next/navigation";
import ToyPicker from "./ToyPicker";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { updateUser } from "@/db/users";

const IMAGE_SIZE = 200;

interface ProductsProps {
    allToys: IToy[];
    toy?: IToy;
    user?: IUser;
}

const Products: React.FC<ProductsProps> = ({ allToys, toy, user }) => {
    const supabase = createClientComponentClient();
    const router = useRouter();

    const pickToy = async (toy: IToy) => {
        if (user) {
            await updateUser(
                supabase,
                { ...user, toy_id: toy.toy_id },
                user.user_id
            );
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
            showCurrent={false}
        />
    );
};

export default Products;
