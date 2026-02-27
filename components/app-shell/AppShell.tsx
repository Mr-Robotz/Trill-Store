import * as React from "react";
import { Navbar } from "./Navbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <Navbar />
      <main className="container-x-wide py-6">{children}</main>
    </div>
  );
}