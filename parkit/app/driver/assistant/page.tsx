import { Suspense } from "react";
import AssistantView from "./assistant-view";
import { Metadata } from "next";

export const instant = false;

export const metadata: Metadata = {
  title: "AI Parking Concierge | ParKit",
  description: "Get real-time, personalized parking recommendations powered by Gemini AI.",
};

export default function AssistantPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen bg-[#F8FAFC] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#2FD08A] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AssistantView />
    </Suspense>
  );
}
