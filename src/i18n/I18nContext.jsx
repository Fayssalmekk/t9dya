import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { translations } from './translations'

const I18nContext = createContext(null)

export function I18nProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem('platform-language') || 'fr')
  useEffect(() => { localStorage.setItem('platform-language', language); document.documentElement.lang = language; document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr' }, [language])
  const value = useMemo(() => ({ language, setLanguage, t: (key, values = {}) => Object.entries(values).reduce((text, [name, replacement]) => text.replace(`{${name}}`, replacement), translations[language]?.[key] || translations.fr[key] || key) }), [language])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n doit être utilisé dans I18nProvider')
  return context
}
