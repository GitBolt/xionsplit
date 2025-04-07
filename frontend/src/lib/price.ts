import { useState, useEffect } from 'react';

// Cache the token price for 5 minutes
let cachedPrice: number | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Fallback price in case the API is down
const FALLBACK_PRICE = 0.034; 

/**
 * Fetches the current XION token price in USD
 * Uses coingecko API for price data
 */
export const fetchXionPrice = async (): Promise<number> => {
  const currentTime = Date.now();
  
  // Return cached price if it's still valid
  if (cachedPrice !== null && currentTime - lastFetchTime < CACHE_DURATION) {
    console.log("Using cached XION price:", cachedPrice);
    return cachedPrice;
  }
  
  try {
    // Using CoinGecko API to get XION price
    // Note: Replace with actual token ID when XION is listed on CoinGecko
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=burnt-finance&vs_currencies=usd"
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch price: ${response.status}`);
    }
    
    const data = await response.json();
    const price = data["burnt-finance"]?.usd;
    
    if (price) {
      cachedPrice = price;
      lastFetchTime = currentTime;
      console.log("Fetched fresh XION price:", price);
      return price;
    } else {
      console.warn("Price not found in API response, using fallback");
      return FALLBACK_PRICE;
    }
  } catch (error) {
    console.error("Error fetching XION price:", error);
    // Use fallback price if request fails
    return FALLBACK_PRICE;
  }
};

/**
 * React hook for getting and refreshing XION price
 */
export const useXionPrice = () => {
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const refreshPrice = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const price = await fetchXionPrice();
      setPrice(price);
    } catch (error) {
      console.error("Error in useXionPrice:", error);
      setError("Failed to fetch XION price");
      setPrice(FALLBACK_PRICE);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    refreshPrice();
    
    // Refresh price every 5 minutes
    const intervalId = setInterval(refreshPrice, CACHE_DURATION);
    
    return () => clearInterval(intervalId);
  }, []);
  
  return { price, loading, error, refreshPrice };
};

/**
 * Formats XION amount (in uxion) to USD
 * @param amount Amount in uxion (microxion) as string or number
 * @param xionPrice Price of 1 XION in USD
 */
export const formatAmountToUSD = (amount: string | number, xionPrice: number | null): string => {
  if (!xionPrice) return "$0.00";
  
  try {
    // Convert amount to string if it's a number
    const amountStr = typeof amount === 'number' ? amount.toString() : amount;
    
    // Convert from uxion to XION then to USD
    const xionAmount = parseInt(amountStr) / 1000000;
    const usdAmount = xionAmount * xionPrice;
    
    // Format with appropriate precision based on amount
    if (usdAmount < 0.01) {
      return `$${usdAmount.toFixed(4)}`;
    } else if (usdAmount < 1) {
      return `$${usdAmount.toFixed(2)}`;
    } else {
      return `$${usdAmount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`;
    }
  } catch (error) {
    console.error("Error formatting amount to USD:", error);
    return "$0.00";
  }
}; 