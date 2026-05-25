import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

const THEME_COOKIE_NAME = 'ab_theme';
const THEME_COOKIE_MAX_AGE_SECONDS = 31536000;

export const APP_THEMES = ['classic', 'nocturne', 'dynamic', 'verdant', 'oriental'] as const;

export type AppTheme = (typeof APP_THEMES)[number];

export interface ThemeOption {
  value: AppTheme;
  label: string;
  description: string;
}

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly themes: ThemeOption[] = [
    {
      value: 'classic',
      label: 'Standard',
      description: "Thème Action Board stable, proche de l'expérience d'origine.",
    },
    {
      value: 'nocturne',
      label: 'Obsidienne',
      description: 'Interface sombre et douce, adaptée aux sessions longues en environnement peu lumineux.',
    },
    {
      value: 'dynamic',
      label: 'Momentum',
      description: 'Palette sportive et contrastée, bleu profond, cyan et orange vif.',
    },
    {
      value: 'verdant',
      label: 'Canopée',
      description: 'Vert dominant, noir structurant et surfaces claires argentées.',
    },
    {
      value: 'oriental',
      label: 'Sumi',
      description: 'Canvas blanc, encre noire et rouge profond inspiré de la calligraphie.',
    },
  ];

  private currentTheme: AppTheme = 'classic';

  getTheme(): AppTheme {
    const dataTheme = this.document.documentElement.getAttribute('data-theme');

    if (this.isValidTheme(dataTheme)) {
      return dataTheme;
    }

    return this.currentTheme;
  }

  setTheme(theme: AppTheme): void {
    this.applyTheme(theme);

    if (this.isBrowser) {
      this.document.cookie = `${THEME_COOKIE_NAME}=${encodeURIComponent(theme)}; Max-Age=${THEME_COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax`;
    }
  }

  initTheme(): void {
    this.applyTheme(this.readCookieTheme() ?? 'classic');
  }

  isValidTheme(value: unknown): value is AppTheme {
    return typeof value === 'string' && APP_THEMES.includes(value as AppTheme);
  }

  private applyTheme(theme: AppTheme): void {
    this.currentTheme = theme;
    this.document.documentElement.setAttribute('data-theme', theme);
  }

  private readCookieTheme(): AppTheme | null {
    if (!this.isBrowser) {
      return null;
    }

    const cookie = this.document.cookie
      .split('; ')
      .find(item => item.startsWith(`${THEME_COOKIE_NAME}=`));

    if (!cookie) {
      return null;
    }

    try {
      const value = decodeURIComponent(cookie.slice(THEME_COOKIE_NAME.length + 1));
      return this.isValidTheme(value) ? value : null;
    } catch {
      return null;
    }
  }
}
