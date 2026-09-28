"use client";
import { usePathname } from "next/navigation";
import AppNav from "./AppNav";

export default function ConditionalNav() {
  const path = usePathname();
  // Hide global nav on homepage — it has its own custom nav
  if (path === "/") return null;
  return <AppNav title="ResQ-Ops" />;
}
