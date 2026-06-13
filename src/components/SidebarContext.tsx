"use client";

import { createContext, useContext, useState } from "react";

const SidebarContext = createContext({
  open: false,
  setOpen: (_: boolean) => {},
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <SidebarContext.Provider value={{ open, setOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

export const useSidebar = () => useContext(SidebarContext);
