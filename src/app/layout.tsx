import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./context/auth-context";
import AppWrapper from "./components/app-wrapper";



export const metadata: Metadata = {
  title: "MoneyWhisper",
  description: "Simple expense tracking app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased"
      >
        <AuthProvider>
          <AppWrapper>{children}</AppWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
