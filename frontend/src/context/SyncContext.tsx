// Contexto global de sincronización reactiva en tiempo real para metallica.vis
import React, { createContext, useCallback, useContext, useState } from 'react';

interface SyncContextValue {
  syncVersion: number;
  triggerSync: (reason?: string) => void;
}

const SyncContext = createContext<SyncContextValue>({
  syncVersion: 0,
  triggerSync: () => {}
});

export function SyncProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [syncVersion, setSyncVersion] = useState<number>(0);

  const triggerSync = useCallback((reason?: string) => {
    if (reason) {
      console.log(`[SyncBus] Sincronización disparada: ${reason}`);
    }
    setSyncVersion((prev) => prev + 1);
  }, []);

  return (
    <SyncContext.Provider value={{ syncVersion, triggerSync }}>
      {children}
    </SyncContext.Provider>
  );
}

export const useSync = (): SyncContextValue => useContext(SyncContext);
