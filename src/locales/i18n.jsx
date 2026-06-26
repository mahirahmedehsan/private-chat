import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import en from './en.json'
import bn from './bn.json'

const locales = { en, bn }

const I18nContext = createContext()

function flatten(obj, prefix = '') {
  return Object.keys(obj).reduce((acc, key) => {
    const val = obj[key]
    const k = prefix ? `${prefix}.${key}` : key
    if (typeof val === 'object' && val !== null) {
      Object.assign(acc, flatten(val, k))
    } else {
      acc[k] = val
    }
    return acc
  }, {})
}

const flatEn = flatten(en)
const flatBn = flatten(bn)
const flatLocales = { en: flatEn, bn: flatBn }

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(() => localStorage.getItem('locale') || 'en')

  const setLocale = useCallback((l) => {
    setLocaleState(l)
    localStorage.setItem('locale', l)
    document.documentElement.lang = l === 'bn' ? 'bn' : 'en'
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale === 'bn' ? 'bn' : 'en'
  }, [locale])

  const value = { locale, setLocale }
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useLocale() {
  return useContext(I18nContext)
}

export function useT() {
  const { locale } = useContext(I18nContext)

  const t = useCallback((key, params = {}) => {
    const dict = flatLocales[locale] || flatEn
    let msg = dict[key]
    if (msg === undefined) {
      msg = flatEn[key] || key
    }
    if (params && Object.keys(params).length > 0) {
      msg = msg.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? `{${k}}`)
    }
    return msg
  }, [locale])

  return t
}
