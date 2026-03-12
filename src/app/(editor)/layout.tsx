import SessionGuard from "@/components/auth/SessionGuard";

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <SessionGuard />
      {children}
    </div>
  );
}
