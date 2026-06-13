"use client";

import { ReactNode } from "react";

export default function StudentActionCell({ children }: { children: ReactNode }) {
  return (
    <td onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-2">{children}</div>
    </td>
  );
}
