import { GlassButton } from "@/components/ui/GlassButton";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 text-center">
      <div className="relative z-10">
        <h1 className="text-6xl font-bold text-white mb-6 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
          Wedding Hall <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-blue-200">
            Calendar & Calculator
          </span>
        </h1>
        <p className="text-xl text-white/70 mb-12 max-w-2xl mx-auto">
          A high-fidelity, tablet-first display tool for visualizing availability and estimating costs with a beautiful liquid glass interface.
        </p>

        <Link href="/hall/grand-ballroom">
          <GlassButton size="lg" className="text-xl px-12 py-6">
            Launch Demo
          </GlassButton>
        </Link>
      </div>
    </main>
  );
}
