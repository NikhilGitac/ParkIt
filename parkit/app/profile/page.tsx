import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Metadata } from "next";
import ProfileView from "./profile-view";

export const metadata: Metadata = {
  title: "My Profile & Activity | ParKit",
  description: "Manage your ParKit profile, vehicles, driver reservations, and host spaces.",
};

async function ProfileServerGate() {
  await connection();
  await cookies();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/profile");
  }

  return <ProfileView userId={user.id} userEmail={user.email || ""} />;
}

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function ProfilePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] overflow-x-hidden w-full max-w-full">
      <Header />
      <div className="flex-1 overflow-x-hidden w-full max-w-full">
        <Suspense
          fallback={
            <div className="min-h-[70vh] flex items-center justify-center p-4">
              <div className="w-10 h-10 border-4 border-[#2FD08A] border-t-transparent rounded-full animate-spin"></div>
            </div>
          }
        >
          <ProfileServerGate />
        </Suspense>
      </div>
      <Footer />
    </div>
  );
}
