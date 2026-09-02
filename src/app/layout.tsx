import type { Metadata } from "next";

import { StaleActionRecovery } from "./stale-action-recovery";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClinicBoost SMS",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-AU">
      <body className="bg-neutral-50 text-neutral-900 antialiased">
        <StaleActionRecovery />
        {children}
      </body>
    </html>
  );
}
