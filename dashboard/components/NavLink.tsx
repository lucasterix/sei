"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={`block rounded-lg px-3 py-1.5 text-sm ${
        active ? "bg-accent/10 font-medium text-accent" : "text-ink2 hover:bg-line/40 hover:text-ink"
      }`}
    >
      {label}
    </Link>
  );
}
