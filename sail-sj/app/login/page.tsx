```tsx
"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#f5f5f7] px-5 text-[#111]">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center">
        <div className="rounded-[28px] bg-white p-8 shadow-[0_20px_70px_rgba(0,0,0,0.08)] sm:p-10">

          {/* Logo */}
          <div className="mb-12">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-lg font-bold text-white">
              S
            </div>
          </div>

          {/* Intro */}
          <div className="mb-8">
            <p className="mb-3 text-sm font-medium text-zinc-400">
              Welcome back
            </p>

            <h1 className="text-4xl font-semibold tracking-[-0.04em]">
              Sign in to Sail
            </h1>

            <p className="mt-3 max-w-xs text-sm leading-6 text-zinc-500">
              Continue with your Google account to access your workspace.
            </p>
          </div>

          {/* Google Button */}
          <button
            type="button"
            onClick={() =>
              signIn("google", {
                callbackUrl: "/index.html",
              })
            }
            className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-sm font-semibold text-zinc-800 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.10)] active:translate-y-0 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
          >
            {/* Hover background */}
            <span className="absolute inset-0 -translate-x-full bg-zinc-50 transition-transform duration-500 ease-out group-hover:translate-x-0" />

            {/* Google Icon */}
            <svg
              className="relative z-10 h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-105"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fill="#4285F4"
                d="M21.35 12.23c0-.79-.07-1.55-.2-2.28H12v4.31h5.22a4.46 4.46 0 0 1-1.94 2.93v2.39h3.14c1.84-1.69 2.93-4.18 2.93-7.35Z"
              />
              <path
                fill="#34A853"
                d="M12 21.6c2.63 0 4.84-.87 6.45-2.36l-3.14-2.39c-.87.58-1.98.92-3.31.92-2.55 0-4.71-1.72-5.49-4.04H3.27v2.47A9.75 9.75 0 0 0 12 21.6Z"
              />
              <path
                fill="#FBBC05"
                d="M6.51 13.73a5.86 5.86 0 0 1 0-3.46V7.8H3.27a9.74 9.74 0 0 0 0 8.4l3.24-2.47Z"
              />
              <path
                fill="#EA4335"
                d="M12 6.23c1.43 0 2.72.49 3.74 1.45l2.8-2.8C16.83 3.32 14.62 2.4 12 2.4a9.75 9.75 0 0 0-8.73 5.4l3.24 2.47C7.29 7.95 9.45 6.23 12 6.23Z"
              />
            </svg>

            <span className="relative z-10">
              Continue with Google
            </span>

            {/* Arrow */}
            <svg
              className="relative z-10 ml-auto h-4 w-4 text-zinc-400 transition-all duration-300 group-hover:translate-x-1 group-hover:text-zinc-900"
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

          {/* Divider */}
          <div className="my-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-zinc-100" />
            <span className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
              Secure sign in
            </span>
            <div className="h-px flex-1 bg-zinc-100" />
          </div>

          <p className="text-center text-xs leading-5 text-zinc-400">
            By continuing, you agree to Sail's terms and privacy policy.
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-400">
          © 2026 Sail
        </p>
      </div>
    </main>
  );
}
```
