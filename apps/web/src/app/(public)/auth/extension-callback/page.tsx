"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { createClient } from "@/app/_libs/supabase/client";

type Status = "working" | "sent" | "error";

function getExtensionId(searchParams: URLSearchParams): string {
  return searchParams.get("extId") ?? "";
}

export default function ExtensionCallbackPage() {
  const searchParams = useSearchParams();
  const extId = useMemo(() => getExtensionId(searchParams), [searchParams]);

  const [status, setStatus] = useState<Status>("working");
  const [message, setMessage] = useState<string>("Finishing sign-in…");

  useEffect(() => {
    (async () => {
      if (!extId) {
        setStatus("error");
        setMessage("Missing extension id (extId). Please retry from the extension.");
        return;
      }

      const supabase = createClient();

      // Let Supabase client parse URL and exchange code if needed
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      const session = data.session;
      if (!session) {
        setStatus("error");
        setMessage("No session found after login. Please retry.");
        return;
      }

      // Send session to extension (requires externally_connectable in manifest)
      const runtime = (globalThis as any).chrome?.runtime;
      if (!runtime?.sendMessage) {
        setStatus("error");
        setMessage("Extension messaging not available. Is the extension installed and enabled?");
        return;
      }

      await new Promise<void>((resolve, reject) => {
        runtime.sendMessage(
          extId,
          { type: "KURATE_AUTH_SESSION", session },
          (response: any) => {
            const lastError = runtime.lastError;
            if (lastError) {
              reject(new Error(lastError.message));
              return;
            }
            if (!response?.ok) {
              reject(new Error(response?.error ?? "Failed to sync session to extension"));
              return;
            }
            resolve();
          },
        );
      });

      setStatus("sent");
      setMessage("Signed in. Taking you home…");
      setTimeout(() => { window.location.href = "/home"; }, 600);
    })().catch((e) => {
      setStatus("error");
      setMessage(e instanceof Error ? e.message : "Login failed");
    });
  }, [extId]);

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Kurate</h1>
      <p className="mt-3 text-sm text-slate-600">{message}</p>
      {status === "working" ? (
        <div className="mt-6 h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
      ) : null}
    </main>
  );
}

