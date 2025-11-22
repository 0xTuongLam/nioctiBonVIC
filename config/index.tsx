import { cookieStorage, createStorage, createConfig, http } from "wagmi"
import type { Chain } from "viem"

// Define Viction Mainnet as a custom chain
export const victionMainnet = {
  id: 88,
  name: "Viction Mainnet",
  nativeCurrency: {
    decimals: 18,
    name: "VIC",
    symbol: "VIC",
  },
  rpcUrls: {
    default: { http: ["https://rpc.viction.xyz/"] },
    public: { http: ["https://rpc.viction.xyz/"] },
  },
  blockExplorers: {
    default: { name: "VicScan", url: "https://www.vicscan.xyz/" },
  },
} as const satisfies Chain

// Read Project ID from environment variables
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID

// Ensure Project ID is defined at build time
if (!projectId) {
  throw new Error("NEXT_PUBLIC_PROJECT_ID is not defined. Please set it in .env.local")
}

// Define supported networks (must be non-empty array)
export const networks: [Chain, ...Chain[]] = [victionMainnet]

// Create the wagmi config manually without appkit adapter to avoid build errors
export const config = createConfig({
  chains: [victionMainnet],
  transports: {
    [victionMainnet.id]: http(),
  },
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
})
