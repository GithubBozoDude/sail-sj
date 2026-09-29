"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="w-full max-w-md rounded-2xl bg-slate-900/80 border border-slate-700/60 p-6 shadow-2xl">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">
          Sail • secure access
        </p>

        <h1 className="text-2xl font-semibold text-slate-50 mb-2">
          Sign in to continue
        </h1>

        <p className="text-sm text-slate-400 mb-6">
          Use your Google account to access sail-sj-chi. You must sign in
          before you can view the app.
        </p>

        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/index.html" })}
          className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-white text-slate-900 text-sm font-medium py-2.5 px-4 hover:bg-slate-100 transition shadow-lg cursor-pointer"
        >
          <span className="h-4 w-4 rounded-[4px] bg-[conic-gradient(from_135deg,#4285F4_0_25%,#34A853_25%_50%,#FBBC05_50%_75%,#EA4335_75%_100%)]" />
          <span>Sign in with Google</span>
        </button>

        <p className="mt-4 text-[11px] text-slate-500">
          Your session is stored securely. Logging out will revoke your access
          until you sign in again.
        </p>
      </div>
    </main>
  );
}