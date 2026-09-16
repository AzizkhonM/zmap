import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://zzmapp.vercel.app/"),

  title: {
    default: "ZMap — CS2 Map Veto",
    template: "%s | ZMap",
  },

  description:
    "Run CS2 map vetoes for BO1, BO3 and BO5 matches. Create a veto room, invite teams with dedicated links, and manage bans, picks and side selection in real time.",

  alternates: {
    canonical: "/",
  },

  icons: {
    icon: "/logo.svg",
  },

  keywords: [
    "CS2 map veto",
    "CS2 veto",
    "CS2 map veto tool",
    "CS2 BO1 veto",
    "CS2 BO3 veto",
    "CS2 BO5 veto",
    "Counter-Strike 2 map veto",
    "CS2 map picker",
  ],

  applicationName: "ZMap",

  openGraph: {
    title: "ZMap — CS2 Map Veto",
    description: "Run CS2 map vetoes for BO1, BO3 and BO5 matches.",
    siteName: "ZMap",
    type: "website",
  },

  twitter: {
    card: "summary",
    title: "ZMap — CS2 Map Veto",
    description: "Run CS2 map vetoes for BO1, BO3 and BO5 matches.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
