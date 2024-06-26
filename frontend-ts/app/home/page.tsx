import { getHumeAccessToken } from "@/lib/getHumeAccessToken";
import Playground from "../components/Playground";
import { getUserById } from "@/db/users";
import { getToyById } from "@/db/toys";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function Home() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  console.log("matadata+++++++", user.user_metadata);

  const dbUser = await getUserById(supabase, user!.id);
  const accessToken = await getHumeAccessToken();

  console.log("dbUser", dbUser);

  if (!accessToken) {
    throw new Error();
  }

  return (
    <div className="flex flex-col gap-2 font-baloo2">
      {dbUser && (
        <Playground
          accessToken={accessToken}
          selectedUser={dbUser}
          selectedToy={dbUser.toy!}
        />
      )}
    </div>
  );
}
