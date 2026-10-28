import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import DashboardView from "./dashboard-view";
import { Header } from "@/components/header";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Host Dashboard | ParKit",
  description: "Manage parking spaces, live bookings, earnings, and gate verifications on ParKit.",
};

async function OwnerDashboardServerGate() {
  await connection();
  await cookies();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/owner/dashboard");
  }

  return <DashboardView />;
}

export default function OwnerDashboardPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC]">
      <Header />
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
            <div className="w-10 h-10 border-4 border-[#2FD08A] border-t-transparent rounded-full animate-spin"></div>
          </div>
        }
      >
        <OwnerDashboardServerGate />
      </Suspense>
    </div>
  );
}
