"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950">
      <button
        onClick={() => signIn("google", { callbackUrl: "/" })}
        className="px-4 py-2 rounded-full bg-white text-black"
      >
        Sign in with Google
      </button>
    </main>
  );
}
