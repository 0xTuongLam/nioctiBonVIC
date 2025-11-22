"use client"

import { useEffect, useState } from "react"
import { useAccount, useReadContract, useWriteContract, useBalance } from "wagmi"
import { parseEther, formatEther } from "viem"
import Image from "next/image"

const CONTRACT_ADDRESS = "0x7814061D2929F363a2683375A6c5e0C2aa6Ad67E" as const
const TOKENS_FOR_SALE = 1050000
const RATE = 167.5
const HARDCAP_VIC = TOKENS_FOR_SALE / RATE

const CONTRACT_ABI = [
  {
    inputs: [],
    name: "PRESALE_START",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "PRESALE_END",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalContributed",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "allocated",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "claim_ed",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "claimable",
    outputs: [{ type: "uint256" }],
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

export default function Home() {
  const { address, isConnected } = useAccount()
  const [mounted, setMounted] = useState(false)
  const [buyAmount, setBuyAmount] = useState("")
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  // Contract reads
  const { data: presaleStart } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "PRESALE_START",
  })

  const { data: presaleEnd } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "PRESALE_END",
  })

  const { data: totalContributed } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "totalContributed",
  })

  const { data: allocated } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "allocated",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  const { data: claimed } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "claim_ed",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  const { data: claimable } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "claimable",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  const { data: balance } = useBalance({
    address: address,
  })

  const { writeContract, isPending: isBuying } = useWriteContract()
  const { writeContract: writeClaim, isPending: isClaiming } = useWriteContract()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Countdown timer
  useEffect(() => {
    if (!presaleEnd || !presaleStart || presaleStart === 0n) return

    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000)
      const end = Number(presaleEnd)
      const remaining = end - now

      if (remaining <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        clearInterval(interval)
        return
      }

      const days = Math.floor(remaining / 86400)
      const hours = Math.floor((remaining % 86400) / 3600)
      const minutes = Math.floor((remaining % 3600) / 60)
      const seconds = remaining % 60

      setCountdown({ days, hours, minutes, seconds })
    }, 1000)

    return () => clearInterval(interval)
  }, [presaleEnd, presaleStart])

  const handleBuy = () => {
    if (!buyAmount || Number.parseFloat(buyAmount) <= 0) {
      alert("Please enter a valid VIC amount!")
      return
    }

    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "buy",
        value: parseEther(buyAmount),
      })
    } catch (error) {
      console.error("[v0] Buy error:", error)
      alert("Transaction failed")
    }
  }

  const handleClaim = () => {
    if (!claimable || claimable === 0n) {
      alert("No tokens available to claim yet!")
      return
    }

    try {
      writeClaim({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "claim",
      })
    } catch (error) {
      console.error("[v0] Claim error:", error)
      alert("Claim failed")
    }
  }

  const handleMaxAmount = () => {
    if (balance) {
      const maxAmount = Math.max(0, Number.parseFloat(formatEther(balance.value)) - 0.01)
      setBuyAmount(maxAmount.toFixed(4))
    }
  }

  const receiveAmount = buyAmount ? (Number.parseFloat(buyAmount) * RATE).toFixed(2) : "0"
  const raisedVic = totalContributed ? Number.parseFloat(formatEther(totalContributed)) : 0
  const progressPercent = Math.min((raisedVic / HARDCAP_VIC) * 100, 100)
  const showCountdown = presaleStart && presaleStart !== 0n

  if (!mounted) return null

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#121117]">
      <div className="layout-container flex h-full grow flex-col">
        <div className="px-4 sm:px-8 md:px-20 lg:px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col w-full max-w-[960px] flex-1">
            {/* Header */}
            <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-white/10 px-4 sm:px-6 lg:px-10 py-3">
              <div className="flex items-center gap-4 text-white">
                <Image
                  src="https://pbs.twimg.com/profile_images/1992127967460474881/4RycsQnl_400x400.jpg"
                  alt="CTB Token Logo"
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em]">CTB Token</h2>
              </div>
              <appkit-button />
            </header>

            {/* Main Content */}
            <main className="flex-1 py-10 px-4 sm:px-6 lg:px-0">
              <div className="bg-[#1c1b25] rounded-xl p-6 sm:p-8 border border-white/10">
                <div className="flex flex-wrap justify-between gap-3 pb-6">
                  <p className="text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em] min-w-72">
                    Join the nioctiB Token Presale
                  </p>
                </div>

                <div className="flex flex-wrap gap-4 pb-6">
                  <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-xl p-6 border border-[#3e3d52]">
                    <p className="text-gray-400 text-base font-medium leading-normal">Presale Price</p>
                    <p className="text-white tracking-light text-xl md:text-2xl font-bold leading-tight">
                      1 VIC = 167.5 CTB
                    </p>
                  </div>
                  <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-xl p-6 border border-[#3e3d52]">
                    <p className="text-gray-400 text-base font-medium leading-normal">Total Supply</p>
                    <p className="text-white tracking-light text-xl md:text-2xl font-bold leading-tight">
                      21,000,000 CTB
                    </p>
                  </div>
                </div>

                {/* Countdown Section */}
                {showCountdown && (
                  <div className="border-t border-b border-white/10 py-6">
                    <h2 className="text-white tracking-light text-2xl font-bold leading-tight text-center pb-3 pt-2">
                      Presale Ends In:
                    </h2>
                    <div className="flex gap-2 sm:gap-4 py-4 px-2 sm:px-4 max-w-lg mx-auto">
                      <div className="flex grow basis-0 flex-col items-stretch gap-2">
                        <div className="flex h-16 sm:h-20 grow items-center justify-center rounded-xl px-3 bg-[#2a2938]">
                          <p className="text-white text-2xl sm:text-4xl font-bold leading-tight tracking-[-0.015em]">
                            {String(countdown.days).padStart(2, "0")}
                          </p>
                        </div>
                        <div className="flex items-center justify-center">
                          <p className="text-gray-400 text-xs sm:text-sm font-normal leading-normal">Days</p>
                        </div>
                      </div>
                      <div className="flex grow basis-0 flex-col items-stretch gap-2">
                        <div className="flex h-16 sm:h-20 grow items-center justify-center rounded-xl px-3 bg-[#2a2938]">
                          <p className="text-white text-2xl sm:text-4xl font-bold leading-tight tracking-[-0.015em]">
                            {String(countdown.hours).padStart(2, "0")}
                          </p>
                        </div>
                        <div className="flex items-center justify-center">
                          <p className="text-gray-400 text-xs sm:text-sm font-normal leading-normal">Hours</p>
                        </div>
                      </div>
                      <div className="flex grow basis-0 flex-col items-stretch gap-2">
                        <div className="flex h-16 sm:h-20 grow items-center justify-center rounded-xl px-3 bg-[#2a2938]">
                          <p className="text-white text-2xl sm:text-4xl font-bold leading-tight tracking-[-0.015em]">
                            {String(countdown.minutes).padStart(2, "0")}
                          </p>
                        </div>
                        <div className="flex items-center justify-center">
                          <p className="text-gray-400 text-xs sm:text-sm font-normal leading-normal">Minutes</p>
                        </div>
                      </div>
                      <div className="flex grow basis-0 flex-col items-stretch gap-2">
                        <div className="flex h-16 sm:h-20 grow items-center justify-center rounded-xl px-3 bg-[#2a2938]">
                          <p className="text-white text-2xl sm:text-4xl font-bold leading-tight tracking-[-0.015em]">
                            {String(countdown.seconds).padStart(2, "0")}
                          </p>
                        </div>
                        <div className="flex items-center justify-center">
                          <p className="text-gray-400 text-xs sm:text-sm font-normal leading-normal">Seconds</p>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full mt-4">
                      <div className="flex justify-between items-center mb-2 text-sm">
                        <span className="font-medium text-gray-300">Progress</span>
                        <span className="font-bold text-white">{progressPercent.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-[#2a2938] rounded-full h-3">
                        <div
                          className="bg-[#5048e5] h-3 rounded-full transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
                        <span>
                          {raisedVic.toFixed(2)} VIC / {HARDCAP_VIC.toFixed(2)} VIC Raised
                        </span>
                        <span>Hard Cap</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Buy Section */}
                <div className="pt-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-gray-300" htmlFor="buy-amount">
                        Amount in VIC
                      </label>
                      <div className="relative">
                        <input
                          className="w-full bg-[#2a2938] text-white border border-[#3e3d52] rounded-lg h-12 px-4 focus:ring-[#5048e5] focus:border-[#5048e5]"
                          id="buy-amount"
                          placeholder="0.0"
                          type="number"
                          value={buyAmount}
                          onChange={(e) => setBuyAmount(e.target.value)}
                        />
                        <button
                          onClick={handleMaxAmount}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm font-bold text-[#5048e5]"
                        >
                          MAX
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-gray-300" htmlFor="receive-amount">
                        You will receive (CTB)
                      </label>
                      <input
                        className="w-full bg-[#2a2938] text-white border border-[#3e3d52] rounded-lg h-12 px-4 focus:ring-[#5048e5] focus:border-[#5048e5]"
                        disabled
                        id="receive-amount"
                        placeholder="0"
                        type="text"
                        value={receiveAmount}
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={handleBuy}
                      disabled={!isConnected || isBuying}
                      className="flex-1 flex min-w-[84px] max-w-full items-center justify-center overflow-hidden rounded-xl h-12 px-4 bg-[#5048e5] text-white text-base font-bold leading-normal tracking-[0.015em] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#5048e5]/90 transition-colors"
                    >
                      <span className="truncate">{isBuying ? "Buying..." : "Buy Now"}</span>
                    </button>
                    <button
                      onClick={handleClaim}
                      disabled={!isConnected || isClaiming || !claimable || claimable === 0n}
                      className="flex-1 flex min-w-[84px] max-w-full items-center justify-center overflow-hidden rounded-xl h-12 px-4 bg-[#2a2938] text-white text-base font-bold leading-normal tracking-[0.015em] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2a2938]/80 transition-colors"
                    >
                      <span className="truncate">{isClaiming ? "Claiming..." : "Claim Tokens"}</span>
                    </button>
                  </div>

                  {/* User Stats */}
                  <div className="mt-8 p-4 bg-[#2a2938] rounded-lg border border-[#3e3d52] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Your VIC Balance</p>
                      <p className="text-lg font-bold text-white">
                        {balance ? Number.parseFloat(formatEther(balance.value)).toFixed(4) : "0"} VIC
                      </p>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-sm text-gray-400">Your Purchased CTB</p>
                      <p className="text-lg font-bold text-white">
                        {allocated ? Number.parseFloat(formatEther(allocated)).toFixed(2) : "0"} CTB
                      </p>
                    </div>
                  </div>

                  {/* Detailed Stats Grid */}
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex flex-col gap-1 rounded-lg p-3 bg-[#2a2938] border border-[#3e3d52]">
                      <p className="text-gray-400 text-xs sm:text-sm font-medium leading-normal">
                        Your Claimable Tokens
                      </p>
                      <p className="text-white text-base sm:text-lg font-bold leading-tight">
                        {claimable ? Number.parseFloat(formatEther(claimable)).toFixed(2) : "0"} CTB
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 rounded-lg p-3 bg-[#2a2938] border border-[#3e3d52]">
                      <p className="text-gray-400 text-xs sm:text-sm font-medium leading-normal">Total Claimed</p>
                      <p className="text-white text-base sm:text-lg font-bold leading-tight">
                        {claimed ? Number.parseFloat(formatEther(claimed)).toFixed(2) : "0"} CTB
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 rounded-lg p-3 bg-[#2a2938] border border-[#3e3d52]">
                      <p className="text-gray-400 text-xs sm:text-sm font-medium leading-normal">Not Yet Claimed</p>
                      <p className="text-white text-base sm:text-lg font-bold leading-tight">
                        {allocated && claimed ? Number.parseFloat(formatEther(allocated - claimed)).toFixed(2) : "0"}{" "}
                        CTB
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 rounded-lg p-3 bg-[#2a2938] border border-[#3e3d52]">
                      <p className="text-gray-400 text-xs sm:text-sm font-medium leading-normal">Tokens for Sale</p>
                      <p className="text-white text-base sm:text-lg font-bold leading-tight">
                        {TOKENS_FOR_SALE.toLocaleString()} CTB
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}
