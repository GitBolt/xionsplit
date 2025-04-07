import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Thought } from '@/lib/types';
import { formatAddress, formatTimeAgo, formatDate, hasUpvoted, upvoteThought } from '@/lib/contract';
import { useAbstraxionAccount, useAbstraxionClient, useAbstraxionSigningClient } from '@burnt-labs/abstraxion';
import TransactionResult from './TransactionResult';
import { scaleIn, pulseAnimation } from '@/lib/animations';

interface ThoughtItemProps {
  thought: Thought;
  index: number;
  isUserThought: boolean;
}

const ThoughtItem: React.FC<ThoughtItemProps> = ({
  thought,
  index,
  isUserThought
}) => {
  const { data: account } = useAbstraxionAccount();
  const { client: queryClient } = useAbstraxionClient();
  const { client: signingClient } = useAbstraxionSigningClient();
  
  const [hasUserUpvoted, setHasUserUpvoted] = useState(false);
  const [isUpvoting, setIsUpvoting] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(thought.upvotes || 0);
  const [executeResult, setExecuteResult] = useState<any>(undefined);
  const [showUpvoteAnimation, setShowUpvoteAnimation] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Check if user has upvoted this thought
  useEffect(() => {
    const checkUpvoteStatus = async () => {
      if (account?.bech32Address && queryClient && thought.id) {
        const result = await hasUpvoted(queryClient, thought.id, account.bech32Address);
        setHasUserUpvoted(result);
      }
    };
    
    checkUpvoteStatus();
  }, [account?.bech32Address, queryClient, thought.id]);
  
  const handleUpvote = async () => {
    // Allow upvoting own thoughts, but disallow if already upvoted or currently upvoting
    if (!account?.bech32Address || !signingClient) {
      return;
    }
    
    if (hasUserUpvoted) {
      setErrorMessage("You've already upvoted this thought");
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }
    
    if (isUpvoting) {
      return;
    }
    
    try {
      setIsUpvoting(true);
      setErrorMessage(null);
      const result = await upvoteThought(signingClient, account.bech32Address, thought.id);
      
      if (result) {
        // Optimistic update
        setUpvoteCount(prev => prev + 1);
        setHasUserUpvoted(true);
        setExecuteResult({
          ...result,
          success: true
        });
        setShowUpvoteAnimation(true);
        
        // Hide animation after 1.5 seconds
        setTimeout(() => {
          setShowUpvoteAnimation(false);
        }, 1500);
      }
    } catch (error: any) {
      console.error("Failed to upvote:", error);
      
      // Check if this is the "already upvoted" error
      if (error.message && error.message.includes("already upvoted")) {
        setErrorMessage("You've already upvoted this thought");
        // Also update the UI state to reflect this
        setHasUserUpvoted(true);
      } else {
        setErrorMessage(error.message || "Failed to upvote. Please try again.");
        setExecuteResult({
          error: error.message || "Transaction failed",
          success: false
        });
      }
      
      // Clear error message after 3 seconds
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setIsUpvoting(false);
    }
  };
  
  const clearExecuteResult = () => {
    setExecuteResult(undefined);
  };
  
  return (
    <>
      <motion.div
        className="bg-white dark:bg-zinc-800/80 rounded-xl shadow-sm border border-zinc-200/70 dark:border-zinc-700/50 overflow-hidden backdrop-blur-sm relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          delay: index * 0.05,
          type: "spring",
          stiffness: 260,
          damping: 20
        }}
        whileHover={{ 
          y: -2,
          boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.1), 0 5px 15px -5px rgba(0, 0, 0, 0.05)",
          transition: { duration: 0.2 }
        }}
      >
        {/* Upvote Animation Overlay */}
        <AnimatePresence>
          {showUpvoteAnimation && (
            <motion.div 
              className="absolute inset-0 flex items-center justify-center bg-emerald-500/10 z-10 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ 
                  scale: [0.5, 1.2, 1],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 1.3,
                  ease: "easeInOut"
                }}
                className="text-emerald-500 dark:text-emerald-400"
              >
                <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L4 10h3v10h10V10h3L12 2z"></path>
                </svg>
                <motion.span 
                  className="absolute top-1/2 mt-5 left-1/2 transform -translate-x-1/2 text-xl font-bold"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  +1
                </motion.span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Error Message */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div 
              className="absolute inset-x-0 top-0 flex justify-center z-20 pointer-events-none"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="bg-red-500 text-white text-xs px-3 py-2 rounded-md shadow-lg">
                {errorMessage}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Author info and metadata */}
        <div className="flex justify-between items-start px-4 pt-4 pb-2">
          <div className="flex items-center">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-600 flex items-center justify-center text-zinc-500 dark:text-zinc-300 font-semibold mr-3">
              {thought.author.substring(4, 6).toUpperCase()}
            </div>
            <div>
              <div className="font-medium text-zinc-700 dark:text-zinc-300 text-sm">
                {formatAddress(thought.author)}
                {isUserThought && (
                  <span className="ml-2 px-1.5 py-0.5 text-[10px] rounded-sm bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium">
                    You
                  </span>
                )}
              </div>
              {/* <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                {formatTimeAgo(thought.timestamp)}
                {thought.created_at && thought.created_at !== thought.timestamp && (
                  <span className="ml-2 text-zinc-400 dark:text-zinc-500">
                    • Posted on {formatDate(thought.created_at)}
                  </span>
                )}
              </div> */}
            </div>
          </div>
          
          {/* Thought ID */}
          <div className="text-xs font-mono bg-zinc-100 dark:bg-zinc-700/50 text-zinc-500 dark:text-zinc-400 px-2 py-1 rounded-md">
            #{thought.id}
          </div>
        </div>
        
        {/* Thought content */}
        <div className="px-4 py-3">
          <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-words">
            {thought.text}
          </p>
        </div>
        
        {/* Actions */}
        <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800/70 flex justify-between items-center">
          {/* Upvote */}
          <motion.button
            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full transition-colors ${
              hasUserUpvoted 
                ? 'text-white bg-emerald-500 dark:bg-emerald-600' 
                : hasUserUpvoted || isUpvoting
                  ? 'text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 cursor-not-allowed'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 bg-transparent'
            }`}
            whileTap={{ scale: hasUserUpvoted ? 1 : 0.95 }}
            onClick={handleUpvote}
            disabled={hasUserUpvoted || isUpvoting}
            aria-label="Upvote thought"
            animate={isUpvoting ? {
              scale: [1, 1.05, 1],
              transition: {
                duration: 0.8,
                repeat: Infinity,
              }
            } : {}}
          >
            <motion.svg 
              className="w-3.5 h-3.5" 
              fill={hasUserUpvoted ? "currentColor" : "none"} 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
              animate={hasUserUpvoted ? {
                y: [0, -2, 0],
                transition: {
                  duration: 0.5,
                  repeat: 1,
                  repeatDelay: 0.2
                }
              } : {}}
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M5 15l7-7 7 7"
              ></path>
            </motion.svg>
            <span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={upvoteCount}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  {upvoteCount} {upvoteCount === 1 ? 'upvote' : 'upvotes'}
                </motion.span>
              </AnimatePresence>
            </span>
          </motion.button>
          
          {/* Attribution */}
          <div className="text-xs text-zinc-400 dark:text-zinc-500 flex items-center">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Immutable on XION
          </div>
        </div>
      </motion.div>
      
      {/* Transaction Result */}
      {executeResult && (
        <TransactionResult
          result={executeResult}
          onClose={clearExecuteResult}
        />
      )}
    </>
  );
};

export default ThoughtItem; 