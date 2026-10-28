import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import ListSpaceView from "./list-space-view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "List Your Space | ParKit Host",
  description: "Monetize your empty driveway or parking bay on ParKit. Fast, secure, and fully verified.",
};

async function ListSpaceServerGate() {
  await connection();
  await cookies();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/owner/list-space");
  }

  return <ListSpaceView />;
}

export default function ListSpacePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
          <div className="w-10 h-10 border-4 border-[#2FD08A] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ListSpaceServerGate />
    </Suspense>
  );
}
