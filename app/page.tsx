"use client"

import { useEffect, useState } from "react"
import { ethers } from "ethers"

const VICTION_CHAIN_ID = 88
const VICTION_RPC = "https://rpc.viction.xyz/"
const CONTRACT_ADDRESS = "0x7814061D2929F363a2683375A6c5e0C2aa6Ad67E"
const TOKENS_FOR_SALE = 1050000
const RATE = 167.5
const HARDCAP_VIC = TOKENS_FOR_SALE / RATE

const CONTRACT_ABI = [
  "function PRESALE_START() view returns (uint256)",
  "function PRESALE_END() view returns (uint256)",
  "function totalContributed() view returns (uint256)",
  "function allocated(address) view returns (uint256)",
  "function claimed(address) view returns (uint256)",
  "function claimable(address) view returns (uint256)",
  "function claim_ed(address) view returns (uint256)",
  "function buy() payable",
  "function claim()",
]

const victionMainnet = {
  chainId: VICTION_CHAIN_ID as number,
  name: "Viction Mainnet",
  currency: "VIC",
  explorerUrl: "https://www.vicscan.xyz/",
  rpcUrl: VICTION_RPC,
}

export default function PresalePage() {
  const [provider, setProvider] = useState<ethers.providers.Provider | null>(null)
  const [signer, setSigner] = useState<ethers.Signer | null>(null)
  const [contract, setContract] = useState<ethers.Contract | null>(null)
  const [userAddress, setUserAddress] = useState<string>("")
  const [presaleStart, setPresaleStart] = useState<number>(0)
  const [presaleEnd, setPresaleEnd] = useState<number>(0)
  const [totalRaised, setTotalRaised] = useState<string>("0")
  const [userVicBalance, setUserVicBalance] = useState<string>("0")
  const [userPurchasedCtb, setUserPurchasedCtb] = useState<string>("0")
  const [userClaimable, setUserClaimable] = useState<string>("0")
  const [userClaimed, setUserClaimed] = useState<string>("0")
  const [userNotClaimed, setUserNotClaimed] = useState<string>("0")
  const [buyAmount, setBuyAmount] = useState<string>("")
  const [receiveAmount, setReceiveAmount] = useState<string>("0")
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [progressPercent, setProgressPercent] = useState<number>(0)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    initProvider()
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged)
      window.ethereum.on("chainChanged", handleChainChanged)
    }
    return () => {
      if (typeof window !== "undefined" && window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
        window.ethereum.removeListener("chainChanged", handleChainChanged)
      }
    }
  }, [])

  useEffect(() => {
    if (presaleEnd > 0) {
      const interval = setInterval(() => {
        updateCountdown()
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [presaleEnd])

  useEffect(() => {
    const amount = Number.parseFloat(buyAmount) || 0
    setReceiveAmount((amount * RATE).toFixed(2))
  }, [buyAmount])

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      setUserAddress("")
      setSigner(null)
    } else {
      connectWallet()
    }
  }

  const handleChainChanged = () => {
    window.location.reload()
  }

  async function initProvider() {
    try {
      const jsonProvider = new ethers.providers.JsonRpcProvider(VICTION_RPC)
      setProvider(jsonProvider)
      const readContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, jsonProvider)
      setContract(readContract)
      await loadContractData(readContract)
    } catch (error) {
      console.error("Failed to initialize provider:", error)
    }
  }

  async function connectWallet() {
    if (typeof window === "undefined" || typeof window.ethereum === "undefined") {
      alert("Please install MetaMask or another Web3 wallet!")
      return
    }

    try {
      await window.ethereum.request({ method: "eth_requestAccounts" })
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum)
      const network = await web3Provider.getNetwork()

      if (network.chainId !== VICTION_CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: `0x${VICTION_CHAIN_ID.toString(16)}` }],
          })
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: `0x${VICTION_CHAIN_ID.toString(16)}`,
                  chainName: "Viction Mainnet",
                  nativeCurrency: { name: "VIC", symbol: "VIC", decimals: 18 },
                  rpcUrls: [VICTION_RPC],
                  blockExplorerUrls: ["https://www.vicscan.xyz/"],
                },
              ],
            })
          } else {
            throw switchError
          }
        }
        window.location.reload()
        return
      }

      const web3Signer = web3Provider.getSigner()
      const address = await web3Signer.getAddress()
      const writeContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, web3Signer)

      setProvider(web3Provider)
      setSigner(web3Signer)
      setContract(writeContract)
      setUserAddress(address)

      await loadContractData(writeContract, address)
    } catch (error) {
      console.error("Connection error:", error)
      alert("Failed to connect wallet. Please try again.")
    }
  }

  async function loadContractData(contractInstance: ethers.Contract, address?: string) {
    try {
      const start = await contractInstance.PRESALE_START()
      const end = await contractInstance.PRESALE_END()
      const raised = await contractInstance.totalContributed()

      setPresaleStart(start.toNumber())
      setPresaleEnd(end.toNumber())
      setTotalRaised(ethers.utils.formatEther(raised))

      const raisedVic = Number.parseFloat(ethers.utils.formatEther(raised))
      const percent = Math.min((raisedVic / HARDCAP_VIC) * 100, 100)
      setProgressPercent(percent)

      if (address) {
        await loadUserData(address)
      }
    } catch (error) {
      console.error("Error loading contract data:", error)
    }
  }

  async function loadUserData(address: string) {
    if (!provider || !contract) return

    try {
      const balance = await provider.getBalance(address)
      const allocated = await contract.allocated(address)
      const claimed = await contract.claim_ed(address)
      const claimable = await contract.claimable(address)

      setUserVicBalance(Number.parseFloat(ethers.utils.formatEther(balance)).toFixed(4))
      setUserPurchasedCtb(Number.parseFloat(ethers.utils.formatEther(allocated)).toFixed(2))
      setUserClaimed(Number.parseFloat(ethers.utils.formatEther(claimed)).toFixed(2))
      setUserClaimable(Number.parseFloat(ethers.utils.formatEther(claimable)).toFixed(2))

      const notClaimed = allocated.sub(claimed)
      setUserNotClaimed(Number.parseFloat(ethers.utils.formatEther(notClaimed)).toFixed(2))
    } catch (error) {
      console.error("Error loading user data:", error)
    }
  }

  function updateCountdown() {
    const now = Math.floor(Date.now() / 1000)
    const remaining = presaleEnd - now

    if (remaining <= 0) {
      setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      return
    }

    const days = Math.floor(remaining / 86400)
    const hours = Math.floor((remaining % 86400) / 3600)
    const minutes = Math.floor((remaining % 3600) / 60)
    const seconds = remaining % 60

    setCountdown({ days, hours, minutes, seconds })
  }

  async function handleBuy() {
    if (!userAddress) {
      alert("Please connect your wallet first!")
      return
    }

    if (!contract || !signer) {
      alert("Contract not initialized!")
      return
    }

    const vicAmount = buyAmount
    if (!vicAmount || Number.parseFloat(vicAmount) <= 0) {
      alert("Please enter a valid VIC amount!")
      return
    }

    try {
      const tx = await contract.buy({ value: ethers.utils.parseEther(vicAmount) })
      alert("Transaction submitted! Waiting for confirmation...")
      await tx.wait()
      alert("Purchase successful!")
      await loadContractData(contract, userAddress)
      setBuyAmount("")
      setReceiveAmount("0")
    } catch (error: any) {
      console.error("Buy error:", error)
      alert("Transaction failed: " + (error.message || "Unknown error"))
    }
  }

  async function handleClaim() {
    if (!userAddress) {
      alert("Please connect your wallet first!")
      return
    }

    if (!contract || !signer) {
      alert("Contract not initialized!")
      return
    }

    try {
      const claimableAmount = await contract.claimable(userAddress)
      if (claimableAmount.eq(0)) {
        alert("No tokens available to claim yet!")
        return
      }

      const tx = await contract.claim()
      alert("Claim transaction submitted! Waiting for confirmation...")
      await tx.wait()
      alert("Tokens claimed successfully!")
      await loadContractData(contract, userAddress)
    } catch (error: any) {
      console.error("Claim error:", error)
      alert("Claim failed: " + (error.message || "Unknown error"))
    }
  }

  async function handleMax() {
    if (userAddress && provider) {
      const balance = await provider.getBalance(userAddress)
      const balanceInVic = ethers.utils.formatEther(balance)
      const maxAmount = Math.max(0, Number.parseFloat(balanceInVic) - 0.01)
      setBuyAmount(maxAmount.toFixed(4))
    }
  }

  if (!isClient) {
    return null
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#121117]">
      <div className="layout-container flex h-full grow flex-col">
        <div className="px-4 sm:px-8 md:px-20 lg:px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col w-full max-w-[960px] flex-1">
            <header className="flex items-center justify-between whitespace-nowrap border-b border-white/10 px-4 sm:px-6 lg:px-10 py-3">
              <div className="flex items-center gap-4 text-white">
                <img
                  src="https://pbs.twimg.com/profile_images/1992127967460474881/4RycsQnl_400x400.jpg"
                  alt="CTB Token Logo"
                  className="size-10 rounded-full"
                />
                <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em]">CTB Token</h2>
              </div>
              <button
                onClick={connectWallet}
                className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-[#5048e5] text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#5048e5]/90 transition-colors"
              >
                <span className="truncate">
                  {userAddress ? `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}` : "Connect Wallet"}
                </span>
              </button>
            </header>

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

                {presaleStart > 0 && (
                  <div className="border-t border-b border-white/10 py-6">
                    <h2 className="text-white tracking-light text-2xl font-bold leading-tight text-center pb-3 pt-2">
                      Presale Ends In:
                    </h2>
                    <div className="flex gap-2 sm:gap-4 py-4 px-2 sm:px-4 max-w-lg mx-auto">
                      {[
                        { label: "Days", value: countdown.days },
                        { label: "Hours", value: countdown.hours },
                        { label: "Minutes", value: countdown.minutes },
                        { label: "Seconds", value: countdown.seconds },
                      ].map((item) => (
                        <div key={item.label} className="flex grow basis-0 flex-col items-stretch gap-2">
                          <div className="flex h-16 sm:h-20 grow items-center justify-center rounded-xl px-3 bg-[#2a2938]">
                            <p className="text-white text-2xl sm:text-4xl font-bold leading-tight tracking-[-0.015em]">
                              {String(item.value).padStart(2, "0")}
                            </p>
                          </div>
                          <div className="flex items-center justify-center">
                            <p className="text-gray-400 text-xs sm:text-sm font-normal leading-normal">{item.label}</p>
                          </div>
                        </div>
                      ))}
                    </div>

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
                          {Number.parseFloat(totalRaised).toFixed(2)} VIC / {HARDCAP_VIC.toFixed(2)} VIC Raised
                        </span>
                        <span>Hard Cap</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-gray-300" htmlFor="buy-amount">
                        Amount in VIC
                      </label>
                      <div className="relative">
                        <input
                          className="w-full bg-[#2a2938] text-white border border-[#3e3d52] rounded-lg h-12 px-4 focus:ring-[#5048e5] focus:border-[#5048e5] focus:outline-none"
                          id="buy-amount"
                          placeholder="0.0"
                          type="number"
                          step="0.01"
                          min="0"
                          value={buyAmount}
                          onChange={(e) => setBuyAmount(e.target.value)}
                        />
                        <button
                          onClick={handleMax}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm font-bold text-[#5048e5] hover:text-[#5048e5]/80 transition-colors"
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
                        className="w-full bg-[#2a2938] text-white border border-[#3e3d52] rounded-lg h-12 px-4 cursor-not-allowed opacity-75"
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
                      className="flex-1 flex min-w-[84px] max-w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 px-4 bg-[#5048e5] text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-[#5048e5]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!userAddress || !buyAmount || Number.parseFloat(buyAmount) <= 0}
                    >
                      <span className="truncate">Buy Now</span>
                    </button>
                    <button
                      onClick={handleClaim}
                      disabled={Number.parseFloat(userClaimable) === 0 || !userAddress}
                      className={`flex-1 flex min-w-[84px] max-w-full items-center justify-center overflow-hidden rounded-xl h-12 px-4 text-base font-bold leading-normal tracking-[0.015em] transition-colors ${
                        Number.parseFloat(userClaimable) > 0 && userAddress
                          ? "bg-[#5048e5] text-white cursor-pointer hover:bg-[#5048e5]/90"
                          : "bg-[#2a2938] text-white/50 opacity-60 cursor-not-allowed"
                      }`}
                    >
                      <span className="truncate">Claim Tokens</span>
                    </button>
                  </div>

                  <div className="mt-8 p-4 bg-[#2a2938] rounded-lg border border-[#3e3d52] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Your VIC Balance</p>
                      <p className="text-lg font-bold text-white">{userVicBalance} VIC</p>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-sm text-gray-400">Your Purchased CTB</p>
                      <p className="text-lg font-bold text-white">{userPurchasedCtb} CTB</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex flex-col gap-1 rounded-lg p-3 bg-[#2a2938] border border-[#3e3d52]">
                      <p className="text-gray-400 text-xs sm:text-sm font-medium leading-normal">
                        Your Claimable Tokens
                      </p>
                      <p className="text-white text-base sm:text-lg font-bold leading-tight">{userClaimable} CTB</p>
                    </div>
                    <div className="flex flex-col gap-1 rounded-lg p-3 bg-[#2a2938] border border-[#3e3d52]">
                      <p className="text-gray-400 text-xs sm:text-sm font-medium leading-normal">Total Claimed</p>
                      <p className="text-white text-base sm:text-lg font-bold leading-tight">{userClaimed} CTB</p>
                    </div>
                    <div className="flex flex-col gap-1 rounded-lg p-3 bg-[#2a2938] border border-[#3e3d52]">
                      <p className="text-gray-400 text-xs sm:text-sm font-medium leading-normal">Not Yet Claimed</p>
                      <p className="text-white text-base sm:text-lg font-bold leading-tight">{userNotClaimed} CTB</p>
                    </div>
                    <div className="flex flex-col gap-1 rounded-lg p-3 bg-[#2a2938] border border-[#3e3d52]">
                      <p className="text-gray-400 text-xs sm:text-sm font-medium leading-normal">Tokens for Sale</p>
                      <p className="text-white text-base sm:text-lg font-bold leading-tight">1,050,000 CTB</p>
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
