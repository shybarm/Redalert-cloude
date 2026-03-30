import type { Metadata } from "next";
import "@fontsource-variable/noto-sans-hebrew";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "שמאי AI - הערכת שווי ויצירת מודעות בינה מלאכותית",
  description:
    "צלם את הפריט שלך וקבל הערכת שווי מיידית ומודעת מכירה מוכנה. שמאי AI מנתח את השוק ונותן לך את המחיר הנכון.",
  keywords: [
    "שמאי",
    "הערכת שווי",
    "מכירת יד שנייה",
    "מודעת מכירה",
    "בינה מלאכותית",
    "AI",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className="font-sans antialiased">
        {children}
        <Toaster position="top-center" dir="rtl" />
      </body>
    </html>
  );
}
