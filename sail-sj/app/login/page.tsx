
"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#080b1a] text-[#e5e7eb] p-6">
      <div className="w-full max-w-[520px]">
        <section className="w-full rounded-[24px] bg-[#080d20] px-[22px] pt-6 pb-5 border border-[rgba(129,140,248,0.35)] shadow-[0_22px_60px_rgba(15,23,42,0.95),0_0_0_1px_rgba(129,140,248,0.12)]">

          {/* Heading */}
          <div className="flex flex-col items-center gap-2 mb-4 text-center">
            <div className="text-[17px] font-semibold text-[#f9fafb]">
              Sail — secure access
            </div>

            <div className="text-[11px] px-[10px] py-1 rounded-full bg-[rgba(99,102,241,0.1)] border border-[rgba(129,140,248,0.4)] text-[#a5b4fc] uppercase tracking-[0.14em] whitespace-nowrap">
              Sign in required
            </div>
          </div>

          {/* Description */}
          <p className="m-0 mb-4 text-center text-[13px] leading-relaxed text-[#9ca3af]">
            Sign in with Google to continue to{" "}
            <span className="text-[#e5e7eb] font-medium">
              sail-sj-chi
            </span>
            . Your access choice is saved automatically — you can change it
            anytime by revisiting this page.
          </p>

          {/* Google Sign In */}
          <div className="mt-[18px] flex justify-center">
            <button
              type="button"
              onClick={() =>
                signIn("google", {
                  callbackUrl: "/index.html",
                })
              }
              className="inline-flex items-center justify-center gap-2 px-5 py-[10px] rounded-full border border-[rgba(148,163,184,0.7)] bg-[#f9fafb] text-[#020617] text-[13px] font-medium hover:bg-[#e5e7eb] hover:-translate-y-[0.5px] hover:shadow-[0_12px_30px_rgba(99,102,241,0.2)] transition-all duration-150 cursor-pointer"
            >
              {/* Google Logo */}
              <svg
                className="w-4 h-4 shrink-0"
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

          {/* Footer */}
          <p className="mt-[14px] text-center text-[11px] leading-relaxed text-[#818cf8]">
            Saved automatically — change anytime by revisiting this page.
          </p>
        </section>
      </div>
    </main>
  );
}
