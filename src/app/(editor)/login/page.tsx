import { Suspense } from "react";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
