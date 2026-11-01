import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Idea Vault | Think clearly. Build deliberately.",
  description: "A private workspace for capturing, developing, evaluating and executing ideas.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}