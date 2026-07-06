import type { Metadata } from "next";
import { CssVarsProvider } from "@mui/joy/styles";
import CssBaseline from "@mui/joy/CssBaseline";
import "./globals.css";

export const metadata: Metadata = {
  title: "AUM ERP",
  description: "AUM ERP frontend",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <CssVarsProvider defaultMode="light">
          <CssBaseline />
          {children}
        </CssVarsProvider>
      </body>
    </html>
  );
}
