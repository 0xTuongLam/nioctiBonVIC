import { cookieStorage, createStorage } from "@wagmi/core"
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi"
import { defineChain } from "viem"

// Define Viction Mainnet
export const victionMainnet = defineChain({
  id: 88,
  name: "Viction Mainnet",
  nativeCurrency: { name: "VIC", symbol: "VIC", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.viction.xyz"] },
  },
  blockExplorers: {
    default: { name: "Vicscan", url: "https://www.vicscan.xyz" },
  },
})

// Get projectId from environment variable
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID

if (!projectId) {
  throw new Error("Project ID is not defined")
}

// Set up metadata
export const metadata = {
  name: "nioctiB Token Presale",
  description: "Join the nioctiB Token Presale",
  url: "https://nioctib.com",
  icons: ["https://pbs.twimg.com/profile_images/1992127967460474881/4RycsQnl_400x400.jpg"],
}

// Create wagmiAdapter
export const networks = [victionMainnet]

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId,
  networks,
})

export const config = wagmiAdapter.wagmiConfig
