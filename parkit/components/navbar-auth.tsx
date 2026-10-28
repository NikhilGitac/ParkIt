import { cookies } from "next/headers";
import { connection } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { NavbarUserMenu } from "./navbar-user-menu";

export async function NavbarAuth({ mobile = false }: { mobile?: boolean }) {
  // Read request data first so Next.js treats this suspended component as dynamic BEFORE calling Supabase auth
  await connection();
  await cookies();

  let user: { id: string; email?: string } | null = null;
  let userRole: "driver" | "owner" | null = null;
  let userName: string | null = null;
  let userAvatar: string | null = null;
  let hostStatus: string | null = null;
  let driverStatus: string | null = null;

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        user = { id: authUser.id, email: authUser.email };

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, role, avatar_url, host_status, driver_status")
          .eq("id", authUser.id)
          .maybeSingle();

        if (profile) {
          userRole = profile.role as "driver" | "owner";
          userName = profile.full_name;
          userAvatar = profile.avatar_url;
          hostStatus = profile.host_status;
          driverStatus = profile.driver_status;
        } else if (authUser.user_metadata) {
          userRole = authUser.user_metadata.role;
          userName = authUser.user_metadata.full_name;
          userAvatar = authUser.user_metadata.avatar_url;
        }
      }
    } catch (err) {
      // In case of any network or connection error, render fallback guest state
      user = null;
    }
  }

  return (
    <NavbarUserMenu
      user={user}
      userRole={userRole}
      userName={userName}
      userAvatar={userAvatar}
      hostStatus={hostStatus}
      driverStatus={driverStatus}
      mobile={mobile}
    />
  );
}
