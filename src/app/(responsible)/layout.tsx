import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ResponsibleSidebar } from "@/components/layout/responsible-sidebar";
import { Header } from "@/components/layout/header";

export default async function ResponsibleLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "RESPONSIBLE") redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden">
      <ResponsibleSidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
