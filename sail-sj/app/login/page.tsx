
"use client";

import { useEffect } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  useEffect(() => {
    document.title = "Sign In To Continue";
  }, []);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070b18] px-5 py-10 text-white">

      {/* Animated background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-indigo-600/15 blur-[150px]" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-blue-600/15 blur-[150px]" />
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-indigo-400/[0.06]" />
        <div className="absolute left-1/2 top-1/2 h-[850px] w-[850px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-indigo-400/[0.04]" />
      </div>

      {/* Login content */}
      <section className="relative z-10 w-full max-w-md">

        {/* Logo */}
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[26px] border border-indigo-400/20 bg-indigo-500/[0.08] shadow-[0_0_60px_rgba(99,102,241,0.15)]">
            <svg
              viewBox="0 0 80 80"
              className="h-12 w-12 text-indigo-400"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M40 5C54 19 65 35 65 48C65 54 59 60 50 60H40V5Z"
                fill="currentColor"
              />
              <path
                d="M36 12C34 31 24 45 8 58C23 52 34 53 40 56V12H36Z"
                fill="currentColor"
                opacity=".7"
              />
              <path
                d="M5 65C18 57 29 58 40 63C51 68 63 67 75 60C68 72 55 76 40 72C26 68 16 67 5 72C2 73 2 68 5 65Z"
                fill="currentColor"
              />
            </svg>
          </div>

          <h1 className="text-5xl font-bold tracking-[-0.06em]">
            Sail<span className="text-indigo-400">.</span>
          </h1>

          <p className="mt-3 text-sm tracking-wide text-slate-400">
            A simpler way to access your workspace.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-7 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:p-9">

          <div className="mb-8 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">
              Welcome back
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Sign in to continue to your workspace.
            </p>
          </div>

          {/* Google button */}
          <button
            type="button"
            onClick={() =>
              signIn("google", {
                callbackUrl: "/index.html",
              })
            }
            className="google-button group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl border border-white/10 bg-white px-5 py-[18px] text-[15px] font-semibold text-[#151827] transition-all duration-300 ease-out hover:-translate-y-1 hover:border-indigo-300/70 hover:bg-white hover:shadow-[0_12px_50px_rgba(99,102,241,0.35)] active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-4 focus-visible:ring-offset-[#101426]"
          >
            {/* Shimmer */}
            <span className="pointer-events-none absolute inset-0 -translate-x-[150%] skew-x-[-20deg] bg-gradient-to-r from-transparent via-indigo-200/70 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[150%]" />

            {/* Google icon */}
            <svg
              className="relative z-10 h-[22px] w-[22px] shrink-0 transition-transform duration-300 group-hover:rotate-[8deg] group-hover:scale-110"
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

            <span className="relative z-10">
              Continue with Google
            </span>

            {/* Arrow */}
            <svg
              className="relative z-10 ml-auto h-5 w-5 text-slate-400 transition-all duration-300 group-hover:translate-x-1 group-hover:text-indigo-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14" />
              <path d="m13 6 6 6-6 6" />
            </svg>
          </button>

          {/* Divider */}
          <div className="my-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-white/[0.08]" />
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">
              Secure authentication
            </span>
            <div className="h-px flex-1 bg-white/[0.08]" />
          </div>

          {/* Security */}
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <svg
              className="h-4 w-4 text-emerald-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            Your connection is private and secure
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-slate-600">
          Protected access · Sail
        </p>
      </section>

      {/* Button glow animation */}
      <style jsx>{`
        .google-button {
          isolation: isolate;
        }

        .google-button::before {
          content: "";
          position: absolute;
          inset: -2px;
          z-index: -1;
          border-radius: inherit;
          background: linear-gradient(
            110deg,
            #6366f1,
            #a855f7,
            #3b82f6,
            #6366f1
          );
          background-size: 300% 100%;
          opacity: 0;
          transition: opacity 300ms ease;
          animation: gradient-flow 4s linear infinite;
        }

        .google-button:hover::before {
          opacity: 1;
        }

        @keyframes gradient-flow {
          from {
            background-position: 0% 50%;
          }
          to {
            background-position: 300% 50%;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .google-button,
          .google-button *,
          .google-button::before {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </main>
  );
}
