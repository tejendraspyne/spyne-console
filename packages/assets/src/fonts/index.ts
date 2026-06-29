// Shared fonts — defined ONCE here and consumed by every app via
// `import { geistSans, geistMono } from "@repo/assets/fonts"`.
//
// The next/font/local loader call lives in this package; apps that list
// "@repo/assets" in `transpilePackages` get the statically-analyzable result.
// The .woff files live in raw/fonts/ (the single copy for the whole repo).
import localFont from "next/font/local";

export const geistSans = localFont({
  src: "../../raw/fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  display: "swap",
});

export const geistMono = localFont({
  src: "../../raw/fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  display: "swap",
});

/** Convenience: the two font CSS-variable classNames joined, for <body>. */
export const fontVariables = `${geistSans.variable} ${geistMono.variable}`;
