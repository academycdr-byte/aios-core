import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Providers } from "@/components/layout/providers"
import { AppLayout } from "@/components/layout/app-layout"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: "ERP Agency | Performance Digital",
  description: "ERP para agências de performance digital especializadas em e-commerces",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="font-sans">
        <Providers>
          <AppLayout>{children}</AppLayout>
        </Providers>
      </body>
    </html>
  )
}
