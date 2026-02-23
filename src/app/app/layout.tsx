"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useSoulmapStore, selectCurrentProfile } from "@/store/useSoulmapStore";

const TABS = [
  { href: "/app/blueprint", label: "Blueprint" },
  { href: "/app/oracle", label: "Oracle" },
  { href: "/app/library", label: "Wisdom Vault" },
  { href: "/app/spark", label: "Spark" },
  { href: "/app/meditation", label: "Still Point" },
];

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const currentProfile = useSoulmapStore(selectCurrentProfile);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--page-bg)]">
      <header className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--page-bg)] px-4 py-3">
        <Link
          href="/app/blueprint"
          className="font-display text-xl font-normal tracking-tight text-[var(--psychic-purple)]"
        >
          SoulMap
        </Link>
        <Link
          href="/app/profiles"
          className="border border-[var(--border)] px-3 py-2 text-xs font-normal uppercase tracking-[0.1em] text-[var(--primary)] transition-colors duration-200 hover:bg-[var(--primary)] hover:text-[var(--page-bg)]"
        >
          <span className="max-w-[100px] truncate">
            {currentProfile?.name ?? "Profiles"}
          </span>
        </Link>
      </header>

      <main className="flex-1 overflow-auto pb-[calc(5rem+env(safe-area-inset-bottom,0px))]">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="min-h-full"
        >
          {children}
        </motion.div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-[var(--border)] bg-[var(--page-bg)] pb-[env(safe-area-inset-bottom,0px)]">
        <div className="flex justify-around gap-1 py-3">
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex min-h-[44px] min-w-0 items-center justify-center border-t-2 px-3 py-3 pt-2 text-center text-[0.75rem] font-medium uppercase tracking-[0.12em] transition-colors duration-200 ${
                pathname === tab.href
                  ? "border-[var(--psychic-purple)] text-[var(--primary)]"
                  : "border-transparent text-[var(--stone)] hover:text-[var(--primary)]"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
