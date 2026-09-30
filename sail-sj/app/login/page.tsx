"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#080d20] px-5 py-10 text-[#f8fafc]">
      {/* Background glow */}
      <div className="pointer-events-none absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-indigo-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 top-0 h-96 w-96 rounded-full bg-blue-600/10 blur-[120px]" />

      {/* Login Card */}
      <section className="relative w-full max-w-[720px] rounded-[32px] border border-indigo-400/20 bg-[#080d20]/80 px-6 py-12 text-center shadow-[0_0_80px_rgba(30,64,175,0.08)] backdrop-blur-xl sm:px-12 sm:py-16">

        {/* Sail Logo */}
        <div className="mb-5 flex justify-center">
          <svg
            viewBox="0 0 80 80"
            className="h-16 w-16 text-indigo-400"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Sail logo"
            role="img"
          >
            <path
              d="M40 5C54 19 65 35 65 48C65 54 59 60 50 60H40V5Z"
              fill="currentColor"
            />
            <path
              d="M36 12C34 31 24 45 8 58C23 52 34 53 40 56V12H36Z"
              fill="currentColor"
              opacity="0.8"
            />
            <path
              d="M5 65C18 57 29 58 40 63C51 68 63 67 75 60C68 72 55 76 40 72C26 68 16 67 5 72C2 73 2 68 5 65Z"
              fill="currentColor"
            />
          </svg>
        </div>

        {/* Heading */}
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Sail
        </h1>

        <p className="mt-3 text-lg text-[#94a3c8] sm:text-xl">
          Secure access to sail-sj-chi
        </p>

        {/* Sign In Badge */}
        <div className="mx-auto mt-10 inline-flex items-center gap-3 rounded-full border border-indigo-500/40 bg-indigo-500/[0.08] px-8 py-4 text-sm font-semibold tracking-[0.12em] text-indigo-400">
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="4" y="10" width="16" height="11" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            <circle cx="12" cy="15.5" r="1" />
          </svg>
          SIGN IN REQUIRED
        </div>

        {/* Description */}
        <p className="mx-auto mt-10 max-w-[500px] text-base leading-relaxed text-[#94a3b8] sm:text-xl">
          Sign in with Google to continue to{" "}
          <span className="font-medium text-[#f8fafc]">
            sail-sj-chi
          </span>
          . Your access choice is saved automatically — you can change it
          anytime by revisiting this page.
        </p>

        {/* Google Sign In Button */}
        <div className="mt-14 flex justify-center">
          <button
            type="button"
            onClick={() =>
              signIn("google", {
                callbackUrl: "/index.html",
              })
            }
            className="group flex w-full max-w-[570px] items-center justify-center gap-5 rounded-full border border-white/80 bg-[#f8faff] px-6 py-6 text-lg font-semibold text-[#10172e] shadow-[0_0_0_rgba(99,102,241,0)] transition-all duration-300 ease-out hover:-translate-y-1 hover:border-indigo-300 hover:bg-white hover:shadow-[0_12px_45px_rgba(79,70,229,0.35)] active:translate-y-0 active:scale-[0.98] sm:text-xl"
          >
            {/* Google Logo */}
            <svg
              className="h-9 w-9 shrink-0 transition-transform duration-300 group-hover:scale-110"
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

            <span>Sign in with Google</span>
          </button>
        </div>

        {/* Divider */}
        <div className="mt-14 border-t border-indigo-300/10" />

        {/* Security Footer */}
        <div className="mt-9 flex items-center justify-center gap-3 text-sm text-[#94a3b8] sm:text-base">
          <svg
            className="h-6 w-6 shrink-0 text-indigo-300"
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
          <span>Your information is always secure.</span>
        </div>
      </section>
    </main>
  );
}
