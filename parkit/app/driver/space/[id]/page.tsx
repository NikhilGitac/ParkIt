import { Suspense } from "react";
import SpaceDetailView from "./space-detail-view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Parking Space Details | ParKit",
  description: "View parking space rates, availability schedule, location, and host details.",
};

async function SpaceDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SpaceDetailView id={id} />;
}

export default function SpaceDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="w-8 h-8 border-4 border-[#2FD08A] border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <SpaceDetailContent params={props.params} />
    </Suspense>
  );
}
