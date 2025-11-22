"use client"

import { useEffect, useState } from "react"
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { formatEther, parseEther } from "viem"
import { victionMainnet } from "@/config"

const CONTRACT_ADDRESS = "0x7814061D2929F363a2683375A6c5e0C2aa6Ad67E"
const TOKENS_FOR_SALE = 1050000
const RATE = 167.5
const HARDCAP_VIC = TOKENS_FOR_SALE / RATE

const CONTRACT_ABI = [
  {
    inputs: [],
    name: "PRESALE_START",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "PRESALE_END",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalContributed",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "allocated",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "claim_ed",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "claimable",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "buy",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "claim",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const

export default function PresalePage() {
  const { address, isConnected } = useAccount()
  const [buyAmount, setBuyAmount] = useState<string>("")
  const [receiveAmount, setReceiveAmount] = useState<string>("0")
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [progressPercent, setProgressPercent] = useState<number>(0)

  const { data: presaleStart } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "PRESALE_START",
    chainId: victionMainnet.id,
  })

  const { data: presaleEnd } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "PRESALE_END",
    chainId: victionMainnet.id,
  })

  const { data: totalContributed } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "totalContributed",
    chainId: victionMainnet.id,
  })

  const { data: userAllocated } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "allocated",
    args: address ? [address] : undefined,
    chainId: victionMainnet.id,
  })

  const { data: userClaimed } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "claim_ed",
    args: address ? [address] : undefined,
    chainId: victionMainnet.id,
  })

  const { data: userClaimable } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "claimable",
    args: address ? [address] : undefined,
    chainId: victionMainnet.id,
  })

  const { writeContract: writeBuy, data: buyTxHash } = useWriteContract()
  const { writeContract: writeClaim, data: claimTxHash } = useWriteContract()

  const { isLoading: isBuyLoading } = useWaitForTransactionReceipt({
    hash: buyTxHash,
  })

  const { isLoading: isClaimLoading } = useWaitForTransactionReceipt({
    hash: claimTxHash,
  })

  // Calculate values
  const totalRaised = totalContributed ? formatEther(totalContributed) : "0"
  const userPurchasedCtb = userAllocated ? formatEther(userAllocated) : "0"
  const userClaimedAmount = userClaimed ? formatEther(userClaimed) : "0"
  const userClaimableAmount = userClaimable ? formatEther(userClaimable) : "0"
  const userNotClaimed = userAllocated && userClaimed ? formatEther(userAllocated - userClaimed) : "0"

  // Update countdown
  useEffect(() => {
    if (presaleEnd) {
      const interval = setInterval(() => {
        const now = Math.floor(Date.now() / 1000)
        const remaining = Number(presaleEnd) - now

        if (remaining <= 0) {
          setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        } else {
          const days = Math.floor(remaining / 86400)
          const hours = Math.floor((remaining % 86400) / 3600)
          const minutes = Math.floor((remaining % 3600) / 60)
          const seconds = remaining % 60
          setCountdown({ days, hours, minutes, seconds })
        }
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [presaleEnd])

  // Update progress
  useEffect(() => {
    if (totalContributed) {
      const raisedVic = Number.parseFloat(formatEther(totalContributed))
      const percent = Math.min((raisedVic / HARDCAP_VIC) * 100, 100)
      setProgressPercent(percent)
    }
  }, [totalContributed])

  // Calculate receive amount
  useEffect(() => {
    const amount = Number.parseFloat(buyAmount) || 0
    setReceiveAmount((amount * RATE).toFixed(2))
  }, [buyAmount])

  // Handle buy
  const handleBuy = async () => {
    if (!buyAmount || Number.parseFloat(buyAmount) <= 0) {
      alert("Please enter a valid amount")
      return
    }

    try {
      writeBuy({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "buy",
        value: parseEther(buyAmount),
        chainId: victionMainnet.id,
      })
    } catch (error) {
      console.error("Buy error:", error)
      alert("Transaction failed. Please try again.")
    }
  }

  // Handle claim
  const handleClaim = async () => {
    try {
      writeClaim({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "claim",
        chainId: victionMainnet.id,
      })
    } catch (error) {
      console.error("Claim error:", error)
      alert("Claim failed. Please try again.")
    }
  }

  const showCountdown = presaleStart && Number(presaleStart) > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="https://pbs.twimg.com/profile_images/1992127967460474881/4RycsQnl_400x400.jpg"
              alt="nioctiB Logo"
              className="w-12 h-12 rounded-full"
            />
            <div>
              <h1 className="text-2xl font-bold">nioctiB Token</h1>
              <p className="text-sm text-gray-300">CTB Token Presale</p>
            </div>
          </div>
          <button
            onClick={() => {}}
            className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-[#5048e5] text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#5048e5]/90 transition-colors"
          >
            <span className="truncate">
              {isConnected ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Connect Wallet"}
            </span>
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Countdown Section */}
        {showCountdown && (
          <section className="mb-8 text-center">
            <h2 className="text-3xl font-bold mb-6">Presale Ends In</h2>
            <div className="flex justify-center gap-4">
              {[
                { label: "Days", value: countdown.days },
                { label: "Hours", value: countdown.hours },
                { label: "Minutes", value: countdown.minutes },
                { label: "Seconds", value: countdown.seconds },
              ].map((item) => (
                <div key={item.label} className="bg-white/10 backdrop-blur-sm rounded-lg p-4 min-w-[80px]">
                  <div className="text-4xl font-bold">{item.value}</div>
                  <div className="text-sm text-gray-300">{item.label}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Progress Bar */}
        <section className="mb-8 bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Presale Progress</span>
            <span className="text-sm font-medium">{progressPercent.toFixed(2)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-4 mb-4">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-4 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-sm">
            <span>Raised: {Number.parseFloat(totalRaised).toFixed(4)} VIC</span>
            <span>Goal: {HARDCAP_VIC.toFixed(0)} VIC</span>
          </div>
        </section>

        {/* Buy Section */}
        <section className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">Buy CTB Tokens</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Amount (VIC)</label>
                <input
                  type="number"
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(e.target.value)}
                  placeholder="0.0"
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={!isConnected}
                />
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-sm text-gray-300 mb-1">You will receive</div>
                <div className="text-2xl font-bold">{receiveAmount} CTB</div>
              </div>
              <button
                onClick={handleBuy}
                disabled={!isConnected || isBuyLoading || !buyAmount}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all"
              >
                {isBuyLoading ? "Processing..." : isConnected ? "Buy Now" : "Connect Wallet First"}
              </button>
            </div>
          </div>

          {/* User Stats */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">Your Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">Purchased CTB:</span>
                <span className="font-bold">{Number.parseFloat(userPurchasedCtb).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Claimable CTB:</span>
                <span className="font-bold text-green-400">{Number.parseFloat(userClaimableAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Claimed CTB:</span>
                <span className="font-bold">{Number.parseFloat(userClaimedAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Not Claimed CTB:</span>
                <span className="font-bold text-yellow-400">{Number.parseFloat(userNotClaimed).toFixed(2)}</span>
              </div>
              <button
                onClick={handleClaim}
                disabled={!isConnected || isClaimLoading || Number.parseFloat(userClaimableAmount) <= 0}
                className="w-full mt-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all"
              >
                {isClaimLoading ? "Processing..." : "Claim Tokens"}
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 backdrop-blur-sm py-6 text-center">
        <p className="text-gray-300">© 2025 nioctiB Token. All rights reserved.</p>
      </footer>
    </div>
  )
}
