import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ExecuteResultOrUndefined } from '@/lib/types';
import { getBlockExplorerUrl } from '@/lib/contract';

interface TransactionResultProps {
  result: ExecuteResultOrUndefined;
  onClose: () => void;
}

const TransactionResult: React.FC<TransactionResultProps> = ({ result, onClose }) => {
  if (!result) return null;
  
  const blockExplorerUrl = getBlockExplorerUrl(result.transactionHash);

  return (
    <motion.div 
      className="mb-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-xl overflow-hidden shadow-md"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ 
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
    >
      <div className="px-4 py-3 bg-emerald-100/50 dark:bg-emerald-800/30 border-b border-emerald-200 dark:border-emerald-700/50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span className="font-medium text-emerald-800 dark:text-emerald-300">Transaction Complete</span>
        </div>
        
        <button 
          onClick={onClose}
          className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      
      <div className="p-4 space-y-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1 font-medium">Transaction Hash</div>
          <motion.div 
            className="font-mono text-xs break-all bg-emerald-100/50 dark:bg-emerald-900/30 p-2 rounded-md text-emerald-700 dark:text-emerald-300"
            whileHover={{ 
              backgroundColor: "rgba(16, 185, 129, 0.2)"
            }}
          >
            {result.transactionHash}
          </motion.div>
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            <div className="text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1 font-medium">Block Height</div>
            <div className="font-mono text-emerald-700 dark:text-emerald-300">{result.height}</div>
          </div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            <Link 
              href={blockExplorerUrl}
              target="_blank"
              className="inline-flex items-center gap-1 text-sm bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-full transition-colors shadow-sm"
            >
              View Details
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
              </svg>
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default TransactionResult; 