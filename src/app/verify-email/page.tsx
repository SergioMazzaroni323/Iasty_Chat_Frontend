import { Suspense } from "react";
import VerifyEmailClient from "./VerifyEmailClient";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="app-shell flex min-h-screen items-center justify-center p-4">
          <div className="surface-3d rounded-2xl px-8 py-6 text-sm" style={{ color: "var(--fg-muted)" }}>
            Loading...
          </div>
        </div>
      }
    >
      <VerifyEmailClient />
    </Suspense>
  );
}
