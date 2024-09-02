import { createClient } from "@/utils/supabase/server";
import { getUserById } from "@/db/users";
import Onboard from "../components/Onboard";

export default async function Home() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  console.log(user);

  const dbUser = user ? await getUserById(supabase, user.id) : undefined;
  console.log("User+++", dbUser);

  return (
    <div className="flex flex-col gap-2 font-quicksand">
      {dbUser && <Onboard selectedUser={dbUser} />}
    </div>
  );
}
