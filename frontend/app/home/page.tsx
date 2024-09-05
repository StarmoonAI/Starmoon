import { createUser, doesUserExist, getUserById } from "@/db/users";
import { getToyById } from "@/db/toys";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { User } from "@supabase/supabase-js";
import { dbGetRecentMessages } from "@/db/conversations";
import Playground from "../components/playground/PlaygroundComponent";
import { defaultToyId } from "@/lib/data";

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

  if (user) {
    const userExists = await doesUserExist(supabase, user);
    if (!userExists) {
      // Create user if they don't exist
      await createUser(supabase, user, {
        toy_id: user?.user_metadata?.toy_id ?? defaultToyId,
      });
      redirect("/onboard");
    }
  }

  const dbUser = await getUserById(supabase, user!.id);
  const accessToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Imp1bnJ1eGlvbmdAZ21haWwuY29tIiwidXNlcl9pZCI6ImZkYWY1NWI2LTFkY2QtNDE0OC1iZDVjLTA0MDI0MDQxM2E0MiIsImNyZWF0ZWRfdGltZSI6IjIwMjQtMDktMDNUMTI6Mzg6NTIuNzAyNDUxIn0.91BWSMx69KdUIuS2lHmdnJu70J3Zu4fBpkMoGw4iOY8";

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
