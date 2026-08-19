"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api, saveToken } from "@/lib/api";

export default function VerifyEmailClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token.");
      return;
    }

    let cancelled = false;
    api
      .verifyEmail(token)
      .then((res) => {
        if (cancelled) return;
        saveToken(res.access_token);
        setStatus("success");
        setMessage(res.message);
        window.setTimeout(() => router.replace("/"), 1500);
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Verification failed");
      });

    return () => {
      cancelled = true;
    };
  }, [token, router]);

  return (
    <div className="app-shell flex min-h-screen items-center justify-center p-4">
      <div className="surface-3d w-full max-w-md rounded-2xl p-8 text-center">
        <h1 className="text-xl font-semibold tracking-tight">Email verification</h1>
        <p
          className="mt-4 text-sm"
          style={{ color: status === "error" ? "#ef4444" : "var(--fg-secondary)" }}
        >
          {message}
        </p>
        {status === "success" ? (
          <p className="mt-4 text-sm" style={{ color: "var(--fg-muted)" }}>
            Redirecting you to Iasty...
          </p>
        ) : (
          <Link
            href="/"
            className="btn-primary mt-6 inline-flex rounded-xl px-5 py-2.5 text-sm"
          >
            Back to Iasty
          </Link>
        )}
      </div>
    </div>
  );
}
