"use client";

import { useRouter } from "next/navigation";
import { ReactNode } from "react";

export default function ClickableRow({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  const router = useRouter();
  return (
    <tr
      onClick={() => router.push(href)}
      className={`cursor-pointer ${className ?? ""}`}
    >
      {children}
    </tr>
  );
}
