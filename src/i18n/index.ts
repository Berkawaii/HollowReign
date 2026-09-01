import {
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
  TRANSLATIONS,
  TranslationDict,
  LanguageMeta,
} from './translations';
import { StorageService } from '../services/StorageService';

class I18nManager {
  private currentLanguage: SupportedLanguage;
  private listeners: (() => void)[] = [];

  constructor() {
    const saved = StorageService.getLanguage() as SupportedLanguage;
    this.currentLanguage = TRANSLATIONS[saved] ? saved : 'en';
  }

  public getLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  public setLanguage(lang: SupportedLanguage): void {
    if (TRANSLATIONS[lang]) {
      this.currentLanguage = lang;
      StorageService.setLanguage(lang);
      this.listeners.forEach((fn) => fn());
    }
  }

  public onLanguageChange(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public getSupportedLanguages(): LanguageMeta[] {
    return SUPPORTED_LANGUAGES;
  }

  public t<K extends keyof TranslationDict>(key: K): string {
    const dict = TRANSLATIONS[this.currentLanguage] || TRANSLATIONS.en;
    return dict[key] || TRANSLATIONS.en[key] || String(key);
  }
}

export const i18n = new I18nManager();
export const t = <K extends keyof TranslationDict>(key: K): string => i18n.t(key);
