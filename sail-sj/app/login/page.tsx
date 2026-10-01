
"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#09090b] px-6 text-white">

      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-indigo-500/[0.07] blur-[140px]" />
        <div className="absolute bottom-[-300px] left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-violet-500/[0.06] blur-[140px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex w-full max-w-sm flex-col items-center text-center">

        {/* Brand */}
        <div className="mb-12">
          <h1 className="text-7xl font-semibold tracking-[-0.09em]">
            sail<span className="text-indigo-400">.</span>
          </h1>
        </div>

        {/* Heading */}
        <div className="mb-10">
          <h2 className="text-2xl font-medium tracking-tight text-white">
            Welcome to Sail
          </h2>
          <p className="mt-3 text-sm text-zinc-500">
            Sign in to continue
          </p>
        </div>

        {/* Google Sign In */}
        <button
          type="button"
          onClick={() =>
            signIn("google", {
              callbackUrl: "/index.html",
            })
          }
          className="group flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white px-6 py-[17px] text-sm font-semibold text-zinc-900 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-indigo-300 hover:bg-indigo-50 hover:shadow-[0_12px_40px_rgba(99,102,241,0.25)] active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-4 focus-visible:ring-offset-[#09090b]"
        >
          {/* Google Icon */}
          <svg
            className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110"
            viewBox="0 0 48 48"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              fill="#4285F4"
              d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15Z"
            />
            <path
              fill="#34A853"
              d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.1c-1.8 1.2-4.1 1.9-6.9 1.9-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20 20 0 0 0 24 44Z"
            />
            <path
              fill="#FBBC05"
              d="M12.6 27.5a12 12 0 0 1 0-7.1v-5.3H5.8a20 20 0 0 0 0 17.7l6.8-5.3Z"
            />
            <path
              fill="#EA4335"
              d="M24 12c3 0 5.7 1 7.8 3.1l5.8-5.8C34.1 6 29.5 4 24 4A20 20 0 0 0 5.8 15.1l6.8 5.3C14.2 15.6 18.7 12 24 12Z"
            />
          </svg>

          <span>Continue with Google</span>

          <svg
            className="ml-auto h-4 w-4 text-zinc-400 transition-all duration-300 group-hover:translate-x-1 group-hover:text-indigo-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14" />
            <path d="m13 6 6 6-6 6" />
          </svg>
        </button>

        {/* Minimal footer */}
        <p className="mt-8 text-xs tracking-wide text-zinc-600">
          sail-sj-chi
        </p>
      </div>
    </main>
  );
}
