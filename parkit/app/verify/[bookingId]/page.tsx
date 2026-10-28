import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import VerifyView from "./verify-view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Entry Check-in Verification | ParKit",
  description: "Verify driver entry OTP code and grant access to parking space.",
};

async function VerifyContent({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  await connection();
  await cookies();

  const { bookingId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/verify/${bookingId}`)}`);
  }

  return <VerifyView bookingId={bookingId} />;
}

export default function VerifyPage(props: {
  params: Promise<{ bookingId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#2FD08A] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <VerifyContent params={props.params} />
    </Suspense>
  );
}
