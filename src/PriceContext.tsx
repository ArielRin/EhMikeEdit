// PriceContext.tsx
import React, { createContext, useContext, useState } from 'react';

interface PriceContextType {
  minLaunchPrice: number;
  actualLaunchPrice: number;
  setMinLaunchPrice: (value: number) => void;
  setActualLaunchPrice: (value: number) => void;
}

const PriceContext = createContext<PriceContextType | undefined>(undefined);

export const PriceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [minLaunchPrice, setMinLaunchPrice] = useState<number>(0);
  const [actualLaunchPrice, setActualLaunchPrice] = useState<number>(0);

  return (
    <PriceContext.Provider
      value={{ minLaunchPrice, actualLaunchPrice, setMinLaunchPrice, setActualLaunchPrice }}
    >
      {children}
    </PriceContext.Provider>
  );
};

export const usePrice = () => {
  const context = useContext(PriceContext);
  if (!context) {
    throw new Error('usePrice must be used within a PriceProvider');
  }
  return context;
};
