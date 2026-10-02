import { createContext, useContext, useEffect } from 'react'
import { translations } from './translations'

const I18nContext = createContext(null)

const translate = (key, values = {}) => Object.entries(values).reduce(
  (text, [name, replacement]) => text.replace(`{${name}}`, replacement),
  translations.fr[key] || key
)

export function I18nProvider({ children }) {
  useEffect(() => {
    document.documentElement.lang = 'fr'
    document.documentElement.dir = 'ltr'
    localStorage.setItem('platform-language', 'fr')
  }, [])
  return <I18nContext.Provider value={{ language: 'fr', t: translate }}>{children}</I18nContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n doit être utilisé dans I18nProvider')
  return context
}
