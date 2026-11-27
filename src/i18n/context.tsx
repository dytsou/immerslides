import { createContext, type ReactNode, useContext, useMemo } from 'react';
import {
  defaultLocale,
  format,
  isLocale,
  type Locale,
  type MessageKey,
  messages,
} from './messages.js';

export type Translator = (
  key: MessageKey,
  values?: Record<string, string | number>,
) => string;

const I18nContext = createContext<Locale>(defaultLocale);

/**
 * Sets the interface language for the player, presenter view, navigator, and
 * site. Without a `locale`, the nearest provider's language is used.
 */
export function I18nProvider({
  locale,
  children,
}: {
  locale?: Locale;
  children?: ReactNode;
}) {
  const inherited = useContext(I18nContext);
  const value = isLocale(locale) ? locale : inherited;
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): { locale: Locale; t: Translator } {
  const locale = useContext(I18nContext);
  return useMemo(
    () => ({
      locale,
      t: (key, values) => format(messages[locale][key], values),
    }),
    [locale],
  );
}
