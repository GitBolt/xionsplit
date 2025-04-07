import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  useAbstraxionAccount, 
  useAbstraxionClient, 
  useModal 
} from "@burnt-labs/abstraxion";
import { 
  WalletIcon, 
  ClipboardDocumentIcon, 
  CheckIcon,
  ArrowPathIcon,
  SparklesIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

export default function Navbar() {
  const { data: account } = useAbstraxionAccount();
  const { client: queryClient } = useAbstraxionClient();
  const [, setShowModal] = useModal();
  const [balance, setBalance] = useState<string>("0");
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Fetch user's XION balance
  const fetchBalance = async () => {
    if (!queryClient || !account?.bech32Address) return;
    
    setRefreshing(true);
    try {
      const result = await queryClient.getBalance(account.bech32Address, "uxion");
      if (result) {
        // Convert from uxion (microxion) to XION
        const xionBalance = (parseInt(result.amount) / 1000000).toFixed(6);
        setBalance(xionBalance);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
      setBalance("Error");
    } finally {
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    fetchBalance();
    
    // Refresh balance every 30 seconds
    const intervalId = setInterval(fetchBalance, 30000);
    
    return () => clearInterval(intervalId);
  }, [queryClient, account?.bech32Address]);
  
  const copyAddress = () => {
    if (!account?.bech32Address) return;
    
    navigator.clipboard.writeText(account.bech32Address)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error("Failed to copy address:", err);
      });
  };
  
  const formatAddress = (address: string): string => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true 
    });
  };
  
  return (
    <nav className="bg-card/95 border-b sticky top-0 z-50 backdrop-blur-sm shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and brand */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-md bg-primary text-white flex items-center justify-center shadow-sm">
              <SparklesIcon className="h-5 w-5" />
            </div>
            <Link href="/" className="font-bold text-xl tracking-tight">
              <span className="bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent animate-pulse-subtle">Xion</span>
              <span>Splitter</span>
            </Link>
          </div>
          
          {/* Wallet and balance info */}
          <div className="flex items-center gap-4">
            {account?.bech32Address ? (
              <>
                <div className="hidden md:flex items-center gap-3">
                  <div className="flex items-center py-1.5 px-4 bg-secondary/40 rounded-md border border-border/30 transition-all shadow-sm animate-pop">
                    <span className="text-sm font-medium mr-2">{balance} XION</span>
                    
                    <button 
                      onClick={fetchBalance}
                      disabled={refreshing}
                      className="text-primary hover:text-primary/80 transition-colors"
                      title="Refresh balance"
                    >
                      <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  
                  {lastUpdated && (
                    <span className="text-xs text-muted-foreground hidden lg:inline opacity-80">
                      Updated: {formatTime(lastUpdated)}
                    </span>
                  )}
                </div>
                
                <div className="relative flex items-center">
                  <button 
                    onClick={copyAddress}
                    className="flex items-center gap-2 py-1.5 px-3 bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-all border border-primary/20 shadow-sm active:scale-95"
                  >
                    <div className="relative">
                      <UserCircleIcon className="h-5 w-5" />
                      <span className="status-dot online absolute -bottom-0.5 -right-0.5 ring-1 ring-card"></span>
                    </div>
                    <span className="text-sm font-medium">
                      {formatAddress(account.bech32Address)}
                    </span>
                    {copied ? (
                      <CheckIcon className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <ClipboardDocumentIcon className="h-4 w-4 opacity-70" />
                    )}
                  </button>
                  
                  {copied && (
                    <div className="absolute -bottom-9 left-1/2 transform -translate-x-1/2 bg-black/90 text-white shadow-lg rounded-lg py-1.5 px-3 text-xs whitespace-nowrap animate-slide-in z-50">
                      Address copied to clipboard!
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md py-2 px-4 text-sm font-medium transition-all shadow-sm active:scale-95"
              >
                <WalletIcon className="h-4 w-4" />
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 