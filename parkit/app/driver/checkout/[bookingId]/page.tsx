import { Suspense } from "react";
import CheckoutView from "./checkout-view";
import { Metadata } from "next";

export const instant = false;

export const metadata: Metadata = {
  title: "Checkout & Reservation | ParKit Driver",
  description: "Confirm and complete your parking reservation on ParKit.",
};

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="w-8 h-8 border-4 border-[#2FD08A] border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <CheckoutView id={bookingId} />
    </Suspense>
  );
}
