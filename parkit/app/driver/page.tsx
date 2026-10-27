import { Metadata } from "next";
import { DriverHome } from "@/components/driver/driver-home";

export const metadata: Metadata = {
  title: "Find Parking Near You | ParKit Driver",
  description:
    "Explore guaranteed, real-time parking spaces around Greater Noida and Delhi NCR. Filter by price, distance, and instant availability.",
};

export default function DriverPage() {
  return (
    <main className="w-full h-screen overflow-hidden bg-slate-900">
      <h1 className="sr-only">ParKit Driver — Find Urban Parking Spaces</h1>
      <DriverHome />
    </main>
  );
}
