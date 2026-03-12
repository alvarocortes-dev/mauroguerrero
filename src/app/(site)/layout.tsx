import { SidebarContent } from "@/components/SidebarContent";
import { MobileMenu } from "@/components/MobileMenu";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen bg-background text-foreground transition-colors duration-300 overflow-hidden">
      <MobileMenu />
      <div className="mx-auto flex h-full w-full max-w-[2500px] gap-8 px-6 pb-10 pt-24 lg:pt-10 lg:gap-20 xl:gap-32">
        <main className="flex-1 h-full overflow-y-auto no-scrollbar">
          {children}
        </main>
        <aside className="hidden w-[220px] shrink-0 flex-col gap-6 lg:flex">
          <SidebarContent />
        </aside>
      </div>
    </div>
  );
}
