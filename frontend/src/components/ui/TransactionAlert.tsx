import React, { useState, useEffect } from 'react';
import { XMarkIcon, CheckCircleIcon, XCircleIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { AnimatePresence, motion } from 'framer-motion';
import { getBlockExplorerUrl } from '@/lib/contract';

type TransactionAlertProps = {
  type: 'success' | 'error';
  title: string;
  message: string;
  txHash?: string;
  isVisible: boolean;
  onClose: () => void;
  autoHideDuration?: number;
};

export default function TransactionAlert({
  type,
  title,
  message,
  txHash,
  isVisible,
  onClose,
  autoHideDuration = 50000,
}: TransactionAlertProps) {
  const [shouldRender, setShouldRender] = useState(isVisible);

  // Auto-hide after specified duration
  useEffect(() => {
    if (isVisible && autoHideDuration > 0) {
      setShouldRender(true);
      const timer = setTimeout(() => {
        onClose();
      }, autoHideDuration);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300); // Match the exit animation duration
      return () => clearTimeout(timer);
    }
  }, [isVisible, autoHideDuration, onClose]);

  // Generate explorer URL
  const explorerUrl = txHash ? getBlockExplorerUrl(txHash) : undefined;

  if (!shouldRender) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed bottom-6 right-6 z-50 max-w-md w-full"
     
        >
          <div className={`
            rounded-lg shadow-md
            ${type === 'success' 
              ? 'bg-emerald-500 dark:bg-emerald-600' 
              : 'bg-rose-500 dark:bg-rose-600'}
          `}>
            <div className="p-4">
              <div className="flex items-center">
                {/* Icon */}
                <div className="flex-shrink-0 text-white">
                  {type === 'success' ? (
                    <CheckCircleIcon className="h-6 w-6" />
                  ) : (
                    <XCircleIcon className="h-6 w-6" />
                  )}
                </div>
              
                {/* Content */}
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-white">
                    {title}
                  </p>
                  
                  <p className="mt-1 text-xs text-white/90">
                    {message}
                  </p>
                  
                  {explorerUrl && (
                    <a 
                      href={explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center text-xs font-medium bg-white/20 hover:bg-white/30 text-white px-2 py-1 rounded transition-colors"
                    >
                      View in Explorer
                      <ArrowTopRightOnSquareIcon className="ml-1 h-3 w-3" />
                    </a>
                  )}
                </div>
              
                {/* Close button */}
                <button
                  type="button"
                  className="flex-shrink-0 ml-1 p-1 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                  onClick={onClose}
                  aria-label="Close notification"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {/* Progress bar for auto-close timer */}
            {autoHideDuration > 0 && (
              <motion.div 
                className="h-1 w-full bg-white/20"
                initial={{ scaleX: 1, transformOrigin: "left" }}
                animate={{ scaleX: 0 }}
                transition={{ duration: autoHideDuration / 1000, ease: "linear" }}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 