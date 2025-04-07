import React, { createContext, useContext, ReactNode } from 'react';
import { useXionPrice } from './price';

interface PriceContextType {
  xionPrice: number | null;
  loading: boolean;
  error: string | null;
  refreshPrice: () => Promise<void>;
}

const PriceContext = createContext<PriceContextType | undefined>(undefined);

export const PriceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { price, loading, error, refreshPrice } = useXionPrice();

  return (
    <PriceContext.Provider value={{ 
      xionPrice: price, 
      loading, 
      error, 
      refreshPrice 
    }}>
      {children}
    </PriceContext.Provider>
  );
};

export const usePrice = (): PriceContextType => {
  const context = useContext(PriceContext);
  if (context === undefined) {
    throw new Error('usePrice must be used within a PriceProvider');
  }
  return context;
}; 