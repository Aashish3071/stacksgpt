"use client";
import { useEffect } from "react";
export default function SessionControls() {
  useEffect(() => {
    const refresh = () => {
      void fetch("/api/auth/refresh", { method: "POST" }).then((r) => {
        if (!r.ok) location.href = "/admin/login";
      });
    };
    const timer = setInterval(refresh, 20 * 60000);
    return () => clearInterval(timer);
  }, []);
  return (
    <button
      className="underline text-sm mt-4"
      onClick={async () => {
        await fetch("/api/admin/login", { method: "DELETE" });
        location.href = "/admin/login";
      }}
    >
      Sign out
    </button>
  );
}
