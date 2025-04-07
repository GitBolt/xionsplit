import React, { createContext, useContext, useState, ReactNode } from 'react';
import Toast from '@/components/ui/Toast';

type ToastType = 'success' | 'error' | 'info';

interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  txHash?: string;
  autoClose?: boolean;
  duration?: number;
  referenceId?: string;
}

interface ToastContextType {
  showToast: (toast: Omit<ToastData, 'id'>) => string;
  hideToast: (id: string) => void;
  hideAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  // Show a new toast notification
  const showToast = (toast: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    
    // If this is a success or error toast with a referenceId, hide any info toasts with the same referenceId
    if ((toast.type === 'success' || toast.type === 'error') && toast.referenceId) {
      setToasts((prevToasts) => 
        prevToasts.filter(t => !(t.type === 'info' && t.referenceId === toast.referenceId))
      );
    }
    
    // If this is a success or error toast, also apply the previous filtering logic for backward compatibility
    if (toast.type === 'success' || toast.type === 'error') {
      setToasts((prevToasts) => {
        // Filter out any info toasts that might be related to this action
        return prevToasts.filter((t) => {
          // Keep all non-info toasts
          if (t.type !== 'info') return true;
          
          // Check if this info toast is related to the current success/error toast
          const messagePattern = toast.message?.toLowerCase() || '';
          const infoMessage = t.message?.toLowerCase() || '';
          const infoTitle = t.title?.toLowerCase() || '';
          
          // If the success/error message contains words from the info toast, consider it related
          // For group creation example:
          // Info toast: "Creating group 'Trip to Paris'..."
          // Success toast: "Group 'Trip to Paris' created successfully"
          if (messagePattern.includes('group') && (infoTitle.includes('creating') || infoMessage.includes('creating'))) {
            return false; // Remove this info toast
          }
          
          // For expense adding
          if (messagePattern.includes('expense') && (infoTitle.includes('adding') || infoMessage.includes('adding'))) {
            return false; // Remove this info toast
          }
          
          // For debt settlement
          if ((messagePattern.includes('debt') || messagePattern.includes('settle')) && 
              (infoTitle.includes('settling') || infoMessage.includes('settling') || 
               infoTitle.includes('processing') || infoMessage.includes('processing'))) {
            return false; // Remove this info toast
          }
          
          // For joining group
          if (messagePattern.includes('join') && (infoTitle.includes('joining') || infoMessage.includes('joining'))) {
            return false; // Remove this info toast
          }
          
          // For leaving group
          if (messagePattern.includes('left') && (infoTitle.includes('leaving') || infoMessage.includes('leaving'))) {
            return false; // Remove this info toast
          }
          
          // Keep all other info toasts
          return true;
        });
      });
    }
    
    // Add the new toast
    setToasts((prevToasts) => [...prevToasts, { ...toast, id }]);
    
    // Log for debugging
    console.log(`Toast shown: ${toast.type} - ${toast.title}${toast.referenceId ? ` (ref: ${toast.referenceId})` : ''}`);
    return id;
  };

  // Hide a specific toast by ID
  const hideToast = (id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  // Hide all toasts
  const hideAllToasts = () => {
    setToasts([]);
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast, hideAllToasts }}>
      {children}
      
      {/* Render toasts */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            type={toast.type}
            title={toast.title}
            message={toast.message}
            txHash={toast.txHash}
            isVisible={true}
            autoClose={toast.autoClose}
            duration={toast.duration}
            onClose={() => hideToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// Custom hook to use the toast context
export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}; 