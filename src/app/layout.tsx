import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cuttamaran",
  description: "A beautiful, open-source desktop video editor",
};

/**
 * Inline script reads the persisted theme from localStorage and applies
 * `data-theme` before first paint to avoid a flash of wrong colours.
 */
const themeInitScript = `
(function(){
  try {
    var s = JSON.parse(localStorage.getItem("cuttamaran_settings") || "{}");
    if (s.theme === "light") document.documentElement.setAttribute("data-theme","light");
    if (s.accentColor && s.accentColor !== "purple") document.documentElement.setAttribute("data-accent", s.accentColor);
  } catch(e){}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="antialiased" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", overflow: "hidden" }}>
        {children}
      </body>
    </html>
  );
}
