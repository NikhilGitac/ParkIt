import { Suspense } from "react";
import DashboardView from "./dashboard-view";
import { Metadata } from "next";

export const instant = false;

export const metadata: Metadata = {
  title: "Host Dashboard | ParKit",
  description: "Manage parking spaces, live bookings, earnings, and gate verifications on ParKit.",
};

export default function OwnerDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
          <div className="w-10 h-10 border-4 border-[#2FD08A] border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <DashboardView />
    </Suspense>
  );
}
