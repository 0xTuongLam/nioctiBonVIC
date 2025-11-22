"use client"

import { wagmiAdapter, projectId, metadata, networks } from "@/config"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createAppKit } from "@reown/appkit/react"
import type { ReactNode } from "react"
import { cookieToInitialState, WagmiProvider, type Config } from "wagmi"

// Set up queryClient
const queryClient = new QueryClient()

if (!projectId) {
  throw new Error("Project ID is not defined")
}

// Create the modal
const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks,
  defaultNetwork: networks[0],
  metadata: metadata,
  features: {
    analytics: true,
  },
})

export default function AppKitProvider({
  children,
  cookies,
}: {
  children: ReactNode
  cookies: string | null
}) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
