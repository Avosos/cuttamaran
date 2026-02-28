import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cuttamaran",
  description: "A beautiful, open-source desktop video editor",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", overflow: "hidden" }}>
        {children}
      </body>
    </html>
  );
}
