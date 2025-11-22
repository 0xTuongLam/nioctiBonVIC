"use client"

import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { WagmiProvider, cookieToInitialState, type Config } from "wagmi"
import { createAppKit } from "@reown/appkit/react"
import { config, networks, projectId, wagmiAdapter, victionMainnet } from "@/config"

const queryClient = new QueryClient()

const metadata = {
  name: "nioctiB Token Presale",
  description: "Join the CTB Token Presale on Viction Mainnet",
  url: typeof window !== "undefined" ? window.location.origin : "https://nioctib.vercel.app",
  icons: ["https://pbs.twimg.com/profile_images/1992127967460474881/4RycsQnl_400x400.jpg"],
}

// Initialize AppKit outside the component render cycle
if (!projectId) {
  console.error("AppKit Initialization Error: Project ID is missing.")
} else {
  createAppKit({
    adapters: [wagmiAdapter],
    projectId: projectId!,
    networks: networks,
    defaultNetwork: victionMainnet,
    metadata,
    features: { analytics: true },
  })
}

export default function ContextProvider({
  children,
  cookies,
}: {
  children: ReactNode
  cookies: string | null
}) {
  const initialState = cookieToInitialState(config as Config, cookies)

  return (
    <WagmiProvider config={config as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
