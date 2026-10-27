import { Suspense } from "react";
import VerifyView from "./verify-view";

export const instant = false;

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#2FD08A] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <VerifyView bookingId={bookingId} />
    </Suspense>
  );
}
