import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { headers } from "next/headers"
import ContextProvider from "@/context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "nioctiB Token Presale",
  description: "Join the nioctiB Token Presale on Viction Mainnet",
  generator: "v0.app",
  icons: {
    icon: "https://pbs.twimg.com/profile_images/1992127967460474881/4RycsQnl_400x400.jpg",
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookies = (await headers()).get("cookie")

  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <ContextProvider cookies={cookies}>{children}</ContextProvider>
        <Analytics />
      </body>
    </html>
  )
}
