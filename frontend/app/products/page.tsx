import { Tabs } from "@/components/ui/tabs";
import ProductsAndSub from "../components/ProductsAndSub";

export default async function Home() {
    return (
        <Tabs defaultValue="products">
            <ProductsAndSub />
        </Tabs>
    );
}
