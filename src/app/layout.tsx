import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Unbounded } from "next/font/google";
import { profile, contact } from "@/data/profile";
import { THEME_BOOTSTRAP } from "@/lib/theme";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const display = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono-stack",
  subsets: ["latin"],
  display: "swap",
});

const description =
  "Tharun Adhithya G S — software developer in Chennai. A playable portfolio: walk an island built from my projects, or boot the desktop OS inside it. Led Softventory; shipped BrandThis and PitchMyWeb at Claxon AI; now freelancing.";

// Set NEXT_PUBLIC_SITE_URL in Vercel once the domain is live — it makes
// Open Graph and canonical URLs absolute instead of relative.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${profile.name} — ${profile.tagline}`,
    template: `%s — ${profile.shortName}`,
  },
  description,
  keywords: [
    "Tharun Adhithya",
    "software developer",
    "Chennai",
    "TypeScript",
    "Next.js",
    "NestJS",
    "PostgreSQL",
    "portfolio",
  ],
  authors: [{ name: profile.name, url: contact.github }],
  creator: profile.name,
  openGraph: {
    type: "website",
    title: `${profile.name} — ${profile.tagline}`,
    description,
    siteName: profile.os.name,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: `${profile.name} — ${profile.tagline}`,
    description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0b0b14",
  colorScheme: "dark light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // The bootstrap script sets data-theme before React hydrates, so the server
    // HTML and the client tree legitimately differ on that one attribute.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body className={`${inter.variable} ${mono.variable} ${display.variable} antialiased`}>{children}</body>
    </html>
  );
}
