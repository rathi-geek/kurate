import { DM_Sans, DM_Mono } from "next/font/google";

/**
 * @description DM Sans font - Primary UI font
 */
export const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
  variable: "--font-dm-sans",
  display: "swap",
});

/**
 * @description DM Mono font - For metadata and code
 */
export const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-dm-mono",
  display: "swap",
});
