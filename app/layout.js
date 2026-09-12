import PlausibleProvider from 'next-plausible'
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

export const metadata = {
  title: "AuraChat - Premium Gemini AI Companion",
  description: "Experience a state-of-the-art AI assistant powered by Google Gemini, equipped with voice synthesis, prompt engineering magic, responsive workspace integration, and real-time response streaming.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning={true}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning={true}>
        <PlausibleProvider src="https://analytics.staging.at16th.com/js/pa-v7pyI_koOis0GXDFr1Z5Z.js" init={{ captureOnLocalhost: true }}>
          {children}  

          </PlausibleProvider>
</body>
    </html>
  );
}
