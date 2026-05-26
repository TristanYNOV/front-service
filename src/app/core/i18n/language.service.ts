import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal, DOCUMENT } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

const LANGUAGE_COOKIE_NAME = 'app_lang';
const LANGUAGE_COOKIE_MAX_AGE_SECONDS = 31536000;

export const SUPPORTED_LANGS = ['fr', 'en'] as const;

export type SupportedLang = (typeof SUPPORTED_LANGS)[number];

export interface LanguageOption {
  value: SupportedLang;
  label: 'FR' | 'ENG';
}

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly transloco = inject(TranslocoService);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly currentLangSignal = signal<SupportedLang>('fr');
  readonly currentLang = this.currentLangSignal.asReadonly();

  private readonly languages: LanguageOption[] = [
    { value: 'fr', label: 'FR' },
    { value: 'en', label: 'ENG' },
  ];

  getCurrentLang(): SupportedLang {
    return this.currentLangSignal();
  }

  getAvailableLangs(): LanguageOption[] {
    return this.languages;
  }

  initLang(): void {
    this.applyLang(this.readCookieLang() ?? this.getActiveTranslocoLang() ?? 'fr', false);
  }

  setLang(lang: SupportedLang): void {
    this.applyLang(lang, true);
  }

  isValidLang(value: unknown): value is SupportedLang {
    return typeof value === 'string' && SUPPORTED_LANGS.includes(value as SupportedLang);
  }

  private applyLang(lang: SupportedLang, persist: boolean): void {
    this.currentLangSignal.set(lang);
    this.transloco.setActiveLang(lang);
    this.document.documentElement.setAttribute('lang', lang);

    if (persist && this.isBrowser) {
      this.document.cookie = `${LANGUAGE_COOKIE_NAME}=${encodeURIComponent(lang)}; Max-Age=${LANGUAGE_COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax`;
    }
  }

  private readCookieLang(): SupportedLang | null {
    if (!this.isBrowser) {
      return null;
    }

    const cookie = this.document.cookie
      .split('; ')
      .find(item => item.startsWith(`${LANGUAGE_COOKIE_NAME}=`));

    if (!cookie) {
      return null;
    }

    try {
      const value = decodeURIComponent(cookie.slice(LANGUAGE_COOKIE_NAME.length + 1));
      return this.isValidLang(value) ? value : null;
    } catch {
      return null;
    }
  }

  private getActiveTranslocoLang(): SupportedLang | null {
    const lang = this.transloco.getActiveLang();
    return this.isValidLang(lang) ? lang : null;
  }
}
