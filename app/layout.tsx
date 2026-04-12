import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HNG Badge Generator",
  description: "Create your HNG internship or mentor badge to share on social media",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-950 text-white antialiased">{children}</body>
    </html>
  );
}
