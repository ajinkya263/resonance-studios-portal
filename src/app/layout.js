import "./globals.css";
import { Rozha_One, Mukta } from "next/font/google";
import MandalaBackground from "@/components/MandalaBackground";

/* Display serif with a distinct Indian character — used for headings. */
const display = Rozha_One({
  subsets: ["latin", "devanagari"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

/* Highly readable body face that also supports Devanagari. */
const body = Mukta({
  subsets: ["latin", "devanagari"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata = {
  title: "Resonance Studios — Tabla Learning Portal",
  description:
    "Structured Indian classical Tabla lessons from Resonance Studios.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="relative min-h-screen">
        {/* Fixed decorative mandala/floral layer behind everything */}
        <MandalaBackground />
        {/* All page content sits above the background */}
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
