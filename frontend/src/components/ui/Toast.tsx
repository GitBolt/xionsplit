import { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  InformationCircleIcon, 
  XMarkIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { getBlockExplorerUrl } from '@/lib/contract';

type ToastProps = {
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
  txHash?: string;
  isVisible: boolean;
  autoClose?: boolean;
  duration?: number;
  position?: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center';
  onClose: () => void;
};

export default function Toast({
  type,
  title,
  message,
  txHash,
  isVisible,
  autoClose = true,
  duration = 5000,
  position = 'bottom-right',
  onClose,
}: ToastProps) {
  const [isClosing, setIsClosing] = useState(false);
  
  useEffect(() => {
    if (isVisible && autoClose) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, autoClose, duration]);
  
  // Handle the close animation
  const handleClose = () => {
    setIsClosing(true);
    
    // Wait for animation to complete before fully closing
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };
  
  // Don't render if not visible
  if (!isVisible) return null;
  
  // Position classes
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2'
  };
  
  // Icon based on type
  const Icon = {
    success: CheckCircleIcon,
    error: XCircleIcon,
    info: InformationCircleIcon
  }[type];
  
  // Color based on type
  const colorClasses = {
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-300 dark:border-emerald-800',
    error: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-900 dark:text-rose-300 dark:border-rose-800',
    info: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800'
  }[type];
  
  // Icon color based on type
  const iconColorClasses = {
    success: 'text-emerald-500 dark:text-emerald-400',
    error: 'text-rose-500 dark:text-rose-400',
    info: 'text-blue-500 dark:text-blue-400'
  }[type];
  
  return (
    <div 
      className={`fixed ${positionClasses[position]} z-50 max-w-md w-full pointer-events-auto
        transition-all duration-300 transform ${isClosing ? 'opacity-0 translate-y-2' : 'opacity-100'}`}
      aria-live="assertive"
    >
      <div className={`shadow-xl rounded-lg border overflow-hidden ${colorClasses}`}>
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Icon className={`h-5 w-5 ${iconColorClasses}`} />
            </div>
            <div className="ml-3 w-0 flex-1 pt-0.5">
              <p className="text-sm font-medium">{title}</p>
              {message && <p className="mt-1 text-sm opacity-80">{message}</p>}
              
              {txHash && (
                <div className="mt-2">
                  <Link 
                    href={getBlockExplorerUrl(txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm font-medium underline underline-offset-2 opacity-80 hover:opacity-100"
                  >
                    View Transaction
                    <ArrowTopRightOnSquareIcon className="ml-1 h-3 w-3" />
                  </Link>
                </div>
              )}
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button
                className="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
                onClick={handleClose}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Progress bar */}
        {autoClose && (
          <div className="h-1 bg-gray-200 dark:bg-gray-700">
            <div 
              className={`h-full ${type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-rose-500' : 'bg-blue-500'}`}
              style={{ 
                width: '100%', 
                animation: `shrink ${duration}ms linear forwards`
              }}
            />
          </div>
        )}
      </div>
      
      {/* Global animation for progress bar */}
      <style jsx global>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
} 