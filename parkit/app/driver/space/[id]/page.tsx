import { Suspense } from "react";
import SpaceDetailView from "./space-detail-view";
import { Metadata } from "next";

export const instant = false;

export const metadata: Metadata = {
  title: "Parking Space Details | ParKit",
  description: "View parking space rates, availability schedule, location, and host details.",
};

export default async function SpaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="w-8 h-8 border-4 border-[#2FD08A] border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <SpaceDetailView id={id} />
    </Suspense>
  );
}
