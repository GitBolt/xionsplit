import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../ui/Button';
import { ExecuteResultOrUndefined } from '@/lib/types';
import { getBlockExplorerUrl } from '@/lib/contract';

interface TransactionResultProps {
  result: any;
  onClose: () => void;
}

const TransactionResult: React.FC<TransactionResultProps> = ({
  result,
  onClose,
}) => {
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Determine component status
  const isSuccess = result?.success === true || (result && findSuccessEvent(result.events));
  const status = !result ? 'pending' : isSuccess ? 'success' : 'error';
  const txHash = result?.transactionHash || '';
  const errorMessage = result?.error || '';
  
  // Determine appropriate message based on transaction type
  let message = '';
  if (!result) {
    message = '';
  } else if (isSuccess) {
    if (result?.events && findUpvoteEvent(result.events)) {
      message = 'Your upvote was successfully recorded on the blockchain.';
    } else {
      message = 'Your thought was successfully posted to the blockchain.';
    }
  } else {
    message = errorMessage || 'Transaction failed. Please try again.';
  }
  
  // Helper to check for success event (post thought)
  function findSuccessEvent(events: readonly any[] = []): boolean {
    return events.some(event => 
      event.type === 'wasm' && 
      event.attributes.some((attr: any) => 
        attr.key === 'action' && 
        (attr.value === 'post_thought' || attr.value === 'upvote_thought')
      )
    );
  }
  
  // Helper to specifically check for upvote events
  function findUpvoteEvent(events: readonly any[] = []): boolean {
    return events.some(event => 
      event.type === 'wasm' && 
      event.attributes.some((attr: any) => 
        attr.key === 'action' && attr.value === 'upvote_thought'
      )
    );
  }
  
  // Auto-dismiss after some time for success transactions
  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      
      // Update progress bar for auto-dismiss
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev < 100) return prev + 2;
          return 100;
        });
      }, 100);
      
      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }
  }, [status, onClose]);
  
  const handleCopyTxHash = () => {
    if (txHash) {
      navigator.clipboard.writeText(txHash);
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
    }
  };
  
  const statusConfig = {
    success: {
      icon: (
        <svg className="w-12 h-12 text-emerald-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      ),
      title: 'Transaction Successful',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      borderColor: 'border-emerald-200 dark:border-emerald-800/30'
    },
    error: {
      icon: (
        <svg className="w-12 h-12 text-red-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      ),
      title: 'Transaction Failed',
      color: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800/30'
    },
    pending: {
      icon: (
        <svg className="w-12 h-12 text-amber-500 mb-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
      ),
      title: 'Transaction Processing',
      color: 'text-amber-500',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      borderColor: 'border-amber-200 dark:border-amber-800/30'
    }
  };
  
  const { icon, title, color, bgColor, borderColor } = statusConfig[status];
  
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          className={`w-full max-w-md rounded-2xl ${bgColor} border ${borderColor} shadow-xl overflow-hidden`}
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", bounce: 0.3 }}
        >
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-20 h-20 -translate-x-1/2 -translate-y-1/2 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 right-0 w-24 h-24 translate-x-1/2 translate-y-1/2 bg-white/10 rounded-full blur-2xl"></div>
          
          <div className="p-6">
            <div className="flex justify-center items-center mb-4">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ 
                  delay: 0.2,
                  type: "spring",
                  stiffness: 300
                }}
              >
                {icon}
              </motion.div>
            </div>
            
            <motion.h3 
              className={`text-lg font-bold ${color} text-center mb-4`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {title}
            </motion.h3>
            
            {message && (
              <motion.p 
                className="text-zinc-700 dark:text-zinc-300 text-center mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {message}
              </motion.p>
            )}
            
            {txHash && (
              <motion.div 
                className="mb-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="bg-white/60 dark:bg-zinc-800/60 rounded-lg p-3 border border-zinc-200 dark:border-zinc-700/50 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Transaction Hash</span>
                      <div className="flex items-center">
                        <span className="font-mono text-xs text-zinc-700 dark:text-zinc-300 truncate max-w-[200px]">
                          {txHash}
                        </span>
                      </div>
                    </div>
                    
                    <motion.button
                      className="p-1.5 rounded-lg bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 shadow-sm text-zinc-600 dark:text-zinc-300 hover:text-emerald-500 dark:hover:text-emerald-400 relative"
                      onClick={handleCopyTxHash}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {showCopySuccess ? (
                        <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>
                        </svg>
                      )}
                    </motion.button>
                  </div>
                  
                  {/* Explorer link */}
                  <motion.div 
                    className="mt-2 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <a 
                      href={getBlockExplorerUrl(txHash)} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center justify-center"
                    >
                      <span>View on Explorer</span>
                      <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                      </svg>
                    </a>
                  </motion.div>
                </div>
              </motion.div>
            )}
            
            <motion.div 
              className="flex justify-center mt-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Button 
                onClick={onClose} 
                variant={status === 'success' ? 'primary' : status === 'error' ? 'outline' : 'secondary'}
                size="md"
              >
                {status === 'success' ? 'Awesome!' : status === 'error' ? 'Try Again' : 'Close'}
              </Button>
            </motion.div>
            
            {/* Auto-dismiss progress for success state */}
            {status === 'success' && (
              <motion.div 
                className="mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <div className="text-xs text-zinc-500 dark:text-zinc-400 text-center mb-1">Auto-closing in {5 - Math.floor(progress / 20)}s</div>
                <div className="h-1 w-full bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-emerald-500 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 5, ease: "linear" }}
                  />
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TransactionResult; 