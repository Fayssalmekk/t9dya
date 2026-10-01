import { createContext, useContext, useMemo, useState } from 'react'

const PlatformContext = createContext(null)

export function PlatformProvider({ children }) {
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [toast, setToast] = useState(null)

  const notify = (message, action) => {
    const key = Date.now()
    setToast({ message, action, key })
    window.setTimeout(() => setToast((current) => current?.key === key ? null : current), 4500)
  }

  const value = useMemo(() => ({ selectedProduct, openProduct: setSelectedProduct, closeProduct: () => setSelectedProduct(null), toast, dismissToast: () => setToast(null), notify }), [selectedProduct, toast])
  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePlatform() {
  const context = useContext(PlatformContext)
  if (!context) throw new Error('usePlatform doit être utilisé dans PlatformProvider')
  return context
}
