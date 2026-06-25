import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"

import "./globals.css"

import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { BrandThemeInitializer } from "@/components/color-theme"

export const metadata: Metadata = {
  title: "SmartSEO",
  description:
    "Dashboard SEO intelligent pour Google Analytics, Search Console et recommandations IA.",
  generator: "SmartSEO",
  icons: {
    icon: "/smartseo-mark.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
      data-brand="mobelite"
    >
      <body className="font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <BrandThemeInitializer />

          <Suspense fallback={null}>
            {children}
            <Analytics />
          </Suspense>

          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
