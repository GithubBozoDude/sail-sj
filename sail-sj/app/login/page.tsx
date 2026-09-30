
"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#050816] text-[#e5e7eb] p-6">
      <div className="w-full max-w-[520px]">
        <section className="w-full rounded-[24px] bg-[#020617] px-[22px] pt-6 pb-5 border border-[rgba(148,163,184,0.4)] shadow-[0_22px_60px_rgba(15,23,42,0.95),0_0_0_1px_rgba(148,163,184,0.15)]">
          
          {/* Heading */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="text-[15px] font-semibold text-[#f9fafb]">
              Sail — secure access
            </div>

            <div className="text-[11px] px-[10px] py-1 rounded-full bg-[rgba(15,23,42,0.9)] border border-[rgba(148,163,184,0.5)] text-[#9ca3af] uppercase tracking-[0.14em] whitespace-nowrap">
              Sign in required
            </div>
          </div>

          {/* Description */}
          <p className="m-0 mb-4 text-[13px] leading-relaxed text-[#9ca3af]">
            Sign in with Google to continue to{" "}
            <span className="text-[#e5e7eb] font-medium">
              sail-sj-chi
            </span>
            . Your access choice is saved automatically — you can change it
            anytime by revisiting this page.
          </p>


          {/* Google Sign In */}
          <div className="mt-[18px] flex justify-start">
            <button
              type="button"
              onClick={() =>
                signIn("google", {
                  callbackUrl: "/index.html",
                })
              }
              className="inline-flex items-center justify-center gap-2 px-4 py-[9px] rounded-full border border-[rgba(148,163,184,0.9)] bg-[#f9fafb] text-[#020617] text-[13px] font-medium hover:bg-[#e5e7eb] hover:-translate-y-[0.5px] hover:shadow-[0_12px_30px_rgba(15,23,42,0.6)] transition-all duration-150 cursor-pointer"
            >
              <span className="w-4 h-4 shrink-0 rounded-[4px] bg-[conic-gradient(from_135deg,#4285F4_0_25%,#34A853_25%_50%,#FBBC05_50%_75%,#EA4335_75%_100%)]" />
              <span>Sign in with Google</span>
            </button>
          </div>

          {/* Footer */}
          <p className="mt-[10px] text-[11px] leading-relaxed text-[#6b7280]">
            Saved automatically — change anytime by revisiting this page.
          </p>
        </section>
      </div>
    </main>
  );
}
