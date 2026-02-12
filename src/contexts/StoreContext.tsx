import React, { createContext, useContext } from 'react';

interface StoreContextValue {
  isInStorefront: boolean;
}

const StoreContext = createContext<StoreContextValue>({ isInStorefront: false });

export const useStoreContext = () => useContext(StoreContext);

export const StorefrontProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <StoreContext.Provider value={{ isInStorefront: true }}>
      {children}
    </StoreContext.Provider>
  );
};
