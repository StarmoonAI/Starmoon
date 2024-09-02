import { getUserById } from "@/db/users";
import { getToyById } from "@/db/toys";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { User } from "@supabase/supabase-js";
import { dbGetRecentMessages } from "@/db/conversations";
import Playground from "../components/playground/PlaygroundComponent";

async function getData(user: User) {
  const supabase = createClient();
  const dbUser = await getUserById(supabase, user!.id);
  // The return value is *not* serialized
  // You can return Date, Map, Set, etc.

  if (!dbUser) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error("Failed to fetch data");
  }

  return dbUser;
}

export default async function Home() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const dbUser = await getUserById(supabase, user!.id);
  const accessToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Imp1bnJ1eGlvbmdAZ21haWwuY29tIiwidXNlcl9pZCI6IjAwNzljZWU5LTE4MjAtNDQ1Ni05MGE0LWU4YzI1MzcyZmUyOSIsImNyZWF0ZWRfdGltZSI6IjIwMjQtMDctMDhUMDA6MDA6MDAuMDAwWiJ9.tN8PhmPuiXAUKOagOlcfNtVzdZ1z--8H2HGd-zk6BGE";

  if (!accessToken) {
    throw new Error();
  }

  return (
    <div className="">
      {dbUser && (
        <div className="">
          <Playground
            selectedUser={dbUser}
            selectedToy={dbUser.toy!}
            accessToken={accessToken}
          />
        </div>
      )}
    </div>
  );
}
