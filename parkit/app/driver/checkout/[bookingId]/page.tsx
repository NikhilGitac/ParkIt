import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import CheckoutView from "./checkout-view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout & Reservation | ParKit Driver",
  description: "Confirm and complete your parking reservation on ParKit.",
};

async function CheckoutContent({
  params,
  searchParams,
}: {
  params: Promise<{ bookingId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  await cookies();

  const { bookingId } = await params;
  const sp = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(sp || {})) {
      if (typeof value === "string") qs.set(key, value);
    }
    const queryString = qs.toString();
    const destination = `/driver/checkout/${bookingId}${queryString ? `?${queryString}` : ""}`;
    redirect(`/login?next=${encodeURIComponent(destination)}`);
  }

  return <CheckoutView id={bookingId} />;
}

export default function CheckoutPage(props: {
  params: Promise<{ bookingId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="w-8 h-8 border-4 border-[#2FD08A] border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <CheckoutContent params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}
